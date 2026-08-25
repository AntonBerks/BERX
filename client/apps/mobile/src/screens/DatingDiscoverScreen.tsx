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
 * not exposed via API v1 yet. This screen honestly shows an initial-
 * letter placeholder instead of a photo, rather than pretending a
 * public photo URL exists when the real architecture never had one.
 */
import React, {useRef, useState} from 'react';
import {View, Text, Pressable, Animated, PanResponder, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingProfileCard} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onMatch: (otherGuid: number, otherUsername: string) => void;
	onOpenMatches: () => void;
	onOpenPrivacy: () => void;
}

const SWIPE_THRESHOLD = 120;

export default function DatingDiscoverScreen({api, onMatch, onOpenMatches, onOpenPrivacy}: Props) {
	const [profiles, setProfiles] = useState<BerxDatingProfileCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState(false);
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
		try {
			if (direction === 'like') {
				const res = await api.datingLike(current.guid);
				if (res.mutual) {
					onMatch(current.guid, current.pseudonym);
				}
			} else {
				await api.datingPass(current.guid);
			}
			setProfiles((prev) => prev.slice(1));
			position.setValue({x: 0, y: 0});
		} catch {
			// Real, honest limitation: neither datingLike/datingPass
			// distinguishes "actually failed" from "rate limited" in a
			// way this screen can show separately (see
			// API_SECURITY_MATRIX.md — dating/interests has a real
			// 30/60s limit). The card stays in place either way rather
			// than silently disappearing on a failure.
			Animated.spring(position, {toValue: {x: 0, y: 0}, useNativeDriver: true}).start();
		} finally {
			setActing(false);
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

	if (loading) return <BerxLoadingState label="Загрузка анкет..." />;
	if (loading) {
		return (
			<View style={styles.screen}>
				<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} />
				<BerxLoadingState label="Загрузка анкет..." />
			</View>
		);
	}
	if (error) {
		return (
			<View style={styles.screen}>
				<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} />
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);
	}
	if (!current) {
		return (
			<View style={styles.screen}>
				<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} />
				<BerxEmptyState title="Анкеты закончились" subtitle="Загляните позже — появятся новые." />
			</View>
		);
	}

	const rotate = position.x.interpolate({inputRange: [-300, 0, 300], outputRange: ['-15deg', '0deg', '15deg']});

	return (
		<View style={styles.screen}>
			<DatingTopBar onOpenMatches={onOpenMatches} onOpenPrivacy={onOpenPrivacy} />
			<Animated.View
				{...panResponder.panHandlers}
				style={[styles.card, {transform: [{translateX: position.x}, {translateY: position.y}, {rotate}]}]}
			>
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
			</Animated.View>

			<View style={styles.actions}>
				<BerxButton label="Пропустить" variant="secondary" onPress={() => resolveCard('pass')} disabled={acting} />
				<BerxButton label="Нравится" onPress={() => resolveCard('like')} disabled={acting} />
			</View>
		</View>
	);
}

function DatingTopBar({onOpenMatches, onOpenPrivacy}: {onOpenMatches: () => void; onOpenPrivacy: () => void}) {
	return (
		<View style={styles.topBar}>
			<Pressable onPress={onOpenMatches} hitSlop={8}>
				<Text style={styles.topBarLink}>Совпадения</Text>
			</Pressable>
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
	topBarLink: {color: colors.accent, fontSize: typography.sizeSm},
	card: {
		width: '88%',
		backgroundColor: colors.graphite,
		borderRadius: radius.lg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		padding: spacing.lg,
		alignItems: 'center',
	},
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
	actions: {
		flexDirection: 'row',
		gap: spacing.lg,
		marginTop: spacing.xxl,
		width: '88%',
		justifyContent: 'space-between',
	},
});
