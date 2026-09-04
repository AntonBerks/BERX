/**
 * BerxBusinessHero — a business, at the top of its dashboard.
 *
 * Verification is server-enforced and admin-only (a business can
 * never verify itself), so the badge here reflects a real
 * administrative decision rather than a self-declared status.
 */
import {StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import {rgba, sharedElementTag} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSceneHero} from './BerxSceneHero';
import {typography} from '../tokens';

export interface BerxBusinessHeroProps {
	placeGuid: number;
	name: string;
	category?: string;
	cover?: ImageSourcePropType;
	/** Admin-granted, server-enforced. */
	verified?: boolean;
	/** Real subscription tier from the business subscription endpoint. */
	planLabel?: string;
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxBusinessHero({placeGuid, name, category, cover, verified, planLabel, actions, testID}: BerxBusinessHeroProps) {
	const {scene} = useBerxScene();
	return (
		<BerxSceneHero
			testID={testID}
			title={name}
			meta={category}
			media={cover}
			mediaAlt={cover ? `Обложка бизнеса ${name}` : undefined}
			height={220}
			sharedTag={sharedElementTag('profileHeader', placeGuid)}
			badges={
				<>
					{verified ? (
						<View
							accessible
							accessibilityLabel="Бизнес подтверждён администрацией"
							style={[styles.badge, {backgroundColor: rgba(scene.accent, 0.14), borderColor: rgba(scene.accent, 0.4)}]}>
							<Text style={[styles.badgeText, {color: scene.accent}]}>✓ Подтверждён</Text>
						</View>
					) : null}
					{planLabel ? (
						<View
							accessible
							accessibilityLabel={`Тариф: ${planLabel}`}
							style={[styles.badge, {borderColor: scene.layers.D4.surface.borderColor}]}>
							<Text style={[styles.badgeText, {color: scene.accent}]}>{planLabel}</Text>
						</View>
					) : null}
				</>
			}
			actions={actions}
		/>
	);
}

const styles = StyleSheet.create({
	badge: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1},
	badgeText: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
