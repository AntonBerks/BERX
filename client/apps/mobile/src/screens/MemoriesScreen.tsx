/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.memories() (components/OssnApi/v1/memories.php,
 * pure read over existing OssnWall/OssnAlbums/OssnPhotos). No push —
 * no real push infrastructure exists in this codebase.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Image, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMemory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onOpenPost: (guid: number) => void;
	onOpenAlbum: (guid: number) => void;
	onBack?: () => void;
}

function yearsAgoLabel(n: number): string {
	if (n === 1) return 'Год назад';
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return `${n} год назад`;
	if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${n} года назад`;
	return `${n} лет назад`;
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

export default function MemoriesScreen({api, onOpenPost, onOpenAlbum, onBack}: Props) {
	const [memories, setMemories] = useState<BerxMemory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.memories();
			setMemories(res.memories);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить воспоминания');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	const sections = groupByYearsAgo(memories);

	return (
		<View style={styles.screen}>
			<BerxHeader title="Воспоминания" onBack={onBack} />
			{sections.length === 0 ? (
				<BerxEmptyState title="Пока нет воспоминаний" subtitle="Здесь будут появляться посты и фото, опубликованные в этот день в прошлые годы." />
			) : (
				<FlatList
					data={sections}
					keyExtractor={(s: Section) => String(s.yearsAgo)}
					contentContainerStyle={styles.list}
					renderItem={({item: section}: {item: Section}) => (
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>{yearsAgoLabel(section.yearsAgo)}</Text>
							{section.items.map((m: BerxMemory) => (
								<Pressable
									key={`${m.type}-${m.guid}`}
									style={styles.row}
									onPress={() => (m.type === 'post' ? onOpenPost(m.guid) : onOpenAlbum(m.album_guid ?? m.guid))}>
									{m.type === 'photo' && m.url ? (
										<Image source={{uri: m.url}} style={styles.thumb} />
									) : (
										<View style={styles.thumbFallback}>
											<Text style={styles.thumbFallbackText}>✎</Text>
										</View>
									)}
									<View style={styles.rowBody}>
										{m.text ? <Text style={styles.rowText} numberOfLines={2}>{m.text}</Text> : (
											<Text style={styles.rowText}>Фото</Text>
										)}
										<Text style={styles.rowMeta}>{fmtDate(m.time)}</Text>
									</View>
								</Pressable>
							))}
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md},
	section: {marginBottom: spacing.lg, gap: spacing.sm},
	sectionTitle: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm},
	thumb: {width: 56, height: 56, borderRadius: radius.sm},
	thumbFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	thumbFallbackText: {color: colors.textFaint, fontSize: typography.sizeLg},
	rowBody: {flex: 1, gap: 2},
	rowText: {fontSize: typography.sizeSm, color: colors.white},
	rowMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
