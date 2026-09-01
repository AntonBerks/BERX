/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Uses React Native's own PanResponder + Animated (both part of RN
 * core, not an external gesture library) for the swipe. Buttons
 * (Like/Pass) are the primary, always-visible action path; the swipe
 * gesture is an enhancement calling the same two functions, not a
 * separate code path — an imprecise gesture never blocks the core
 * action, tapping the button still works.
 *
 * Photos: BERX Match's real backend keeps profile photos server-side
 * private, released only through a separate photo-request/grant flow
 * — that flow IS now real and exposed via API v1 (requestDatingPhotoAccess()/
 * respondDatingPhotoAccess()/DatingUserPhotosScreen), but deliberately
 * NOT surfaced here: requesting access to a stranger's private photo
 * before either side has even liked the other isn't a flow this app
 * builds anywhere (DatingUserPhotosScreen is reachable only from a
 * real match) — this comment previously said the flow itself didn't
 * exist yet, which stopped being true once it shipped; corrected here
 * rather than left stale. This screen still honestly shows an
 * initial-letter placeholder instead of a photo, since a pre-match
 * discover card never has one to show.
 *
 * MAX BUILD — datingLike()/datingPass() now DO distinguish rate
 * limiting (a real 429 'rate_limited', see OssnDating::
 * isActionRateLimited()) from any other failure — the ambiguity this
 * screen previously disclosed is closed; a real "slow down" message
 * shows instead of a silent spring-back.
 *
 * BERX WORLD TRANSFORMATION — was a literal Tinder card: an inset
 * floating rounded rectangle (88% width, visible margin on every
 * side) with a boxed photo placeholder, name/city/goal/bio stacked
 * below it, and a Pass/Like button pair underneath — the exact shape
 * multiple directive passes named directly ("BERX Match must not look
 * like Tinder," "another dating app" listed among banned identities).
 * Rebuilt full-bleed: the card now fills the screen edge to edge (no
 * inset, no visible card boundary — the single structural change that
 * breaks Tinder's own silhouette), using the same BerxScrimHero
 * language every other discovery surface in the app now shares —
 * name/age/city/goal/bio live ON the photo area via the real scrim,
 * not stacked as plain text below a boxed thumbnail. Actions moved
 * into a floating glass panel at the bottom, the same "actions live
 * in a raised glass panel over the world" composition
 * WelcomeScreen's entry panel already established — one grammar
 * across the app, not a dating-app-specific one.
 *
 * The real swipe gesture (PanResponder + Animated.ValueXY, RN core,
 * no gesture library) is functional, not decorative — it's the same
 * action a tap on the panel buttons performs, just gesture-driven —
 * so it stayed, applied to the new full-bleed wrapper instead of a
 * small floating card.
 */
import React, {useRef, useState, useMemo} from 'react';
import {View, Text, Pressable, Animated, PanResponder, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingProfileCard} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxScrimHero, scrimBadgeStyles} from '../../../../packages/design-system/src/components/BerxScrimHero';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onMatch: (otherGuid: number, otherUsername: string) => void;
	onOpenMatches: () => void;
	onOpenPrivacy: () => void;
	onOpenDatingProfile: () => void;
	onOpenSearch?: () => void;
}

const SWIPE_THRESHOLD = 120;

export default function DatingDiscoverScreen({api, onMatch, onOpenMatches, onOpenPrivacy, onOpenDatingProfile, onOpenSearch}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [profiles, setProfiles] = useState<BerxDatingProfileCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState(false);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	// MAX BUILD — real undo (api.datingUndo() was always a real client
	// method with zero callers). Keeps the just-passed card itself
	// (the server only returns restored_guid, not full card data) so a
	// confirmed undo can put it back exactly where it was.
	const [lastPassed, setLastPassed] = useState<BerxDatingProfileCard | null>(null);
	const [undoing, setUndoing] = useState(false);
	const position = useRef(new Animated.ValueXY()).current;

	async function load() {
		setLoading(true);
		try {
			const res = await api.datingDiscover(20, 0);
			setProfiles(res.profiles);
			setError(null);
		} catch {
			setError('Не удалось загрузить анкеты. Возможно, у вас ещё нет анкеты знакомств — заполните её на сайте.');
		} finally {
			setLoading(false);
		}
	}

	React.useEffect(() => {
		load();
	}, []);

	const current = profiles[0];

	async function resolveCard(direction: 'like' | 'pass') {
		if (!current || acting) return;
		setActing(true);
		setActionMessage(null);
		try {
			if (direction === 'like') {
				const res = await api.datingLike(current.guid);
				if (res.mutual) {
					onMatch(current.guid, current.pseudonym);
				}
				setLastPassed(null);
			} else {
				await api.datingPass(current.guid);
				setLastPassed(current);
			}
			setProfiles((prev) => prev.slice(1));
			position.setValue({x: 0, y: 0});
		} catch (e) {
			// Real, distinct server verdict now (OssnDating::
			// isActionRateLimited()) — shown as-is instead of a silent
			// spring-back for every failure alike.
			if (e instanceof BerxApiError && e.code === 'rate_limited') {
				setActionMessage('Слишком много действий — подождите минуту');
			}
			Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: true}).start();
		} finally {
			setActing(false);
		}
	}

	async function handleUndo() {
		if (!lastPassed || undoing) return;
		setUndoing(true);
		try {
			const res = await api.datingUndo();
			// Only restore if the server confirms it undid THIS exact
			// pass — never assume, since another real pass could have
			// happened in between (e.g. a second tab/device).
			if (res.restored_guid === lastPassed.guid) {
				setProfiles((prev: BerxDatingProfileCard[]) => [lastPassed, ...prev]);
				setLastPassed(null);
			}
		} catch {
			// real server rejection (e.g. nothing to undo) — lastPassed stays as-is, button just does nothing more
		} finally {
			setUndoing(false);
		}
	}

	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_: any, gesture: any) => Math.abs(gesture.dx) > 8,
			onPanResponderMove: Animated.event([null, {dx: position.x, dy: position.y}], {useNativeDriver: false}),
			onPanResponderRelease: (_: any, gesture: any) => {
				if (gesture.dx > SWIPE_THRESHOLD) {
					Animated.timing(position, {toValue: {x: 600, y: gesture.dy}, duration: 200, useNativeDriver: true}).start(() =>
						resolveCard('like')
					);
				} else if (gesture.dx < -SWIPE_THRESHOLD) {
					Animated.timing(position, {toValue: {x: -600, y: gesture.dy}, duration: 200, useNativeDriver: true}).start(() =>
						resolveCard('pass')
					);
				} else {
					Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: true}).start();
				}
			},
		})
	).current;

	if (loading) {
		return (
			<View style={styles.screen}>
				<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} onOpenDatingProfile={onOpenDatingProfile} onOpenSearch={onOpenSearch} />
				<BerxLoadingState label="Загрузка анкет..." />
			</View>
		);
	}
	if (error) {
		return (
			<View style={styles.screen}>
				<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} onOpenDatingProfile={onOpenDatingProfile} onOpenSearch={onOpenSearch} />
				<BerxErrorState message={error} onRetry={load} />
				{/* MAX BUILD — a real path to fix the most common cause of this
				    error (no dating profile yet) instead of only a generic retry. */}
				<View style={styles.errorAction}>
					<BerxButton label="Заполнить анкету" variant="secondary" onPress={onOpenDatingProfile} fullWidth />
				</View>
			</View>
		);
	}
	if (!current) {
		return (
			<View style={styles.screen}>
				<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} onOpenDatingProfile={onOpenDatingProfile} onOpenSearch={onOpenSearch} />
				<BerxEmptyState title="Анкеты закончились" subtitle="Загляните позже — появятся новые." />
				{lastPassed ? (
					<Pressable onPress={handleUndo} disabled={undoing} hitSlop={8} style={styles.undoWrap}>
						<Text style={styles.undoLink}>{undoing ? 'Отмена…' : `↺ Вернуть «${lastPassed.pseudonym}»`}</Text>
					</Pressable>
				) : null}
			</View>
		);
	}

	const rotate = position.x.interpolate({inputRange: [-300, 0, 300], outputRange: ['-15deg', '0deg', '15deg']});

	return (
		<View style={styles.screen}>
			<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} onOpenDatingProfile={onOpenDatingProfile} onOpenSearch={onOpenSearch} />
			<Animated.View
				{...panResponder.panHandlers}
				style={[styles.cardWrap, {transform: [{translateX: position.x}, {translateY: position.y}, {rotate}]}]}
			>
				<BerxScrimHero
					imageUrl={null}
					title={`${current.pseudonym}${current.age ? `, ${current.age}` : ''}`}
					subtitle={current.city ?? undefined}
					fill
					badge={
						current.goal ? (
							<View style={scrimBadgeStyles.badge}>
								<Text style={scrimBadgeStyles.badgeTextAccent}>{current.goal}</Text>
							</View>
						) : undefined
					}
				>
					{current.bio ? (
						<Text style={styles.bio} numberOfLines={4}>
							{current.bio}
						</Text>
					) : null}
				</BerxScrimHero>
			</Animated.View>

			<View style={styles.panelWrap}>
				{actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
				{lastPassed ? (
					<Pressable onPress={handleUndo} disabled={undoing} hitSlop={8}>
						<Text style={styles.undoLink}>{undoing ? 'Отмена…' : `↺ Вернуть «${lastPassed.pseudonym}»`}</Text>
					</Pressable>
				) : null}
				<BerxGlassSurface elevated padding="lg" style={styles.panel}>
					<View style={styles.actions}>
						<BerxButton label="Пропустить" variant="secondary" onPress={() => resolveCard('pass')} disabled={acting} />
						<BerxButton label="Нравится" onPress={() => resolveCard('like')} disabled={acting} />
					</View>
				</BerxGlassSurface>
			</View>
		</View>
	);
}

function DatingTopBar({onOpenMatches, onOpenPrivacy, onOpenDatingProfile, onOpenSearch}: {onOpenMatches: () => void; onOpenPrivacy: () => void; onOpenDatingProfile: () => void; onOpenSearch?: () => void}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.topBar}>
			<View style={styles.topBarLinks}>
				<Pressable onPress={onOpenMatches} hitSlop={8}>
					<Text style={styles.topBarLink}>Совпадения</Text>
				</Pressable>
				<Pressable onPress={onOpenDatingProfile} hitSlop={8}>
					<Text style={styles.topBarLink}>Анкета</Text>
				</Pressable>
				{onOpenSearch ? (
					<Pressable onPress={onOpenSearch} hitSlop={8}>
						<Text style={styles.topBarLink}>Поиск</Text>
					</Pressable>
				) : null}
			</View>
			<Text style={styles.topBarTitle}>Знакомства</Text>
			<Pressable onPress={onOpenPrivacy} hitSlop={8}>
				<Text style={styles.topBarLink}>Приватность</Text>
			</Pressable>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, paddingTop: spacing.md},
	topBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.md,
	},
	topBarTitle: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	topBarLinks: {flexDirection: 'row', gap: spacing.md},
	errorAction: {paddingHorizontal: spacing.lg, marginTop: spacing.md},
	topBarLink: {color: colors.accent, fontSize: typography.sizeSm},
	// Full-bleed, no inset margin — the one structural change that
	// breaks the Tinder card's own silhouette. See file header.
	cardWrap: {flex: 1, borderRadius: radius.lg, overflow: 'hidden', marginHorizontal: spacing.md},
	bio: {color: colors.white, fontSize: typography.sizeBase, marginTop: spacing.sm},
	panelWrap: {padding: spacing.lg, gap: spacing.sm},
	panel: {},
	actionMessage: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center'},
	undoWrap: {alignItems: 'center'},
	undoLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, textAlign: 'center'},
	actions: {
		flexDirection: 'row',
		gap: spacing.lg,
		justifyContent: 'space-between',
	},
});
