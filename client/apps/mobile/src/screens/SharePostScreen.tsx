/**
 * BERX WORLD — real "share post to a conversation". Same real
 * friend-picker shape as EventInviteScreen.tsx (api.friends(), same
 * per-row busy/done state), but the real action is
 * api.sendMessage(..., sharedPostGuid) — the post rides along the
 * exact same real entity-metadata mechanism a message attachment
 * already uses (see conversations.php's own comment), re-verified
 * server-side against the caller's own real visibility before it's
 * ever allowed to send. No client-side trust in what's "shareable".
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFriend} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	postGuid: number;
	onBack?: () => void;
}

export default function SharePostScreen({api, postGuid, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState<Set<number>>(new Set());
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.friends();
			setFriends(res.friends);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить друзей');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function shareTo(friendGuid: number) {
		setBusyGuid(friendGuid);
		try {
			await api.sendMessage(friendGuid, 'Поделился(-ась) постом', undefined, undefined, postGuid);
			setSent((prev: Set<number>) => new Set(prev).add(friendGuid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось отправить');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && friends.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Поделиться постом" onBack={onBack} />
			{friends.length === 0 ? (
				<BerxEmptyState title="Друзей пока нет" subtitle="Как только у вас появятся друзья на BERX, вы сможете делиться постами с ними в сообщениях." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={friends}
						keyExtractor={(f: BerxFriend) => String(f.guid)}
						contentContainerStyle={styles.list}
						renderItem={({item}: {item: BerxFriend}) => (
							<View style={styles.row}>
								<Image source={{uri: item.icon}} style={styles.avatar} />
								<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
								{sent.has(item.guid) ? (
									<Text style={styles.sentLabel}>Отправлено</Text>
								) : (
									<BerxButton label="Отправить" loading={busyGuid === item.guid} onPress={() => shareTo(item.guid)} />
								)}
							</View>
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
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	sentLabel: {fontSize: typography.sizeXs, color: colors.textFaint},
});
