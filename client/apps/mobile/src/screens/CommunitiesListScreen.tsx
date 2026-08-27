/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.myCommunities() was always a
 * real, working client method (real GET /communities/mine) with zero
 * UI caller — this screen only ever offered a full/searchable browse
 * list, with no way to filter down to communities you're actually a
 * member of.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenCommunity: (guid: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

type Tab = 'all' | 'mine';

export default function CommunitiesListScreen({api, onOpenCommunity, onCreate, onBack}: Props) {
	const [tab, setTab] = useState<Tab>('all');
	const [q, setQ] = useState('');
	const [items, setItems] = useState<BerxCommunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = tab === 'mine' ? await api.myCommunities() : await api.communities(q || undefined);
			setItems(res.communities);
			setError(null);
		} catch {
			setError('Не удалось загрузить сообщества');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, q, tab]);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab]);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Сообщества" />
			<View style={styles.tabRow}>
				<Pressable style={[styles.tab, tab === 'all' && styles.tabActive]} onPress={() => setTab('all')}>
					<Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Все</Text>
				</Pressable>
				<Pressable style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
					<Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>Мои</Text>
				</Pressable>
			</View>
			<View style={styles.searchRow}>
				{tab === 'all' ? (
					<View style={styles.searchInput}>
						<BerxInput placeholder="Поиск сообществ..." value={q} onChangeText={setQ} onSubmitEditing={load} />
					</View>
				) : (
					<View style={styles.searchInput} />
				)}
				<BerxButton label="+" onPress={onCreate} />
			</View>

			{loading ? (
				<BerxLoadingState label="Загрузка..." />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState
					title={tab === 'mine' ? 'Вы пока не в сообществах' : 'Сообщества не найдены'}
					subtitle={tab === 'mine' ? 'Вступите в сообщество на вкладке «Все» или создайте своё.' : 'Попробуйте другой запрос или создайте своё.'}
				/>
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(c: BerxCommunity) => String(c.guid)}
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
						renderItem={({item}: {item: BerxCommunity}) => (
							<Pressable style={styles.row} onPress={() => onOpenCommunity(item.guid)}>
								<Text style={styles.name}>{item.name}</Text>
								{item.description ? (
									<Text style={styles.description} numberOfLines={2}>
										{item.description}
									</Text>
								) : null}
								{item.is_member ? <Text style={styles.memberBadge}>Вы участник</Text> : null}
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	tabRow: {flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
	tab: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim},
	tabTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	searchRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
	searchInput: {flex: 1},
	fadeFlex: {flex: 1},
	row: {padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	description: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	memberBadge: {color: colors.accent, fontSize: typography.sizeXs, marginTop: spacing.xs},
});
