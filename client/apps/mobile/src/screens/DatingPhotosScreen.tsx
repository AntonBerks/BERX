/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real, significant gap found in the zero-UI-
 * caller sweep of client.ts: api.ownDatingPhotos()/deleteOwnDatingPhoto()/
 * datingPhotoRequests()/respondDatingPhotoAccess() were always real,
 * working client methods, but there was NO upload endpoint anywhere
 * (dating.php's own header comment said so explicitly: "added the
 * same day a real client method ships, not before") and no screen at
 * all — a user could never actually put a photo behind the private-
 * photo-access system this session's earlier work already documented
 * in API_SECURITY_MATRIX.md.
 *
 * uploadOwnDatingPhoto()/datingPhotoUrl()/grantedDatingPhotoAccess()
 * are new this batch (real POST/GET routes in dating.php,
 * OssnDating::addPhoto()/storagePath()/listGrantedAccess() are new
 * real class methods — same bare-random-filename storage + byte-
 * sniffed MIME pattern as OssnStories::addStory(), not OssnFile, since
 * the schema already committed to `storage_name`/`mime_type` columns
 * before this batch). Photos are private-by-default: the /media route
 * re-checks canViewPhoto() (owner OR a real granted access row) on
 * every single request, so <Image> here always attaches the same
 * bearer auth headers used everywhere else in this app — never a
 * bare public URL.
 *
 * Same `pickImage` injected-prop pattern as AlbumDetailScreen — no
 * image-picker library is installable in this sandbox.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, Dimensions, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxDatingOwnPhoto, BerxDatingPhotoRequest} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	pickImage: () => Promise<BerxFilePart | null>;
	onBack?: () => void;
}

const TILE = Dimensions.get('window').width / 3 - spacing.md;

export default function DatingPhotosScreen({api, pickImage, onBack}: Props) {
	const [photos, setPhotos] = useState<BerxDatingOwnPhoto[]>([]);
	const [requests, setRequests] = useState<BerxDatingPhotoRequest[]>([]);
	const [granted, setGranted] = useState<BerxDatingPhotoRequest[]>([]);
	const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, r, g, h] = await Promise.all([
				api.ownDatingPhotos(),
				api.datingPhotoRequests(),
				api.grantedDatingPhotoAccess(),
				api.getAuthHeaders(),
			]);
			setPhotos(p.photos);
			setRequests(r.requests);
			setGranted(g.access);
			setAuthHeaders(h);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleUpload() {
		const picked = await pickImage();
		if (!picked) return; // cancelled — real optional action, not an error
		setUploading(true);
		setError(null);
		try {
			await api.uploadOwnDatingPhoto(picked);
			await load();
		} catch {
			setError('Не удалось загрузить фото. Проверьте формат (JPEG/PNG/WebP/GIF).');
		} finally {
			setUploading(false);
		}
	}

	async function handleDelete(id: number) {
		setBusyId(id);
		try {
			await api.deleteOwnDatingPhoto(id);
			setPhotos((prev: BerxDatingOwnPhoto[]) => prev.filter((p: BerxDatingOwnPhoto) => p.id !== id));
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		} finally {
			setBusyId(null);
		}
	}

	async function respond(accessId: number, grant: boolean) {
		setBusyId(accessId);
		try {
			await api.respondDatingPhotoAccess(accessId, grant);
			setRequests((prev: BerxDatingPhotoRequest[]) => prev.filter((r: BerxDatingPhotoRequest) => r.access_id !== accessId));
			if (grant) await load(); // a granted request also joins the "granted" list below
		} catch {
			// list stays as-is on failure
		} finally {
			setBusyId(null);
		}
	}

	async function revoke(accessId: number) {
		setBusyId(accessId);
		try {
			await api.revokeDatingPhotoAccess(accessId);
			setGranted((prev: BerxDatingPhotoRequest[]) => prev.filter((g2: BerxDatingPhotoRequest) => g2.access_id !== accessId));
		} catch {
			// list stays as-is on failure
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && photos.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	const header = (
		<View>
			<View style={styles.toolbar}>
				<Text style={styles.hint}>Эти фото видны только вам, пока вы не одобрите запрос доступа от совпадения.</Text>
				<BerxButton label="Добавить фото" variant="secondary" loading={uploading} onPress={handleUpload} fullWidth />
				{error ? <Text style={styles.error}>{error}</Text> : null}
			</View>

			{requests.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Запросы на доступ ({requests.length})</Text>
					{requests.map((r: BerxDatingPhotoRequest) => (
						<View key={r.access_id}>
							<BerxGlassSurface padding="sm" style={styles.requestRow}>
								<Image source={{uri: r.requester.icon}} style={styles.requestAvatar} />
								<Text style={styles.requestName} numberOfLines={1}>{r.requester.fullname || r.requester.username}</Text>
								<Pressable onPress={() => respond(r.access_id, true)} disabled={busyId === r.access_id} hitSlop={8}>
									<Text style={styles.grant}>Разрешить</Text>
								</Pressable>
								<Pressable onPress={() => respond(r.access_id, false)} disabled={busyId === r.access_id} hitSlop={8}>
									<Text style={styles.deny}>Отклонить</Text>
								</Pressable>
							</BerxGlassSurface>
						</View>
					))}
				</View>
			) : null}

			{granted.length > 0 ? (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Кому открыт доступ ({granted.length})</Text>
					{granted.map((g: BerxDatingPhotoRequest) => (
						<View key={g.access_id}>
							<BerxGlassSurface padding="sm" style={styles.requestRow}>
								<Image source={{uri: g.requester.icon}} style={styles.requestAvatar} />
								<Text style={styles.requestName} numberOfLines={1}>{g.requester.fullname || g.requester.username}</Text>
								<Pressable onPress={() => revoke(g.access_id)} disabled={busyId === g.access_id} hitSlop={8}>
									<Text style={styles.deny}>{busyId === g.access_id ? '…' : 'Отозвать'}</Text>
								</Pressable>
							</BerxGlassSurface>
						</View>
					))}
				</View>
			) : null}

			<Text style={styles.sectionTitle}>Мои фото ({photos.length})</Text>
		</View>
	);

	return (
		<View style={styles.screen}>
			<BerxHeader title="Приватные фото" onBack={onBack} />
			<BerxFadeIn style={styles.fadeFlex}>
				<FlatList
					data={photos}
					keyExtractor={(p: BerxDatingOwnPhoto) => String(p.id)}
					numColumns={3}
					contentContainerStyle={styles.grid}
					ListHeaderComponent={header}
					ListFooterComponent={photos.length > 0 ? <Text style={styles.hint}>Удерживайте фото, чтобы удалить</Text> : null}
					ListEmptyComponent={<BerxEmptyState title="Фотографий пока нет" />}
					renderItem={({item}: {item: BerxDatingOwnPhoto}) => (
						<Pressable style={styles.tileWrap} onLongPress={() => handleDelete(item.id)} disabled={busyId === item.id}>
							<Image source={{uri: api.datingPhotoUrl(item.id), headers: authHeaders}} style={styles.tile} />
						</Pressable>
					)}
				/>
			</BerxFadeIn>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md, gap: spacing.xs},
	hint: {fontSize: typography.sizeXs, color: colors.textFaint, textAlign: 'center', padding: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	section: {paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', paddingHorizontal: spacing.md, marginBottom: spacing.xs},
	requestRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	requestAvatar: {width: 32, height: 32, borderRadius: 16, backgroundColor: colors.graphite},
	requestName: {flex: 1, fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium},
	grant: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	deny: {fontSize: typography.sizeSm, color: colors.danger},
	fadeFlex: {flex: 1},
	grid: {paddingHorizontal: spacing.md, gap: spacing.sm},
	tileWrap: {width: TILE, height: TILE, margin: spacing.xs / 2},
	tile: {width: '100%', height: '100%', borderRadius: 8, backgroundColor: colors.graphite},
});
