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
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunityMember} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	guid: number;
	isOwner?: boolean;
	onOpenProfile: (username: string) => void;
	onBack?: () => void;
}

export default function CommunityMembersScreen({api, guid, isOwner, onOpenProfile, onBack}: Props) {
	const [items, setItems] = useState<BerxCommunityMember[]>([]);
	const [moderatorGuids, setModeratorGuids] = useState<Set<number>>(new Set());
	const [loading, setLoading] = useState(true);
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

	if (loading) return <BerxLoadingState />;
	if (error && items.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title={`Участники (${items.length})`} onBack={onBack} />
			{error ? <Text style={styles.errorBanner}>{error}</Text> : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Участников пока нет" />
			) : (
				<FlatList
					data={items}
					keyExtractor={(m: BerxCommunityMember) => String(m.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCommunityMember}) => (
						<Pressable style={styles.row} onPress={() => onOpenProfile(item.username)}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
							{item.is_owner ? (
								<Text style={styles.ownerBadge}>Владелец</Text>
							) : isOwner && moderatorGuids.has(item.guid) ? (
								<Text style={styles.moderatorBadge}>Модератор</Text>
							) : isOwner ? (
								<BerxButton
									label="Сделать модератором"
									variant="secondary"
									loading={busyGuid === item.guid}
									onPress={() => assignModerator(item.guid)}
								/>
							) : null}
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	ownerBadge: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
	moderatorBadge: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold},
	errorBanner: {fontSize: typography.sizeSm, color: colors.danger, paddingHorizontal: spacing.md, paddingTop: spacing.sm},
});
