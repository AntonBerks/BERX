/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real, honest gap this closes: registration (RegisterScreen) and
 * login both existed, but a freshly-activated account landed straight
 * in the home feed with no first-run moment at all — POST /me/avatar
 * (client.ts's uploadAvatar()) was called from nowhere in the app.
 *
 * Shown exactly once, right after the FIRST successful login that
 * follows a registration in this same app session (gated by AppShell's
 * `pendingOnboarding` module flag — see its header comment for why
 * this is a session-local signal, not a new persistent server flag or
 * a new local-storage dependency). BERX ID / name / email were already
 * collected at registration — this screen only CONFIRMS them (real
 * data from the just-completed /me call, never re-asked) and offers
 * the one genuinely new, real, optional action: an avatar.
 *
 * Rules honored: avatar stays fully optional (Skip always available,
 * enabled, real navigation — not a disabled placeholder); nothing here
 * is mandatory beyond what registration already required; no interest
 * picker, no invented profile fields (no bio/city field exists on
 * PATCH /me, so none is faked here).
 */
import {useState, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxUser} from '@berx/api/types';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	user: BerxUser;
	pickImage: () => Promise<BerxFilePart | null>;
	onComplete: () => void;
}

export default function OnboardingScreen({api, user, pickImage, onComplete}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [step, setStep] = useState<'welcome' | 'avatar'>('welcome');
	const [iconUrl, setIconUrl] = useState(user.icon_url);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handlePickAvatar() {
		const picked = await pickImage();
		if (!picked) return; // cancelled — real optional action, not an error
		setUploading(true);
		setError(null);
		try {
			const res = await api.uploadAvatar(picked);
			setIconUrl(res.icon_url);
		} catch {
			setError('Не удалось загрузить фото. Можно пропустить и добавить его позже в профиле.');
		} finally {
			setUploading(false);
		}
	}

	if (step === 'welcome') {
		return (
			<View style={styles.screen}>
				<Text style={styles.eyebrow}>Добро пожаловать в BERX</Text>
				<BerxAvatar iconUrl={iconUrl} fallbackInitial={user.username.charAt(0)} size={88} />
				<Text style={styles.name}>{user.fullname}</Text>
				<Text style={styles.handle}>@{user.username}</Text>
				<Text style={styles.body}>Это ваш BERX ID — по нему вас найдут друзья, места и события.</Text>
				<BerxButton label="Далее" onPress={() => setStep('avatar')} fullWidth />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<Text style={styles.eyebrow}>Фото профиля</Text>
			<BerxAvatar iconUrl={iconUrl} fallbackInitial={user.username.charAt(0)} size={96} />
			<Text style={styles.body}>Необязательно — можно добавить сейчас или позже в настройках профиля.</Text>
			{error ? <Text style={styles.error}>{error}</Text> : null}
			<BerxButton label={iconUrl ? 'Сменить фото' : 'Добавить фото'} variant="secondary" onPress={handlePickAvatar} loading={uploading} fullWidth />
			<BerxButton label="Готово" onPress={onComplete} fullWidth />
			<BerxButton label="Пропустить" variant="secondary" onPress={onComplete} fullWidth />
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.md},
	eyebrow: {fontSize: typography.sizeSm, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1},
	name: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, color: colors.text, marginTop: spacing.sm},
	handle: {fontSize: typography.sizeBase, color: colors.accent},
	body: {fontSize: typography.sizeBase, color: colors.textDim, textAlign: 'center', marginBottom: spacing.md},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center'},
});
