/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX WORLD — real @mention rendering. Splits post/comment text on
 * the same real pattern the server resolves mentions with
 * (components/OssnApi/ossn_com.php's own ossn_api_extract_mentions()
 * — usernames are alphanumeric-only, confirmed against
 * OssnUser::save()'s real validation before either side picked a
 * pattern). A highlighted @handle is always tappable here — this
 * component doesn't re-verify whether a real notification actually
 * fired for it (that already happened server-side, friends-only, at
 * post time); tapping a bad or nonexistent handle is handled by
 * whatever onOpenProfile already does for one, same as any other
 * profile link in this app.
 */
import type {ReactNode} from 'react';
import {Text, StyleSheet, TextStyle} from 'react-native';
import {colors, typography} from '@berx/design-system/tokens';

interface Props {
	text: string;
	onOpenProfile: (username: string) => void;
	style?: TextStyle | TextStyle[];
}

const MENTION_RE = /@([a-zA-Z0-9]+)/g;

export function BerxMentionText({text, onOpenProfile, style}: Props) {
	if (!text.includes('@')) {
		// The common case — no mention syntax at all — skips the regex
		// entirely and renders exactly like a plain Text always did.
		return <Text style={style}>{text}</Text>;
	}

	const parts: ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let i = 0;
	MENTION_RE.lastIndex = 0;
	while ((match = MENTION_RE.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index));
		}
		const username = match[1];
		parts.push(
			<Text key={`mention-${i++}`} style={styles.mention} onPress={() => onOpenProfile(username)}>
				@{username}
			</Text>
		);
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return <Text style={style}>{parts}</Text>;
}

const styles = StyleSheet.create({
	mention: {color: colors.accent, fontWeight: typography.weightMedium},
});
