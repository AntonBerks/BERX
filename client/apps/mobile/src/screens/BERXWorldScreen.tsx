/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * A real navigational hub, not a new data surface: every card here
 * routes to a screen that already exists and already fetches real
 * data (Places, Events, Nearby, Communities, Video). No Restaurants/
 * Tickets/Rewards/Wallet/Music cards — none of that has real backend
 * in BERX today (see BERX_DECISIONS.md and BERX_PROGRESS.md's
 * "explicitly NOT built" list). Restaurants specifically: already
 * covered by Places' category filter (restaurant/cafe/bar/...), not
 * a separate domain that needs its own card. Video was added here
 * once its real backend (videos.php, built on the existing Media
 * Foundation) shipped — this comment previously said Video had no
 * real backend, which is now stale and corrected.
 */
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	onOpenPlaces: () => void;
	onOpenEvents: () => void;
	onOpenNearby: () => void;
	onOpenCommunities: () => void;
	onOpenVideo: () => void;
	onOpenMusic: () => void;
	onOpenNearbyNow: () => void;
	onOpenSocialMap: () => void;
	onBack?: () => void;
}

/** The two live, real-time surfaces get real hierarchy (full-width, elevated, a live dot) — not the same flat row as a static list. */
function HeroCard({label, subtitle, onPress}: {label: string; subtitle: string; onPress: () => void}) {
	return (
		<Pressable onPress={onPress}>
			<BerxGlassSurface elevated style={styles.hero}>
				<View style={styles.liveDot} />
				<Text style={styles.heroLabel}>{label}</Text>
				<Text style={styles.heroSubtitle}>{subtitle}</Text>
			</BerxGlassSurface>
		</Pressable>
	);
}

function WorldCard({label, subtitle, onPress}: {label: string; subtitle: string; onPress: () => void}) {
	return (
		<Pressable style={styles.cardWrap} onPress={onPress}>
			<BerxGlassSurface style={styles.card} padding="md">
				<Text style={styles.cardLabel}>{label}</Text>
				<Text style={styles.cardSubtitle}>{subtitle}</Text>
			</BerxGlassSurface>
		</Pressable>
	);
}

export default function BERXWorldScreen({onOpenPlaces, onOpenEvents, onOpenNearby, onOpenCommunities, onOpenVideo, onOpenMusic, onOpenNearbyNow, onOpenSocialMap, onBack}: Props) {
	return (
		<View style={styles.screen}>
			<BerxHeader title="BERX World" onBack={onBack} />
			<BerxFadeIn style={styles.heroRow}>
				<HeroCard label="Рядом сейчас" subtitle="Реальные места и события поблизости, в эту минуту" onPress={onOpenNearbyNow} />
				<HeroCard label="Карта BERX" subtitle="Места, события и друзья онлайн рядом" onPress={onOpenSocialMap} />
			</BerxFadeIn>
			<BerxFadeIn style={styles.grid} delayMs={90}>
				<WorldCard label="Места" subtitle="Кафе, рестораны, бары и не только" onPress={onOpenPlaces} />
				<WorldCard label="События" subtitle="Концерты, встречи, мероприятия" onPress={onOpenEvents} />
				<WorldCard label="Рядом" subtitle="Что вокруг вас прямо сейчас" onPress={onOpenNearby} />
				<WorldCard label="Сообщества" subtitle="Люди с общими интересами" onPress={onOpenCommunities} />
				<WorldCard label="Видео" subtitle="Смотрите, что снимают вокруг" onPress={onOpenVideo} />
				<WorldCard label="Музыка" subtitle="Треки, которые загружают другие" onPress={onOpenMusic} />
			</BerxFadeIn>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	heroRow: {padding: spacing.md, gap: spacing.sm},
	hero: {gap: 4},
	liveDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginBottom: spacing.xs},
	heroLabel: {fontSize: typography.sizeXl, color: colors.white, fontWeight: typography.weightBold},
	heroSubtitle: {fontSize: typography.sizeSm, color: colors.textDim},
	grid: {paddingHorizontal: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
	cardWrap: {width: '47%'},
	card: {gap: 4, minHeight: 92},
	cardLabel: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
	cardSubtitle: {fontSize: typography.sizeXs, color: colors.textDim},
});
