/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.memories() (components/OssnApi/v1/memories.php,
 * pure read over existing OssnWall/OssnAlbums/OssnPhotos). No push —
 * no real push infrastructure exists in this codebase.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {BerxMediaWell} from '../../../../packages/design-system/src/spatial/BerxMediaWell';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMemory} from '@berx/api/types';
import {spacing, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxEyebrow} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {berxCount} from '@berx/domain';

export interface MemoriesScreenProps {
	api: BerxApiClient;
	onOpenPost: (guid: number) => void;
	onOpenAlbum: (guid: number) => void;
	onBack?: () => void;
}

function yearsAgoLabel(n: number): string {
	/* one year ago is named rather than counted; everything else takes
	   the shared agreement rule */
	if (n === 1) return 'Год назад';
	return `${berxCount(n, 'год', 'года', 'лет')} назад`;
}

function fmtDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});
}

type Section = {yearsAgo: number; items: BerxMemory[]};

function groupByYearsAgo(memories: BerxMemory[]): Section[] {
	const map = new Map<number, BerxMemory[]>();
	for (const m of memories) {
		if (!map.has(m.years_ago)) map.set(m.years_ago, []);
		map.get(m.years_ago)!.push(m);
	}
	return Array.from(map.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([yearsAgo, items]) => ({yearsAgo, items}));
}

export default function MemoriesScreen(props: MemoriesScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="temporal" testID="memories">
			<MemoriesScreenBody {...props} />
		</BerxFamilyScene>
	);
}

/**
 * The first memory that actually has media. A memory of a text post
 * has none, and that is a real answer — the temporal room is lit
 * without it rather than with something borrowed.
 */
function memoryMedia(memories: BerxMemory[]): {uri: string} | undefined {
	const withMedia = memories.find((m) => m.url);
	return withMedia?.url ? {uri: withMedia.url} : undefined;
}

function MemoriesScreenBody({api, onOpenPost, onOpenAlbum, onBack}: MemoriesScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [memories, setMemories] = useState<BerxMemory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* a memory's own media is the atmosphere; a text-only memory legitimately has none */
	useBerxSceneAtmosphere(memoryMedia(memories));

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.memories();
			setMemories(res.memories);
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
	}, [api, offline]);

	useEffect(() => {
		load();
	}, [load]);

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title="Воспоминания" onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);

	const sections = groupByYearsAgo(memories);

	return (
		<View style={styles.screen}>
			{header}
			{sections.length === 0 ? (
				<BerxEmptyState title="Пока нет воспоминаний" subtitle="Здесь будут появляться посты и фото, опубликованные в этот день в прошлые годы." />
			) : (
				<BerxSceneList
					data={sections}
					keyExtractor={(s: Section) => String(s.yearsAgo)}
					contentContainerStyle={styles.list}
					renderItem={({item: section}: {item: Section}) => (
						<View style={styles.section}>
							<BerxEyebrow tone="accent">{yearsAgoLabel(section.yearsAgo)}</BerxEyebrow>
							{section.items.map((m: BerxMemory) => (
								<BerxSpatialCard
									key={`${m.type}-${m.guid}`}
									depth="D3"
									padding={spacing.md}
									radius={18}
									onPress={() => (m.type === 'post' ? onOpenPost(m.guid) : onOpenAlbum(m.album_guid ?? m.guid))}
									accessibilityLabel={`${m.text || 'Фото'}, ${fmtDate(m.time)}`}>
									<View style={styles.row}>
									{m.type === 'photo' && m.url ? (
										<Image source={{uri: m.url}} style={styles.thumb} />
									) : (
										<BerxMediaWell radius={radius.sm} style={styles.thumbFallback}>
											<BerxText role="subtitle" emphasis="tertiary">✎</BerxText>
										</BerxMediaWell>
									)}
									<View style={styles.rowBody}>
										{m.text ? <BerxText role="meta" numberOfLines={2}>{m.text}</BerxText> : (
											<BerxText role="meta">Фото</BerxText>
										)}
										<BerxText role="meta" emphasis="tertiary">{fmtDate(m.time)}</BerxText>
									</View>
									</View>
								</BerxSpatialCard>
							))}
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	list: {paddingBottom: spacing.xxxl},
	section: {marginBottom: spacing.lg, gap: spacing.sm},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm},
	thumb: {width: 56, height: 56, borderRadius: radius.sm},
	thumbFallback: {width: 56, height: 56},
	rowBody: {flex: 1, gap: 2},
});
