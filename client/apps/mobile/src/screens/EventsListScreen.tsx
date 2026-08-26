/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.events(), api.eventCategories() (components/OssnApi/
 * v1/events.php). No ticket/payment UI anywhere — that backend does
 * not exist (see BERX_DECISIONS.md).
 *
 * Future UI pass: event rows move onto BerxGlassSurface (the date
 * badge stays its own flat block inside it -- a real ticket-stub
 * shape, not another glass card) and the list gets a real BerxFadeIn
 * entrance.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet, Image} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxEvent, BerxPlaceCategory} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onCreate: () => void;
	onOpenMine: () => void;
	onBack?: () => void;
}

export default function EventsListScreen({api, onOpenEvent, onCreate, onOpenMine, onBack}: Props) {
	const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
	const [category, setCategory] = useState<string | undefined>(undefined);
	const [categories, setCategories] = useState<BerxPlaceCategory[]>([]);
	const [items, setItems] = useState<BerxEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.eventCategories().then((r) => setCategories(r.categories)).catch(() => undefined);
	}, [api]);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.events({category, past: tab === 'past'});
			setItems(res.events);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить события');
		} finally {
			setLoading(false);
		}
	}, [api, category, tab]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading && items.length === 0) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="События" onBack={onBack} />
			<View style={styles.toolbar}>
				<View style={styles.tabRow}>
					<Pressable style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
						<Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Предстоящие</Text>
					</Pressable>
					<Pressable style={[styles.tab, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
						<Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Прошедшие</Text>
					</Pressable>
					<Pressable style={styles.tab} onPress={onOpenMine}>
						<Text style={styles.tabText}>Я иду</Text>
					</Pressable>
				</View>
				<BerxButton label="Создать событие" onPress={onCreate} fullWidth />
			</View>
			<FlatList
				horizontal
				showsHorizontalScrollIndicator={false}
				data={categories}
				keyExtractor={(c: BerxPlaceCategory) => c.slug}
				contentContainerStyle={styles.chipRow}
				renderItem={({item}: {item: BerxPlaceCategory}) => (
					<Pressable
						style={[styles.chip, category === item.slug && styles.chipActive]}
						onPress={() => setCategory(category === item.slug ? undefined : item.slug)}>
						<Text style={[styles.chipText, category === item.slug && styles.chipTextActive]}>{item.label}</Text>
					</Pressable>
				)}
			/>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title={tab === 'upcoming' ? 'Событий пока нет' : 'Прошедших событий нет'} subtitle="Создайте первое — оно появится здесь." />
			) : (
				<BerxFadeIn style={styles.listFade} delayMs={60}>
					<FlatList
						data={items}
						keyExtractor={(e: BerxEvent) => String(e.guid)}
						contentContainerStyle={styles.list}
						renderItem={({item}: {item: BerxEvent}) => {
							const date = new Date(item.starts * 1000);
							return (
								<Pressable onPress={() => onOpenEvent(item.guid)}>
									<BerxGlassSurface padding={0} style={styles.card}>
										<View style={styles.dateBadge}>
											<Text style={styles.dateDay}>{date.getDate()}</Text>
											<Text style={styles.dateMonth}>{date.toLocaleDateString('ru-RU', {month: 'short'}).toUpperCase()}</Text>
										</View>
										{item.cover_url ? <Image source={{uri: item.cover_url}} style={styles.cardImage} /> : null}
										<View style={styles.cardBody}>
											<Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
											{item.location ? <Text style={styles.cardMeta} numberOfLines={1}>{item.location}</Text> : null}
											<Text style={styles.cardGoing}>{item.attendee_count} идут{item.is_going ? ' · вы идёте' : ''}</Text>
										</View>
									</BerxGlassSurface>
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
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm},
	tabRow: {flexDirection: 'row', gap: spacing.xs},
	tab: {flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.surface},
	tabActive: {backgroundColor: colors.accentSoft},
	tabText: {fontSize: typography.sizeSm, color: colors.textDim, fontWeight: typography.weightMedium},
	tabTextActive: {color: colors.accent},
	chipRow: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.xs},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	listFade: {flex: 1},
	list: {padding: spacing.md, gap: spacing.sm},
	card: {flexDirection: 'row', marginBottom: spacing.sm},
	dateBadge: {width: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.graphite},
	dateDay: {fontSize: typography.sizeXl, color: colors.white, fontWeight: typography.weightBold},
	dateMonth: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
	cardImage: {width: 64, height: 64},
	cardBody: {flex: 1, padding: spacing.sm, justifyContent: 'center', gap: 2},
	cardTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	cardMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
	cardGoing: {fontSize: typography.sizeXs, color: colors.textDim},
});
