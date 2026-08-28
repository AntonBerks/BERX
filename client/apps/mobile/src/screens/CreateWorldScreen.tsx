/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX WORLD — create a World. Visibility is a real, server-enforced
 * fork in behavior, not cosmetic: a private world's invites are real
 * friends only (server silently drops anyone who isn't a real
 * OssnUser::isFriend() match — same restriction CreatePlanScreen's
 * invite flow already uses); a public world has no invite step at
 * all — anyone can find and join it later (api.joinWorld()).
 *
 * "Temporary" expiry uses the same honest relative-preset pattern as
 * CreatePlanScreen's own date stand-in (no real date/time picker is
 * installable/verifiable in this sandbox) — real unix timestamps
 * computed client-side from "через неделю"/"через месяц", not a
 * fabricated picker UI. expires_at is stored and shown to members but
 * v1 does not yet auto-archive an expired world — a real, disclosed
 * follow-up (see classes/OssnWorlds.php's own header).
 */
import {useEffect, useState} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxFriend, BerxWorldVisibility} from '@berx/api/types';
import {colors, spacing, radius, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

interface Props {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
}

function weekFromNow(): number {
	return Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
}
function monthFromNow(): number {
	return Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
}

export default function CreateWorldScreen({api, onCreated, onBack}: Props) {
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [visibility, setVisibility] = useState<BerxWorldVisibility>('private');
	const [isTemporary, setIsTemporary] = useState(false);
	const [expiresAt, setExpiresAt] = useState<number>(weekFromNow());
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [inviteGuids, setInviteGuids] = useState<number[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		api.friends().then((r) => setFriends(r.friends)).catch(() => undefined);
	}, [api]);

	function toggleInvite(guid: number) {
		setInviteGuids((prev: number[]) => (prev.includes(guid) ? prev.filter((g: number) => g !== guid) : [...prev, guid]));
	}

	async function submit() {
		if (!title.trim()) {
			setError('Укажите название мира.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createWorld({
				title: title.trim(),
				description: description.trim() || undefined,
				visibility,
				isTemporary,
				expiresAt: isTemporary ? expiresAt : undefined,
				inviteGuids: visibility === 'private' ? inviteGuids : undefined,
			});
			onCreated(res.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать мир');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Новый мир" onBack={onBack} />
			<View style={styles.body}>
				<BerxInput placeholder="Название мира" value={title} onChangeText={setTitle} />
				<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />

				<Text style={styles.label}>Видимость</Text>
				<View style={styles.chipWrap}>
					<Pressable style={[styles.chip, visibility === 'private' && styles.chipActive]} onPress={() => setVisibility('private')}>
						<Text style={[styles.chipText, visibility === 'private' && styles.chipTextActive]}>Закрытый — только по приглашению</Text>
					</Pressable>
					<Pressable style={[styles.chip, visibility === 'public' && styles.chipActive]} onPress={() => setVisibility('public')}>
						<Text style={[styles.chipText, visibility === 'public' && styles.chipTextActive]}>Открытый — можно вступить самому</Text>
					</Pressable>
				</View>

				<Text style={styles.label}>Срок</Text>
				<View style={styles.chipWrap}>
					<Pressable style={[styles.chip, !isTemporary && styles.chipActive]} onPress={() => setIsTemporary(false)}>
						<Text style={[styles.chipText, !isTemporary && styles.chipTextActive]}>Бессрочный</Text>
					</Pressable>
					<Pressable style={[styles.chip, isTemporary && expiresAt === weekFromNow() && styles.chipActive]} onPress={() => { setIsTemporary(true); setExpiresAt(weekFromNow()); }}>
						<Text style={styles.chipText}>Неделя</Text>
					</Pressable>
					<Pressable style={[styles.chip, isTemporary && expiresAt === monthFromNow() && styles.chipActive]} onPress={() => { setIsTemporary(true); setExpiresAt(monthFromNow()); }}>
						<Text style={styles.chipText}>Месяц</Text>
					</Pressable>
				</View>

				{visibility === 'private' && friends.length > 0 ? (
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

				{error ? <Text style={styles.error}>{error}</Text> : null}
				<BerxButton label="Создать мир" onPress={submit} loading={submitting} fullWidth />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	body: {padding: spacing.lg, gap: spacing.md},
	label: {color: colors.textDim, fontSize: typography.sizeSm, fontWeight: typography.weightMedium, marginTop: spacing.sm},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {color: colors.danger, fontSize: typography.sizeSm},
});
