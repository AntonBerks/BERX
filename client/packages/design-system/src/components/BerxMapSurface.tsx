/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX MAP SURFACE — a real spatial projection of real coordinates.
 *
 * HONEST CONSTRAINT: no map library is installable in this environment
 * (react-native-maps / maplibre — npm is blocked here), so there is no
 * basemap imagery: no streets, no coastlines, no labels. What this
 * surface DOES render is real: every pin's position comes from the
 * actual lat/lng the API returned, projected with a real
 * equirectangular projection around a real center and scaled by a real
 * radius in kilometres. Relative geography — what is north of what,
 * what is clustered, what sits at the edge of the radius — is
 * therefore truthful. It is a radar, not a fake map, and it is labelled
 * as one in the UI rather than dressed up as cartography.
 *
 * Pins with a null lat/lng are NOT placed at a made-up position; they
 * are excluded here and surfaced by the caller as a list instead.
 */
import React from 'react';
import {View, Text, Image, Pressable, Dimensions, LayoutChangeEvent, StyleSheet, ViewStyle} from 'react-native';
import {spacing, typography, radius as radiusTokens} from '../tokens';
import type {BerxColorTokens} from '../tokens';
import {useBerxColors} from '../theme';

export interface BerxMapPin {
	key: string;
	lat: number;
	lng: number;
	label: string;
	/** The pin's own real photo, when the caller has one. The references draw markers as portraits, not dots. */
	imageUrl?: string | null;
	/** 'place' | 'event' | 'self' — drives the marker's real meaning, not decoration. */
	kind: 'place' | 'event' | 'self';
	onPress?: () => void;
}

export interface BerxMapSurfaceProps {
	/** Real center — the viewer's own submitted coordinate. */
	centerLat: number;
	centerLng: number;
	/** Real radius the API was queried with. Sets the surface's scale. */
	radiusKm: number;
	pins: BerxMapPin[];
	height?: number;
	/** Key of the pin currently selected by the caller, if any. */
	selectedKey?: string | null;
	style?: ViewStyle;
}

const EARTH_KM_PER_DEG = 111.32;

/**
 * Real equirectangular projection: latitude degrees are a constant
 * distance apart, longitude degrees shrink by cos(lat). Accurate
 * enough at city radius, which is the only radius this surface is ever
 * used at.
 */
export function projectPin(
	lat: number,
	lng: number,
	centerLat: number,
	centerLng: number,
): {northKm: number; eastKm: number} {
	const northKm = (lat - centerLat) * EARTH_KM_PER_DEG;
	const eastKm = (lng - centerLng) * EARTH_KM_PER_DEG * Math.cos((centerLat * Math.PI) / 180);
	return {northKm, eastKm};
}

export function BerxMapSurface({
	centerLat,
	centerLng,
	radiusKm,
	pins,
	height = 300,
	selectedKey,
	style,
}: BerxMapSurfaceProps) {
	const colors = useBerxColors();
	const styles = React.useMemo(() => makeStyles(colors), [colors]);
	// Width and height are measured separately: the surface used to assume
	// a square, so once it filled a tall screen every pin was projected off
	// the right edge.
	const [width, setWidth] = React.useState(Dimensions.get('window').width);
	const halfW = width / 2;
	const halfH = height / 2;
	// The queried radius must fit in the SHORTER axis, or the edge of the
	// radius falls outside the surface on one side.
	const half = Math.min(halfW, halfH);
	// One ring per real kilometre band, at most four — the rings are a
	// distance scale, so they only exist where the radius supports them.
	const ringCount = Math.max(1, Math.min(4, Math.round(radiusKm)));

	const placed = pins
		.map((pin: BerxMapPin) => {
			const {northKm, eastKm} = projectPin(pin.lat, pin.lng, centerLat, centerLng);
			const distanceKm = Math.sqrt(northKm * northKm + eastKm * eastKm);
			// Scale so the queried radius reaches the surface edge.
			const scale = half / radiusKm;
			return {
				pin,
				distanceKm,
				top: halfH - northKm * scale,
				left: halfW + eastKm * scale,
			};
		})
		// Outside the real queried radius = genuinely not in view.
		.filter((p: {distanceKm: number}) => p.distanceKm <= radiusKm);

	return (
		<View
			style={[styles.surface, {height}, style]}
			onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
			{Array.from({length: ringCount}).map((_unused: unknown, i: number) => {
				const ringKm = (radiusKm / ringCount) * (i + 1);
				const size = (ringKm / radiusKm) * half * 2;
				return (
					<View
						key={`ring-${i}`}
						style={[
							styles.ring,
							{width: size, height: size, borderRadius: size / 2, top: halfH - size / 2, left: halfW - size / 2},
						]}
					/>
				);
			})}

			<View style={[styles.self, {top: halfH - 7, left: halfW - 7}]} />

			{placed.map((p: {pin: BerxMapPin; top: number; left: number}) => {
				const selected = selectedKey === p.pin.key;
				return (
					<Pressable
						key={p.pin.key}
						onPress={p.pin.onPress}
						style={[styles.pinWrap, {top: p.top - 22, left: p.left - 22}]}>
						{p.pin.imageUrl ? (
							<View style={[styles.marker, selected && styles.markerSelected]}>
								<Image source={{uri: p.pin.imageUrl}} style={styles.markerImage} />
							</View>
						) : (
							<View
								style={[
									styles.pin,
									p.pin.kind === 'event' ? styles.pinEvent : styles.pinPlace,
									selected && styles.pinSelected,
								]}
							/>
						)}
						{selected ? (
							<Text style={styles.pinLabel} numberOfLines={1}>
								{p.pin.label}
							</Text>
						) : null}
					</Pressable>
				);
			})}

			<Text style={styles.scaleLabel}>{radiusKm} км</Text>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) =>
	StyleSheet.create({
		surface: {
			borderRadius: radiusTokens.lg,
			backgroundColor: colors.graphite,
			borderWidth: 1,
			borderColor: colors.borderSoft,
			overflow: 'hidden',
		},
		ring: {
			position: 'absolute',
			borderWidth: 1,
			borderColor: colors.borderSoft,
		},
		self: {
			position: 'absolute',
			width: 14,
			height: 14,
			borderRadius: 7,
			backgroundColor: colors.accent,
			borderWidth: 3,
			borderColor: colors.bg,
		},
		pinWrap: {position: 'absolute', alignItems: 'center'},
		// The references draw a map marker as a portrait in a ring, not a dot.
		marker: {
			width: 44,
			height: 44,
			borderRadius: 22,
			overflow: 'hidden',
			borderWidth: 2,
			borderColor: colors.bg,
			backgroundColor: colors.graphite,
			shadowColor: '#000',
			shadowOpacity: 0.45,
			shadowRadius: 10,
			shadowOffset: {width: 0, height: 4},
			elevation: 8,
		},
		markerSelected: {borderColor: colors.accent, borderWidth: 3},
		markerImage: {width: '100%', height: '100%'},
		pin: {width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.bg},
		pinPlace: {backgroundColor: colors.white},
		pinEvent: {backgroundColor: colors.accentSecondary},
		pinSelected: {width: 16, height: 16, borderRadius: 8, borderColor: colors.accent},
		pinLabel: {
			marginTop: 2,
			maxWidth: 110,
			fontSize: typography.sizeXs,
			color: colors.white,
			backgroundColor: colors.glass3,
			paddingHorizontal: spacing.xs,
			paddingVertical: 1,
			borderRadius: radiusTokens.pill,
			overflow: 'hidden',
		},
		scaleLabel: {
			position: 'absolute',
			right: spacing.sm,
			bottom: spacing.sm,
			fontSize: typography.sizeXs,
			color: colors.textFaint,
		},
	});
