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
 * Everything the server refuses for a reason of its own — the whole
 * account system switched off (403), too many attempts (429), BERX
 * being down (500) — used to arrive as one interchangeable "не удалось
 * зарегистрироваться", so a wait-and-retry looked exactly like a
 * never-going-to-work. Those go through classifyFailure now, and the
 * screen says when trying again cannot change the answer.
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
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

/**
 * The error codes auth.php actually returns for a field, and what each
 * one means to the person typing. Anything not in this table is not a
 * field problem and must not be reported as one.
 */
const FIELD_ERROR: Record<string, string> = {
	username_taken: 'Этот логин уже занят',
	invalid_username: 'Логин недопустим',
	email_taken: 'Этот email уже используется',
	invalid_password: 'Пароль слишком простой',
	invalid_email: 'Некорректный email',
};

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
	/**
	 * A dead network is not a rejected registration.
	 *
	 * Signing up with no connection produced whatever generic failure
	 * came back, so the one problem a person can act on looked like the
	 * one they cannot. Offline is real here now and takes precedence:
	 * nothing was sent, so nothing was refused.
	 */
	const {offline} = useBerxConnectivity();
	const [username, setUsername] = useState('');
	const [firstname, setFirstname] = useState('');
	const [lastname, setLastname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	/* false where pressing the button again fails identically — a
	   refused capability or a resource that is not there. The button
	   stays (the form above it can still change), but the screen says
	   so instead of inviting a pointless second attempt. */
	const [retryable, setRetryable] = useState(true);
	const [done, setDone] = useState<string | null>(null);

	async function handleSubmit() {
		if (!username.trim() || !firstname.trim() || !lastname.trim() || !email.trim() || !password) {
			setError('Заполните все поля');
			return;
		}
		setSubmitting(true);
		setError(null);
		setRetryable(true);
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
			/* A field the server named is the most actionable answer there
			   is, so it wins: the fix is one edit away in the form above. */
			const field = e instanceof BerxApiError ? FIELD_ERROR[e.code] : undefined;
			if (field) {
				setError(field);
			} else {
				/* everything else is about the request, not the form: a
				   refusal, a rate limit, a dead server and a dead network
				   are four different things and now read as four */
				const failure = classifyFailure(e, offline);
				setError(
					failure.kind === 'forbidden'
						? 'Регистрация сейчас закрыта на сервере.'
						: failure.message,
				);
				setRetryable(failure.retryable);
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
					<View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.errorBlock}>
						<Text style={styles.error}>{error}</Text>
						{!retryable ? (
							<Text style={styles.errorHint}>Повторная попытка ничего не изменит.</Text>
						) : null}
					</View>
				) : null}
				{offline ? (
					<View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.offlineNotice}>
						<BerxText role="callout">Нет соединения</BerxText>
						<BerxText role="meta" emphasis="secondary">
							BERX не сможет создать аккаунт, пока связь не вернётся. Всё, что вы ввели, останется здесь.
						</BerxText>
					</View>
				) : null}
				<BerxButton
					label="Зарегистрироваться"
					onPress={handleSubmit}
					loading={submitting}
					disabled={!canSubmit || offline}
					fullWidth
				/>
				<BerxButton label="Назад" variant="secondary" onPress={onBack} fullWidth />
			</BerxSpatialCard>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	/* the notice is a block, not a line: styles.error on this screen is
	   a Text style */
	offlineNotice: {gap: 2},
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
	errorBlock: {gap: 2, marginBottom: spacing.sm},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center'},
	errorHint: {color: colors.textDim, fontSize: typography.sizeSm, textAlign: 'center'},
	doneText: {marginBottom: spacing.lg},
});
