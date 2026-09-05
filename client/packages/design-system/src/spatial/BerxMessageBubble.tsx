/**
 * BerxMessageBubble — one message.
 *
 * Its actions are not printed under it. Every own message used to
 * carry a permanent "Удалить" link with a 44dp target of its own, so
 * a thread of twenty messages was a thread of twenty delete buttons,
 * and half the height of the conversation was controls nobody had
 * asked for. A message's actions belong to the message you are
 * looking at, so selecting one gives it the scene's focus: the thread
 * behind it recedes, the message itself emerges on the focus plane,
 * and its actions appear on a shelf beneath it. Selecting again puts
 * it back.
 *
 * The accessibility action stays where it was — always registered,
 * never dependent on the selection — so a screen reader or switch
 * user reaches delete directly rather than through a state they would
 * have to discover first.
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
import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';
import {BerxFocusTarget} from './BerxFocusTarget';
import {BerxActionShelf} from './BerxActionShelf';
import {colors, spacing, typography} from '../tokens';
import {BerxText} from './BerxText';

export type BerxMessageDelivery = 'sending' | 'sent' | 'failed';

export interface BerxMessageBubbleProps {
	/** The message's own id — what the scene's focus is keyed on. */
	id: string | number;
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
	id,
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
	const [selected, setSelected] = useState(false);
	const retryable = delivery === 'failed' && onRetry !== undefined;
	const actionable = onDelete !== undefined || retryable;

	return (
		<View
			testID={testID}
			accessible
			accessibilityRole="text"
			accessibilityLabel={`${own ? 'Вы' : senderName}: ${text}, ${timeLabel}, ${DELIVERY_LABEL[delivery]}`}
			accessibilityHint={actionable ? 'Нажмите, чтобы показать действия с сообщением' : undefined}
			accessibilityActions={onDelete ? [{name: 'delete', label: 'Удалить сообщение'}] : undefined}
			onAccessibilityAction={(e) => {
				if (e.nativeEvent.actionName === 'delete') onDelete?.();
			}}
			style={[styles.row, own ? styles.rowOwn : styles.rowOther, deleting ? styles.deleting : null]}>
			<BerxFocusTarget id={`message-${id}`} focused={selected} style={styles.bubbleWrap}>
				<Pressable
					disabled={!actionable}
					onPress={() => setSelected((v) => !v)}
					accessibilityRole={actionable ? 'button' : undefined}
					accessibilityState={actionable ? {expanded: selected} : undefined}>
				<BerxSurface
					surface={layer.surface}
					lighting={layer.lighting}
					radius={18}
					style={own ? {backgroundColor: rgba(scene.accent, 0.14), borderColor: rgba(scene.accent, 0.32)} : undefined}>
					<View style={styles.bubble}>
						<BerxText role="body">{text}</BerxText>
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
				</Pressable>
				{/* the message's own actions, on the control plane, only
				    while the message holds the scene's focus */}
				{selected && actionable ? (
					<BerxActionShelf variant="attached" align="start" style={styles.actions}>
						{retryable ? (
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
					</BerxActionShelf>
				) : null}
			</BerxFocusTarget>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {paddingHorizontal: spacing.lg, paddingVertical: 3, flexDirection: 'row'},
	rowOwn: {justifyContent: 'flex-end'},
	rowOther: {justifyContent: 'flex-start'},
	bubbleWrap: {maxWidth: '82%', gap: 2},
	bubble: {paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2},
	meta: {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4},
	time: {color: colors.textFaint, fontSize: 11},
	delivery: {fontSize: 11, fontWeight: typography.weightMedium},
	actions: {marginTop: spacing.xs, alignSelf: 'flex-end'},
	/* the 44dp target stays; it is now on a control that is only there
	   when the message it belongs to is the one being acted on */
	retry: {color: colors.danger, fontSize: typography.sizeSm, minHeight: 44, paddingHorizontal: spacing.sm, textAlignVertical: 'center', lineHeight: 44},
	delete: {color: colors.textDim, fontSize: typography.sizeSm, minHeight: 44, paddingHorizontal: spacing.sm, textAlignVertical: 'center', lineHeight: 44},
	deleting: {opacity: 0.5},
});
