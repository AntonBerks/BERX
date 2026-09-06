/**
 * Editing your own account.
 *
 * BERX could register a person and then never let them change
 * anything about themselves: `PATCH /me` has always been real —
 * firstname, lastname, email, password — and no screen in the product
 * called it. You could not fix a typo in your own name.
 *
 * Four fields, because four is what the endpoint accepts. BERX has no
 * bio, no pronouns, no location and no interest tags on a general
 * profile, so this screen does not pretend to offer them: the fields
 * here are exactly the ones the server will store.
 *
 * Only what changed is sent. PATCH means the untouched fields keep
 * their values, so opening this screen and saving cannot quietly
 * rewrite an email the person never looked at.
 */
import {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxSection} from '../../../../packages/design-system/src/spatial/BerxSection';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';

export interface EditProfileScreenProps {
	api: BerxApiClient;
	/** Called with the server's own updated user, never with local state. */
	onSaved?: () => void;
	onBack?: () => void;
}

export default function EditProfileScreen(props: EditProfileScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="identity" testID="edit-profile">
			<EditProfileScreenBody {...props} />
		</BerxFamilyScene>
	);
}

/**
 * The server stores a first and a last name and returns them joined.
 *
 * `GET /me` gives `fullname` only, and `PATCH /me` takes the two parts
 * separately, so the fields have to be seeded from the joined value:
 * the first word is the first name and whatever follows is the rest.
 * That is a guess about someone's name, which is why the fields are
 * shown filled in and editable rather than being sent back unchanged —
 * anyone whose name splits differently can correct it, and nothing is
 * written until they do something.
 */
function splitName(fullname: string): {first: string; last: string} {
	const trimmed = fullname.trim();
	const gap = trimmed.indexOf(' ');
	if (gap < 0) return {first: trimmed, last: ''};
	return {first: trimmed.slice(0, gap), last: trimmed.slice(gap + 1).trim()};
}

function EditProfileScreenBody({api, onSaved, onBack}: EditProfileScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [failure, setFailure] = useState<{message: string; retryable: boolean} | null>(null);

	const [first, setFirst] = useState('');
	const [last, setLast] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [repeat, setRepeat] = useState('');
	/* what the server had when this screen opened — the baseline every
	   field is compared against, so an untouched field is never sent */
	const [saved, setSaved] = useState<{first: string; last: string; email: string} | null>(null);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		setNotice(null);
		try {
			const me = await api.me();
			const name = splitName(me.fullname);
			setFirst(name.first);
			setLast(name.last);
			setEmail(me.email);
			setSaved({first: name.first, last: name.last, email: me.email});
			setState('default');
		} catch (e) {
			const f = classifyFailure(e, offline);
			setFailure({message: f.message, retryable: f.retryable});
			setState(f.state);
		}
	}, [api, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const passwordMismatch = password.length > 0 && password !== repeat;
	const changed =
		saved !== null &&
		(first.trim() !== saved.first || last.trim() !== saved.last || email.trim() !== saved.email || password.length > 0);

	async function save() {
		if (!saved || !changed || passwordMismatch) return;
		setBusy(true);
		setNotice(null);
		try {
			/* only the fields that actually differ: PATCH keeps the rest,
			   and sending an unchanged email would be this screen
			   rewriting something nobody touched */
			const fields: {firstname?: string; lastname?: string; email?: string; password?: string} = {};
			if (first.trim() !== saved.first) fields.firstname = first.trim();
			if (last.trim() !== saved.last) fields.lastname = last.trim();
			if (email.trim() !== saved.email) fields.email = email.trim();
			if (password.length > 0) fields.password = password;

			const updated = await api.updateProfile(fields);
			/* the server's own record, not the text in these boxes */
			const name = splitName(updated.fullname);
			setFirst(name.first);
			setLast(name.last);
			setEmail(updated.email);
			setSaved({first: name.first, last: name.last, email: updated.email});
			setPassword('');
			setRepeat('');
			setNotice('Сохранено');
			onSaved?.();
		} catch (e) {
			const f = classifyFailure(e, offline);
			setNotice(f.message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Профиль" onBack={onBack} />

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={failure?.message}
				retryable={failure?.retryable ?? true}
				style={styles.body}>
				<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
					{/* D2 — the form is a structural object in the room */}
					<BerxGlassSurface padding="lg" style={styles.form}>
						<BerxSection label="Имя">
							<BerxInput
								placeholder="Имя"
								value={first}
								onChangeText={setFirst}
								accessibilityLabel="Имя"
								autoCapitalize="words"
							/>
							<BerxInput
								placeholder="Фамилия"
								value={last}
								onChangeText={setLast}
								accessibilityLabel="Фамилия"
								autoCapitalize="words"
							/>
						</BerxSection>

						<BerxSection label="Почта">
							<BerxInput
								placeholder="Почта"
								value={email}
								onChangeText={setEmail}
								accessibilityLabel="Адрес почты"
								autoCapitalize="none"
								keyboardType="email-address"
							/>
						</BerxSection>

						{/* changing a password is its own act: left empty, nothing
						    is sent, and the field never shows what is stored —
						    the server does not return it and this screen will not
						    invent a row of dots to imply it did */}
						<BerxSection label="Новый пароль" detail="Оставьте пустым, чтобы не менять">
							<BerxInput
								placeholder="Новый пароль"
								value={password}
								onChangeText={setPassword}
								accessibilityLabel="Новый пароль"
								secureTextEntry
								autoCapitalize="none"
							/>
							<BerxInput
								placeholder="Ещё раз"
								value={repeat}
								onChangeText={setRepeat}
								accessibilityLabel="Повторите новый пароль"
								secureTextEntry
								autoCapitalize="none"
							/>
							{passwordMismatch ? (
								<BerxText role="meta" liveRegion="polite" style={styles.warning}>
									Пароли не совпадают
								</BerxText>
							) : null}
						</BerxSection>

						{notice ? (
							<BerxText role="meta" emphasis="secondary" liveRegion="polite">
								{notice}
							</BerxText>
						) : null}

						{/* D4 — the commit, disabled until something has actually
						    changed: a save that sends nothing is a control that
						    does nothing */}
						<BerxActionShelf variant="anchored" align="stack">
							<BerxButton
								label="Сохранить"
								loading={busy}
								disabled={!changed || passwordMismatch}
								onPress={save}
								fullWidth
							/>
						</BerxActionShelf>
					</BerxGlassSurface>
				</BerxSceneScroll>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {flex: 1},
	scrollBody: {padding: spacing.lg, paddingBottom: spacing.xxxl},
	form: {gap: spacing.md},
	warning: {opacity: 0.9},
});
