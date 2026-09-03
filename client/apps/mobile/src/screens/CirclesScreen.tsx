/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.circles() (components/OssnApi/v1/circles.php, new
 * domain this session). Always the caller's own — circles have no
 * public tier at all.
 *
 * BERX WORLD REBUILD — was a plain title bar + full-width button +
 * flat colors.surface list cards, the same generic list-detail pattern
 * PeopleScreen/MyMomentsScreen already moved past. Same editorial
 * header + circular utility button as those screens, and each circle
 * is now a real BerxGlassSurface card instead of a flat colored box.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircle, BerxCircleKind} from '@berx/api/types';
import {ruPeopleLabel, ruPlural} from '@berx/domain';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEditorialTitle, BerxCircleButton} from '../../../../packages/design-system/src/components/BerxGreetingHeader';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenCircle: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

/**
 * Keyed on the REAL kind union rather than `Record<string, string>`, so
 * TypeScript proves every value the backend can send has a Russian
 * label. It previously fell back to `?? item.kind`, which meant an
 * unmapped kind would render the raw database enum to the user — and
 * that is exactly what happened. OssnCircles::isValidKind() whitelists
 * these four and coerces anything else to null on create, so this map
 * is now provably complete and the fallback is gone rather than left
 * as a trap.
 *
 * The lookup is still guarded at RUNTIME by kindLabel() below, because
 * a compile-time union only constrains what the server is SUPPOSED to
 * send. When a server sends something outside its own contract, an
 * unguarded lookup renders the string "undefined" into the UI — which
 * is worse than the raw enum this fix was made to stop leaking. So an
 * unrecognised kind drops the segment entirely: the kind is decorative
 * metadata next to a real name and a real member count, and showing
 * nothing is always better than showing broken text.
 */
const KIND_LABEL: Record<Exclude<BerxCircleKind, null>, string> = {
	family: 'Семья',
	work: 'Работа',
	travel: 'Путешествия',
	close_friends: 'Близкие друзья',
};

/** ' · Семья', or '' if the server sent a kind outside its own contract. */
function kindLabel(kind: BerxCircleKind): string {
	if (!kind) return '';
	const label = KIND_LABEL[kind];
	return label ? ` · ${label}` : '';
}

export default function CirclesScreen({api, onOpenCircle, onCreate, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxCircle[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.circles();
			setItems(res.circles);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить круги');
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
			<View style={styles.head}>
				<BerxEditorialTitle
					topInset={!onBack}
					style={styles.headline}
					accentIndex={1}
					lines={[
						'Круги',
						items.length > 0 ? `${items.length} ${ruPlural(items.length, 'круг', 'круга', 'кругов')}` : 'приватные списки друзей',
					]}
				/>
				<View style={styles.headActions}>
					{onBack ? <BerxCircleButton icon="chevron-left" onPress={onBack} /> : null}
					<BerxCircleButton icon="plus" onPress={onCreate} />
				</View>
			</View>
			{items.length === 0 ? (
				<BerxEmptyState title="Кругов пока нет" subtitle="Круги — приватные списки друзей для управления видимостью." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(c: BerxCircle) => String(c.id)}
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
						renderItem={({item}: {item: BerxCircle}) => (
							<Pressable onPress={() => onOpenCircle(item.id)}>
								<BerxGlassSurface padding="md" style={styles.row}>
									<Text style={styles.title}>{item.name}</Text>
									<Text style={styles.meta}>
										{ruPeopleLabel(item.member_count)}
										{kindLabel(item.kind)}
									</Text>
								</BerxGlassSurface>
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
	head: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md},
	headline: {flex: 1, paddingHorizontal: 0, paddingTop: 0},
	headActions: {flexDirection: 'row', gap: spacing.sm},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {gap: 2, marginBottom: spacing.sm},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
