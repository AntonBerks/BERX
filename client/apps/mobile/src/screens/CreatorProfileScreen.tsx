/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data throughout: api.getCreatorProfile()/getCreatorContent()
 * (components/OssnApi/v1/creator.php). Every number shown here
 * (friends, views) is a live COUNT() server-side, never estimated.
 * No engagement rate / growth chart / follower projection — none of
 * that has a real data source in BERX, so none of it is shown.
 * Records exactly one real view on mount (self-views excluded
 * server-side).
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCreatorProfile, BerxCreatorContent, BerxCreatorPostItem, BerxCreatorAlbumItem, BerxCreatorEventItem, BerxCreatorExperienceItem} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	username: string;
	onOpenPost: (guid: number) => void;
	onOpenAlbum: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onOpenExperience: (id: number) => void;
	onOpenVideos?: (userGuid: number) => void;
	onOpenSettings?: () => void;
	onBack?: () => void;
}

type Tab = 'posts' | 'albums' | 'events' | 'experiences';

function fmtDate(unix: number): string {
	return new Date(unix * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
}

export default function CreatorProfileScreen({api, username, onOpenPost, onOpenAlbum, onOpenEvent, onOpenExperience, onOpenVideos, onOpenSettings, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [profile, setProfile] = useState<BerxCreatorProfile | null>(null);
	const [content, setContent] = useState<BerxCreatorContent | null>(null);
	const [tab, setTab] = useState<Tab>('posts');
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, c] = await Promise.all([api.getCreatorProfile(username), api.getCreatorContent(username)]);
			setProfile(p);
			setContent(c);
			api.recordCreatorView(username).catch(() => undefined); // best-effort — a failed view log shouldn't block the page
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Профиль автора недоступен');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, username]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error || !profile || !content) return <BerxErrorState message={error ?? 'Не найдено'} onRetry={load} />;

	const tabCount = tab === 'posts' ? content.posts.length : tab === 'albums' ? content.albums.length : tab === 'events' ? content.events.length : content.experiences.length;

	return (
		<View style={styles.screen}>
			<BerxHeader title={`@${username}`} onBack={onBack} />
			<View style={styles.body}>
				{profile.category ? <Text style={styles.category}>{profile.category}</Text> : null}
				{profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

				<View style={styles.statsRow}>
					<View style={styles.stat}>
						<Text style={styles.statValue}>{profile.audience.friend_count}</Text>
						<Text style={styles.statLabel}>друзей</Text>
					</View>
					<View style={styles.stat}>
						<Text style={styles.statValue}>{profile.audience.total_views}</Text>
						<Text style={styles.statLabel}>просмотров</Text>
					</View>
					<View style={styles.stat}>
						<Text style={styles.statValue}>{profile.audience.views_last_30_days}</Text>
						<Text style={styles.statLabel}>за 30 дней</Text>
					</View>
				</View>

				{profile.is_own && onOpenSettings ? (
					<BerxButton label="Настройки автора" variant="secondary" onPress={onOpenSettings} fullWidth />
				) : null}

				{onOpenVideos ? (
					<BerxButton label="Видео автора" variant="secondary" onPress={() => onOpenVideos(profile.user_guid)} fullWidth />
				) : null}
			</View>

			<View style={styles.tabRow}>
				{(['posts', 'albums', 'events', 'experiences'] as Tab[]).map((t) => (
					<Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
						<Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
							{t === 'posts' ? 'Посты' : t === 'albums' ? 'Альбомы' : t === 'events' ? 'События' : 'Впечатления'}
						</Text>
					</Pressable>
				))}
			</View>

			{tabCount === 0 ? (
				<BerxEmptyState title="Пока ничего нет" />
			) : tab === 'posts' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={content.posts}
						keyExtractor={(p: BerxCreatorPostItem) => String(p.guid)}
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
						renderItem={({item}: {item: BerxCreatorPostItem}) => (
							<Pressable style={styles.row} onPress={() => onOpenPost(item.guid)}>
								<Text style={styles.rowText} numberOfLines={2}>{item.text}</Text>
								<Text style={styles.rowMeta}>{fmtDate(item.time)}</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'albums' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={content.albums}
						keyExtractor={(a: BerxCreatorAlbumItem) => String(a.guid)}
						numColumns={2}
						contentContainerStyle={styles.grid}
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
						renderItem={({item}: {item: BerxCreatorAlbumItem}) => (
							<Pressable style={styles.gridCard} onPress={() => onOpenAlbum(item.guid)}>
								<Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : tab === 'events' ? (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={content.events}
						keyExtractor={(e: BerxCreatorEventItem) => String(e.guid)}
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
						renderItem={({item}: {item: BerxCreatorEventItem}) => (
							<Pressable style={styles.mediaRow} onPress={() => onOpenEvent(item.guid)}>
								{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.mediaBody}>
									<Text style={styles.rowText} numberOfLines={1}>{item.title}</Text>
									<Text style={styles.rowMeta}>{fmtDate(item.starts)}</Text>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={content.experiences}
						keyExtractor={(e: BerxCreatorExperienceItem) => String(e.id)}
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
						renderItem={({item}: {item: BerxCreatorExperienceItem}) => (
							<Pressable style={styles.mediaRow} onPress={() => onOpenExperience(item.id)}>
								{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.mediaBody}>
									<Text style={styles.rowText} numberOfLines={1}>{item.title}</Text>
									<Text style={styles.rowMeta}>{item.anchor_title ?? ''} · {fmtDate(item.scheduled_start)}</Text>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.sm},
	category: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	bio: {fontSize: typography.sizeSm, color: colors.textDim},
	statsRow: {flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.sm},
	stat: {alignItems: 'flex-start'},
	statValue: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	statLabel: {fontSize: typography.sizeXs, color: colors.textFaint},
	tabRow: {flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	tab: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim},
	tabTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	fadeFlex: {flex: 1},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: 4},
	rowText: {fontSize: typography.sizeBase, color: colors.white},
	rowMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
	grid: {padding: spacing.sm},
	gridCard: {flex: 1, margin: spacing.xs, borderRadius: radius.md, backgroundColor: colors.surface, padding: spacing.md, aspectRatio: 1.3, justifyContent: 'flex-end'},
	gridTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium},
	mediaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.graphite},
	mediaBody: {flex: 1, gap: 2},
});
