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
 * Future UI pass: the card itself now sits on BerxGlassSurface
 * (Spatial Glass, matching the rest of the app) instead of a flat
 * colors.graphite box — the PanResponder/Animated transform stays on
 * the outer Animated.View wrapper, unchanged, so the swipe gesture
 * behavior is identical.
 *
 * MAX BUILD — datingLike()/datingPass() now DO distinguish rate
 * limiting (a real 429 'rate_limited', see OssnDating::
 * isActionRateLimited()) from any other failure — the ambiguity this
 * screen previously disclosed is closed; a real "slow down" message
 * shows instead of a silent spring-back.
 */
import React, {useRef, useState} from 'react';
import {View, Text, Pressable, Animated, PanResponder, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingProfileCard} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';

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
				<BerxGlassSurface elevated padding="lg" style={styles.card}>
					<View style={styles.photoPlaceholder}>
						<Text style={styles.photoInitial}>{current.pseudonym.charAt(0).toUpperCase()}</Text>
					</View>
					<Text style={styles.name}>
						{current.pseudonym}
						{current.age ? `, ${current.age}` : ''}
					</Text>
					{current.city ? <Text style={styles.city}>{current.city}</Text> : null}
					{current.goal ? <Text style={styles.goal}>{current.goal}</Text> : null}
					{current.bio ? (
						<Text style={styles.bio} numberOfLines={4}>
							{current.bio}
						</Text>
					) : null}
				</BerxGlassSurface>
			</Animated.View>

			{actionMessage ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
			{lastPassed ? (
				<Pressable onPress={handleUndo} disabled={undoing} hitSlop={8}>
					<Text style={styles.undoLink}>{undoing ? 'Отмена…' : `↺ Вернуть «${lastPassed.pseudonym}»`}</Text>
				</Pressable>
			) : null}
			<View style={styles.actions}>
				<BerxButton label="Пропустить" variant="secondary" onPress={() => resolveCard('pass')} disabled={acting} />
				<BerxButton label="Нравится" onPress={() => resolveCard('like')} disabled={acting} />
			</View>
		</View>
	);
}

function DatingTopBar({onOpenMatches, onOpenPrivacy, onOpenDatingProfile, onOpenSearch}: {onOpenMatches: () => void; onOpenPrivacy: () => void; onOpenDatingProfile: () => void; onOpenSearch?: () => void}) {
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

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black, alignItems: 'center', paddingTop: spacing.md},
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
	cardWrap: {width: '88%'},
	card: {alignItems: 'center'},
	photoPlaceholder: {
		width: '100%',
		height: 320,
		borderRadius: radius.md,
		backgroundColor: colors.glass2,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: spacing.lg,
	},
	photoInitial: {color: colors.textDim, fontSize: 96, fontWeight: typography.weightBold},
	name: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	city: {color: colors.textDim, fontSize: typography.sizeBase, marginTop: spacing.xs},
	goal: {
		color: colors.accent,
		fontSize: typography.sizeSm,
		marginTop: spacing.sm,
		backgroundColor: colors.accentSoft,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: radius.pill,
	},
	bio: {color: colors.textDim, fontSize: typography.sizeBase, marginTop: spacing.md, textAlign: 'center'},
	actionMessage: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.sm},
	undoWrap: {marginTop: spacing.lg},
	undoLink: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, marginTop: spacing.sm},
	actions: {
		flexDirection: 'row',
		gap: spacing.lg,
		marginTop: spacing.xxl,
		width: '88%',
		justifyContent: 'space-between',
	},
});
