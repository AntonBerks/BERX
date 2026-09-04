/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getExperience()/respondToExperience()/
 * inviteToExperience() (components/OssnApi/v1/experiences.php).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxExperienceDetail, BerxExperienceParticipant, BerxFriend} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface ExperienceDetailScreenProps {
	api: BerxApiClient;
	id: number;
	onOpenPlace: (guid: number) => void;
	onOpenEvent: (guid: number) => void;
	onBack?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
	invited: 'Приглашён',
	accepted: 'Идёт',
	declined: 'Отклонил',
};

function fmtWhen(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'});
}

export default function ExperienceDetailScreen(props: ExperienceDetailScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" testID="experience-detail">
			<ExperienceDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function ExperienceDetailScreenBody({api, id, onOpenPlace, onOpenEvent, onBack}: ExperienceDetailScreenProps) {
	const [experience, setExperience] = useState<BerxExperienceDetail | null>(null);
	const [friends, setFriends] = useState<BerxFriend[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [e, f] = await Promise.all([api.getExperience(id), api.friends()]);
			setExperience(e);
			setFriends(f.friends);
		} catch (e2) {
			setError(e2 instanceof Error ? e2.message : 'Впечатление недоступно');
		} finally {
			setLoading(false);
		}
	}, [api, id]);

	useEffect(() => {
		load();
	}, [load]);

	async function respond(accept: boolean) {
		if (!experience) return;
		setBusy(true);
		try {
			await api.respondToExperience(experience.id, accept);
			await load();
		} catch {
			// real error (e.g. not actually invited) — nothing optimistic
		} finally {
			setBusy(false);
		}
	}

	async function invite(guid: number) {
		if (!experience) return;
		setBusy(true);
		try {
			await api.inviteToExperience(experience.id, guid);
			await load();
		} catch {
			// server rejects non-friends/duplicates with a real error
		} finally {
			setBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !experience) return <BerxErrorState message={error ?? 'Впечатление не найдено'} onRetry={load} />;

	const participantGuids = new Set(experience.participants.map((p: BerxExperienceParticipant) => p.guid));
	const availableFriends = friends.filter((f: BerxFriend) => !participantGuids.has(f.guid));

	return (
		<View style={styles.screen}>
			<BerxHeader title={experience.title} onBack={onBack} />
			<View style={styles.body}>
				<Text style={styles.when}>{fmtWhen(experience.scheduled_start)}</Text>

				{experience.anchor ? (
					<Pressable
						style={styles.anchorCard}
						onPress={() => (experience.anchor!.type === 'place' ? onOpenPlace(experience.anchor!.guid) : onOpenEvent(experience.anchor!.guid))}>
						{experience.anchor.image_url ? <Image source={{uri: experience.anchor.image_url}} style={styles.anchorImage} /> : <View style={styles.anchorImageFallback} />}
						<View style={styles.anchorBody}>
							<Text style={styles.anchorTitle} numberOfLines={1}>{experience.anchor.title}</Text>
							<Text style={styles.anchorType}>{experience.anchor.type === 'place' ? 'Место' : 'Событие'}</Text>
						</View>
					</Pressable>
				) : null}

				{experience.description ? <Text style={styles.description}>{experience.description}</Text> : null}

				{!experience.is_own && experience.my_status === 'invited' ? (
					<View style={styles.actions}>
						<BerxButton label="Пойду" loading={busy} onPress={() => respond(true)} />
						<BerxButton label="Не пойду" variant="secondary" loading={busy} onPress={() => respond(false)} />
					</View>
				) : null}

				{experience.is_own ? (
					<Pressable onPress={() => setShowPicker(!showPicker)}>
						<Text style={styles.toggleText}>{showPicker ? 'Скрыть друзей' : 'Пригласить друга'}</Text>
					</Pressable>
				) : null}

				{showPicker ? (
					availableFriends.length === 0 ? (
						<Text style={styles.hint}>Все друзья уже приглашены.</Text>
					) : (
						<FlatList
							horizontal
							showsHorizontalScrollIndicator={false}
							data={availableFriends}
							keyExtractor={(f: BerxFriend) => String(f.guid)}
							contentContainerStyle={styles.pickerRow}
							renderItem={({item}: {item: BerxFriend}) => (
								<Pressable style={styles.pickerItem} onPress={() => invite(item.guid)} disabled={busy}>
									<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
									<Text style={styles.pickerName} numberOfLines={1}>{item.fullname}</Text>
								</Pressable>
							)}
						/>
					)
				) : null}

				<Text style={styles.sectionTitle}>Участники ({experience.participants.length})</Text>
				{experience.participants.map((p: BerxExperienceParticipant) => (
					<View key={p.guid} style={styles.participantRow}>
						<Image source={{uri: p.icon}} style={styles.participantAvatar} />
						<Text style={styles.participantName} numberOfLines={1}>{p.fullname}</Text>
						<Text style={styles.participantStatus}>{STATUS_LABEL[p.status]}</Text>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.md, gap: spacing.md},
	when: {fontSize: typography.sizeSm, color: colors.textDim},
	anchorCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm},
	anchorImage: {width: 56, height: 56, borderRadius: radius.sm},
	anchorImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	anchorBody: {flex: 1, gap: 2},
	anchorTitle: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	anchorType: {fontSize: typography.sizeXs, color: colors.textFaint},
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	actions: {flexDirection: 'row', gap: spacing.sm},
	toggleText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	hint: {fontSize: typography.sizeSm, color: colors.textFaint},
	pickerRow: {gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {fontSize: typography.sizeXs, color: colors.textDim, marginTop: 4},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	participantRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	participantAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	participantName: {flex: 1, fontSize: typography.sizeSm, color: colors.white},
	participantStatus: {fontSize: typography.sizeXs, color: colors.textFaint},
});
