/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Future UI pass: rings now use BerxAvatar's own hasActiveStory prop
 * (built into the design system but, per its own header comment,
 * never actually wired into a screen until now) instead of a
 * hand-rolled ring View — every group in this rail is by definition
 * an active-story owner, so hasActiveStory is always real here. The
 * rail also gets a real BerxFadeIn entrance.
 *
 * MAX BUILD — closes a real gap: api.ownStories() was always a real,
 * working client method (real GET /stories/own) with zero UI caller.
 * storiesFeed()'s own real scope is "every OTHER user's active
 * stories" (listActiveForViewer()'s own doc comment) — the caller's
 * own active stories never appeared in this rail at all, meaning a
 * story you just created was invisible (and thus unopenable/
 * undeletable via StoryViewerScreen's real deleteStory()) from the
 * moment you left CreateStoryScreen. A leading "Вы" ring, built from
 * ownStories() into the same BerxStoryFeedGroup shape the rest of
 * this rail already uses, closes that loop.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxStoryFeedGroup, BerxOwnStorySummary} from '@berx/api/types';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	myGuid?: number;
	myUsername?: string;
	onOpenGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
	onBack?: () => void;
}

export default function StoriesRailScreen({api, myGuid, myUsername, onOpenGroup, onCreateStory, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [groups, setGroups] = useState<BerxStoryFeedGroup[]>([]);
	const [ownGroup, setOwnGroup] = useState<BerxStoryFeedGroup | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.storiesFeed();
			setGroups(res.feed);
			setError(null);
		} catch {
			setError('Не удалось загрузить истории');
		} finally {
			setLoading(false);
		}
		if (myGuid) {
			// Best-effort, never blocks the main feed load — a failed
			// own-stories fetch just means no "Вы" ring, not an error.
			api.ownStories().then((res) => {
				setOwnGroup(res.stories.length > 0 ? {owner_guid: myGuid, owner_username: myUsername ?? null, stories: res.stories.map((s: BerxOwnStorySummary) => ({id: s.id, caption: s.caption, time_created: s.time_created, mime_type: s.mime_type, is_highlighted: s.is_highlighted, viewer_count: s.viewer_count}))} : null);
			}).catch(() => undefined);
		}
	}, [api, myGuid, myUsername]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Истории" />
			<BerxFadeIn>
				<Pressable style={styles.createButton} onPress={onCreateStory}>
					<Text style={styles.createButtonText}>+ Создать историю</Text>
				</Pressable>

				{loading ? (
					<BerxLoadingState label="Загрузка..." />
				) : error ? (
					<BerxErrorState message={error} onRetry={load} />
				) : groups.length === 0 && !ownGroup ? (
					<BerxEmptyState title="Пока нет активных историй" subtitle="Истории живут 24 часа с момента публикации." />
				) : (
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={ownGroup ? [ownGroup, ...groups] : groups}
						keyExtractor={(g: BerxStoryFeedGroup) => String(g.owner_guid)}
						contentContainerStyle={styles.rail}
						renderItem={({item}: {item: BerxStoryFeedGroup}) => (
							<Pressable style={styles.ringItem} onPress={() => onOpenGroup(item)}>
								<BerxAvatar fallbackInitial={(item.owner_username ?? '?').charAt(0)} size={64} hasActiveStory />
								<Text style={styles.ringLabel} numberOfLines={1}>
									{item === ownGroup ? 'Вы' : item.owner_username ?? `#${item.owner_guid}`}
								</Text>
							</Pressable>
						)}
					/>
				)}
			</BerxFadeIn>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	createButton: {
		margin: spacing.lg,
		padding: spacing.md,
		borderRadius: 999,
		backgroundColor: colors.accentSoft,
		alignItems: 'center',
	},
	createButtonText: {color: colors.accent, fontWeight: typography.weightMedium},
	rail: {paddingHorizontal: spacing.lg, gap: spacing.md},
	ringItem: {alignItems: 'center', width: 76, marginRight: spacing.md},
	ringLabel: {color: colors.textDim, fontSize: typography.sizeXs, marginTop: spacing.xs, textAlign: 'center'},
});
