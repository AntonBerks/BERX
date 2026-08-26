/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxStoryFeedGroup} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

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
							<View style={styles.ring}>
								<Text style={styles.ringInitial}>{(item.owner_username ?? '?').charAt(0).toUpperCase()}</Text>
							</View>
							<Text style={styles.ringLabel} numberOfLines={1}>
								{item.owner_username ?? `#${item.owner_guid}`}
							</Text>
						</Pressable>
					)}
				/>
			)}
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
	ring: {
		width: 64,
		height: 64,
		borderRadius: 32,
		borderWidth: 3,
		borderColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.graphite,
	},
	ringInitial: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	ringLabel: {color: colors.textDim, fontSize: typography.sizeXs, marginTop: spacing.xs, textAlign: 'center'},
});
