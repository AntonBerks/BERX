/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — closes a real gap: api.myLifeMoments() (GET
 * /lifemoments/mine) was a real, working client method with zero UI
 * callers. Until now a Moment only ever existed scoped inside the
 * Event/Experience/Place it was written on — no personal "everything
 * I've written" view existed at all. Deliberately a plain text list
 * with an author byline (no avatar circle, no like/comment row), same
 * "quiet running log" visual grammar EventDetailScreen/
 * ExperienceDetailScreen already use for moments — not a Post feed
 * reskin.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxLifeMoment, BerxLifeMomentSourceType, BerxLifeMomentPerson} from '@berx/api/types';
import {relativeTimeLabel, ruPlural} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxDepthCard} from '../../../../packages/design-system/src/components/BerxDepthCard';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEditorialTitle} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenEvent: (guid: number) => void;
	onOpenExperience: (id: number) => void;
	onOpenPlace: (guid: number) => void;
	onBack?: () => void;
}

const SOURCE_LABEL: Record<BerxLifeMomentSourceType, string> = {
	event_checkin: 'событие',
	experience: 'впечатление',
	place_checkin: 'место',
};

export default function MyMomentsScreen({api, onOpenEvent, onOpenExperience, onOpenPlace, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxLifeMoment[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.myLifeMoments();
			setItems(res.moments);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить моменты');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	function openSource(m: BerxLifeMoment) {
		if (m.source_type === 'event_checkin') onOpenEvent(m.source_id);
		else if (m.source_type === 'experience') onOpenExperience(m.source_id);
		else onOpenPlace(m.source_id);
	}

	if (loading) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			{onBack ? <BerxHeader onBack={onBack} title="" /> : null}
			{/* OPUS 5 — MOMENTS gets the same editorial headline as the other
			    non-feed surfaces. The count is the real loaded list length; an
			    empty list says so rather than showing "0". */}
			<View style={styles.head}>
				<BerxEditorialTitle
					style={styles.headline}
					accentIndex={1}
					lines={[
						'Твои моменты',
						items.length > 0
							? `${items.length} ${ruPlural(items.length, 'запись', 'записи', 'записей')}`
							: 'здесь появится прожитое',
					]}
				/>
			</View>
			{error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Пока пусто" subtitle="Момент можно записать прямо на месте — во время события, впечатления или отметки на месте." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(m: BerxLifeMoment) => String(m.id)}
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
						renderItem={({item}: {item: BerxLifeMoment}) => (
							<BerxDepthCard maxAngle={5} elevation={2} style={styles.cardWrap} onPress={() => openSource(item)}>
							<BerxGlassSurface level={2} padding="lg" radius={radius.xl} style={styles.row}>
								<Text style={styles.text}>{item.text}</Text>
								<View style={styles.metaRow}>
									{/* BERX SPATIAL — the people in a moment are real, already-fetched
									    entities (BerxLifeMoment.people), so they read as faces here
									    rather than a comma-joined string. The names stay too: a face
									    without a name is recognisable to nobody. */}
									{item.people.length > 0 ? (
										<BerxAvatarStack
											people={item.people.map((p: BerxLifeMomentPerson) => ({
												guid: p.guid,
												icon: p.icon,
												initial: (p.username ?? '?').charAt(0),
											}))}
											size={24}
										/>
									) : null}
									<Text style={styles.meta}>
										{SOURCE_LABEL[item.source_type]} · {relativeTimeLabel(item.time_created)}
										{item.people.length > 0 ? ` · с ${item.people.map((p: BerxLifeMomentPerson) => p.username ?? `#${p.guid}`).join(', ')}` : ''}
									</Text>
								</View>
							</BerxGlassSurface>
							</BerxDepthCard>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	head: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
	headline: {},
	fadeFlex: {flex: 1},
	list: {padding: spacing.lg},
	separator: {height: 1, backgroundColor: colors.borderSoft},
	row: {paddingVertical: spacing.md, gap: 4},
	cardWrap: {marginBottom: spacing.md},
	text: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	meta: {color: colors.textFaint, fontSize: typography.sizeXs, flex: 1},
});
