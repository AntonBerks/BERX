/**
 * BERX WORLD — real @mention autocomplete, as a single reusable
 * component instead of duplicated logic per composer. Sourced from
 * the caller's own real friend list (api.friends()) because
 * server-side mentions are friends-only too (see
 * ossn_api_extract_mentions() in components/OssnApi/ossn_com.php) —
 * this never suggests someone a mention wouldn't actually reach or
 * notify. First built inline in CreatePostScreen.tsx, then extracted
 * here so PostDetailScreen's comment composer (comments support the
 * exact same real @mention notification path) gets it too without
 * copy-pasting the word-boundary logic a second time.
 *
 * Real word-boundary detection tracks the TextInput's own selection
 * (controlled via onSelectionChange) and looks for an "@partial"
 * token immediately before the cursor — not a naive whole-text
 * substring search, so it only triggers while actually mid-mention.
 */
import {useState, useMemo} from 'react';
import {View, Text, Pressable, StyleSheet, TextInputProps, NativeSyntheticEvent, TextInputSelectionChangeEventData} from 'react-native';
import {spacing, radius, typography} from '../tokens';
import {BerxInput} from './BerxInput';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

interface MentionCandidate {
	guid: number;
	username: string;
	fullname: string;
}

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'selection' | 'onSelectionChange'> {
	value: string;
	onChangeText: (text: string) => void;
	friends: MentionCandidate[];
}

function activeMentionQuery(value: string, cursor: number): string | null {
	const before = value.slice(0, cursor);
	const match = before.match(/(?:^|[\s\n])@([a-zA-Z0-9]{0,30})$/);
	return match ? match[1] : null;
}

export function BerxMentionInput({value, onChangeText, friends, ...rest}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [selection, setSelection] = useState<{start: number; end: number}>({start: 0, end: 0});

	const mentionQuery = activeMentionQuery(value, selection.start);
	const matches: MentionCandidate[] =
		mentionQuery === null
			? []
			: friends
					.filter((f: MentionCandidate) => mentionQuery === '' || f.username.toLowerCase().startsWith(mentionQuery.toLowerCase()) || f.fullname.toLowerCase().startsWith(mentionQuery.toLowerCase()))
					.slice(0, 6);

	function insertMention(username: string) {
		const cursor = selection.start;
		const before = value.slice(0, cursor);
		const atIndex = before.lastIndexOf('@');
		if (atIndex < 0) return;
		const newBefore = before.slice(0, atIndex) + '@' + username + ' ';
		onChangeText(newBefore + value.slice(cursor));
		setSelection({start: newBefore.length, end: newBefore.length});
	}

	return (
		<View>
			<BerxInput
				{...rest}
				value={value}
				onChangeText={onChangeText}
				onSelectionChange={(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => setSelection(e.nativeEvent.selection)}
				selection={selection}
			/>
			{matches.length > 0 ? (
				<View style={styles.mentionBox}>
					{matches.map((f: MentionCandidate) => (
						<Pressable key={f.guid} style={styles.mentionRow} onPress={() => insertMention(f.username)}>
							<Text style={styles.mentionName}>{f.fullname || f.username}</Text>
							<Text style={styles.mentionUsername}>@{f.username}</Text>
						</Pressable>
					))}
				</View>
			) : null}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	mentionBox: {backgroundColor: colors.glass1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden', marginTop: spacing.xs},
	mentionRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	mentionName: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	mentionUsername: {color: colors.textFaint, fontSize: typography.sizeXs},
});
