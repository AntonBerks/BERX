/**
 * BerxChatRow — one conversation in the MESSAGES list.
 *
 * The whole row is a single control with one announced sentence
 * ("Anna, 2 непрочитанных, «увидимся в семь», 14:32"), because a
 * screen reader stepping through four separate nodes has to
 * reassemble that sentence itself. The message thread is a shared
 * element, so opening the conversation continues the same object.
 */
import {StyleSheet, Text, View} from 'react-native';
import {rgba, sharedElementTag} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxAvatar} from '../components/BerxAvatar';
import {colors, spacing, typography} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxChatRowProps {
	conversationGuid: number;
	name: string;
	avatarUrl?: string;
	/** Last message preview. Never rendered when the viewer may not read it. */
	preview?: string;
	timeLabel?: string;
	unread?: number;
	onPress: () => void;
	testID?: string;
}

export function BerxChatRow({
	conversationGuid,
	name,
	avatarUrl,
	preview,
	timeLabel,
	unread = 0,
	onPress,
	testID,
}: BerxChatRowProps) {
	const {scene} = useBerxScene();

	const label = [name, unread > 0 ? `${unread} непрочитанных` : undefined, preview, timeLabel].filter(Boolean).join(', ');

	return (
		<BerxSpatialCard
			depth="D3"
			onPress={onPress}
			accessibilityLabel={label}
			padding={spacing.md}
			radius={18}
			sharedTag={sharedElementTag('messageThread', conversationGuid)}
			testID={testID}>
			<View style={styles.row}>
				<BerxAvatar iconUrl={avatarUrl} fallbackInitial={name.slice(0, 1)} size={46} />
				<View style={styles.text}>
					<View style={styles.topRow}>
						<Text style={[styles.name, unread > 0 ? styles.nameUnread : null]} numberOfLines={1}>
							{name}
						</Text>
						{timeLabel ? <BerxText role="meta" emphasis="tertiary">{timeLabel}</BerxText> : null}
					</View>
					{preview ? (
						<Text style={[styles.preview, unread > 0 ? {color: colors.text} : null]} numberOfLines={1}>
							{preview}
						</Text>
					) : null}
				</View>
				{unread > 0 ? (
					<View style={[styles.badge, {backgroundColor: scene.accent, shadowColor: scene.accent}]}>
						<Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
					</View>
				) : (
					<View style={[styles.badgeSpacer, {borderColor: rgba(colors.white, 0)}]} />
				)}
			</View>
		</BerxSpatialCard>
	);
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	text: {flex: 1, gap: 2},
	topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
	name: {color: colors.textDim, fontSize: typography.sizeBase, flexShrink: 1},
	nameUnread: {color: colors.text, fontWeight: typography.weightMedium},
	preview: {color: colors.textDim, fontSize: typography.sizeSm},
	badge: {minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', shadowOpacity: 1, shadowRadius: 8},
	badgeText: {color: '#04252A', fontSize: 11, fontWeight: typography.weightBold},
	badgeSpacer: {width: 22, height: 22},
});
