/**
 * BERX-003 — Create Account.
 *
 * Registration is honest about what actually happens next: the real
 * API requires email activation before login() will accept the new
 * credentials (see auth.php's register action), so the success state
 * shows the server's own message rather than a friendlier invention
 * that might not match what the user has to do. Field-level errors
 * are mapped from the API's real error codes.
 *
 * v9 puts the form on the structure plane of the AUTH hero scene,
 * makes the error and the success announcement real live regions, and
 * disables submit until every required field is filled instead of
 * failing after the tap.
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {BerxApiError} from '@berx/core';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxWordmark} from '../../../../packages/design-system/src/spatial/BerxWordmark';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxScreenScene} from '../spatial/BerxScreenScene';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface RegisterScreenProps {
	api: BerxApiClient;
	onRegistered: () => void;
	onBack: () => void;
}

export default function RegisterScreen(props: RegisterScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-003" testID="berx-003">
			<RegisterSceneBody {...props} />
		</BerxScreenScene>
	);
}

function RegisterSceneBody({api, onRegistered, onBack}: RegisterScreenProps) {
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

	/* every field is required by the server, so submit says so up front */
	const canSubmit =
		username.trim().length > 0 &&
		firstname.trim().length > 0 &&
		lastname.trim().length > 0 &&
		email.trim().length > 0 &&
		password.length > 0;

	if (done) {
		return (
			<View style={styles.screen}>
				<View style={styles.masthead}>
					<BerxWordmark size={34} />
					<BerxText role="heading" heading>
						Почти готово
					</BerxText>
				</View>
				<BerxSpatialCard depth="D2" padding={spacing.xl}>
					{/* the server's own instruction, announced, not just drawn */}
					{/* the server's own instruction, announced, not just drawn */}
					<View accessibilityLiveRegion="polite" style={styles.doneText}>
						<BerxText role="body" emphasis="secondary" style={styles.centered}>
							{done}
						</BerxText>
					</View>
					<BerxButton label="К входу" onPress={onRegistered} fullWidth />
				</BerxSpatialCard>
			</View>
		);
	}

	return (
		<BerxSceneScroll
			style={styles.screen}
			contentContainerStyle={styles.scrollBody}
			keyboardShouldPersistTaps="handled">
			<View style={styles.masthead}>
				<BerxWordmark size={34} />
			</View>
			<BerxText role="heading" heading style={styles.title}>
				Создать аккаунт
			</BerxText>
			<BerxSpatialCard depth="D2" padding={spacing.xl}>
				<BerxInput placeholder="Имя" value={firstname} onChangeText={setFirstname} style={styles.input} />
				<BerxInput placeholder="Фамилия" value={lastname} onChangeText={setLastname} style={styles.input} />
				<BerxInput placeholder="Логин" autoCapitalize="none" value={username} onChangeText={setUsername} style={styles.input} />
				<BerxInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
				<BerxInput placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
				{error ? (
					<Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>
						{error}
					</Text>
				) : null}
				<BerxButton
					label="Зарегистрироваться"
					onPress={handleSubmit}
					loading={submitting}
					disabled={!canSubmit}
					fullWidth
				/>
				<BerxButton label="Назад" variant="secondary" onPress={onBack} fullWidth />
			</BerxSpatialCard>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	/* the form scrolls: five fields and a keyboard do not fit on a
	   small phone, and a centred column with nothing to scroll simply
	   put the submit button out of reach */
	scrollBody: {flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingVertical: spacing.xl, gap: spacing.md},
	screen: {flex: 1},
	masthead: {alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
	centered: {textAlign: 'center'},
	title: {textAlign: 'center', marginBottom: spacing.md},
	/* the inputs sit inside one glass pane now, so they need their own rhythm */
	input: {marginBottom: spacing.md},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center'},
	doneText: {marginBottom: spacing.lg},
});
