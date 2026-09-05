/**
 * BerxObjectCard — the shared body of every BERX domain card.
 *
 * Experiences, trips, collections, communities, creators and rewards
 * are different objects with the same spatial job: a lit card on the
 * content plane carrying media, a title, real counts and one primary
 * action. Sharing this base is what stops six near-identical cards
 * drifting into six different ideas of a card.
 *
 * Domain-specific wrappers live in their own modules and are thin by
 * design — each supplies real fields, none re-implements the surface.
 */
import {Image, StyleSheet, View, type ImageSourcePropType} from 'react-native';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxActionShelf} from './BerxActionShelf';
import {BerxScrim} from './BerxScrim';
import {useBerxScene} from './BerxSpatialScene';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxObjectCardFact {
	label: string;
	/** Real server value. Omit the fact rather than render an invented zero. */
	value: string | number;
}

export interface BerxObjectCardProps {
	title: string;
	subtitle?: string;
	body?: string;
	media?: ImageSourcePropType;
	mediaAlt?: string;
	facts?: readonly BerxObjectCardFact[];
	badges?: React.ReactNode;
	actions?: React.ReactNode;
	onPress?: () => void;
	sharedTag?: string;
	/** Overrides the composed accessible name when the domain has a better sentence. */
	accessibilityLabel?: string;
	testID?: string;
}

export function BerxObjectCard({
	title,
	subtitle,
	body,
	media,
	mediaAlt,
	facts,
	badges,
	actions,
	onPress,
	sharedTag,
	accessibilityLabel,
	testID,
}: BerxObjectCardProps) {
	const {scene} = useBerxScene();
	const label =
		accessibilityLabel ??
		[title, subtitle, ...(facts ?? []).map((f) => `${f.label}: ${f.value}`)].filter(Boolean).join(', ');

	/**
	 * An object with real media is made of that media.
	 *
	 * A photograph in a band above a paragraph is a conventional card:
	 * the image is decoration attached to a text block, and a list of
	 * them reads as a list of rectangles with pictures in them. The
	 * archive's treatment is the other way round — the media is the
	 * object, and what the object *says* sits inside the media's own
	 * falloff, so a place is a photograph of that place with its name
	 * in the dark at the bottom of it.
	 *
	 * The falloff is not a bar laid over the picture. BerxScrim ramps
	 * from clear, through the point where the text begins, to full at
	 * the lower edge, in the scene's own substrate colour, so the image
	 * darkens into the room rather than into a black rectangle. That
	 * ramp is also what keeps the text at 4.5:1 over an image BERX has
	 * never seen: by the line where the type sits, the scrim is at
	 * three quarters of the substrate.
	 *
	 * An object with no media keeps the lit surface and the type. BERX
	 * does not ship a stock photograph to make the two look alike.
	 */
	const cinematic = media !== undefined;

	return (
		<BerxSpatialCard depth="D3" onPress={onPress} accessibilityLabel={onPress ? label : undefined} padding={0} sharedTag={sharedTag} testID={testID}>
			{cinematic ? (
				<View style={styles.stage}>
					<Image
						source={media}
						resizeMode="cover"
						accessible={mediaAlt !== undefined}
						accessibilityLabel={mediaAlt}
						style={styles.media}
					/>
					<BerxScrim color={scene.background} strength={0.94} textStart={0.42} id={`berx-card-scrim-${testID ?? title}`} />
					<View style={styles.overlay}>
						{badges ? <View style={styles.badges}>{badges}</View> : null}
						<BerxText role="title" numberOfLines={2}>
							{title}
						</BerxText>
						{subtitle ? (
							<BerxText role="meta" emphasis="secondary" numberOfLines={1}>
								{subtitle}
							</BerxText>
						) : null}
					</View>
				</View>
			) : null}
			{/* Numbers stand on the card, not in the picture.
			    A badge is a state — live, open, verified — and it belongs
			    over the media it qualifies. A fact is a quantity, read as
			    a figure with a word under it, and three of those stacked
			    on a photograph beside a title is a caption competing with
			    itself. They sit on the object's own surface below the
			    picture, where a figure is read rather than glanced at. */}
			{!cinematic || body || actions || (facts && facts.length > 0) ? (
				<View style={cinematic ? styles.tail : styles.body}>
					{!cinematic && badges ? <View style={styles.badges}>{badges}</View> : null}
					{!cinematic ? (
						<BerxText role="subtitle" numberOfLines={2}>
							{title}
						</BerxText>
					) : null}
					{!cinematic && subtitle ? (
						<BerxText role="meta" emphasis="secondary" numberOfLines={1}>
							{subtitle}
						</BerxText>
					) : null}
					{body ? (
						<BerxText role="body" emphasis="secondary" numberOfLines={3}>
							{body}
						</BerxText>
					) : null}
					{facts && facts.length > 0 ? <Facts facts={facts} /> : null}
					{/* actions are promoted to the control plane, attached to
					    the card rather than floating over it — see
					    BerxActionShelf */}
					{actions ? <BerxActionShelf inset={spacing.lg}>{actions}</BerxActionShelf> : null}
				</View>
			) : null}
		</BerxSpatialCard>
	);
}

/** The object's real numbers, read as quantities rather than as words. */
function Facts({facts}: {facts: readonly BerxObjectCardFact[]}) {
	return (
		<View style={styles.facts} accessibilityRole="list">
			{facts.map((f) => (
				<View key={f.label} style={styles.fact} accessible accessibilityLabel={`${f.label}: ${f.value}`}>
					<BerxText role="heading">{f.value}</BerxText>
					<BerxText role="meta" emphasis="tertiary">{f.label}</BerxText>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	/* A real frame rather than a band.
	 *
	 * 3:2 rather than 4:3: an object in a list has to be an object you
	 * can see several of. At 4:3 three cards fill a phone and the list
	 * stops being a list; at 3:2 the picture is still the object and
	 * the scene still has more than one thing in it. */
	stage: {width: '100%', aspectRatio: 3 / 2, justifyContent: 'flex-end'},
	media: {...StyleSheet.absoluteFillObject},
	/* what the object says, standing in its own picture */
	overlay: {padding: spacing.lg, gap: spacing.xs},
	body: {padding: spacing.lg, gap: spacing.xs},
	/* anything that did not fit in the picture — a description, the
	   controls — continues below it on the card's own surface */
	tail: {paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.xs},
	badges: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: 2},
	facts: {flexDirection: 'row', gap: spacing.xl, paddingTop: spacing.sm, flexWrap: 'wrap'},
	fact: {gap: 1},
});
