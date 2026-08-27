/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real, significant gap found in a broader sweep
 * of client.ts for zero-UI-caller methods: api.updateProfile() (real
 * PATCH /me, components/OssnApi/v1/me.php) had NO screen anywhere in
 * the app — a user could see their own name/email on ProfileScreen
 * but never change either from the app itself. `first_name`/
 * `last_name` are now real, separate fields on BerxUser (added this
 * batch alongside the existing combined `fullname`) so this screen
 * pre-fills exactly what the server holds, not a guessed split of
 * the display name.
 *
 * Password change is a separate, explicitly labeled section on the
 * same screen (not a separate route — updateProfile() is one real
 * endpoint for both). The server does NOT require the current
 * password to set a new one (confirmed by reading me.php's PATCH
 * branch directly — a pre-existing property of the endpoint, not
 * something this screen can fix), so the only real safeguard this
 * screen can honestly add is a client-side "repeat new password"
 * match check before submitting — never faked as a security control,
 * just a typo guard.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxUser} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onSaved: () => void;
	onBack?: () => void;
}

export default function EditProfileScreen({api, onSaved, onBack}: Props) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const user: BerxUser = await api.me();
			setFirstName(user.first_name);
			setLastName(user.last_name);
			setEmail(user.email);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function submit() {
		if (!firstName.trim()) {
			setError('Укажите имя.');
			return;
		}
		if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			setError('Некорректный email.');
			return;
		}
		if (newPassword && newPassword !== repeatPassword) {
			setError('Пароли не совпадают.');
			return;
		}
		if (newPassword && newPassword.length < 6) {
			setError('Пароль должен быть не короче 6 символов.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await api.updateProfile({
				firstname: firstName.trim(),
				lastname: lastName.trim(),
				email: email.trim(),
				...(newPassword ? {password: newPassword} : {}),
			});
			onSaved();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать профиль" onBack={onBack} />
				<BerxLoadingState />
			</View>
		);
	}
	if (error && !firstName && !email) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать профиль" onBack={onBack} />
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Редактировать профиль" onBack={onBack} />
			<View style={styles.body}>
				<BerxInput placeholder="Имя" value={firstName} onChangeText={setFirstName} />
				<BerxInput placeholder="Фамилия" value={lastName} onChangeText={setLastName} />
				<BerxInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

				<Text style={styles.sectionTitle}>Сменить пароль (необязательно)</Text>
				<BerxInput placeholder="Новый пароль" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
				<BerxInput placeholder="Повторите новый пароль" value={repeatPassword} onChangeText={setRepeatPassword} secureTextEntry />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Сохранить" loading={submitting} onPress={submit} fullWidth />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
