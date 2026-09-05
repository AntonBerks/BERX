/**
 * BerxComposer — writing a message or a post.
 *
 * Send is disabled while empty and while a send is in flight, and the
 * field is cleared only after the caller's promise resolves — so a
 * failed send keeps the user's text instead of losing it to an
 * optimistic reset.
 *
 * Typing state is reported through the caller (BERX has a real typing
 * endpoint) and throttled here, so keystrokes do not become one
 * request each.
 */
import {useCallback, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';
import {colors, spacing, typography} from '../tokens';
import {BerxIcon} from '../icons';

export interface BerxComposerProps {
	/** Must resolve only after the server confirms, and reject on failure. */
	onSend: (text: string) => Promise<void>;
	/** Real typing endpoint. Called at most once every 3 seconds. */
	onTyping?: () => void;
	placeholder?: string;
	accessibilityLabel?: string;
	maxLength?: number;
	disabled?: boolean;
	disabledReason?: string;
	/** Attachment control, when the surrounding screen supports real uploads. */
	leading?: React.ReactNode;
	testID?: string;
}

const TYPING_INTERVAL_MS = 3000;

export function BerxComposer({
	onSend,
	onTyping,
	placeholder = 'Сообщение',
	accessibilityLabel = 'Текст сообщения',
	maxLength = 4000,
	disabled,
	disabledReason,
	leading,
	testID,
}: BerxComposerProps) {
	const {scene} = useBerxScene();
	const layer = scene.layers.D4;
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const lastTyping = useRef(0);

	const change = useCallback(
		(next: string) => {
			setText(next);
			if (!onTyping || next.length === 0) return;
			const now = Date.now();
			if (now - lastTyping.current < TYPING_INTERVAL_MS) return;
			lastTyping.current = now;
			onTyping();
		},
		[onTyping],
	);

	const send = useCallback(async () => {
		const value = text.trim();
		if (!value || sending || disabled) return;
		setSending(true);
		setError(null);
		try {
			await onSend(value);
			/* cleared only now — the server has the message */
			setText('');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось отправить');
		} finally {
			setSending(false);
		}
	}, [text, sending, disabled, onSend]);

	const canSend = text.trim().length > 0 && !sending && !disabled;

	return (
		<View testID={testID}>
			{error ? (
				<Text accessibilityLiveRegion="assertive" style={styles.error}>
					{error}
				</Text>
			) : null}
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={26}>
				<View style={styles.row}>
					{leading}
					<TextInput
						value={text}
						onChangeText={change}
						placeholder={disabled ? disabledReason ?? placeholder : placeholder}
						placeholderTextColor={colors.textFaint}
						accessibilityLabel={accessibilityLabel}
						accessibilityState={{disabled: disabled === true}}
						editable={!disabled}
						multiline
						maxLength={maxLength}
						style={styles.input}
					/>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Отправить"
						accessibilityState={{disabled: !canSend, busy: sending}}
						disabled={!canSend}
						onPress={send}
						style={[
							styles.send,
							{
								backgroundColor: canSend ? rgba(scene.accent, 0.2) : 'transparent',
								borderColor: canSend ? rgba(scene.accent, 0.5) : layer.surface.borderColor,
							},
						]}>
						{/* the set's own send mark; ↑ is a typographic arrow whose
						    weight and shape change with the resolved font */}
						<BerxIcon
							name={sending ? 'loading' : 'send'}
							size={18}
							color={canSend ? scene.accent : colors.textFaint}
							decorative
						/>
					</Pressable>
				</View>
			</BerxSurface>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm},
	input: {flex: 1, color: colors.text, fontSize: typography.sizeBase, maxHeight: 120, paddingVertical: spacing.sm, minHeight: 44},
	send: {width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
	error: {color: colors.danger, fontSize: typography.sizeXs, paddingHorizontal: spacing.lg, paddingBottom: 4},
});
