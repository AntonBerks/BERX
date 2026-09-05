/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data + real upload/delete: api.getAlbum()/uploadAlbumPhoto()/
 * deleteAlbumPhoto() (components/OssnApi/v1/albums.php — the upload
 * endpoint bridges OssnPhotos::AddPhoto()'s real resize/crop/CDN
 * logic into the API's stateless auth via a session bridge; see that
 * file's header comment for the full story). Same `pickImage`
 * injected-prop pattern as CreateStoryScreen — no image-picker
 * library is installable in this sandbox (npm blocked), so the
 * actual device picker is a separate piece that plugs into this
 * prop; this screen owns everything after a file is selected.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxAlbumDetail, BerxAlbumPhoto} from '@berx/api/types';
import type {BerxAuthState} from '@berx/auth';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxMediaGrid} from '../../../../packages/design-system/src/components/BerxMediaGrid';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface AlbumDetailScreenProps {
	api: BerxApiClient;
	guid: number;
	authState: BerxAuthState;
	pickImage: () => Promise<BerxFilePart | null>;
	onBack?: () => void;
}

export default function AlbumDetailScreen(props: AlbumDetailScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="immersive" testID="album-detail">
			<AlbumDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function AlbumDetailScreenBody({api, guid, authState, pickImage, onBack}: AlbumDetailScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [album, setAlbum] = useState<BerxAlbumDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	/**
	 * Deleting used to be long-press only, with a line of text under
	 * the grid explaining the gesture. A destructive action reachable
	 * by exactly one gesture is unreachable for anyone using a screen
	 * reader or a keyboard, so selecting a photo now brings a real
	 * control forward instead.
	 */
	const [selected, setSelected] = useState<number | null>(null);

	const myGuid = authState.getSnapshot().user?.guid;
	const isOwn = !!album && !!myGuid && album.owner_guid === myGuid;

	/* the album's own first photo lights the room it is shown in */
	useBerxSceneAtmosphere(album?.photos[0]?.url ? {uri: album.photos[0].url} : undefined);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.getAlbum(guid);
			setAlbum(res);
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different problems,
			   and being offline is a fourth. A 403 or a 404 also stops
			   offering a Retry that cannot work. */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
		} finally {
			setLoading(false);
		}
	}, [api, guid, offline]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleAddPhoto() {
		const picked = await pickImage();
		if (!picked) return; // user cancelled, or no picker wired yet — not an error state
		setUploading(true);
		setError(null);
		try {
			await api.uploadAlbumPhoto(guid, picked);
			await load();
		} catch {
			setError('Не удалось загрузить фото. Проверьте формат (JPEG/PNG/WebP/GIF) и размер (до 8 МБ).');
		} finally {
			setUploading(false);
		}
	}

	async function handleDeletePhoto(photoGuid: number) {
		if (!album) return;
		setBusyGuid(photoGuid);
		try {
			await api.deleteAlbumPhoto(album.guid, photoGuid);
			setAlbum({...album, photos: album.photos.filter((p: BerxAlbumPhoto) => p.guid !== photoGuid)});
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		} finally {
			setBusyGuid(null);
		}
	}

	/* The way back stays on screen while the scene is loading and after
	   it fails. It used to be inside the branch that only rendered once
	   the data had arrived, so an error left the person on a screen with
	   no exit — the dead end the archive forbids, on a screen reached by
	   a push. The name arrives when the data does. */
	const header = <BerxHeader title={album?.title} onBack={onBack} />;

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error && !album)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);
	if (!album) return null;

	return (
		<View style={styles.screen}>
			{header}
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Добавить фото" variant="secondary" loading={uploading} onPress={handleAddPhoto} fullWidth />
					{error ? <Text style={styles.error}>{error}</Text> : null}
				</View>
			) : null}
			{album.photos.length === 0 ? (
				<BerxEmptyState title="Фотографий пока нет" />
			) : (
				<BerxSceneScroll contentContainerStyle={styles.gridPad}>
					{/* the archive's own media grid, over the album domain */}
					<BerxMediaGrid
						items={album.photos.map((p: BerxAlbumPhoto) => ({
							guid: p.guid,
							url: p.url,
							media_type: 'image' as const,
						}))}
						columns={3}
						onPress={isOwn ? (item) => setSelected(item.guid === selected ? null : item.guid) : undefined}
					/>
				</BerxSceneScroll>
			)}
			{isOwn && selected !== null ? (
				/* D4 — the destructive control, brought forward for the
				   selected photo and nowhere else */
				<BerxActionShelf variant="anchored" align="spread">
					<BerxText role="meta" emphasis="secondary">Фото выбрано</BerxText>
					<View style={styles.selectedActions}>
						<BerxButton label="Отмена" variant="secondary" onPress={() => setSelected(null)} />
						<BerxButton
							label="Удалить"
							variant="danger"
							loading={busyGuid === selected}
							onPress={() => {
								const guidToDelete = selected;
								setSelected(null);
								handleDeletePhoto(guidToDelete);
							}}
						/>
					</View>
				</BerxActionShelf>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	gridPad: {padding: spacing.sm},
	selectedActions: {flexDirection: 'row', gap: spacing.sm},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	toolbar: {padding: spacing.md, gap: spacing.xs},
	hint: {fontSize: typography.sizeXs, color: colors.textFaint, textAlign: 'center', padding: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
