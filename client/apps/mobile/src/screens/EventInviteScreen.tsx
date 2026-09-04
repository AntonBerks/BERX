/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.friends() (new — components/OssnApi/v1/friends.php,
 * added this batch specifically because this screen needs it) +
 * api.inviteToEvent() (components/OssnApi/v1/events.php). Only real
 * friends are listed — nobody can be invited who the caller isn't
 * actually connected to; the server re-checks this regardless.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface EventInviteScreenProps {
	api: BerxApiClient;
	guid: number;
	onBack?: () => void;
}

export default function EventInviteScreen(props: EventInviteScreenProps) {
	return (
		<BerxFamilyScene family="EVENTS" testID="event-invite">
			<EventInviteScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function EventInviteScreenBody({api, guid, onBack}: EventInviteScreenProps) {
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [invited, setInvited] = useState<Set<number>>(new Set());
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

	async function invite(friendGuid: number) {
		setBusyGuid(friendGuid);
		try {
			await api.inviteToEvent(guid, friendGuid);
			setInvited((prev: Set<number>) => new Set(prev).add(friendGuid));
		} catch (e) {
			// Real server rejection (already going / already invited /
			// event ended) surfaces as-is — never silently marked invited.
			setError(e instanceof Error ? e.message : 'Не удалось отправить приглашение');
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error && friends.length === 0) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Пригласить друзей" onBack={onBack} />
			{friends.length === 0 ? (
				<BerxEmptyState title="Друзей пока нет" subtitle="Как только у вас появятся друзья на BERX, вы сможете приглашать их на события." />
			) : (
				<FlatList
					data={friends}
					keyExtractor={(f: BerxFriend) => String(f.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxFriend}) => (
						<View style={styles.row}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
							{invited.has(item.guid) ? (
								<Text style={styles.invitedLabel}>Приглашён</Text>
							) : (
								<BerxButton label="Пригласить" loading={busyGuid === item.guid} onPress={() => invite(item.guid)} />
							)}
						</View>
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
	invitedLabel: {fontSize: typography.sizeXs, color: colors.textFaint},
});
