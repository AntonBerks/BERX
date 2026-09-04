/**
 * BerxIdentity — a person, as one addressable object.
 *
 * Name, handle, verification and relationship travel together as a
 * single accessible unit, so a screen reader announces "Anna Berg,
 * @anna, подтверждён, друг" once instead of reading four unrelated
 * fragments. `avatar` is a shared element: the same person's avatar
 * keeps its identity across scenes.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {rgba, sharedElementTag} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxAvatar} from '../components/BerxAvatar';
import {colors, spacing, typography} from '../tokens';

export type BerxRelationship = 'self' | 'friend' | 'requested' | 'none';

export interface BerxIdentityProps {
	userGuid: number;
	name: string;
	handle?: string;
	avatarUrl?: string;
	/** Real, server-side verification. Never inferred from anything client-side. */
	verified?: boolean;
	relationship?: BerxRelationship;
	size?: number;
	subtitle?: string;
	trailing?: React.ReactNode;
	testID?: string;
}

const RELATIONSHIP_LABEL: Record<BerxRelationship, string | undefined> = {
	self: 'это вы',
	friend: 'друг',
	requested: 'заявка отправлена',
	none: undefined,
};

export function BerxIdentity({
	userGuid,
	name,
	handle,
	avatarUrl,
	verified,
	relationship = 'none',
	size = 44,
	subtitle,
	trailing,
	testID,
}: BerxIdentityProps) {
	const {scene} = useBerxScene();
	const rel = RELATIONSHIP_LABEL[relationship];

	const label = [name, handle ? `@${handle}` : undefined, verified ? 'подтверждён' : undefined, rel, subtitle]
		.filter(Boolean)
		.join(', ');

	return (
		<View testID={testID} accessible accessibilityRole="text" accessibilityLabel={label} style={styles.root}>
			<View nativeID={sharedElementTag('avatar', userGuid)}>
				<BerxAvatar iconUrl={avatarUrl} fallbackInitial={name.slice(0, 1)} size={size} />
			</View>
			<View style={styles.text}>
				<View style={styles.nameRow}>
					<Text style={styles.name} numberOfLines={1}>
						{name}
					</Text>
					{verified ? (
						<View style={[styles.verified, {backgroundColor: rgba(scene.accent, 0.16), borderColor: rgba(scene.accent, 0.4)}]}>
							<Text style={[styles.verifiedGlyph, {color: scene.accent}]}>✓</Text>
						</View>
					) : null}
				</View>
				{handle || subtitle || rel ? (
					<Text style={styles.meta} numberOfLines={1}>
						{[handle ? `@${handle}` : undefined, subtitle, rel].filter(Boolean).join(' · ')}
					</Text>
				) : null}
			</View>
			{trailing}
		</View>
	);
}
const styles = StyleSheet.create({
	root: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	text: {flex: 1, gap: 2},
	nameRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium, flexShrink: 1},
	meta: {color: colors.textDim, fontSize: typography.sizeSm},
	verified: {width: 16, height: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	verifiedGlyph: {fontSize: 10, fontWeight: typography.weightBold, lineHeight: 12},
});
