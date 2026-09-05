/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Honest scope, matching the web settings tab this mirrors: OSSN core
 * has no "deactivate/pause" concept, only OssnUser::deleteUser(),
 * which is PERMANENT. api.deleteAccount(password) re-authenticates
 * server-side with the real password before deleting anything, and
 * revokes the calling token on success (components/OssnApi/v1/
 * me.php) — this screen does not fabricate a soft-delete that
 * doesn't exist.
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface DeleteAccountScreenProps {
	api: BerxApiClient;
	onDeleted: () => void;
	onBack?: () => void;
}

export default function DeleteAccountScreen(props: DeleteAccountScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="delete-account">
			<DeleteAccountScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function DeleteAccountScreenBody({api, onDeleted, onBack}: DeleteAccountScreenProps) {
	const [password, setPassword] = useState('');
	const [confirming, setConfirming] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (password.length === 0) {
			setError('Введите пароль.');
			return;
		}
		if (!confirming) {
			// First tap asks for real confirmation before the second,
			// destructive tap — matches the web tab's confirm() dialog
			// intent without a native Alert dependency this sandbox
			// can't verify.
			setConfirming(true);
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await api.deleteAccount(password);
			onDeleted();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось удалить аккаунт');
			setConfirming(false);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Удаление аккаунта" onBack={onBack} />
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.body}>
					{/* D2 — the consequences and the confirmation are one object.
					    Nothing else on this screen competes with them. */}
					<BerxGlassSurface padding="lg" style={styles.form}>
						<BerxText role="meta" emphasis="secondary">Это действие необратимо. Аккаунт и все связанные данные будут удалены безвозвратно.</BerxText>
						<View style={styles.list}>
							<BerxText role="meta" emphasis="tertiary">· Все ваши посты, комментарии и лайки будут удалены</BerxText>
							<BerxText role="meta" emphasis="tertiary">· Все загруженные фото и файлы будут удалены</BerxText>
							<BerxText role="meta" emphasis="tertiary">· Отменить это действие будет невозможно</BerxText>
						</View>
						<BerxInput placeholder="Введите пароль для подтверждения" value={password} onChangeText={setPassword} secureTextEntry />
						{error ? <Text style={styles.error}>{error}</Text> : null}
						{/* D4 — a destructive commit, on the control plane where the
						    person has to reach for it deliberately */}
						<BerxActionShelf variant="anchored" align="stack">
							<BerxButton
								label={confirming ? 'Точно удалить навсегда' : 'Удалить аккаунт'}
								variant="danger"
								loading={submitting}
								disabled={password.length === 0}
								onPress={submit}
								fullWidth
							/>
						</BerxActionShelf>
					</BerxGlassSurface>
				</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	form: {gap: spacing.md},
	list: {gap: 4},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
