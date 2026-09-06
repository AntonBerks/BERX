/**
 * BerxConfirm — the question BERX asks before something irreversible.
 *
 * BERX had no confirmation anywhere. Blocking a person, deleting a
 * post, leaving a community and revoking a session were all one tap
 * from done, and the only protection was that some of those controls
 * were hard to reach by accident. That is not a protection.
 *
 * It is built as a focus moment rather than an alert box, because that
 * is what it is: the scene stops, the room falls back, and one object
 * comes forward carrying the question. The falloff is the same D5
 * field every other focused object in BERX gets — resolved from the
 * measured box of this card, in the scene's own substrate — so the
 * confirmation belongs to the room instead of covering it.
 *
 * Three things it will not do:
 *
 *   It will not pre-select the destructive answer. Cancel takes the
 *   focus and the escape/back gesture, and the destructive action is
 *   never the one a stray press lands on.
 *
 *   It will not close on its own. A confirmation that dismisses on a
 *   backdrop tap turns "I misread this" into "done", so the backdrop
 *   is inert and the only ways out are the two answers.
 *
 *   It will not report success before the server does. `onConfirm`
 *   is awaited; the card holds a busy state until it resolves, and a
 *   rejection keeps the question open with the real reason under it.
 */
import {useCallback, useRef, useState} from 'react';
import {Modal, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import {resolveFocus, type BerxFocusField, type BerxFocusRect} from '@berx/spatial';
import {colors, spacing} from '../tokens';
import {BerxText} from './BerxText';
import {BerxButton} from '../components/BerxButton';
import {BerxSurface} from './BerxSurface';
import {BerxFocusClearing} from './BerxFocusClearing';
import {useBerxScene} from './BerxSpatialScene';

export interface BerxConfirmProps {
	visible: boolean;
	/** What is about to happen, as a question. */
	title: string;
	/** What it will actually do — consequences, not reassurance. */
	body?: string;
	confirmLabel: string;
	cancelLabel?: string;
	/** True when confirming destroys or restricts something. */
	destructive?: boolean;
	/** Must resolve only once the server has confirmed, and reject on failure. */
	onConfirm: () => Promise<void>;
	onCancel: () => void;
	testID?: string;
}

export function BerxConfirm({
	visible,
	title,
	body,
	confirmLabel,
	cancelLabel = 'Отмена',
	destructive,
	onConfirm,
	onCancel,
	testID,
}: BerxConfirmProps) {
	const {scene} = useBerxScene();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [box, setBox] = useState<BerxFocusRect | null>(null);
	const [window, setWindow] = useState({width: 0, height: 0});
	const field = useRef<BerxFocusField | null>(null);

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

	const confirm = useCallback(async () => {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			await onConfirm();
		} catch (e) {
			/* the question stays open with the real reason: a failed
			   confirmation that closes looks exactly like a successful one */
			setError(e instanceof Error ? e.message : 'Не удалось выполнить');
		} finally {
			setBusy(false);
		}
	}, [busy, onConfirm]);

	if (!visible) return null;

	const focus = scene.layers.D5;

	return (
		<Modal visible transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
			<View
				testID={testID}
				onLayout={measureRoot}
				style={[styles.room, {backgroundColor: scene.background}]}>
				{/* the room falls back around the question, in its own
				    substrate — never toward black */}
				{field.current ? <BerxFocusClearing field={field.current} id="berx-confirm" /> : null}

				<View style={styles.centre} pointerEvents="box-none">
					<View onLayout={measureCard} style={styles.cardWrap}>
						<BerxSurface
							surface={focus.surface}
							lighting={focus.lighting}
							radius={24}
							emissive
							emissiveGain={field.current?.emissionGain}>
							<View
								style={styles.body}
								accessible
								accessibilityRole="alert"
								accessibilityLabel={body ? `${title}. ${body}` : title}
								accessibilityViewIsModal>
								<BerxText role="heading" heading>{title}</BerxText>
								{body ? <BerxText role="body" emphasis="secondary">{body}</BerxText> : null}
								{error ? (
									<BerxText role="meta" style={styles.error}>{error}</BerxText>
								) : null}

								{/* cancel first, and it is the one a stray press
								    finds: the destructive answer is never the
								    default anywhere in BERX */}
								<View style={styles.answers}>
									<BerxButton label={cancelLabel} variant="secondary" onPress={onCancel} disabled={busy} fullWidth />
									<BerxButton
										label={confirmLabel}
										variant={destructive ? 'danger' : 'primary'}
										loading={busy}
										onPress={confirm}
										fullWidth
									/>
								</View>
							</View>
						</BerxSurface>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	room: {flex: 1},
	centre: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, zIndex: 5},
	/* the question is an object, not a sheet: it does not reach the edges */
	cardWrap: {width: '100%', maxWidth: 420},
	body: {padding: spacing.xl, gap: spacing.md},
	error: {color: colors.danger},
	answers: {gap: spacing.sm, marginTop: spacing.xs},
});
