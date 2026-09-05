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
import {View, StyleSheet} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface BERXWorldScreenProps {
	onOpenPlaces: () => void;
	onOpenEvents: () => void;
	onOpenNearby: () => void;
	onOpenCommunities: () => void;
	onOpenVideo: () => void;
	onOpenMusic: () => void;
	onOpenNearbyNow: () => void;
	onBack?: () => void;
}

function WorldCard({label, subtitle, onPress}: {label: string; subtitle: string; onPress: () => void}) {
	return (
		/* D3 — each door into the world is an object standing in it,
		   lit by the same geographic atmosphere behind them */
		<BerxSpatialCard
			depth="D3"
			padding={spacing.lg}
			radius={18}
			onPress={onPress}
			accessibilityLabel={`${label}. ${subtitle}`}
			style={styles.card}>
			<BerxText role="heading">{label}</BerxText>
			<BerxText role="meta" emphasis="secondary">{subtitle}</BerxText>
		</BerxSpatialCard>
	);
}

export default function BERXWorldScreen(props: BERXWorldScreenProps) {
	return (
		<BerxFamilyScene family="EXPLORE" testID="berx-world">
			<BERXWorldScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function BERXWorldScreenBody({onOpenPlaces, onOpenEvents, onOpenNearby, onOpenCommunities, onOpenVideo, onOpenMusic, onOpenNearbyNow, onBack}: BERXWorldScreenProps) {
	return (
		<View style={styles.screen}>
			<BerxHeader title="BERX World" onBack={onBack} />
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.grid}>
					<WorldCard label="Места" subtitle="Кафе, рестораны, бары и не только" onPress={onOpenPlaces} />
					<WorldCard label="События" subtitle="Концерты, встречи, мероприятия" onPress={onOpenEvents} />
					<WorldCard label="Рядом" subtitle="Что вокруг вас прямо сейчас" onPress={onOpenNearby} />
					<WorldCard label="Сообщества" subtitle="Люди с общими интересами" onPress={onOpenCommunities} />
					<WorldCard label="Видео" subtitle="Смотрите, что снимают вокруг" onPress={onOpenVideo} />
					<WorldCard label="Музыка" subtitle="Треки, которые загружают другие" onPress={onOpenMusic} />
					<WorldCard label="Рядом сейчас" subtitle="Реальные места и события поблизости" onPress={onOpenNearbyNow} />
				</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	grid: {padding: spacing.md, gap: spacing.sm},
	card: {gap: 4},
});
