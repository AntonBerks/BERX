/**
 * BERX SOCIAL SCENE — 2D spatial fallback.
 *
 * The web/harness half of the True3D/2D split (Metro takes
 * BerxSocialScene.native.tsx on iOS/Android; the esbuild harness has
 * no `.native.` resolution and always lands here).
 *
 * Carries the SAME graph semantics as the GL scene, and the same
 * refusals:
 *   - You are the centre.
 *   - Every friend sits on ONE ring at ONE radius, because BERX has no
 *     friendship-strength data (`BerxFriend` is just identity fields).
 *     Spreading them would be an invented closeness ranking.
 *   - The only real per-friend difference is presence, so an online
 *     friend is lit and an offline one is dim.
 *   - Suggestions sit OUTSIDE the ring at a radius driven by real
 *     `mutual_count` — more shared friends pulls them inward.
 *   - Edges are drawn only centre-to-friend, where a real relationship
 *     exists. Suggestions get no edge, because you are not connected.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxFriend, BerxPeopleSuggestion} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {useBerxColors} from '@berx/design-system/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const BOX = 320;
const FRIEND_RING = BOX * 0.24;
const SUGGEST_NEAR = BOX * 0.32;
const SUGGEST_FAR = BOX * 0.44;
const MAX_FRIENDS = 24;
const MAX_SUGGESTIONS = 12;

interface Props {
	friends: BerxFriend[];
	online: {guid: number}[];
	suggestions: BerxPeopleSuggestion[];
}

export default function BerxSocialScene({friends, online, suggestions}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const onlineGuids = useMemo(() => new Set(online.map((o) => o.guid)), [online]);

	const shownFriends = friends.slice(0, MAX_FRIENDS);
	const shownSuggestions = suggestions.slice(0, MAX_SUGGESTIONS);
	const maxMutual = shownSuggestions.reduce((m: number, s: BerxPeopleSuggestion) => Math.max(m, s.mutual_count), 0);

	return (
		<View style={styles.wrap}>
			<View style={styles.canvasBox}>
				{/* The friend ring itself — one radius, because that is what BERX can prove. */}
				{shownFriends.length > 0 ? (
					<View style={[styles.ring, {width: FRIEND_RING * 2, height: FRIEND_RING * 2, borderRadius: FRIEND_RING}]} />
				) : null}

				{shownFriends.map((f: BerxFriend, i: number) => {
					const angle = (i / Math.max(shownFriends.length, 1)) * Math.PI * 2;
					const isOnline = onlineGuids.has(f.guid);
					return (
						<View
							key={`f-${f.guid}`}
							style={[
								styles.friend,
								isOnline ? styles.friendOnline : styles.friendOffline,
								{transform: [{translateX: Math.cos(angle) * FRIEND_RING}, {translateY: Math.sin(angle) * FRIEND_RING}]},
							]}
						/>
					);
				})}

				{shownSuggestions.map((s: BerxPeopleSuggestion, i: number) => {
					const t = maxMutual > 0 ? s.mutual_count / maxMutual : 0;
					const distance = SUGGEST_FAR - t * (SUGGEST_FAR - SUGGEST_NEAR);
					const angle = ((i + 0.5) / Math.max(shownSuggestions.length, 1)) * Math.PI * 2;
					return (
						<View
							key={`s-${s.guid}`}
							style={[
								styles.suggestion,
								{transform: [{translateX: Math.cos(angle) * distance}, {translateY: Math.sin(angle) * distance}]},
							]}
						/>
					);
				})}

				{/* You. Drawn last so it sits above the ring. */}
				<View style={styles.self} />
			</View>
			<Text style={styles.hint}>
				Кольцо — ваши друзья. Снаружи — люди с общими друзьями: чем больше общих, тем ближе.
			</Text>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	wrap: {gap: spacing.sm},
	canvasBox: {
		height: BOX,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.bg,
		borderWidth: 1,
		borderColor: colors.borderSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	ring: {position: 'absolute', borderWidth: 1, borderColor: colors.accent, opacity: 0.28},
	self: {position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent},
	friend: {position: 'absolute', width: 12, height: 12, borderRadius: 6},
	friendOnline: {backgroundColor: colors.accent},
	friendOffline: {backgroundColor: colors.textFaint},
	suggestion: {
		position: 'absolute',
		width: 10,
		height: 10,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: colors.accent,
		backgroundColor: 'transparent',
		opacity: 0.8,
	},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'center', paddingHorizontal: spacing.md},
});
