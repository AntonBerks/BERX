/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.experiences() (components/OssnApi/v1/experiences.php,
 * new domain this session). Includes both owned experiences and ones
 * you've been invited to, with your real invite status shown.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, FlatList, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxExperience} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxAuroraField} from '../../../../packages/design-system/src/components/BerxAuroraField';
import {useWindowDimensions} from 'react-native';
import {BerxSpatialScene, BerxDepthLayer} from '../../../../packages/design-system/src/v9/BerxSpatialScene';
import {BerxExperienceCard} from '../../../../packages/design-system/src/v9/BerxV9Domain';
import {useBerxReducedMotion} from '../../../../packages/design-system/src/v9/BerxBoundaries';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	userGuid?: number;
	isOwn: boolean;
	onOpenExperience: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
	invited: 'Приглашение',
	accepted: 'Вы идёте',
	declined: 'Отклонено',
};

function fmtWhen(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

export default function ExperiencesScreen({api, userGuid, isOwn, onOpenExperience, onCreate, onBack}: Props) {
	const colors = useBerxColors();
	const reducedMotion = useBerxReducedMotion();
	const win = useWindowDimensions();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxExperience[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.experiences(userGuid);
			// A response missing the list is the SAME thing to a user as an
			// empty one, and the screen must not die on it. It did: any
			// shape drift on this endpoint threw out of render with
			// "Cannot read properties of undefined (reading 'length')"
			// instead of showing the real empty state this screen already has.
			setItems(res.experiences ?? []);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить впечатления');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	/* EXPERIENCES, rebuilt inside the V9 spatial architecture.
	   The list was flat `colors.surface` rectangles — the same opaque
	   panel BERX replaced with glass everywhere else — so the family
	   whose whole subject is a shared plan read as a settings list. It
	   is now a real scene: D4 for the header and the create action, D3
	   glass for the plans themselves, each rendered by the V9
	   ExperienceCard rather than a fourth hand-rolled row layout. */
	return (
		<BerxSpatialScene reducedMotion={reducedMotion} style={styles.screen}>
			{/* D0 atmosphere — see SearchScreen's note. */}
			<BerxDepthLayer depth="D0" fill animateEntry={false} style={styles.atmosphere}>
				<BerxAuroraField width={win.width} height={win.height} />
			</BerxDepthLayer>

			<BerxDepthLayer depth="D4">
				<BerxHeader title="Впечатления" onBack={onBack} />
				{isOwn ? (
					<View style={styles.toolbar}>
						<BerxButton label="Создать впечатление" onPress={onCreate} fullWidth />
					</View>
				) : null}
			</BerxDepthLayer>
			<BerxDepthLayer depth="D3" style={styles.fadeFlex}>
			{items.length === 0 ? (
				<BerxEmptyState title="Впечатлений пока нет" subtitle={isOwn ? 'Соберите место или событие в план с друзьями.' : undefined} />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(e: BerxExperience) => String(e.id)}
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
						renderItem={({item}: {item: BerxExperience}) => (
							<BerxExperienceCard
								title={item.title}
								subtitle={`${fmtWhen(item.scheduled_start)}${item.anchor ? ` · ${item.anchor.title}` : ''}`}
								imageUrl={item.anchor?.image_url ?? null}
								meta={item.my_status && !item.is_own ? STATUS_LABEL[item.my_status] : null}
								onPress={() => onOpenExperience(item.id)}
								accessibilityLabel={item.title}
							/>
						)}
					/>
				</BerxFadeIn>
			)}
			</BerxDepthLayer>
		</BerxSpatialScene>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	atmosphere: {opacity: 0.5},
	toolbar: {padding: spacing.md},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 56, height: 56, borderRadius: radius.sm},
	thumbFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
	status: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightMedium},
});
