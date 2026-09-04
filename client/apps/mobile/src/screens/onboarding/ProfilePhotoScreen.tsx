/**
 * BERX-006 — Profile Photo.
 *
 * Real capability end to end: the device picker returns a real file,
 * `POST /api/v1/me/avatar` uploads it, and the server answers with the
 * real `icon_url`, which is what gets shown. Nothing is displayed as
 * saved before that response arrives.
 *
 * Skipping is a real choice, not a dead end — BERX renders an initial
 * for an account with no photo everywhere else, so an account without
 * one is complete, just quieter.
 */
import {useCallback, useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxDepthLayer} from '../../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {BerxIcon} from '../../../../../packages/design-system/src/icons/BerxIcon';
import {useBerxScene} from '../../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene} from '../../spatial/BerxScreenScene';

export interface ProfilePhotoScreenProps {
	api: BerxApiClient;
	/** The device picker. Injected so this screen never imports a native module directly. */
	pickImage: () => Promise<BerxFilePart | null>;
	/** Current avatar, when the account already has one. */
	currentIconUrl?: string;
	displayName: string;
	onDone: () => void;
	onBack?: () => void;
}

export default function ProfilePhotoScreen(props: ProfilePhotoScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-006" testID="berx-006">
			<ProfilePhotoSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ProfilePhotoSceneBody({api, pickImage, currentIconUrl, displayName, onDone, onBack}: ProfilePhotoScreenProps) {
	const {scene} = useBerxScene();
	const [iconUrl, setIconUrl] = useState<string | undefined>(currentIconUrl);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const choose = useCallback(async () => {
		setError(null);
		let part: BerxFilePart | null = null;
		try {
			part = await pickImage();
		} catch {
			setError('Не удалось открыть галерею.');
			return;
		}
		/* the user cancelled — not an error, and not a failure to report */
		if (!part) return;

		setBusy(true);
		try {
			const res = await api.uploadAvatar(part);
			/* the server's own URL, only after it confirms */
			setIconUrl(res.icon_url);
			setSaved(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить фото.');
		} finally {
			setBusy(false);
		}
	}, [api, pickImage]);

	return (
		<View style={styles.screen}>
			<BerxHeader title="Фото профиля" onBack={onBack} />

			<View style={styles.body}>
				<BerxDepthLayer depth="D5" style={styles.haloLayer} decorative>
					<BerxEnergyHalo size={230} intensity={iconUrl ? 0.7 : 0.28} />
				</BerxDepthLayer>

				<BerxSpatialCard depth="D3" padding={spacing.xl}>
					<View style={styles.avatarWrap}>
						{iconUrl ? (
							<Image
								source={{uri: iconUrl}}
								accessible
								accessibilityRole="image"
								accessibilityLabel={`Фото профиля: ${displayName}`}
								style={[styles.avatar, {borderColor: scene.accent}]}
							/>
						) : (
							<View style={[styles.avatar, styles.avatarEmpty, {borderColor: scene.layers.D4.surface.borderColor}]}>
								<Text style={[styles.initial, {color: scene.accent}]}>{displayName.slice(0, 1).toUpperCase()}</Text>
							</View>
						)}
					</View>

					<Text style={styles.title} accessibilityRole="header">
						Как вас узнают
					</Text>
					<Text style={styles.lead}>
						Фото появляется рядом с вашими моментами, местами и сообщениями. Его можно поменять в любой момент.
					</Text>

					{error ? (
						<Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>
							{error}
						</Text>
					) : null}
					{saved && !error ? (
						<Text accessibilityLiveRegion="polite" style={styles.saved}>
							Фото сохранено
						</Text>
					) : null}

					<BerxActionShelf variant="anchored">
						<BerxButton label={iconUrl ? 'Выбрать другое' : 'Выбрать фото'} onPress={choose} loading={busy} fullWidth />
						<BerxButton
							label={iconUrl ? 'Готово' : 'Пропустить'}
							variant="secondary"
							onPress={onDone}
							disabled={busy}
							fullWidth
						/>
					</BerxActionShelf>

					<View style={styles.hintRow}>
						<BerxIcon name="info" size={16} decorative />
						<Text style={styles.hint}>Без фото BERX показывает первую букву имени — аккаунт полноценный и так.</Text>
					</View>
				</BerxSpatialCard>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	body: {flex: 1, justifyContent: 'center', padding: spacing.lg},
	haloLayer: {position: 'absolute', top: '12%', left: 0, right: 0, alignItems: 'center'},
	avatarWrap: {alignItems: 'center', paddingBottom: spacing.lg},
	avatar: {width: 132, height: 132, borderRadius: 66, borderWidth: 2},
	avatarEmpty: {alignItems: 'center', justifyContent: 'center'},
	initial: {fontSize: 52, fontWeight: typography.weightBold},
	title: {color: colors.text, fontSize: typography.sizeTitle, fontWeight: typography.weightBold, textAlign: 'center'},
	lead: {
		color: colors.textDim,
		fontSize: typography.sizeBase,
		lineHeight: typography.sizeBase * 1.45,
		textAlign: 'center',
		marginTop: spacing.sm,
	},
	error: {color: colors.danger, fontSize: typography.sizeSm, textAlign: 'center', marginTop: spacing.md},
	saved: {color: colors.success, fontSize: typography.sizeSm, textAlign: 'center', marginTop: spacing.md},
	actions: {gap: spacing.sm, marginTop: spacing.xl},
	hintRow: {flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.lg},
	hint: {flex: 1, color: colors.textFaint, fontSize: typography.sizeXs, lineHeight: typography.sizeXs * 1.5},
});
