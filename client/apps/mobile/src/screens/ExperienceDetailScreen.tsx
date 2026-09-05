/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.getExperience()/respondToExperience()/
 * inviteToExperience() (components/OssnApi/v1/experiences.php).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxExperienceDetail, BerxExperienceParticipant, BerxFriend} from '@berx/api/types';
import {colors, spacing, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene, useBerxSceneAtmosphere} from '../spatial/BerxScreenScene';
import {BerxSection} from '../../../../packages/design-system/src/spatial/BerxSection';
import {BerxSceneHero} from '../../../../packages/design-system/src/spatial/BerxSceneHero';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {berxCount} from '@berx/domain';

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

	/* an experience is anchored to a real place or event; that anchor is its environment */
	useBerxSceneAtmosphere(experience?.anchor?.image_url ? {uri: experience.anchor.image_url} : undefined);

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
			{/* the title lives in the hero, so the way back does not
			    repeat it */}
			<BerxHeader onBack={onBack} />

			{/* the experience as the scene's subject, standing where it
			    is happening: the anchor's own photograph is real domain
			    media, and the anchor card below still says in words which
			    place or event that is, so the image is context rather
			    than a claim. An experience with no anchor gets the room's
			    own lit surface instead of a borrowed picture. */}
			<BerxSceneHero
				title={experience.title}
				meta={fmtWhen(experience.scheduled_start)}
				media={experience.anchor?.image_url ? {uri: experience.anchor.image_url} : undefined}
				mediaAlt={experience.anchor ? `${experience.anchor.title}` : undefined}
				height={210}
				actions={
					!experience.is_own && experience.my_status === 'invited' ? (
						<>
							<BerxButton label="Пойду" loading={busy} onPress={() => respond(true)} />
							<BerxButton label="Не пойду" variant="secondary" loading={busy} onPress={() => respond(false)} />
						</>
					) : experience.is_own ? (
						<BerxButton
							label={showPicker ? 'Скрыть друзей' : 'Пригласить друга'}
							variant="secondary"
							onPress={() => setShowPicker(!showPicker)}
							accessibilityState={{expanded: showPicker}}
						/>
					) : undefined
				}
			/>

			<View style={styles.body}>

				{experience.anchor ? (
					<BerxSpatialCard
						depth="D3"
						padding={spacing.sm}
						radius={18}
						accessibilityLabel={`${experience.anchor.title}, ${experience.anchor.type === 'place' ? 'место' : 'событие'}`}
						onPress={() => (experience.anchor!.type === 'place' ? onOpenPlace(experience.anchor!.guid) : onOpenEvent(experience.anchor!.guid))}>
						<View style={styles.anchorCard}>
						{experience.anchor.image_url ? <Image source={{uri: experience.anchor.image_url}} style={styles.anchorImage} /> : <View style={styles.anchorImageFallback} />}
						<View style={styles.anchorBody}>
							<BerxText role="callout" numberOfLines={1}>{experience.anchor.title}</BerxText>
							<BerxText role="meta" emphasis="tertiary">{experience.anchor.type === 'place' ? 'Место' : 'Событие'}</BerxText>
						</View>
						</View>
					</BerxSpatialCard>
				) : null}

				{experience.description ? (
					<BerxText role="body" emphasis="secondary">
						{experience.description}
					</BerxText>
				) : null}

				{showPicker ? (
					availableFriends.length === 0 ? (
						<BerxText role="meta" emphasis="tertiary">Все друзья уже приглашены.</BerxText>
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
									accessibilityLabel={`Пригласить ${item.fullname}`}
									accessibilityState={{disabled: busy}}
									onPress={() => invite(item.guid)}
									disabled={busy}>
									<Image source={{uri: item.icon}} style={styles.pickerAvatar} />
									<BerxText role="meta" emphasis="secondary" style={styles.pickerName} numberOfLines={1}>{item.fullname}</BerxText>
								</Pressable>
							)}
						/>
					)
				) : null}

				<BerxSection label="Участники" detail={(experience.participants.length > 0 ? berxCount(experience.participants.length, 'участник', 'участника', 'участников') : undefined)}>
					{experience.participants.map((p: BerxExperienceParticipant) => (
						<View key={p.guid} style={styles.participantRow}>
							<Image source={{uri: p.icon}} style={styles.participantAvatar} />
							<BerxText role="meta" style={styles.participantName} numberOfLines={1}>{p.fullname}</BerxText>
							<BerxText role="meta" emphasis="tertiary">{STATUS_LABEL[p.status]}</BerxText>
						</View>
					))}
				</BerxSection>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	anchorCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm},
	anchorImage: {width: 56, height: 56, borderRadius: radius.sm},
	anchorImageFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	anchorBody: {flex: 1, gap: 2},
	actions: {flexDirection: 'row', gap: spacing.sm},
	pickerRow: {gap: spacing.sm},
	pickerItem: {alignItems: 'center', width: 64, marginRight: spacing.sm},
	pickerAvatar: {width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.graphite},
	pickerName: {marginTop: 4},
	participantRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs},
	participantAvatar: {width: 32, height: 32, borderRadius: radius.pill, backgroundColor: colors.graphite},
	participantName: {flex: 1},
});
