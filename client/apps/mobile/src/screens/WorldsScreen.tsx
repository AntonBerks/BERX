/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — Worlds. A genuinely new first-class BERX object — see
 * classes/OssnWorlds.php's own header. Real data only: api.myWorlds()
 * (GET /worlds/mine) merges worlds the caller owns with worlds they're
 * an accepted member of.
 *
 * Deliberately a DIFFERENT visual grammar from Plans (status list) and
 * Places/Events (photo tiles): a World is a CONTAINER — what's public
 * or private, who's in it, and how many real things it holds — so
 * this reads as a stack of bordered "container cards" with a real
 * item-count breakdown by type, not a status list or a photo grid.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxWorld, BerxWorldItemType} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenWorld: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

const ITEM_TYPE_LABEL: Record<BerxWorldItemType, string> = {
	place: 'место',
	event: 'событие',
	plan: 'план',
	experience: 'впечатление',
};

function itemsSummary(world: BerxWorld): string {
	const counts: Partial<Record<BerxWorldItemType, number>> = {};
	for (const item of world.items) {
		counts[item.item_type] = (counts[item.item_type] ?? 0) + 1;
	}
	const parts = (Object.keys(counts) as BerxWorldItemType[]).map((t) => `${counts[t]} ${ITEM_TYPE_LABEL[t]}`);
	return parts.length > 0 ? parts.join(' · ') : 'Пока пусто';
}

export default function WorldsScreen({api, onOpenWorld, onCreate, onBack}: Props) {
	const [items, setItems] = useState<BerxWorld[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.myWorlds();
			setItems(res.worlds);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить миры');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Миры" />
			<View style={styles.toolbar}>
				<Text style={styles.hint}>Люди, места и события, собранные в одно целое.</Text>
				<BerxButton label="Новый мир" onPress={onCreate} />
			</View>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Пока нет миров" subtitle="Соберите поездку, компанию друзей или соседей в один мир." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(w: BerxWorld) => String(w.id)}
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
						renderItem={({item}: {item: BerxWorld}) => {
							const accepted = item.members.filter((m) => m.status === 'accepted');
							return (
								<Pressable style={styles.card} onPress={() => onOpenWorld(item.id)}>
									<View style={styles.cardHeader}>
										<Text style={styles.title} numberOfLines={1}>{item.title}</Text>
										<View style={[styles.visBadge, item.visibility === 'public' && styles.visBadgePublic]}>
											<Text style={[styles.visBadgeText, item.visibility === 'public' && styles.visBadgeTextPublic]}>
												{item.visibility === 'public' ? 'Открытый' : 'Закрытый'}
											</Text>
										</View>
										{item.is_temporary ? <Text style={styles.tempTag}>временный</Text> : null}
									</View>
									<Text style={styles.itemsSummary}>{itemsSummary(item)}</Text>
									<View style={styles.footerRow}>
										<View style={styles.avatarCluster}>
											{accepted.slice(0, 5).map((m, i) => (
												<View key={m.user_guid} style={[styles.avatarClusterItem, {marginLeft: i === 0 ? 0 : -12, zIndex: 10 - i}]}>
													<BerxAvatar iconUrl={m.icon} fallbackInitial={(m.username ?? '#').charAt(0)} size={26} />
												</View>
											))}
										</View>
										<Text style={styles.memberCount}>{accepted.length} {accepted.length === 1 ? 'участник' : 'участников'}</Text>
									</View>
								</Pressable>
							);
						}}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	toolbar: {paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs},
	fadeFlex: {flex: 1},
	list: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm},
	card: {borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs},
	cardHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	title: {flex: 1, color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	visBadge: {paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface},
	visBadgePublic: {backgroundColor: colors.accentSoft},
	visBadgeText: {fontSize: typography.sizeXs, color: colors.textFaint},
	visBadgeTextPublic: {color: colors.accent, fontWeight: typography.weightMedium},
	tempTag: {fontSize: typography.sizeXs, color: colors.textFaint, fontStyle: 'italic'},
	itemsSummary: {color: colors.textDim, fontSize: typography.sizeSm},
	footerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs},
	avatarCluster: {flexDirection: 'row', alignItems: 'center'},
	avatarClusterItem: {borderRadius: radius.pill, borderWidth: 2, borderColor: colors.black},
	memberCount: {color: colors.textFaint, fontSize: typography.sizeXs},
});
