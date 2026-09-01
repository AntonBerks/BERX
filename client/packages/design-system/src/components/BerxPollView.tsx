/**
 * BERX WORLD — real Post Polls, rendered once and reused everywhere a
 * post can appear (FeedScreen, PostDetailScreen) — same reuse
 * rationale as BerxMentionInput.tsx. Before a real vote (my_vote is
 * null and the poll hasn't ended), each option is a tappable choice;
 * after voting (or once ended), it becomes a real result — a live
 * percentage bar per option from the server's own counts, never
 * computed from a guess. Counts and my_vote always come from the
 * server's own fresh response (see api.votePoll()'s own comment) —
 * this component never predicts a result client-side.
 */
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, radius, typography} from '../tokens';
import type {BerxPostPoll} from '@berx/api/types';

interface Props {
	poll: BerxPostPoll;
	onVote: (optionIndex: number) => void;
	voting?: boolean;
}

export function BerxPollView({poll, onVote, voting}: Props) {
	const showResults = poll.my_vote !== null || poll.is_ended;

	return (
		<View style={styles.wrap}>
			{poll.options.map((option, i) => {
				const count = poll.counts[i] ?? 0;
				const pct = poll.total > 0 ? Math.round((count / poll.total) * 100) : 0;
				const mine = poll.my_vote === i;
				if (!showResults) {
					return (
						<Pressable key={i} style={styles.optionButton} disabled={!!voting} onPress={() => onVote(i)}>
							<Text style={styles.optionButtonText} numberOfLines={2}>{option}</Text>
						</Pressable>
					);
				}
				return (
					<View key={i} style={styles.resultRow}>
						<View style={styles.resultBarTrack}>
							<View style={[styles.resultBarFill, {width: `${pct}%`}, mine && styles.resultBarFillMine]} />
						</View>
						<View style={styles.resultLabelRow}>
							<Text style={[styles.resultLabel, mine && styles.resultLabelMine]} numberOfLines={2}>
								{mine ? '✓ ' : ''}{option}
							</Text>
							<Text style={styles.resultPct}>{pct}%</Text>
						</View>
					</View>
				);
			})}
			<Text style={styles.totalLabel}>
				{poll.total} {poll.total === 1 ? 'голос' : 'голосов'}
				{poll.is_ended ? ' · опрос завершён' : ''}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: {gap: spacing.xs, marginTop: spacing.sm},
	optionButton: {borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.glass1},
	optionButtonText: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	resultRow: {gap: 2},
	resultBarTrack: {height: 6, borderRadius: 3, backgroundColor: colors.glass2, overflow: 'hidden'},
	resultBarFill: {height: 6, borderRadius: 3, backgroundColor: colors.borderSoft},
	resultBarFillMine: {backgroundColor: colors.accent},
	resultLabelRow: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm},
	resultLabel: {flex: 1, color: colors.textDim, fontSize: typography.sizeSm},
	resultLabelMine: {color: colors.accent, fontWeight: typography.weightMedium},
	resultPct: {color: colors.textFaint, fontSize: typography.sizeXs},
	totalLabel: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: 2},
});
