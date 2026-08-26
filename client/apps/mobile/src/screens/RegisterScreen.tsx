/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real, honest gap this closes: POST /auth/register existed since the
 * earliest API-foundation phase, with a matching client.register()
 * just added, but no screen ever called either — the auth flow only
 * ever had a way in for people who already had an account.
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {BerxApiError} from '@berx/core';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';

interface Props {
	api: BerxApiClient;
	onRegistered: () => void;
	onBack: () => void;
}

export default function RegisterScreen({api, onRegistered, onBack}: Props) {
	const [username, setUsername] = useState('');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState<string | null>(null);

	async function handleSubmit() {
		if (!username.trim() || !firstname.trim() || !lastname.trim() || !email.trim() || !password) {
			setError('Заполните все поля');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.register({
				username: username.trim(),
				firstname: firstname.trim(),
				lastname: lastname.trim(),
				email: email.trim(),
				password,
			});
			// Honest, not a fake "logged in" state: the real API requires
			// email activation before login() will accept these
			// credentials — see auth.php's register action. Showing the
			// server's own message rather than inventing a friendlier one
			// that might not match what actually needs to happen next.
			setDone(res.message);
		} catch (e) {
			if (e instanceof BerxApiError) {
				if (e.code === 'username_taken') setError('Этот логин уже занят');
				else if (e.code === 'invalid_username') setError('Логин недопустим');
				else if (e.code === 'email_taken') setError('Этот email уже используется');
				else if (e.code === 'invalid_password') setError('Пароль слишком простой');
				else if (e.code === 'invalid_email') setError('Некорректный email');
				else setError('Не удалось зарегистрироваться');
			} else {
				setError('Не удалось подключиться');
			}
		} finally {
			setSubmitting(false);
		}
	}

	if (done) {
		return (
			<View style={styles.screen}>
				<Text style={styles.title}>Почти готово</Text>
				<Text style={styles.doneText}>{done}</Text>
				<BerxButton label="К входу" onPress={onRegistered} fullWidth />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<Text style={styles.title}>Создать аккаунт</Text>
			<BerxInput placeholder="Имя" value={firstname} onChangeText={setFirstname} style={styles.input} />
			<BerxInput placeholder="Фамилия" value={lastname} onChangeText={setLastname} style={styles.input} />
			<BerxInput placeholder="Логин" autoCapitalize="none" value={username} onChangeText={setUsername} style={styles.input} />
			<BerxInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
			<BerxInput placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
			{error ? <Text style={styles.error}>{error}</Text> : null}
			<BerxButton label="Зарегистрироваться" onPress={handleSubmit} loading={submitting} fullWidth />
			<BerxButton label="Назад" variant="secondary" onPress={onBack} fullWidth />
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, padding: spacing.xl, justifyContent: 'center', gap: spacing.md},
	title: {fontSize: typography.sizeXl, fontWeight: typography.weightBold, color: colors.text, textAlign: 'center', marginBottom: spacing.md},
	input: {marginBottom: 0},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center'},
	doneText: {color: colors.textDim, fontSize: typography.sizeBase, textAlign: 'center', marginBottom: spacing.lg},
});
