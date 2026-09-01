/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX WORLD — real @mention + #hashtag rendering. Formerly
 * BerxMentionText (mentions only); renamed once hashtags became a
 * second real thing this component highlights, rather than bolting
 * hashtag support onto a component whose name no longer described it.
 *
 * Splits post/comment text on the same real patterns the server
 * resolves both with: @mentions match components/OssnApi/ossn_com.php's
 * own ossn_api_extract_mentions() (alphanumeric-only usernames,
 * confirmed against OssnUser::save()'s real validation); #hashtags
 * match classes/OssnHashtags.php's own extractTags() (Unicode letters/
 * numbers/underscore — this is a Russian-language app, Cyrillic tags
 * are real, not an edge case). Both are always tappable here — this
 * component doesn't re-verify server-side state (a mention only
 * really notified a real friend at post time; a hashtag search
 * simply returns whatever's real for that tag right now); a bad or
 * empty result is handled by whatever the destination screen already
 * does for one, same as any other real link in this app.
 */
import type {ReactNode} from 'react';
import {Text, StyleSheet, TextStyle} from 'react-native';
import {colors, typography} from '@berx/design-system/tokens';

interface Props {
	text: string;
	onOpenProfile: (username: string) => void;
	onOpenHashtag?: (tag: string) => void;
	style?: TextStyle | TextStyle[];
}

const TOKEN_RE = /([@#][\p{L}\p{N}_]+)/gu;

export function BerxRichText({text, onOpenProfile, onOpenHashtag, style}: Props) {
	if (!text.includes('@') && !text.includes('#')) {
		// The common case — plain text, no @/# at all — skips the regex
		// entirely and renders exactly like a plain Text always did.
		return <Text style={style}>{text}</Text>;
	}

	const parts: ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let i = 0;
	TOKEN_RE.lastIndex = 0;
	while ((match = TOKEN_RE.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index));
		}
		const token = match[1];
		const body = token.slice(1);
		if (token.charAt(0) === '@') {
			parts.push(
				<Text key={`tok-${i++}`} style={styles.token} onPress={() => onOpenProfile(body)}>
					{token}
				</Text>
			);
		} else if (onOpenHashtag) {
			parts.push(
				<Text key={`tok-${i++}`} style={styles.token} onPress={() => onOpenHashtag(body)}>
					{token}
				</Text>
			);
		} else {
			parts.push(token);
		}
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return <Text style={style}>{parts}</Text>;
}

const styles = StyleSheet.create({
	token: {color: colors.accent, fontWeight: typography.weightMedium},
});
