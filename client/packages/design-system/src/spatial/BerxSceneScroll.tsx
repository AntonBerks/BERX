/**
 * BerxSceneScroll — the scrolling surface of a scene that is not a list.
 *
 * A detail scene — a place, an event, a business, an album — scrolls
 * a composition rather than a collection, so it uses a ScrollView
 * rather than a list. Thirteen of them did that with React Native's
 * own, which means the scene was never told where the viewer had
 * scrolled to, so the room sat still behind moving content and
 * parallax — the most legible depth cue BERX has — simply did not
 * happen on those screens.
 *
 * This is that ScrollView, reporting the scroll to the scene it is
 * in. A caller's own handler still runs. Outside a scene it is an
 * ordinary ScrollView rather than an error, because an auth screen's
 * first frame exists before the scene does.
 *
 * It also holds the content to the layout contract's width, for the
 * same reason the list does: a wide window should get more room
 * around the scene, not wider objects.
 */
import {useCallback} from 'react';
import {
	ScrollView,
	StyleSheet,
	View,
	useWindowDimensions,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	type ScrollViewProps,
	type ViewStyle,
} from 'react-native';
import {BERX_V9_CONTRACT_DEFAULTS, type BerxResolvedScreen} from '@berx/scenes';
import {useBerxSceneScrollOptional} from './BerxSpatialScene';

export interface BerxSceneScrollProps extends ScrollViewProps {
	/** The resolved screen, when the caller has one. */
	screen?: BerxResolvedScreen;
	/** Skips the width limit for content that manages its own. */
	full?: boolean;
	style?: ViewStyle;
}

export function BerxSceneScroll({screen, full = false, style, onScroll, children, ...rest}: BerxSceneScrollProps) {
	const scene = useBerxSceneScrollOptional();
	const {width} = useWindowDimensions();
	const maxWidth = screen?.maxContentWidth ?? BERX_V9_CONTRACT_DEFAULTS.layout.maxContentWidth;

	const handleScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			scene?.onScroll(event);
			onScroll?.(event);
		},
		[scene, onScroll],
	);

	const body = full || width <= maxWidth ? children : <View style={[styles.frame, {maxWidth}]}>{children}</View>;

	return (
		<ScrollView
			onScroll={handleScroll}
			scrollEventThrottle={scene?.scrollEventThrottle ?? 16}
			style={style}
			{...rest}>
			{body}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	frame: {width: '100%', alignSelf: 'center'},
});
