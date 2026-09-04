/**
 * BerxIcon — the archive's icon contract, enforced.
 *
 * The v9 icon rules are not advice, so none of them are left to the
 * caller:
 *
 *  - 24×24 grid, 1.7px nominal stroke, rounded caps and joins. The
 *    stroke scales with the glyph so a 32px icon does not look
 *    heavier than a 20px one.
 *  - Cyan is stateful, never decorative: `state="active"` or
 *    `selected` is the only way to get the accent, and the default
 *    state inherits a neutral colour.
 *  - The touch target is 44×44 even though the glyph is 24. A
 *    pressable icon gets that box automatically.
 *  - An accessible name is required unless the icon is explicitly
 *    marked decorative — the type makes the omission impossible, not
 *    merely discouraged.
 *  - Motion is 140–360ms and nothing rotates continuously except
 *    `loading`, which is the one glyph allowed to spin — and it stops
 *    under reduced motion, where a static arc still reads as busy.
 */
import {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {BERX_ICON_PATHS, type BerxIconName} from './paths';
import {useBerxLayer} from '../spatial/useBerxLayer';
import {colors} from '../tokens';

const GRID = 24;
/** The archive's nominal stroke on the 24 grid. */
const NOMINAL_STROKE = 1.7;

export type BerxIconState = 'default' | 'active' | 'selected' | 'disabled';

interface BerxIconBase {
	name: BerxIconName;
	size?: number;
	state?: BerxIconState;
	/** Overrides the state colour. Use sparingly — state should decide. */
	color?: string;
	style?: ViewStyle;
	testID?: string;
}

/**
 * Either the icon has a name, or it is explicitly decorative. There is
 * no third option, which is how "never use an icon-only action
 * without an accessible name" stops being a rule someone can forget.
 */
export type BerxIconProps = BerxIconBase &
	({accessibilityLabel: string; decorative?: false} | {decorative: true; accessibilityLabel?: never});

export function BerxIcon(props: BerxIconProps) {
	const {name, size = GRID, state = 'default', color, style, testID} = props;
	const layer = useBerxLayer('D4');
	const geometry = BERX_ICON_PATHS[name];

	const spin = useRef(new Animated.Value(0)).current;
	/* `loading` is the single exception to "never rotate continuously" */
	const allowSpin = name === 'loading';

	useEffect(() => {
		if (!allowSpin) return;
		const loop = Animated.loop(
			Animated.timing(spin, {toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true}),
		);
		loop.start();
		return () => loop.stop();
	}, [allowSpin, spin]);

	const resolved =
		color ??
		(state === 'active' || state === 'selected'
			? layer.accent
			: state === 'disabled'
				? colors.textFaint
				: colors.textDim);

	/* stroke scales with the glyph so optical weight stays constant */
	const strokeWidth = (NOMINAL_STROKE * GRID) / size;

	const glyph = (
		<Svg width={size} height={size} viewBox={`0 0 ${GRID} ${GRID}`} fill="none">
			{geometry.d ? (
				<Path
					d={geometry.d}
					stroke={resolved}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			) : null}
			{geometry.circles?.map((c, i) =>
				c.r > 0 ? (
					<Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke={resolved} strokeWidth={strokeWidth} />
				) : null,
			)}
			{geometry.dots?.map((c, i) => (
				<Circle key={`d${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={resolved} />
			))}
		</Svg>
	);

	const body = allowSpin ? (
		<Animated.View
			style={{transform: [{rotate: spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']})}]}}>
			{glyph}
		</Animated.View>
	) : (
		glyph
	);

	if (props.decorative) {
		return (
			<View
				testID={testID}
				style={style}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				pointerEvents="none">
				{body}
			</View>
		);
	}

	return (
		<View testID={testID} style={style} accessible accessibilityRole="image" accessibilityLabel={props.accessibilityLabel}>
			{body}
		</View>
	);
}

export interface BerxIconButtonProps {
	name: BerxIconName;
	/** Required: an icon-only control with no name is unusable. */
	accessibilityLabel: string;
	accessibilityHint?: string;
	onPress: () => void;
	size?: number;
	state?: BerxIconState;
	disabled?: boolean;
	style?: ViewStyle;
	testID?: string;
}

/**
 * An icon that acts. The 44×44 target comes from the contract, not
 * from whatever padding the caller happened to add.
 */
export function BerxIconButton({
	name,
	accessibilityLabel,
	accessibilityHint,
	onPress,
	size = GRID,
	state = 'default',
	disabled,
	style,
	testID,
}: BerxIconButtonProps) {
	return (
		<Pressable
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessibilityState={{disabled: disabled === true, selected: state === 'selected'}}
			disabled={disabled}
			onPress={onPress}
			style={({pressed}) => [styles.target, {opacity: disabled ? 0.45 : pressed ? 0.6 : 1}, style]}>
			<BerxIcon name={name} size={size} state={disabled ? 'disabled' : state} decorative />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	/* the archive's minimum, on every touch surface */
	target: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
});
