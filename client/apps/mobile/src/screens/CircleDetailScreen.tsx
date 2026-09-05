/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getCircle()/addCircleMember()/removeCircleMember()
 * (components/OssnApi/v1/circles.php). The "add" picker is sourced
 * from api.friends() (real, existing this session) filtered to
 * exclude people already in the circle — never an arbitrary user
 * search, since the server would reject a non-friend anyway.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircleDetail, BerxCircleMember, BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface CircleDetailScreenProps {
	api: BerxApiClient;
	id: number;
	onBack?: () => void;
}

export default function CircleDetailScreen(props: CircleDetailScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" atmosphereKind="community" testID="circle-detail">
			<CircleDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CircleDetailScreenBody({api, id, onBack}: CircleDetailScreenProps) {
	/* the rule between two entries is the structure plane's own edge:
	   a fixed grey hairline belongs to no plane and does not change
	   with the colour world */
	const dividerColor = useBerxScene().scene.layers.D2.surface.borderColor;
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

	/* The way back stays on screen while the scene is loading and after
	   it fails. It used to be inside the branch that only rendered once
	   the data had arrived, so an error left the person on a screen with
	   no exit — the dead end the archive forbids, on a screen reached by
	   a push. The name arrives when the data does. */
	const header = <BerxHeader title={circle?.name} onBack={onBack} />;

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error || !circle)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error ?? 'Круг не найден'} onRetry={load} />
			</View>
		);

	const memberGuids = new Set(circle.members.map((m: BerxCircleMember) => m.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !memberGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			{header}
			<View style={styles.toolbar}>
				<Pressable
					style={styles.toggleBtn}
					accessibilityRole="button"
					accessibilityState={{expanded: showPicker}}
					accessibilityLabel={showPicker ? 'Скрыть список друзей' : 'Добавить друга в круг'}
					onPress={() => setShowPicker(!showPicker)}>
					<BerxText role="label" emphasis="accent">{showPicker ? 'Скрыть список друзей' : 'Добавить друга'}</BerxText>
				</Pressable>
			</View>

			{showPicker ? (
				availableFriends.length === 0 ? (
					<BerxText role="meta" emphasis="tertiary" style={styles.hint}>Все друзья уже в этом круге.</BerxText>
				) : (
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={availableFriends}
						keyExtractor={(f: BerxFriend) => String(f.guid)}
						contentContainerStyle={styles.pickerRow}
						renderItem={({item}: {item: BerxFriend}) => (
							<Pressable
								style={styles.pickerItem}
								accessibilityRole="button"
								accessibilityLabel={`Добавить ${item.fullname} в круг`}
								accessibilityState={{disabled: busyGuid === item.guid}}
								onPress={() => addMember(item.guid)}
								disabled={busyGuid === item.guid}>
								<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
								<BerxText role="meta" emphasis="secondary" style={styles.pickerName} numberOfLines={1}>{item.fullname}</BerxText>
							</Pressable>
						)}
					/>
				)
			) : null}

			{circle.members.length === 0 ? (
				<BerxEmptyState title="В круге пока никого нет" subtitle="Добавьте друзей выше." />
			) : (
				<BerxSceneList rows
					data={circle.members}
					keyExtractor={(m: BerxCircleMember) => String(m.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCircleMember}) => (
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<View style={[styles.row, {borderBottomColor: dividerColor}]}>
							<Image source={{uri: item.icon}} style={styles.avatar} />
							<BerxText role="callout" style={styles.name} numberOfLines={1}>{item.fullname}</BerxText>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={`Убрать ${item.fullname} из круга`}
								accessibilityState={{disabled: busyGuid === item.guid}}
								onPress={() => removeMember(item.guid)}
								hitSlop={8}
								disabled={busyGuid === item.guid}>
								<BerxIcon name="close" size={15} decorative />
							</Pressable>
						</View>
						</BerxSpatialCard>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	toolbar: {padding: spacing.md},
	toggleBtn: {alignSelf: 'flex-start'},
	hint: {paddingHorizontal: spacing.md, paddingBottom: spacing.sm},
	pickerRow: {paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {marginTop: 4},
	list: {paddingBottom: spacing.xxxl},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1},
	remove: {fontSize: typography.sizeSm, color: colors.textFaint, padding: 4},
});
