/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.memories() (components/OssnApi/v1/memories.php,
 * pure read over existing OssnWall/OssnAlbums/OssnPhotos). No push —
 * no real push infrastructure exists in this codebase.
 *
 * MAX BUILD — a 'checkin' memory type (real geo-verified check-ins,
 * same "on this day" prior-year matching as posts/photos, see
 * memories.php's own header) closes the "remember" step of the
 * Experience lifecycle with the "verify" step's real data.
 *
 * BERX WORLD — a real, PERSISTED "Saved" rail (api.mySavedMemories(),
 * classes/OssnMemories.php), additive to the derived "on this day"
 * scan above — a different real object, not a recolor of the same
 * list. Saved deliberately from a real Experience (see
 * ExperienceDetailScreen's own "Сохранить как воспоминание" action),
 * with a real avatar cluster of who was actually there — same "who"
 * visual language PlansScreen already established, reused rather than
 * inventing a third pattern for "a group of real people connected to
 * one object."
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Image, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMemory, BerxSavedMemory} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenPost: (guid: number) => void;
	onOpenAlbum: (guid: number) => void;
	onOpenPlace?: (guid: number) => void;
	onOpenSavedMemory?: (id: number) => void;
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

export default function MemoriesScreen({api, onOpenPost, onOpenAlbum, onOpenPlace, onOpenSavedMemory, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [memories, setMemories] = useState<BerxMemory[]>([]);
	const [saved, setSaved] = useState<BerxSavedMemory[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [res, savedRes] = await Promise.all([
				api.memories(),
				api.mySavedMemories().catch(() => ({memories: []})), // real, additive — a failure here shouldn't blank out the "on this day" list
			]);
			setMemories(res.memories);
			setSaved(savedRes.memories);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить воспоминания');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	const sections = groupByYearsAgo(memories);

	const savedRail =
		saved.length > 0 ? (
			<View style={styles.savedSection}>
				<Text style={styles.sectionTitle}>Сохранённые</Text>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={saved}
					keyExtractor={(m: BerxSavedMemory) => `saved-${m.id}`}
					contentContainerStyle={styles.savedRow}
					renderItem={({item}: {item: BerxSavedMemory}) => (
						<Pressable style={styles.savedCard} onPress={onOpenSavedMemory ? () => onOpenSavedMemory(item.id) : undefined}>
							<Text style={styles.savedTitle} numberOfLines={1}>{item.title}</Text>
							<Text style={styles.savedMeta} numberOfLines={1}>
								{new Date(item.happened_at * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short', year: 'numeric'})}
								{item.place ? ` · ${item.place.title}` : ''}
							</Text>
							{item.people.length > 0 ? (
								<View style={styles.savedAvatars}>
									{item.people.slice(0, 4).map((person, i) => (
										<View key={person.guid} style={[styles.savedAvatarItem, {marginLeft: i === 0 ? 0 : -10, zIndex: 10 - i}]}>
											<BerxAvatar iconUrl={person.icon} fallbackInitial={(person.username ?? '#').charAt(0)} size={24} />
										</View>
									))}
								</View>
							) : null}
							{/* BERX WORLD — the real Moments captured live during this memory's source (Moment -> Memory link), same rows, never duplicated. */}
							{item.moments.length > 0 ? (
								<Text style={styles.savedMomentPreview} numberOfLines={2}>
									「{item.moments[0].text}」{item.moments.length > 1 ? ` +${item.moments.length - 1}` : ''}
								</Text>
							) : null}
						</Pressable>
					)}
				/>
			</View>
		) : null;

	if (sections.length === 0 && saved.length === 0) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Воспоминания" onBack={onBack} />
				<BerxEmptyState title="Пока нет воспоминаний" subtitle="Здесь будут появляться посты и фото, опубликованные в этот день в прошлые годы." />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Воспоминания" onBack={onBack} />
			{sections.length === 0 ? (
				<>
					{savedRail}
					<BerxEmptyState title="Пока нет старых постов и фото" subtitle="Здесь будут появляться посты и фото, опубликованные в этот день в прошлые годы." />
				</>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						ListHeaderComponent={savedRail}
						data={sections}
						keyExtractor={(s: Section) => String(s.yearsAgo)}
						contentContainerStyle={styles.list}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
						renderItem={({item: section}: {item: Section}) => (
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>{yearsAgoLabel(section.yearsAgo)}</Text>
								{section.items.map((m: BerxMemory) => (
									<Pressable
										key={`${m.type}-${m.guid}`}
										style={styles.row}
										onPress={() => (m.type === 'post' ? onOpenPost(m.guid) : m.type === 'checkin' ? onOpenPlace?.(m.guid) : onOpenAlbum(m.album_guid ?? m.guid))}>
										{m.type === 'photo' && m.url ? (
											<Image source={{uri: m.url}} style={styles.thumb} />
										) : (
											<View style={styles.thumbFallback}>
												<Text style={styles.thumbFallbackText}>{m.type === 'checkin' ? '📍' : '✎'}</Text>
											</View>
										)}
										<View style={styles.rowBody}>
											{m.type === 'checkin' ? (
												<Text style={styles.rowText} numberOfLines={2}>Вы были здесь: {m.place_title}</Text>
											) : m.text ? (
												<Text style={styles.rowText} numberOfLines={2}>{m.text}</Text>
											) : (
												<Text style={styles.rowText}>Фото</Text>
											)}
											<Text style={styles.rowMeta}>{fmtDate(m.time)}</Text>
										</View>
									</Pressable>
								))}
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md},
	fadeFlex: {flex: 1},
	section: {marginBottom: spacing.lg, gap: spacing.sm},
	sectionTitle: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm},
	thumb: {width: 56, height: 56, borderRadius: radius.sm},
	thumbFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center'},
	thumbFallbackText: {color: colors.textFaint, fontSize: typography.sizeLg},
	rowBody: {flex: 1, gap: 2},
	rowText: {fontSize: typography.sizeSm, color: colors.white},
	rowMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
	savedSection: {paddingTop: spacing.md, gap: spacing.sm},
	savedRow: {paddingHorizontal: spacing.md, gap: spacing.sm},
	savedCard: {
		width: 180,
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		padding: spacing.md,
		marginRight: spacing.sm,
		gap: 4,
	},
	savedTitle: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightBold},
	savedMeta: {color: colors.textFaint, fontSize: typography.sizeXs},
	savedAvatars: {flexDirection: 'row', marginTop: spacing.xs},
	savedAvatarItem: {borderRadius: radius.pill, borderWidth: 2, borderColor: colors.surface},
	savedMomentPreview: {color: colors.textDim, fontSize: typography.sizeXs, fontStyle: 'italic', marginTop: spacing.xs},
});
