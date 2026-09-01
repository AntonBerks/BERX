/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — create a Plan. Both place and time are genuinely
 * optional (unlike CreateEventScreen — see api.createPlan()'s own
 * header) — a Plan can exist as "who's in?" before either is decided,
 * that's the entire point of the object. When a time IS wanted, this
 * reuses CreateEventScreen's own honest "tomorrow 19:00" stand-in
 * (no real date/time picker is installable/verifiable in this
 * sandbox — same disclosed constraint, not duplicated as a new gap).
 *
 * Invitees are real friends only (server-enforced — OssnPlans::
 * createPlan() silently drops anyone who isn't a real
 * OssnUser::isFriend() match, same restriction OssnEvents::invite()
 * already uses) — the friend chip list here is the same real
 * api.friends() every other invite flow in this app already calls.
 */
import {useEffect, useState, useMemo} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxFriend} from '@berx/api/types';
import {spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
}

function defaultStart(): {label: string; unix: number} {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	d.setHours(19, 0, 0, 0);
	return {label: d.toLocaleString('ru-RU'), unix: Math.floor(d.getTime() / 1000)};
}

export default function CreatePlanScreen({api, onCreated, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [title, setTitle] = useState('');
	const [notes, setNotes] = useState('');
	const [places, setPlaces] = useState<BerxPlace[]>([]);
	const [placeGuid, setPlaceGuid] = useState<number | undefined>(undefined);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [inviteGuids, setInviteGuids] = useState<number[]>([]);
	const [hasTime, setHasTime] = useState(false);
	const [start] = useState(defaultStart);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.places().then((r) => setPlaces(r.places.slice(0, 20))).catch(() => undefined);
		api.friends().then((r) => setFriends(r.friends)).catch(() => undefined);
	}, [api]);

	function toggleInvite(guid: number) {
		setInviteGuids((prev: number[]) => (prev.includes(guid) ? prev.filter((g: number) => g !== guid) : [...prev, guid]));
	}

	async function submit() {
		if (!title.trim()) {
			setError('Укажите название плана.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createPlan({
				title: title.trim(),
				notes: notes.trim() || undefined,
				placeGuid,
				startsAt: hasTime ? start.unix : undefined,
				inviteGuids,
			});
			onCreated(res.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать план');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Новый план" onBack={onBack} />
			<View style={styles.body}>
				<Text style={styles.hint}>Место и время можно решить позже — план работает и без них.</Text>
				<BerxInput placeholder="Что предлагаете?" value={title} onChangeText={setTitle} />

				<Text style={styles.label}>Время</Text>
				<View style={styles.chipWrap}>
					<Pressable style={[styles.chip, !hasTime && styles.chipActive]} onPress={() => setHasTime(false)}>
						<Text style={[styles.chipText, !hasTime && styles.chipTextActive]}>Пока не решено</Text>
					</Pressable>
					<Pressable style={[styles.chip, hasTime && styles.chipActive]} onPress={() => setHasTime(true)}>
						<Text style={[styles.chipText, hasTime && styles.chipTextActive]}>{start.label}</Text>
					</Pressable>
				</View>

				{places.length > 0 ? (
					<>
						<Text style={styles.label}>Место (необязательно)</Text>
						<View style={styles.chipWrap}>
							<Pressable style={[styles.chip, !placeGuid && styles.chipActive]} onPress={() => setPlaceGuid(undefined)}>
								<Text style={[styles.chipText, !placeGuid && styles.chipTextActive]}>Не выбрано</Text>
							</Pressable>
							{places.map((p: BerxPlace) => (
								<Pressable key={p.guid} style={[styles.chip, placeGuid === p.guid && styles.chipActive]} onPress={() => setPlaceGuid(p.guid)}>
									<Text style={[styles.chipText, placeGuid === p.guid && styles.chipTextActive]} numberOfLines={1}>{p.title}</Text>
								</Pressable>
							))}
						</View>
					</>
				) : null}

				{friends.length > 0 ? (
					<>
						<Text style={styles.label}>Пригласить друзей</Text>
						<View style={styles.chipWrap}>
							{friends.map((f: BerxFriend) => {
								const active = inviteGuids.includes(f.guid);
								return (
									<Pressable key={f.guid} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleInvite(f.guid)}>
										<Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>{f.username}</Text>
									</Pressable>
								);
							})}
						</View>
					</>
				) : null}

				<BerxInput placeholder="Заметки (необязательно)" value={notes} onChangeText={setNotes} multiline />

				{error ? <Text style={styles.error}>{error}</Text> : null}
				<BerxButton label="Создать план" onPress={submit} loading={submitting} fullWidth />
			</View>
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.lg, gap: spacing.md},
	hint: {color: colors.textFaint, fontSize: typography.sizeXs},
	label: {color: colors.textDim, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, marginTop: spacing.sm},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {color: colors.danger, fontSize: typography.sizeSm},
});
