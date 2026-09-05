/**
 * BERX-010 — Onboarding Complete.
 *
 * The one screen in the sequence that is genuinely a moment rather
 * than a form, so it is built as one: the D5 energy layer carries it,
 * the scene's own enter motion brings it in, and under reduced motion
 * it cross-fades instead — the moment survives, the movement does not.
 *
 * Every number is real. `GET /me` gives the account, `GET /points`
 * gives the real starting level, balance and streak. If points fail to
 * load the screen still completes — it simply shows fewer facts,
 * rather than a zero that would read as "you have nothing".
 */
import {useCallback, useEffect, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPointsBalance, BerxUser} from '@berx/api/types';
import {spacing} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxDepthLayer} from '../../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {BerxStatRail, type BerxStat} from '../../../../../packages/design-system/src/spatial/BerxStatRail';
import {BerxSpatialCard} from '../../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {useBerxSceneEnter} from '../../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene} from '../../spatial/BerxScreenScene';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';
import {BerxWordmark} from '../../../../../packages/design-system/src/spatial/BerxWordmark';

export interface OnboardingCompleteScreenProps {
	api: BerxApiClient;
	onEnter: () => void;
}

export default function OnboardingCompleteScreen(props: OnboardingCompleteScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-010" testID="berx-010">
			<OnboardingCompleteSceneBody {...props} />
		</BerxScreenScene>
	);
}

function OnboardingCompleteSceneBody({api, onEnter}: OnboardingCompleteScreenProps) {
	const enter = useBerxSceneEnter();
	const [user, setUser] = useState<BerxUser | null>(null);
	const [points, setPoints] = useState<BerxPointsBalance | null>(null);

	const load = useCallback(async () => {
		const [me, balance] = await Promise.all([
			api.me().catch(() => null),
			/* best-effort: the moment must not depend on the points service */
			api.pointsBalance().catch(() => null),
		]);
		setUser(me);
		setPoints(balance);
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	/* only facts the server actually returned */
	const stats: BerxStat[] = [];
	if (points) {
		stats.push({key: 'level', label: 'уровень', value: points.level});
		stats.push({key: 'points', label: 'баллов', value: points.balance});
		if (points.current_streak > 0) stats.push({key: 'streak', label: 'дней подряд', value: points.current_streak});
	}

	const name = user?.fullname || user?.username;

	return (
		<View style={styles.screen}>
			<BerxDepthLayer depth="D5" style={styles.haloLayer} decorative>
				<BerxEnergyHalo size={320} intensity={0.9} />
			</BerxDepthLayer>

			<Animated.View style={[styles.center, enter]}>
				<BerxWordmark size={16} />
				<BerxText role="display" heading style={styles.centered}>
					{name ? `Готово, ${name}` : 'Готово'}
				</BerxText>
				<BerxText role="body" emphasis="secondary" style={styles.centered}>
					Люди, места, события и впечатления — всё в одном пространстве. Начните с того, что рядом.
				</BerxText>

				{stats.length > 0 ? (
					<BerxSpatialCard depth="D3" padding={spacing.lg} style={styles.statsCard}>
						<BerxStatRail stats={stats} />
					</BerxSpatialCard>
				) : null}
			</Animated.View>

			<BerxActionShelf variant="anchored">
				<BerxButton label="Войти в BERX" onPress={onEnter} fullWidth />
			</BerxActionShelf>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, justifyContent: 'space-between', padding: spacing.xl, paddingBottom: spacing.xxl},
	haloLayer: {position: 'absolute', top: '16%', left: 0, right: 0, alignItems: 'center'},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
	centered: {textAlign: 'center', maxWidth: 340},
	statsCard: {marginTop: spacing.lg, alignSelf: 'stretch'},
	actions: {gap: spacing.md},
});
