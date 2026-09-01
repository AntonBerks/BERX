/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.communityMembers() (components/OssnApi/v1/
 * communities.php), wraps OssnGroup::getMembers() verbatim.
 *
 * MAX BUILD — closes a real gap: api.addCommunityModerator() was
 * always a real, working client method (real POST route in
 * communities.php, owner/admin-only server-side) with zero UI
 * caller — CommunityModeratorsScreen only ever offered "Снять"
 * (removeCommunityModerator), so a real moderator could be revoked
 * but never actually appointed from the app. `moderatorGuids` is
 * fetched from the real /communities/{guid}/moderators list (owner-
 * only, best-effort) so the button correctly reads "Уже модератор"
 * instead of re-offering an action that would just insert a
 * duplicate relation row server-side.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, FlatList, Image, Pressable, Alert, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunityMember} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	guid: number;
	isOwner?: boolean;
	onOpenProfile: (username: string) => void;
	/** MAX BUILD — real Transfer Ownership (OssnGroup::changeOwner()). Called after a successful transfer since this screen's own `isOwner` prop is a static route param that can't refresh itself mid-screen — see this file's own comment on the transfer flow. */
	onTransferred?: () => void;
	onBack?: () => void;
}

export default function CommunityMembersScreen({api, guid, isOwner, onOpenProfile, onTransferred, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxCommunityMember[]>([]);
	const [moderatorGuids, setModeratorGuids] = useState<Set<number>>(new Set());
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.communityMembers(guid);
			setItems(res.members);
			if (isOwner) {
				// Owner-only endpoint — best-effort, never blocks the members list itself.
				api.communityModerators(guid).then((m) => setModeratorGuids(new Set(m.moderators.map((x) => x.guid)))).catch(() => undefined);
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить участников');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, guid, isOwner]);

	useEffect(() => {
		load();
	}, [load]);

	async function assignModerator(userGuid: number) {
		setBusyGuid(userGuid);
		try {
			await api.addCommunityModerator(guid, userGuid);
			setModeratorGuids((prev: Set<number>) => new Set(prev).add(userGuid));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось назначить модератора');
		} finally {
			setBusyGuid(null);
		}
	}

	/** MAX BUILD — real Transfer Ownership, owner-only, server re-checks regardless. Pops back after success — this screen's own isOwner is a static param that can't reflect "I'm no longer owner" mid-screen. */
	function confirmTransfer(member: BerxCommunityMember) {
		Alert.alert(
			'Передать владение?',
			`${member.fullname} станет владельцем сообщества, вы — обычным участником. Это действие нельзя отменить.`,
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Передать',
					style: 'destructive',
					onPress: async () => {
						setBusyGuid(member.guid);
						try {
							await api.transferCommunityOwnership(guid, member.guid);
							if (onTransferred) onTransferred();
							else onBack?.();
						} catch (e) {
							setError(e instanceof Error ? e.message : 'Не удалось передать владение');
						} finally {
							setBusyGuid(null);
						}
					},
				},
			]
		);
	}

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title={`Участники (${items.length})`} onBack={onBack} />
			{error ? <Text style={styles.errorBanner}>{error}</Text> : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Участников пока нет" />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(m: BerxCommunityMember) => String(m.guid)}
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
						renderItem={({item}: {item: BerxCommunityMember}) => (
							<Pressable style={styles.row} onPress={() => onOpenProfile(item.username)}>
								<Image source={{uri: item.icon}} style={styles.avatar} />
								<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
								{item.is_owner ? (
									<Text style={styles.ownerBadge}>Владелец</Text>
								) : isOwner && moderatorGuids.has(item.guid) ? (
									<Text style={styles.moderatorBadge}>Модератор</Text>
								) : isOwner ? (
									<View style={styles.ownerActions}>
										<BerxButton
											label="Сделать модератором"
											variant="secondary"
											loading={busyGuid === item.guid}
											onPress={() => assignModerator(item.guid)}
										/>
										<Pressable onPress={() => confirmTransfer(item)} disabled={busyGuid === item.guid} hitSlop={8}>
											<Text style={styles.transferLink}>Передать владение</Text>
										</Pressable>
									</View>
								) : null}
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
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	ownerBadge: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
	moderatorBadge: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold},
	ownerActions: {alignItems: 'flex-end', gap: 4},
	transferLink: {fontSize: typography.sizeXs, color: colors.danger},
	errorBanner: {fontSize: typography.sizeSm, color: colors.danger, paddingHorizontal: spacing.md, paddingTop: spacing.sm},
});
