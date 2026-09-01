/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.myGoingEvents() (components/OssnApi/v1/events.php).
 *
 * MAX BUILD — "shared activities": each event now carries a real
 * friends_going_count (computed server-side in the same request, no
 * extra round trip), shown as a "👥 N идут" nudge — turning a flat
 * list of your own plans into a real cross-reference of who else is
 * already going, without a second screen or a second fetch.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

export default function MyEventsScreen({api, onOpenEvent, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.myGoingEvents();
			setItems(res.events);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить события');
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

	return (
		<View style={styles.screen}>
			<BerxHeader title="Я иду" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Вы никуда не записаны" subtitle="Нажмите «Пойду» на странице события, чтобы оно появилось здесь." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(e: BerxEvent) => String(e.guid)}
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
						renderItem={({item}: {item: BerxEvent}) => {
							const date = new Date(item.starts * 1000);
							return (
								<Pressable style={styles.card} onPress={() => onOpenEvent(item.guid)}>
									{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.cardImage} /> : <View style={styles.cardImageFallback} />}
									<View style={styles.cardBody}>
										<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
										<Text style={styles.cardMeta}>{date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}{item.friends_going_count ? ` · 👥 ${item.friends_going_count} идут` : ''}</Text>
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

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	card: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	cardImage: {width: 56, height: 56, borderRadius: radius.sm},
	cardImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	cardBody: {flex: 1},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	cardMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
