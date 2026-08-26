/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getCircle()/addCircleMember()/removeCircleMember()
 * (components/OssnApi/v1/circles.php). The "add" picker is sourced
 * from api.friends() (real, existing this session) filtered to
 * exclude people already in the circle — never an arbitrary user
 * search, since the server would reject a non-friend anyway.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircleDetail, BerxCircleMember, BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	id: number;
	onBack?: () => void;
}

export default function CircleDetailScreen({api, id, onBack}: Props) {
	const [circle, setCircle] = useState<BerxCircleDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const [showPicker, setShowPicker] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [c, f] = await Promise.all([api.getCircle(id), api.friends()]);
			setCircle(c);
			setFriends(f.friends);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Круг недоступен');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function addMember(guid: number) {
		if (!circle) return;
		setBusyGuid(guid);
		try {
			await api.addCircleMember(circle.id, guid);
			await load();
		} catch {
			// server rejects non-friends / duplicates with a real error — nothing optimistic here
		} finally {
			setBusyGuid(null);
		}
	}

	async function removeMember(guid: number) {
		if (!circle) return;
		setBusyGuid(guid);
		try {
			await api.removeCircleMember(circle.id, guid);
			setCircle({...circle, members: circle.members.filter((m: BerxCircleMember) => m.guid !== guid)});
		} catch {
			// list stays as-is on failure
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !circle) return <BerxErrorState message={error ?? 'Круг не найден'} onRetry={load} />;

	const memberGuids = new Set(circle.members.map((m: BerxCircleMember) => m.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !memberGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			<BerxHeader title={circle.name} onBack={onBack} />
			<View style={styles.toolbar}>
				<Pressable style={styles.toggleBtn} onPress={() => setShowPicker(!showPicker)}>
					<Text style={styles.toggleBtnText}>{showPicker ? 'Скрыть список друзей' : 'Добавить друга'}</Text>
				</Pressable>
			</View>

			{showPicker ? (
				availableFriends.length === 0 ? (
					<Text style={styles.hint}>Все друзья уже в этом круге.</Text>
				) : (
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={availableFriends}
						keyExtractor={(f: BerxFriend) => String(f.guid)}
						contentContainerStyle={styles.pickerRow}
						renderItem={({item}: {item: BerxFriend}) => (
							<Pressable style={styles.pickerItem} onPress={() => addMember(item.guid)} disabled={busyGuid === item.guid}>
								<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
								<Text style={styles.pickerName} numberOfLines={1}>{item.fullname}</Text>
							</Pressable>
						)}
					/>
				)
			) : null}

			{circle.members.length === 0 ? (
				<BerxEmptyState title="В круге пока никого нет" subtitle="Добавьте друзей выше." />
			) : (
				<FlatList
					data={circle.members}
					keyExtractor={(m: BerxCircleMember) => String(m.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCircleMember}) => (
						<View style={styles.row}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<Text style={styles.name} numberOfLines={1}>{item.fullname}</Text>
							<Pressable onPress={() => removeMember(item.guid)} hitSlop={8} disabled={busyGuid === item.guid}>
								<Text style={styles.remove}>✕</Text>
							</Pressable>
						</View>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md},
	toggleBtn: {alignSelf: 'flex-start'},
	toggleBtnText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
