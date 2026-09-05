/**
 * BERX-281 — Creator Hub. The CREATOR family's named contract.
 *
 * Real data throughout: api.getCreatorProfile()/getCreatorContent()
 * (components/OssnApi/v1/creator.php). Every number shown here
 * (friends, views) is a live COUNT() server-side, never estimated.
 * No engagement rate / growth chart / follower projection — none of
 * that has a real data source in BERX, so none of it is shown.
 * Records exactly one real view on mount (self-views excluded
 * server-side).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Image, StyleSheet} from 'react-native';
import {BerxMediaWell} from '../../../../packages/design-system/src/spatial/BerxMediaWell';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCreatorProfile, BerxCreatorContent, BerxCreatorPostItem, BerxCreatorAlbumItem, BerxCreatorEventItem, BerxCreatorExperienceItem} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxCreatorCard} from '../../../../packages/design-system/src/spatial/BerxCreatorCard';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxScreenScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxStatRail} from '../../../../packages/design-system/src/spatial/BerxStatRail';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface CreatorProfileScreenProps {
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

export default function CreatorProfileScreen(props: CreatorProfileScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-281" testID="berx-281">
			<CreatorProfileSceneBody {...props} />
		</BerxScreenScene>
	);
}

/**
 * The creator's own content, in the order the archive puts it in:
 * an event image, else an experience image. Posts and albums carry
 * no image URL in this response, so a creator whose only work is
 * text legitimately gets no atmosphere.
 */
function creatorMedia(content: BerxCreatorContent | null): {uri: string} | undefined {
	const url =
		content?.events.find((e) => e.image_url)?.image_url ??
		content?.experiences.find((e) => e.image_url)?.image_url ??
		null;
	return url ? {uri: url} : undefined;
}

function CreatorProfileSceneBody({api, username, onOpenPost, onOpenAlbum, onOpenEvent, onOpenExperience, onOpenVideos, onOpenSettings, onBack}: CreatorProfileScreenProps) {
	const [profile, setProfile] = useState<BerxCreatorProfile | null>(null);
	const [content, setContent] = useState<BerxCreatorContent | null>(null);
	const [tab, setTab] = useState<Tab>('posts');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/* the creator's own published work lights the room — their event or
	   experience imagery, never a stock creative backdrop */
	useBerxSceneAtmosphere(creatorMedia(content));

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
		}
	}, [api, username]);

	useEffect(() => {
		load();
	}, [load]);

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader title={`@${username}`} onBack={onBack} />
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error || !profile || !content)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error ?? 'Не найдено'} onRetry={load} />
			</View>
		);

	const tabCount = tab === 'posts' ? content.posts.length : tab === 'albums' ? content.albums.length : tab === 'events' ? content.events.length : content.experiences.length;

	return (
		<View style={styles.screen}>
			{header}
			<View style={styles.body}>
				{/**
				 * Real audience numbers from creator.php: friends, total
				 * views and views in the last 30 days. There is no
				 * earnings figure anywhere — BERX has points and rewards
				 * but no money, so BerxWalletCard stays BLOCKED.
				 */}
				<BerxCreatorCard
					userGuid={profile.user_guid}
					name={`@${username}`}
					handle={username}
					tagline={profile.bio ?? undefined}
					postCount={content.posts.length}
					viewCount={profile.audience.total_views}
					actions={
						profile.category ? <BerxText role="micro" emphasis="accent">{profile.category}</BerxText> : undefined
					}
				/>

				{/* the design system's own stat rail rather than a third
				    hand-rolled pair of number-over-label columns */}
				<BerxStatRail
					stats={[
						{key: 'friends', label: 'друзей', value: profile.audience.friend_count},
						{key: 'views30', label: 'за 30 дней', value: profile.audience.views_last_30_days},
					]}
				/>

				{/* the creator's own controls, on the control plane and
				    beside each other: two stacked full-width buttons are a
				    settings screen, not a profile */}
				{(profile.is_own && onOpenSettings) || onOpenVideos ? (
					<BerxActionShelf variant="anchored">
						{profile.is_own && onOpenSettings ? (
							<BerxButton label="Настройки автора" variant="secondary" onPress={onOpenSettings} />
						) : null}
						{onOpenVideos ? (
							<BerxButton label="Видео автора" variant="secondary" onPress={() => onOpenVideos(profile.user_guid)} />
						) : null}
					</BerxActionShelf>
				) : null}
			</View>

			<View style={styles.tabRow}>
				{/* BerxProfileTabs in the archive aliases the same segmented
				    control every other BERX surface uses */}
				<BerxSegmentTabs
					options={[
						{key: 'posts', label: 'Посты'},
						{key: 'albums', label: 'Альбомы'},
						{key: 'events', label: 'События'},
						{key: 'experiences', label: 'Впечатления'},
					]}
					value={tab}
					onChange={(key) => setTab(key as Tab)}
				/>
			</View>

			{tabCount === 0 ? (
				<BerxEmptyState title="Пока ничего нет" />
			) : tab === 'posts' ? (
				<BerxSceneList rows
					data={content.posts}
					keyExtractor={(p: BerxCreatorPostItem) => String(p.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCreatorPostItem}) => (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.md}
							radius={18}
							onPress={() => onOpenPost(item.guid)}
							accessibilityLabel={`${item.text}, ${fmtDate(item.time)}`}
							style={styles.listItem}>
							<BerxText role="body" numberOfLines={2}>{item.text}</BerxText>
							<BerxText role="meta" emphasis="tertiary">{fmtDate(item.time)}</BerxText>
						</BerxSpatialCard>
					)}
				/>
			) : tab === 'albums' ? (
				<FlatList
					data={content.albums}
					keyExtractor={(a: BerxCreatorAlbumItem) => String(a.guid)}
					numColumns={2}
					contentContainerStyle={styles.grid}
					renderItem={({item}: {item: BerxCreatorAlbumItem}) => (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.md}
							radius={18}
							onPress={() => onOpenAlbum(item.guid)}
							accessibilityLabel={item.title}
							style={styles.gridCard}>
							<BerxText role="label" numberOfLines={1}>{item.title}</BerxText>
						</BerxSpatialCard>
					)}
				/>
			) : tab === 'events' ? (
				<FlatList
					data={content.events}
					keyExtractor={(e: BerxCreatorEventItem) => String(e.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCreatorEventItem}) => (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.sm}
							radius={18}
							onPress={() => onOpenEvent(item.guid)}
							accessibilityLabel={item.title}
							style={styles.listItem}>
							<View style={styles.mediaRow}>
							{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <BerxMediaWell radius={radius.sm} style={styles.thumbFallback} />}
							<View style={styles.mediaBody}>
								<BerxText role="body" numberOfLines={1}>{item.title}</BerxText>
								<BerxText role="meta" emphasis="tertiary">{fmtDate(item.starts)}</BerxText>
								</View>
							</View>
						</BerxSpatialCard>
					)}
				/>
			) : (
				<FlatList
					data={content.experiences}
					keyExtractor={(e: BerxCreatorExperienceItem) => String(e.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCreatorExperienceItem}) => (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.sm}
							radius={18}
							onPress={() => onOpenExperience(item.id)}
							accessibilityLabel={item.title}
							style={styles.listItem}>
							<View style={styles.mediaRow}>
							{item.image_url ? <Image source={{uri: item.image_url}} style={styles.thumb} /> : <BerxMediaWell radius={radius.sm} style={styles.thumbFallback} />}
							<View style={styles.mediaBody}>
								<BerxText role="body" numberOfLines={1}>{item.title}</BerxText>
								<BerxText role="meta" emphasis="tertiary">{item.anchor_title ?? ''} · {fmtDate(item.scheduled_start)}</BerxText>
								</View>
							</View>
						</BerxSpatialCard>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.sm},
	bio: {fontSize: typography.sizeSm, color: colors.textDim},
	tabRow: {flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},

	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim},
	tabTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	list: {paddingBottom: spacing.xxxl},

	grid: {padding: spacing.sm},
	gridCard: {flex: 1, margin: spacing.xs, aspectRatio: 1.3, justifyContent: 'flex-end'},
	listItem: {marginBottom: spacing.sm},
	mediaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	thumb: {width: 48, height: 48, borderRadius: radius.sm},
	thumbFallback: {width: 48, height: 48},
	mediaBody: {flex: 1, gap: 2},
});
