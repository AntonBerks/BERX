/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Future UI pass: rings now use BerxAvatar's own hasActiveStory prop
 * (built into the design system but, per its own header comment,
 * never actually wired into a screen until now) instead of a
 * hand-rolled ring View — every group in this rail is by definition
 * an active-story owner, so hasActiveStory is always real here. The
 * rail also gets a real BerxFadeIn entrance.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxStoryFeedGroup} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenGroup: (group: BerxStoryFeedGroup) => void;
	onCreateStory: () => void;
	onBack?: () => void;
}

export default function StoriesRailScreen({api, onOpenGroup, onCreateStory, onBack}: Props) {
	const [groups, setGroups] = useState<BerxStoryFeedGroup[]>([]);
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
	}, [api]);

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
				) : groups.length === 0 ? (
					<BerxEmptyState title="Пока нет активных историй" subtitle="Истории живут 24 часа с момента публикации." />
				) : (
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={groups}
						keyExtractor={(g: BerxStoryFeedGroup) => String(g.owner_guid)}
						contentContainerStyle={styles.rail}
						renderItem={({item}: {item: BerxStoryFeedGroup}) => (
							<Pressable style={styles.ringItem} onPress={() => onOpenGroup(item)}>
								<BerxAvatar fallbackInitial={(item.owner_username ?? '?').charAt(0)} size={64} hasActiveStory />
								<Text style={styles.ringLabel} numberOfLines={1}>
									{item.owner_username ?? `#${item.owner_guid}`}
								</Text>
							</Pressable>
						)}
					/>
				)}
			</BerxFadeIn>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
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
