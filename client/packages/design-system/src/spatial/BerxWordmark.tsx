/**
 * BerxWordmark — the mark, drawn one way.
 *
 * Three screens each had their own idea of it: 40px at 2pt tracking
 * on the welcome scene, 34px at 2pt centred on sign-in, a bold 20px
 * in the feed's header. Same four letters, three different marks, and
 * an identity that changes size, weight and spacing between screens
 * is not an identity.
 *
 * The treatment here is the live BERX web theme's own: the letters
 * held at a medium weight and opened up to 0.44em of tracking, with
 * the final letter carrying the active colour world's accent. Tracked
 * type adds its space *after* every letter including the last, which
 * pushes a centred mark visibly off the optical middle — the leading
 * pad here puts it back, which is the kind of correction that makes
 * the difference between a logo and a word in bold.
 *
 * It announces itself once, as "BERX", rather than letting a screen
 * reader spell out a two-span title.
 */
import {StyleSheet, Text, type TextStyle} from 'react-native';
import {colors} from '../tokens';
import {useBerxSceneOptional} from './BerxSpatialScene';

export interface BerxWordmarkProps {
	/** Cap height in px. The tracking follows it. */
	size?: number;
	/** Marks the mark as the screen's heading. */
	heading?: boolean;
	style?: TextStyle;
	testID?: string;
}

/** The web theme's ratio, kept as a ratio so it holds at every size. */
const TRACKING = 0.44;

export function BerxWordmark({size = 46, heading, style, testID}: BerxWordmarkProps) {
	const scene = useBerxSceneOptional();
	const accent = scene?.scene.accent ?? colors.accent;
	const tracking = size * TRACKING;

	return (
		<Text
			testID={testID}
			accessibilityRole={heading ? 'header' : undefined}
			accessibilityLabel="BERX"
			style={[
				styles.mark,
				{fontSize: size, lineHeight: Math.round(size * 1.12), letterSpacing: tracking, paddingLeft: tracking},
				style,
			]}>
			BER<Text style={{color: accent}}>X</Text>
		</Text>
	);
}

const styles = StyleSheet.create({
	/* medium, not bold: at this tracking a heavy weight reads as
	   shouting rather than as a mark */
	mark: {color: colors.text, fontWeight: '600'},
});
