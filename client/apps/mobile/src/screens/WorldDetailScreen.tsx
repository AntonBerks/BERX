/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — World detail. Real actions only, all server-verdict-
 * driven (is_owner/my_status come from the server — see
 * components/OssnApi/v1/worlds.php's own ossn_api_world_json()):
 *   - my_status === 'invited' gets real Accept/Decline;
 *   - my_status === 'not_member' on a public world gets a real Join;
 *   - an accepted non-owner member gets Leave;
 *   - the owner gets Delete World and can attach real existing
 *     places/events/plans/experiences (picked from the same real
 *     api.places()/api.events()/api.myPlans()/api.experiences() lists
 *     every other screen already uses — never a raw numeric-id field).
 * Removing an item is available to the owner or whoever added it.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxWorld, BerxWorldItemType, BerxPlace, BerxEvent, BerxPlan, BerxExperience} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	id: number;
	onBack?: () => void;
}

const ITEM_TYPE_LABEL: Record<BerxWorldItemType, string> = {
	place: 'Место',
	event: 'Событие',
	plan: 'План',
	experience: 'Впечатление',
};

export default function WorldDetailScreen({api, id, onBack}: Props) {
	const [world, setWorld] = useState<BerxWorld | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const [pickingType, setPickingType] = useState<BerxWorldItemType | null>(null);
	const [pickerPlaces, setPickerPlaces] = useState<BerxPlace[]>([]);
	const [pickerEvents, setPickerEvents] = useState<BerxEvent[]>([]);
	const [pickerPlans, setPickerPlans] = useState<BerxPlan[]>([]);
	const [pickerExperiences, setPickerExperiences] = useState<BerxExperience[]>([]);

	const load = useCallback(async () => {
		try {
			const res = await api.getWorld(id);
			setWorld(res.world);
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить мир');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function openPicker(type: BerxWorldItemType) {
		setPickingType(type);
		try {
			if (type === 'place' && pickerPlaces.length === 0) setPickerPlaces((await api.places()).places.slice(0, 20));
			if (type === 'event' && pickerEvents.length === 0) setPickerEvents((await api.events()).events.slice(0, 20));
			if (type === 'plan' && pickerPlans.length === 0) setPickerPlans((await api.myPlans()).plans);
			if (type === 'experience' && pickerExperiences.length === 0) setPickerExperiences((await api.experiences()).experiences);
		} catch {
			// Real, honest degrade — the picker just shows nothing to pick from.
		}
	}

	async function addItem(type: BerxWorldItemType, itemId: number) {
		setBusy(true);
		try {
			await api.addWorldItem(id, type, itemId);
			setPickingType(null);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось добавить в мир');
		} finally {
			setBusy(false);
		}
	}

	async function removeItem(type: BerxWorldItemType, itemId: number) {
		setBusy(true);
		try {
			await api.removeWorldItem(id, type, itemId);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось убрать из мира');
		} finally {
			setBusy(false);
		}
	}

	async function respond(accept: boolean) {
		setBusy(true);
		try {
			await api.respondToWorldInvite(id, accept);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось ответить');
		} finally {
			setBusy(false);
		}
	}

	async function join() {
		setBusy(true);
		try {
			await api.joinWorld(id);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось вступить в мир');
		} finally {
			setBusy(false);
		}
	}

	async function leave() {
		setBusy(true);
		try {
			await api.leaveWorld(id);
			onBack?.();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось покинуть мир');
			setBusy(false);
		}
	}

	async function remove() {
		setBusy(true);
		try {
			await api.deleteWorld(id);
			onBack?.();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось удалить мир');
			setBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !world) return <BerxErrorState message={error ?? 'Мир недоступен'} onRetry={load} />;

	const acceptedMembers = world.members.filter((m: BerxWorld['members'][number]) => m.status === 'accepted');

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title={world.title} onBack={onBack} />
			<BerxFadeIn style={styles.body}>
				<View style={styles.metaRow}>
					<View style={[styles.visBadge, world.visibility === 'public' && styles.visBadgePublic]}>
						<Text style={[styles.visBadgeText, world.visibility === 'public' && styles.visBadgeTextPublic]}>
							{world.visibility === 'public' ? 'Открытый мир' : 'Закрытый мир'}
						</Text>
					</View>
					{world.is_temporary && world.expires_at ? (
						<Text style={styles.expiry}>до {new Date(world.expires_at * 1000).toLocaleDateString('ru-RU')}</Text>
					) : null}
					<Text style={styles.owner}>Создатель: {world.owner_username ?? `#${world.owner_guid}`}</Text>
				</View>

				{world.description ? <Text style={styles.description}>{world.description}</Text> : null}

				{world.my_status === 'invited' ? (
					<View style={styles.actions}>
						<BerxButton label="Отклонить" variant="secondary" onPress={() => respond(false)} disabled={busy} />
						<BerxButton label="Присоединиться" onPress={() => respond(true)} disabled={busy} />
					</View>
				) : null}
				{world.my_status === 'not_member' && world.visibility === 'public' ? (
					<BerxButton label="Вступить в мир" onPress={join} loading={busy} fullWidth />
				) : null}

				<Text style={styles.sectionTitle}>Участники ({acceptedMembers.length})</Text>
				<View style={styles.memberList}>
					{acceptedMembers.map((m: BerxWorld['members'][number]) => (
						<View key={m.user_guid} style={styles.memberRow}>
							<BerxAvatar iconUrl={m.icon} fallbackInitial={(m.username ?? '#').charAt(0)} size={32} />
							<Text style={styles.memberName} numberOfLines={1}>{m.username ?? `#${m.user_guid}`}</Text>
							{m.role === 'owner' ? <Text style={styles.ownerTag}>создатель</Text> : null}
						</View>
					))}
				</View>

				<Text style={styles.sectionTitle}>Содержимое ({world.items.length})</Text>
				<View style={styles.itemList}>
					{world.items.length === 0 ? (
						<Text style={styles.hint}>Пока ничего не добавлено.</Text>
					) : (
						world.items.map((item: BerxWorld['items'][number]) => (
							<View key={`${item.item_type}-${item.item_id}`} style={styles.itemRow}>
								<View style={styles.itemMain}>
									<Text style={styles.itemType}>{ITEM_TYPE_LABEL[item.item_type]}</Text>
									<Text style={styles.itemTitle} numberOfLines={1}>{item.title ?? `#${item.item_id}`}</Text>
								</View>
								<Pressable onPress={() => removeItem(item.item_type, item.item_id)} disabled={busy}>
									<Text style={styles.removeLink}>убрать</Text>
								</Pressable>
							</View>
						))
					)}
				</View>

				{(world.my_status === 'accepted' || world.my_status === 'owner') ? (
					<>
						<Text style={styles.sectionTitle}>Добавить в мир</Text>
						<View style={styles.chipWrap}>
							{(Object.keys(ITEM_TYPE_LABEL) as BerxWorldItemType[]).map((t) => (
								<Pressable key={t} style={[styles.chip, pickingType === t && styles.chipActive]} onPress={() => openPicker(t)}>
									<Text style={[styles.chipText, pickingType === t && styles.chipTextActive]}>{ITEM_TYPE_LABEL[t]}</Text>
								</Pressable>
							))}
						</View>
						{pickingType === 'place' ? (
							<View style={styles.chipWrap}>
								{pickerPlaces.map((p: BerxPlace) => (
									<Pressable key={p.guid} style={styles.chip} onPress={() => addItem('place', p.guid)} disabled={busy}>
										<Text style={styles.chipText} numberOfLines={1}>{p.title}</Text>
									</Pressable>
								))}
							</View>
						) : null}
						{pickingType === 'event' ? (
							<View style={styles.chipWrap}>
								{pickerEvents.map((e: BerxEvent) => (
									<Pressable key={e.guid} style={styles.chip} onPress={() => addItem('event', e.guid)} disabled={busy}>
										<Text style={styles.chipText} numberOfLines={1}>{e.title}</Text>
									</Pressable>
								))}
							</View>
						) : null}
						{pickingType === 'plan' ? (
							<View style={styles.chipWrap}>
								{pickerPlans.map((p: BerxPlan) => (
									<Pressable key={p.id} style={styles.chip} onPress={() => addItem('plan', p.id)} disabled={busy}>
										<Text style={styles.chipText} numberOfLines={1}>{p.title}</Text>
									</Pressable>
								))}
							</View>
						) : null}
						{pickingType === 'experience' ? (
							<View style={styles.chipWrap}>
								{pickerExperiences.map((ex: BerxExperience) => (
									<Pressable key={ex.id} style={styles.chip} onPress={() => addItem('experience', ex.id)} disabled={busy}>
										<Text style={styles.chipText} numberOfLines={1}>{ex.title}</Text>
									</Pressable>
								))}
							</View>
						) : null}
					</>
				) : null}

				{world.is_owner ? (
					<BerxButton label="Удалить мир" variant="secondary" onPress={remove} disabled={busy} fullWidth />
				) : world.my_status === 'accepted' ? (
					<BerxButton label="Покинуть мир" variant="secondary" onPress={leave} disabled={busy} fullWidth />
				) : null}
			</BerxFadeIn>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	body: {padding: spacing.lg, gap: spacing.md},
	metaRow: {gap: 4, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center'},
	visBadge: {paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface},
	visBadgePublic: {backgroundColor: colors.accentSoft},
	visBadgeText: {fontSize: typography.sizeXs, color: colors.textFaint},
	visBadgeTextPublic: {color: colors.accent, fontWeight: typography.weightMedium},
	expiry: {color: colors.textFaint, fontSize: typography.sizeXs},
	owner: {color: colors.textFaint, fontSize: typography.sizeXs, width: '100%', marginTop: 2},
	description: {color: colors.text, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * typography.lineHeightBase},
	actions: {flexDirection: 'row', gap: spacing.md},
	sectionTitle: {color: colors.textFaint, fontSize: typography.sizeXs, fontWeight: typography.weightBold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm},
	memberList: {gap: spacing.sm},
	memberRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	memberName: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
	ownerTag: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	itemList: {gap: spacing.sm},
	itemRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	itemMain: {flex: 1, flexDirection: 'row', gap: spacing.xs, alignItems: 'baseline'},
	itemType: {color: colors.textFaint, fontSize: typography.sizeXs},
	itemTitle: {flex: 1, color: colors.text, fontSize: typography.sizeSm},
	removeLink: {color: colors.danger, fontSize: typography.sizeXs},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
});
