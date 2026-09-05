/**
 * Dating / Discover — a SOCIAL-family v9 scene.
 *
 * Not one of the 300: the archive names no dating contract, and
 * inventing one would be inventing product logic. It borrows the
 * SOCIAL family's spatial definition and keeps its own naming.
 *
 * Real endpoints only: `/dating/discover`, `/dating/interests` (which
 * is the like, and answers whether the like was mutual),
 * `/dating/pass`, `/dating/undo`.
 *
 * Interaction: the two buttons are the primary, always-visible path;
 * the swipe is an enhancement that calls the same two functions, so
 * an imprecise gesture never blocks the action and the flow stays
 * usable by keyboard and switch control. Both use RN core
 * PanResponder/Animated — no gesture library is installed.
 *
 * Photos are BLOCKED, honestly: BERX Match keeps profile photos
 * server-side private and releases them through a photo-request/grant
 * flow that API v1 does not expose for discovery. The card shows the
 * pseudonym's initial rather than pretending a public photo URL
 * exists that the architecture never had.
 *
 * Two things fixed here:
 *  - `datingUndo` was a real endpoint with no UI at all. A pass is now
 *    undoable, and the restored profile is re-read from the server
 *    rather than reconstructed locally.
 *  - the loading branch was written twice, the first as an early
 *    `return` that made the second unreachable — so the loading state
 *    silently lost its top bar.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, PanResponder, StyleSheet, Text, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingProfileCard} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxDepthLayer} from '../../../../packages/design-system/src/spatial/BerxDepthLayer';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface DatingDiscoverScreenProps {
	api: BerxApiClient;
	onMatch: (otherGuid: number, otherUsername: string) => void;
	onOpenMatches: () => void;
	onOpenPrivacy: () => void;
}

const SWIPE_THRESHOLD = 120;

export default function DatingDiscoverScreen(props: DatingDiscoverScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" atmosphereKind="identity" testID="dating-discover">
			<DatingDiscoverSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function DatingDiscoverSceneBody({api, onMatch, onOpenMatches, onOpenPrivacy}: DatingDiscoverScreenProps) {
	const {scene} = useBerxScene();
	const [profiles, setProfiles] = useState<BerxDatingProfileCard[]>([]);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState(false);
	const [canUndo, setCanUndo] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const position = useRef(new Animated.ValueXY()).current;

	const load = useCallback(async () => {
		setState('loading');
		try {
			const res = await api.datingDiscover(20, 0);
			setProfiles(res.profiles);
			setError(null);
			setState(res.profiles.length === 0 ? 'empty' : 'default');
		} catch (e) {
			setError(
				e instanceof Error && e.message
					? e.message
					: 'Не удалось загрузить анкеты. Возможно, у вас ещё нет анкеты знакомств.',
			);
			const failure = classifyFailure(e, offline);
			/* the profile-less case is real and specific: keep the server's
			   own words when it gave them, and the classifier's otherwise */
			setState(failure.state);
		}
	}, [api, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const current = profiles[0];

	const resolveCard = useCallback(
		async (direction: 'like' | 'pass') => {
			if (!current || acting) return;
			setActing(true);
			setNotice(null);
			try {
				if (direction === 'like') {
					const res = await api.datingLike(current.guid);
					/* mutual is the server's answer, not a guess */
					if (res.mutual) onMatch(current.guid, current.pseudonym);
					setCanUndo(false);
				} else {
					await api.datingPass(current.guid);
					/* only a pass is undoable — /dating/undo restores the last pass */
					setCanUndo(true);
				}
				setProfiles((prev) => prev.slice(1));
				position.setValue({x: 0, y: 0});
				setState(profiles.length <= 1 ? 'empty' : 'default');
			} catch {
				/**
				 * `/dating/interests` has a real 30-per-60s limit and the
				 * API does not separate "rate limited" from "failed" in a
				 * way this screen could show differently. The card springs
				 * back rather than silently disappearing on a failure.
				 */
				setNotice('Действие не сохранилось. Возможно, слишком часто — попробуйте ещё раз.');
				Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: true}).start();
			} finally {
				setActing(false);
			}
		},
		[current, acting, api, onMatch, position, profiles.length],
	);

	const undo = useCallback(async () => {
		if (!canUndo || acting) return;
		setActing(true);
		setNotice(null);
		try {
			const res = await api.datingUndo();
			setCanUndo(false);
			if (res.restored_guid === null) {
				setNotice('Нечего возвращать.');
				return;
			}
			/* re-read rather than reconstructing the restored card locally */
			await load();
		} catch {
			setNotice('Не удалось вернуть анкету.');
		} finally {
			setActing(false);
		}
	}, [canUndo, acting, api, load]);

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dx) > 8,
			onPanResponderMove: Animated.event([null, {dx: position.x, dy: position.y}], {useNativeDriver: false}),
			onPanResponderRelease: (_evt, gesture) => {
				if (gesture.dx > SWIPE_THRESHOLD) {
					Animated.timing(position, {toValue: {x: 600, y: gesture.dy}, duration: 200, useNativeDriver: true}).start(() =>
						resolveCard('like'),
					);
				} else if (gesture.dx < -SWIPE_THRESHOLD) {
					Animated.timing(position, {toValue: {x: -600, y: gesture.dy}, duration: 200, useNativeDriver: true}).start(() =>
						resolveCard('pass'),
					);
				} else {
					Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: true}).start();
				}
			},
		}),
	).current;

	/* under reduced motion the card does not rotate as it travels */
	const rotate = scene.reducedMotion
		? '0deg'
		: position.x.interpolate({inputRange: [-300, 0, 300], outputRange: ['-15deg', '0deg', '15deg']});

	return (
		<View style={styles.screen}>
			<View style={styles.topBar}>
				<BerxButton label="Совпадения" variant="secondary" onPress={onOpenMatches} />
				<BerxText role="subtitle" heading>
					Знакомства
				</BerxText>
				<BerxButton label="Приватность" variant="secondary" onPress={onOpenPrivacy} />
			</View>

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				emptyTitle="Анкеты закончились"
				emptyBody="Загляните позже — появятся новые."
				emptyAction={canUndo ? {label: 'Вернуть последнюю', onPress: undo} : undefined}
				style={styles.body}>
				{current ? (
					<>
						{/* D5 — energy behind the focal card */}
						<BerxDepthLayer depth="D5" style={styles.haloLayer} decorative>
							<BerxEnergyHalo size={220} intensity={0.35} />
						</BerxDepthLayer>

						<Animated.View
							{...panResponder.panHandlers}
							style={[styles.cardWrap, {transform: [{translateX: position.x}, {translateY: position.y}, {rotate}]}]}>
							<BerxSpatialCard
								depth="D3"
								padding={spacing.xl}
								accessibilityLabel={`Анкета: ${current.pseudonym}${current.age ? `, ${current.age}` : ''}${current.city ? `, ${current.city}` : ''}`}>
								<View style={styles.initialWrap}>
									<Text style={[styles.initial, {color: scene.accent}]}>
										{current.pseudonym.charAt(0).toUpperCase()}
									</Text>
								</View>
								<BerxText role="title">
									{current.pseudonym}
									{current.age ? `, ${current.age}` : ''}
								</BerxText>
								{current.city ? <BerxText role="meta" emphasis="secondary" style={styles.meta}>{current.city}</BerxText> : null}
								{current.goal ? <BerxText role="meta" emphasis="secondary" style={styles.meta}>{current.goal}</BerxText> : null}
								{current.bio ? (
									<BerxText role="body" emphasis="secondary" numberOfLines={5} style={styles.bio}>
										{current.bio}
									</BerxText>
								) : null}
								{current.interests ? <BerxText role="meta" emphasis="secondary" style={styles.meta}>{current.interests}</BerxText> : null}
								{/* the honest limit, stated on the card itself */}
								<BerxText role="meta" emphasis="tertiary" style={styles.photoNote}>
									Фото в BERX Match открываются по отдельному запросу и здесь не показываются.
								</BerxText>
							</BerxSpatialCard>
						</Animated.View>

						{notice ? (
							<Text accessibilityLiveRegion="polite" style={styles.notice}>
								{notice}
							</Text>
						) : null}

						{/* the always-available path: the gesture is an enhancement, never the only way */}
						<BerxActionShelf variant="anchored">
							<BerxButton label="Пропустить" variant="secondary" onPress={() => resolveCard('pass')} disabled={acting} />
							<BerxButton label="Вернуть" variant="secondary" onPress={undo} disabled={!canUndo || acting} />
							<BerxButton label="Нравится" onPress={() => resolveCard('like')} disabled={acting} />
						</BerxActionShelf>
					</>
				) : null}
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
		gap: spacing.sm,
	},
	body: {flex: 1, justifyContent: 'center'},
	haloLayer: {position: 'absolute', top: '18%', left: 0, right: 0, alignItems: 'center'},
	cardWrap: {paddingHorizontal: spacing.lg},
	initialWrap: {alignItems: 'center', paddingVertical: spacing.xl},
	initial: {fontSize: 56, fontWeight: typography.weightBold},
	meta: {marginTop: 2},
	bio: {marginTop: spacing.sm},
	photoNote: {marginTop: spacing.lg},
	notice: {color: colors.danger, fontSize: typography.sizeXs, textAlign: 'center', paddingTop: spacing.sm},
	actions: {flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', padding: spacing.lg, flexWrap: 'wrap'},
});
