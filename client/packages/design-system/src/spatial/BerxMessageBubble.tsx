/**
 * BerxMessageBubble — one message.
 *
 * Delivery state is server truth: a message is 'sending' only while
 * the request is in flight and becomes 'sent' when the server has
 * acknowledged it. It never renders as sent optimistically, because a
 * message that appears delivered and was not is the worst possible
 * failure in a messenger.
 *
 * Own and other messages are distinguished by more than alignment —
 * alignment alone is invisible to a screen reader — so the announced
 * label names the sender.
 */
import {StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';
import {colors, spacing, typography} from '../tokens';

export type BerxMessageDelivery = 'sending' | 'sent' | 'failed';

export interface BerxMessageBubbleProps {
	text: string;
	own: boolean;
	senderName: string;
	timeLabel: string;
	delivery?: BerxMessageDelivery;
	onRetry?: () => void;
	/**
	 * Deleting one's own message. Rendered as a real, labelled control
	 * rather than only a long-press: a gesture with no visible
	 * equivalent is unreachable by keyboard, switch control and anyone
	 * who does not already know it is there.
	 */
	onDelete?: () => void;
	deleting?: boolean;
	testID?: string;
}

const DELIVERY_LABEL: Record<BerxMessageDelivery, string> = {
	sending: 'отправляется',
	sent: 'отправлено',
	failed: 'не отправлено',
};

export function BerxMessageBubble({
	text,
	own,
	senderName,
	timeLabel,
	delivery = 'sent',
	onRetry,
	onDelete,
	deleting,
	testID,
}: BerxMessageBubbleProps) {
	const {scene} = useBerxScene();
	const layer = own ? scene.layers.D4 : scene.layers.D3;

	return (
		<View
			testID={testID}
			accessible
			accessibilityRole="text"
			accessibilityLabel={`${own ? 'Вы' : senderName}: ${text}, ${timeLabel}, ${DELIVERY_LABEL[delivery]}`}
			accessibilityActions={onDelete ? [{name: 'delete', label: 'Удалить сообщение'}] : undefined}
			onAccessibilityAction={(e) => {
				if (e.nativeEvent.actionName === 'delete') onDelete?.();
			}}
			style={[styles.row, own ? styles.rowOwn : styles.rowOther, deleting ? styles.deleting : null]}>
			<View style={styles.bubbleWrap}>
				<BerxSurface
					surface={layer.surface}
					lighting={layer.lighting}
					radius={18}
					style={own ? {backgroundColor: rgba(scene.accent, 0.14), borderColor: rgba(scene.accent, 0.32)} : undefined}>
					<View style={styles.bubble}>
						<Text style={styles.text}>{text}</Text>
						<View style={styles.meta}>
							<Text style={styles.time}>{timeLabel}</Text>
							{own ? (
								<Text
									style={[
										styles.delivery,
										delivery === 'failed' ? {color: colors.danger} : delivery === 'sending' ? {color: colors.textFaint} : {color: scene.accent},
									]}>
									{delivery === 'failed' ? '!' : delivery === 'sending' ? '…' : '✓'}
								</Text>
							) : null}
						</View>
					</View>
				</BerxSurface>
				{delivery === 'failed' && onRetry ? (
					<Text accessibilityRole="button" accessibilityLabel="Повторить отправку" onPress={onRetry} style={styles.retry}>
						Повторить
					</Text>
				) : null}
				{onDelete ? (
					<Text
						accessibilityRole="button"
						accessibilityLabel="Удалить сообщение"
						accessibilityState={{busy: deleting === true}}
						onPress={onDelete}
						style={styles.delete}>
						{deleting ? 'Удаляется…' : 'Удалить'}
					</Text>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {paddingHorizontal: spacing.lg, paddingVertical: 3, flexDirection: 'row'},
	rowOwn: {justifyContent: 'flex-end'},
	rowOther: {justifyContent: 'flex-start'},
	bubbleWrap: {maxWidth: '82%', gap: 2},
	bubble: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2},
	text: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * 1.4},
	meta: {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4},
	time: {color: colors.textFaint, fontSize: 11},
	delivery: {fontSize: 11, fontWeight: typography.weightMedium},
	retry: {color: colors.danger, fontSize: typography.sizeXs, textAlign: 'right', minHeight: 44, paddingTop: spacing.md},
	delete: {color: colors.textFaint, fontSize: typography.sizeXs, textAlign: 'right', minHeight: 44, paddingTop: spacing.md},
	deleting: {opacity: 0.5},
});
