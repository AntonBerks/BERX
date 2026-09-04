/**
 * BerxAvatarCluster — several people as one object.
 *
 * Overlapping avatars are a single accessible unit ("Anna, Ilya и
 * ещё 4"), not a row of unlabelled images: a screen reader reading
 * six "image" nodes tells the user nothing about who is here.
 */

import {StyleSheet, Text, View} from 'react-native';
import {useBerxScene} from './BerxSpatialScene';
import {BerxAvatar} from '../components/BerxAvatar';
import {colors, typography} from '../tokens';

export interface BerxClusterMember {
	guid: number;
	name: string;
	avatarUrl?: string;
}

export interface BerxAvatarClusterProps {
	members: readonly BerxClusterMember[];
	/** Real total from the server when it exceeds the members actually loaded. */
	total?: number;
	max?: number;
	size?: number;
	/** e.g. "участники сообщества" — completes the announced sentence. */
	contextLabel?: string;
	testID?: string;
}

export function BerxAvatarCluster({members, total, max = 4, size = 32, contextLabel, testID}: BerxAvatarClusterProps) {
	const {scene} = useBerxScene();
	const shown = members.slice(0, max);
	const count = total ?? members.length;
	const overflow = Math.max(0, count - shown.length);

	const names = shown.map((m) => m.name).join(', ');
	const label = [contextLabel, names, overflow > 0 ? `и ещё ${overflow}` : undefined].filter(Boolean).join(': ');

	if (shown.length === 0) return null;

	return (
		<View testID={testID} accessible accessibilityRole="text" accessibilityLabel={label} style={styles.root}>
			{shown.map((m, i) => (
				<View
					key={m.guid}
					style={[
						styles.slot,
						{marginLeft: i === 0 ? 0 : -size / 3, borderColor: scene.background, borderRadius: size / 2, borderWidth: 2},
					]}>
					<BerxAvatar iconUrl={m.avatarUrl} fallbackInitial={m.name.slice(0, 1)} size={size} />
				</View>
			))}
			{overflow > 0 ? (
				<View
					style={[
						styles.slot,
						styles.overflow,
						{
							width: size,
							height: size,
							borderRadius: size / 2,
							marginLeft: -size / 3,
							borderColor: scene.background,
							backgroundColor: scene.layers.D4.surface.backgroundColor,
						},
					]}>
					<Text style={styles.overflowText}>+{overflow}</Text>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flexDirection: 'row', alignItems: 'center'},
	slot: {},
	overflow: {alignItems: 'center', justifyContent: 'center', borderWidth: 2},
	overflowText: {color: colors.textDim, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
