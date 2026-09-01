/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real Post Drafts (see classes/OssnPostDrafts.php's own
 * header). Real data: api.drafts()/deleteDraft() (components/OssnApi/
 * v1/posts.php). Opening a draft hands it to CreatePostScreen for
 * editing/publishing — this screen itself never publishes directly,
 * to avoid a second, divergent publish path from CreatePostScreen's
 * own (which also handles media attach, which a draft never carries).
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPostDraft} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenDraft: (draft: BerxPostDraft) => void;
	onBack?: () => void;
}

export default function MyDraftsScreen({api, onOpenDraft, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxPostDraft[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.drafts();
			setItems(res.drafts);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить черновики');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleDelete(id: number) {
		setBusyId(id);
		try {
			await api.deleteDraft(id);
			setItems((prev: BerxPostDraft[]) => prev.filter((d: BerxPostDraft) => d.id !== id));
		} catch {
			// list stays as-is on failure — never optimistically removed before the server confirms
		} finally {
			setBusyId(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Черновики" onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Черновиков нет" subtitle="Сохраните пост как черновик со страницы создания поста." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(d: BerxPostDraft) => String(d.id)}
						contentContainerStyle={styles.list}
						refreshControl={
							<RefreshControl
								refreshing={refreshing}
								onRefresh={() => {
									setRefreshing(true);
									load();
								}}
								tintColor={colors.accent}
							/>
						}
						renderItem={({item}: {item: BerxPostDraft}) => (
							<Pressable style={styles.card} onPress={() => onOpenDraft(item)}>
								<Text style={styles.text} numberOfLines={3}>{item.text}</Text>
								<View style={styles.rowEnd}>
									<Text style={styles.time}>{relativeTimeLabel(item.time_updated)}</Text>
									<Pressable onPress={() => handleDelete(item.id)} hitSlop={8} disabled={busyId === item.id}>
										<Text style={styles.remove}>{busyId === item.id ? '…' : 'Удалить'}</Text>
									</Pressable>
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	card: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, marginBottom: spacing.sm},
	text: {fontSize: typography.sizeBase, color: colors.white},
	rowEnd: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs},
	time: {fontSize: typography.sizeXs, color: colors.textFaint},
	remove: {fontSize: typography.sizeSm, color: colors.danger},
});
