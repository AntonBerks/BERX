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
 *
 * The moment and the facts have different fates. The congratulation,
 * the halo and the way in never depend on a request — finishing
 * onboarding must not be blocked by a server. The facts do depend on
 * one, so they carry a real state: a skeleton while the account is in
 * flight, and the true reason when it does not arrive. A 403 here is
 * not the same failure as a dead network, and neither is the same as
 * "you have no points", so none of the three renders as another.
 */
import {useCallback, useEffect, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPointsBalance, BerxUser} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxDepthLayer} from '../../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {BerxStatRail, type BerxStat} from '../../../../../packages/design-system/src/spatial/BerxStatRail';
import {BerxSpatialCard} from '../../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {useBerxSceneEnter} from '../../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxDataBoundary} from '../../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxScreenScene} from '../../spatial/BerxScreenScene';
import {classifyFailure, type BerxFailure} from '../../spatial/screenState';
import {useBerxConnectivity} from '../../spatial/useBerxConnectivity';
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
	/* A dead network is not "you have no points", and a 403 is not a
	 * dead network. This screen greeted people by name and showed a
	 * level before either had arrived, so a slow or absent connection
	 * produced a congratulation addressed to nobody with nothing in
	 * it — identical to the congratulation of someone whose account
	 * the server genuinely refused. The facts carry a real state now.
	 * The way in never does: finishing onboarding must not depend on
	 * the points service, or on any request at all. */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [failure, setFailure] = useState<BerxFailure | null>(null);
	const [user, setUser] = useState<BerxUser | null>(null);
	const [points, setPoints] = useState<BerxPointsBalance | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		setFailure(null);
		let me: BerxUser;
		try {
			me = await api.me();
		} catch (e) {
			/* the account is what the facts are about: when it does not
			   arrive, say which of the three reasons it was */
			const f = classifyFailure(e, offline);
			setFailure(f);
			setState(f.state);
			return;
		}
		setUser(me);
		/* best-effort: the moment must not depend on the points service,
		   and a missing balance is omitted rather than shown as a zero
		   someone has not earned */
		setPoints(await api.pointsBalance().catch(() => null));
		setState('success');
	}, [api, offline]);

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

				{/* The facts, and only the facts, wait on the server. The
				    skeleton keeps the card's shape so nothing jumps when the
				    level lands; a refusal says it is a refusal and offers no
				    retry, because retrying a permission fails identically
				    every time. */}
				<BerxDataBoundary
					state={state}
					style={styles.facts}
					errorMessage={failure?.message}
					retryable={failure?.retryable ?? true}
					onRetry={load}
					privateTitle="Профиль закрыт"
					privateReason={failure?.message}
					loadingSkeleton={
						<BerxSpatialCard depth="D3" padding={spacing.lg} style={styles.statsCard}>
							<View style={styles.skeletonRail}>
								<View style={styles.skeletonStat} />
								<View style={styles.skeletonStat} />
							</View>
						</BerxSpatialCard>
					}
					testID="berx-010-facts">
					{stats.length > 0 ? (
						<BerxSpatialCard depth="D3" padding={spacing.lg} style={styles.statsCard}>
							<BerxStatRail stats={stats} />
						</BerxSpatialCard>
					) : null}
				</BerxDataBoundary>
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
	facts: {alignSelf: 'stretch'},
	statsCard: {marginTop: spacing.lg, alignSelf: 'stretch'},
	/* the skeleton stands where the two real stats will stand */
	skeletonRail: {flexDirection: 'row', gap: spacing.xl, justifyContent: 'center'},
	skeletonStat: {width: 64, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)'},
	actions: {gap: spacing.md},
});
