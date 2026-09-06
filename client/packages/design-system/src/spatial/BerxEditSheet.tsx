/**
 * BerxEditSheet — changing something you already made.
 *
 * BERX could create a place, a trip, a collection, a circle, an event,
 * an experience and a community, and could delete every one of them.
 * It could not fix a typo in any of them. Seven real PATCH endpoints
 * sat in the API client with nothing in the product able to reach
 * them, so the only way to correct a wrong title was to destroy the
 * object and lose everything attached to it.
 *
 * One sheet serves all seven rather than seven near-identical screens.
 * The domains differ in their fields, not in what editing *is*, so the
 * caller describes the fields and the sheet owns the behaviour — which
 * is also what keeps the editing gesture identical everywhere, the way
 * every other spatial primitive in BERX is.
 *
 * What it refuses to do:
 *
 *   It will not send what you did not change. Every one of these
 *   endpoints takes a partial body and applies exactly the keys it
 *   receives, so sending the untouched fields back would overwrite a
 *   value another device changed a second ago with the copy this
 *   screen happened to load. Only touched fields go.
 *
 *   It will not close before the server agrees. `onSave` is awaited
 *   and must return the server's own updated object; a rejection keeps
 *   the sheet open, with the edits still in it and the real reason
 *   underneath. A sheet that closes on failure looks exactly like one
 *   that succeeded.
 *
 *   It will not throw away your typing. The backdrop is inert while
 *   anything is unsaved, and cancelling something dirty asks first.
 *
 *   It will not pretend a dead network is a refusal. With no
 *   connection the save is not attempted at all: nothing was sent, so
 *   nothing was rejected.
 */
import {useCallback, useMemo, useRef, useState} from 'react';
import {Modal, ScrollView, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import {resolveFocus, type BerxFocusField, type BerxFocusRect} from '@berx/spatial';
import {colors, spacing} from '../tokens';
import {BerxText} from './BerxText';
import {BerxButton} from '../components/BerxButton';
import {BerxInput} from '../components/BerxInput';
import {BerxSurface} from './BerxSurface';
import {BerxChoiceChips} from './BerxChoiceChips';
import {BerxWhenPicker} from './BerxWhenPicker';
import {BerxFocusClearing} from './BerxFocusClearing';
import {useBerxScene} from './BerxSpatialScene';

/** A moment is cleared by choosing nothing, which the API sends as ''. */
export type BerxEditValue = string | number | null;

interface FieldBase {
	key: string;
	label: string;
	/** Empty is rejected before the request rather than by the server. */
	required?: boolean;
	/** Said under the field, when the server has a rule worth knowing. */
	hint?: string;
}

export type BerxEditField =
	| (FieldBase & {kind: 'text'; value: string; placeholder?: string})
	| (FieldBase & {kind: 'multiline'; value: string; placeholder?: string})
	| (FieldBase & {kind: 'number'; value: number | null; placeholder?: string; unit?: string})
	| (FieldBase & {kind: 'choice'; value: string; options: readonly {key: string; label: string}[]})
	| (FieldBase & {kind: 'moment'; value: number | null; clearable?: boolean});

export interface BerxEditSheetProps {
	visible: boolean;
	title: string;
	fields: readonly BerxEditField[];
	/**
	 * Receives only the fields that actually changed, keyed as the
	 * caller declared them. Must reject on failure and resolve only
	 * once the server has confirmed — the caller is expected to apply
	 * the server's returned object, not these values.
	 */
	onSave: (changed: Record<string, BerxEditValue>) => Promise<void>;
	onClose: () => void;
	/** True when the device is known to be unusable. The save is not attempted. */
	offline?: boolean;
	saveLabel?: string;
	testID?: string;
}

function isEmpty(v: BerxEditValue): boolean {
	return v === null || (typeof v === 'string' && v.trim().length === 0);
}

export function BerxEditSheet({
	visible,
	title,
	fields,
	onSave,
	onClose,
	offline = false,
	saveLabel = 'Сохранить',
	testID,
}: BerxEditSheetProps) {
	const {scene} = useBerxScene();
	/* keyed by field, holding only what the person actually touched —
	   an untouched field has no entry and is never sent */
	const [edits, setEdits] = useState<Record<string, BerxEditValue>>({});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmingDiscard, setConfirmingDiscard] = useState(false);
	const [box, setBox] = useState<BerxFocusRect | null>(null);
	const [window, setWindow] = useState({width: 0, height: 0});
	const field = useRef<BerxFocusField | null>(null);

	const current = useCallback(
		(f: BerxEditField): BerxEditValue => (f.key in edits ? edits[f.key] : f.value),
		[edits],
	);

	/* dirty means different from what the server gave us, not merely
	   touched: typing a character and deleting it is not an edit */
	const changed = useMemo(() => {
		const out: Record<string, BerxEditValue> = {};
		for (const f of fields) {
			if (!(f.key in edits)) continue;
			const next = edits[f.key];
			const before = f.value;
			if (typeof next === 'string' && typeof before === 'string' ? next.trim() !== before.trim() : next !== before) {
				out[f.key] = typeof next === 'string' ? next.trim() : next;
			}
		}
		return out;
	}, [edits, fields]);

	const dirty = Object.keys(changed).length > 0;
	const missing = fields.filter((f) => f.required && isEmpty(current(f)));
	const canSave = dirty && missing.length === 0 && !offline;

	const measureRoot = (event: LayoutChangeEvent) => {
		const {width, height} = event.nativeEvent.layout;
		setWindow((prev) => (prev.width === width && prev.height === height ? prev : {width, height}));
	};
	const measureCard = (event: LayoutChangeEvent) => {
		const {x, y, width, height} = event.nativeEvent.layout;
		setBox((prev) =>
			prev && prev.x === x && prev.y === y && prev.width === width && prev.height === height ? prev : {x, y, width, height},
		);
	};

	if (box && window.width > 0) {
		field.current = resolveFocus({
			rect: box,
			viewportWidth: window.width,
			viewportHeight: window.height,
			background: scene.background,
			tier: scene.budget.tier,
			blurred: scene.layers.D5.blurred,
		});
	}

	const close = useCallback(() => {
		setEdits({});
		setError(null);
		setConfirmingDiscard(false);
		onClose();
	}, [onClose]);

	const requestClose = useCallback(() => {
		if (busy) return;
		if (dirty) {
			setConfirmingDiscard(true);
			return;
		}
		close();
	}, [busy, dirty, close]);

	const save = useCallback(async () => {
		if (busy || !canSave) return;
		setBusy(true);
		setError(null);
		try {
			await onSave(changed);
			/* the caller applied the server's object; only now is it safe
			   to drop the local edits */
			setEdits({});
			setError(null);
			onClose();
		} catch (e) {
			setError(e instanceof Error && e.message ? e.message : 'Не удалось сохранить');
		} finally {
			setBusy(false);
		}
	}, [busy, canSave, changed, onSave, onClose]);

	if (!visible) return null;

	const focus = scene.layers.D5;

	return (
		<Modal visible transparent animationType="fade" onRequestClose={requestClose}>
			<View testID={testID} onLayout={measureRoot} style={[styles.room, {backgroundColor: scene.background}]}>
				{/* the room recedes around the object being changed, in its
				    own substrate — the same D5 field every focused object
				    in BERX gets, never a black scrim */}
				{field.current ? <BerxFocusClearing field={field.current} id="berx-edit-sheet" /> : null}

				<View style={styles.centre} pointerEvents="box-none">
					<View onLayout={measureCard} style={styles.cardWrap}>
						<BerxSurface
							surface={focus.surface}
							lighting={focus.lighting}
							radius={24}
							emissive
							emissiveGain={field.current?.emissionGain}>
							<View style={styles.body} accessibilityViewIsModal>
								<BerxText role="heading" heading>{title}</BerxText>

								<ScrollView
									style={styles.fields}
									contentContainerStyle={styles.fieldsBody}
									keyboardShouldPersistTaps="handled">
									{fields.map((f) => (
										<View key={f.key} style={styles.field}>
											<BerxText role="meta" emphasis="secondary">{f.label}</BerxText>
											<EditField
												field={f}
												value={current(f)}
												disabled={busy}
												onChange={(v) => setEdits((prev) => ({...prev, [f.key]: v}))}
											/>
											{f.hint ? <BerxText role="meta" emphasis="secondary">{f.hint}</BerxText> : null}
										</View>
									))}
								</ScrollView>

								{/* what actually stops the save, said before the tap
								    rather than after it */}
								{missing.length > 0 ? (
									<BerxText role="meta" emphasis="secondary" liveRegion="polite">
										{`Нужно заполнить: ${missing.map((f) => f.label.toLowerCase()).join(', ')}`}
									</BerxText>
								) : null}
								{offline ? (
									<BerxText role="meta" emphasis="secondary" liveRegion="polite">
										Нет соединения — изменения не уйдут на сервер, пока связь не вернётся. Всё, что вы ввели, останется здесь.
									</BerxText>
								) : null}
								{error ? (
									<BerxText role="meta" liveRegion="assertive" style={styles.error}>{error}</BerxText>
								) : null}

								{confirmingDiscard ? (
									<View style={styles.answers} accessibilityRole="alert">
										<BerxText role="body" emphasis="secondary">Закрыть без сохранения? Изменения пропадут.</BerxText>
										<BerxButton label="Вернуться к правкам" variant="secondary" onPress={() => setConfirmingDiscard(false)} fullWidth />
										<BerxButton label="Закрыть без сохранения" variant="danger" onPress={close} fullWidth />
									</View>
								) : (
									<View style={styles.answers}>
										<BerxButton label="Отмена" variant="secondary" onPress={requestClose} disabled={busy} fullWidth />
										<BerxButton label={saveLabel} loading={busy} disabled={!canSave} onPress={save} fullWidth />
									</View>
								)}
							</View>
						</BerxSurface>
					</View>
				</View>
			</View>
		</Modal>
	);
}

function EditField({
	field,
	value,
	disabled,
	onChange,
}: {
	field: BerxEditField;
	value: BerxEditValue;
	disabled: boolean;
	onChange: (v: BerxEditValue) => void;
}) {
	if (field.kind === 'choice') {
		return (
			<BerxChoiceChips
				options={field.options}
				value={typeof value === 'string' ? value : undefined}
				onChange={(k) => onChange(k)}
				accessibilityLabel={field.label}
				disabled={disabled}
			/>
		);
	}

	if (field.kind === 'moment') {
		return (
			<View style={styles.moment}>
				<BerxWhenPicker
					label={field.label}
					/* the rail is forward-looking, so an unset moment starts
					   from now rather than from 1970 */
					value={typeof value === 'number' ? value : Math.floor(Date.now() / 1000)}
					onChange={(v) => onChange(v)}
				/>
				{field.clearable && value !== null ? (
					<BerxButton label="Убрать" variant="secondary" onPress={() => onChange(null)} disabled={disabled} />
				) : null}
			</View>
		);
	}

	if (field.kind === 'number') {
		return (
			<BerxInput
				value={value === null || value === undefined ? '' : String(value)}
				onChangeText={(t) => {
					const digits = t.replace(/[^0-9.]/g, '');
					onChange(digits.length === 0 ? null : Number(digits));
				}}
				keyboardType="numeric"
				placeholder={field.placeholder}
				editable={!disabled}
				accessibilityLabel={field.unit ? `${field.label}, ${field.unit}` : field.label}
			/>
		);
	}

	return (
		<BerxInput
			value={typeof value === 'string' ? value : ''}
			onChangeText={onChange}
			placeholder={field.placeholder}
			multiline={field.kind === 'multiline'}
			style={field.kind === 'multiline' ? styles.multiline : undefined}
			editable={!disabled}
			accessibilityLabel={field.label}
		/>
	);
}

const styles = StyleSheet.create({
	room: {flex: 1},
	centre: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, zIndex: 5},
	/* an object being changed, not a sheet covering the room */
	cardWrap: {width: '100%', maxWidth: 460},
	body: {padding: spacing.xl, gap: spacing.md},
	/* the fields scroll inside the card so a long form never pushes the
	   save button off the bottom of the screen */
	fields: {maxHeight: 380},
	fieldsBody: {gap: spacing.md, paddingBottom: spacing.xs},
	field: {gap: spacing.xs},
	multiline: {minHeight: 88, textAlignVertical: 'top'},
	moment: {gap: spacing.sm},
	error: {color: colors.danger},
	answers: {gap: spacing.sm, marginTop: spacing.xs},
});
