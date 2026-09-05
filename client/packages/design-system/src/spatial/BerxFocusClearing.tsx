/**
 * BerxFocusClearing — the D5 falloff, painted between the controls
 * and the focus.
 *
 * The scene resolves the field (see focus.ts in @berx/spatial); this
 * draws it. It is one radial gradient in the scene's own substrate
 * colour, transparent across the focused object and its margin, and
 * it is deliberately not a full-screen sheet: a sheet hides the room,
 * and the room is what the focused object is emerging *from*. It
 * covers the whole plane so the falloff reaches every edge; what it
 * does at each point is the difference.
 *
 * It takes the field as a prop rather than reading the scene, so the
 * scene root can render it without importing a component that imports
 * the scene root back.
 */
import {StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import {useState} from 'react';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import type {BerxFocusField} from '@berx/spatial';

export interface BerxFocusClearingProps {
	field: BerxFocusField;
	/** Unique per scene — SVG gradient ids are global to the document. */
	id: string;
	testID?: string;
}

export function BerxFocusClearing({field, id, testID}: BerxFocusClearingProps) {
	const [box, setBox] = useState({width: 0, height: 0});

	const onLayout = (event: LayoutChangeEvent) => {
		const {width, height} = event.nativeEvent.layout;
		if (Math.abs(width - box.width) > 0.5 || Math.abs(height - box.height) > 0.5) {
			setBox({width, height});
		}
	};

	return (
		<View
			testID={testID}
			onLayout={onLayout}
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[StyleSheet.absoluteFillObject, styles.plane]}>
			{box.width > 0 && box.height > 0 ? (
				<Svg width={box.width} height={box.height} pointerEvents="none">
					<Defs>
						<RadialGradient
							id={`${id}-clearing`}
							cx={`${field.centerX * 100}%`}
							cy={`${field.centerY * 100}%`}
							rx={`${field.radiusX * 100}%`}
							ry={`${field.radiusY * 100}%`}
							gradientUnits="objectBoundingBox">
							{field.stops.map((stop, index) => (
								<Stop
									key={`${id}-stop-${index}`}
									offset={`${stop.offset * 100}%`}
									stopColor={field.surroundColor}
									stopOpacity={stop.alpha}
								/>
							))}
						</RadialGradient>
					</Defs>
					<Rect x={0} y={0} width={box.width} height={box.height} fill={`url(#${id}-clearing)`} />
				</Svg>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	/* Between the content and the controls.
	 *
	 * Above D3, so the content around the focus falls away with the
	 * room it stands in. Below D4, so the controls do not: a scene
	 * whose actions dimmed out with everything else is a modal, and
	 * D5 focus is not a modal. The focused object is promoted to D5
	 * while it holds focus, which is why it sits above this and inside
	 * the clearing rather than under it. */
	plane: {zIndex: 3.5},
});
