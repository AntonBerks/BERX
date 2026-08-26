/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data: api.getPlace, api.placeReviews, api.savePlace/unsavePlace,
 * api.createPlaceReview (components/OssnApi/v1/places.php). No
 * booking/reservation UI — that backend does not exist (see
 * BERX_DECISIONS.md).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Image, Pressable, Linking, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceReview} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid: number;
	onAddToCollection?: () => void;
	onOpenBusinessDashboard?: (placeGuid: number) => void;
	onBack?: () => void;
}

export default function PlaceDetailScreen({api, guid, myGuid, onAddToCollection, onOpenBusinessDashboard, onBack}: Props) {
	const [place, setPlace] = useState<BerxPlace | null>(null);
	const [reviews, setReviews] = useState<BerxPlaceReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [businessBusy, setBusinessBusy] = useState(false);
	const [reviewText, setReviewText] = useState('');
	const [reviewRating, setReviewRating] = useState(5);
	const [submitting, setSubmitting] = useState(false);
	const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
	const [replyBusy, setReplyBusy] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, r] = await Promise.all([api.getPlace(guid), api.placeReviews(guid)]);
			setPlace(p);
			setReviews(r.reviews);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить место');
		} finally {
			setLoading(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	/**
	 * Real route building via core RN Linking — hands the place's real
	 * lat/lng to the OS's own maps handler. No maps library is
	 * installed (same npm constraint as every native module here), and
	 * this genuinely works today rather than being a placeholder.
	 * Records a real 'route' impression only when coordinates actually
	 * exist and the handler was actually invoked.
	 */
	async function buildRoute() {
		if (!place || place.lat === null || place.lng === null) return;
		const url = `geo:${place.lat},${place.lng}?q=${place.lat},${place.lng}`;
		try {
			await Linking.openURL(url);
			api.recordNearbyAction(place.guid, 'route').catch(() => undefined);
		} catch {
			// A device with no maps handler at all is a real outcome —
			// no impression recorded, since no route was actually built.
		}
	}

	async function toggleSave() {
		if (!place) return;
		setSaving(true);
		try {
			if (place.is_saved) {
				await api.unsavePlace(place.guid);
				setPlace({...place, is_saved: false});
			} else {
				await api.savePlace(place.guid);
				setPlace({...place, is_saved: true});
				// Real 'saved' impression — recorded only on an actual save,
				// never on unsave, and only after the real API call succeeded.
				api.recordNearbyAction(place.guid, 'saved').catch(() => undefined);
			}
		} catch {
			// best-effort — UI already reflects the pre-toggle state on failure
		} finally {
			setSaving(false);
		}
	}

	async function toggleBusiness() {
		if (!place) return;
		setBusinessBusy(true);
		try {
			const updated = place.is_business ? await api.disableBusiness(place.guid) : await api.enableBusiness(place.guid);
			setPlace(updated);
		} catch {
			// real server rejection (e.g. not the owner) — nothing optimistic here
		} finally {
			setBusinessBusy(false);
		}
	}

	async function submitReview() {
		if (!place || reviewText.trim().length === 0) return;
		setSubmitting(true);
		try {
			await api.createPlaceReview(place.guid, reviewRating, reviewText.trim());
			setReviewText('');
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось отправить отзыв');
		} finally {
			setSubmitting(false);
		}
	}

	async function submitReply(reviewGuid: number) {
		const text = (replyDrafts[reviewGuid] ?? '').trim();
		if (!text) return;
		setReplyBusy(reviewGuid);
		try {
			await api.replyToReview(reviewGuid, text);
			await load();
			setReplyDrafts((prev) => ({...prev, [reviewGuid]: ''}));
		} catch {
			// draft stays populated on failure so the owner can retry without retyping
		} finally {
			setReplyBusy(null);
		}
	}

	if (loading && !place) return <BerxLoadingState />;
	if (error && !place) return <BerxErrorState message={error} onRetry={load} />;
	if (!place) return null;

	const isOwner = place.owner_guid === myGuid;
	const alreadyReviewed = reviews.some((r) => r.author?.guid === myGuid);

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title={place.title} onBack={onBack} />
			<View style={styles.hero}>
				{place.cover_url ? (
					<Image source={{uri: place.cover_url}} style={styles.heroImage} />
				) : (
					<View style={styles.heroFallback}>
						<Text style={styles.heroInitial}>{place.title.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</View>

			<View style={styles.body}>
				<View style={styles.metaRow}>
					{place.category ? <View style={styles.chip}><Text style={styles.chipText}>{place.category}</Text></View> : null}
					{place.price ? <Text style={styles.priceText}>{'$'.repeat(place.price)}</Text> : null}
					{place.rating_count > 0 ? <Text style={styles.ratingText}>★ {place.rating} ({place.rating_count})</Text> : null}
					{place.is_business && place.verified ? <Text style={styles.verifiedBadge}>✓ Верифицированный бизнес</Text> : null}
				</View>

				{place.address ? <Text style={styles.address}>{place.address}</Text> : null}
				{place.phone ? <Text style={styles.address}>{place.phone}</Text> : null}
				{place.hours ? <Text style={styles.address}>{place.hours}</Text> : null}

				<View style={styles.actions}>
					<BerxButton
						label={place.is_saved ? 'Сохранено' : 'Сохранить'}
						variant={place.is_saved ? 'primary' : 'secondary'}
						loading={saving}
						onPress={toggleSave}
					/>
					{onAddToCollection ? <BerxButton label="В подборку" variant="secondary" onPress={onAddToCollection} /> : null}
					{place.lat !== null && place.lng !== null ? <BerxButton label="Маршрут" variant="secondary" onPress={buildRoute} /> : null}
				</View>

				{myGuid === place.owner_guid ? (
					<View style={styles.actions}>
						<BerxButton
							label={place.is_business ? 'Отключить бизнес-статус' : 'Стать бизнесом'}
							variant="secondary"
							loading={businessBusy}
							onPress={toggleBusiness}
						/>
						{place.is_business && onOpenBusinessDashboard ? (
							<BerxButton label="Панель бизнеса" variant="secondary" onPress={() => onOpenBusinessDashboard(place.guid)} />
						) : null}
					</View>
				) : null}

				{place.description ? <Text style={styles.description}>{place.description}</Text> : null}

				<View style={styles.infoBlock}>
					{place.hours ? <Text style={styles.infoLine}>🕐 {place.hours}</Text> : null}
					{place.phone ? <Text style={styles.infoLine}>📞 {place.phone}</Text> : null}
					{place.website ? <Text style={styles.infoLine}>🔗 {place.website}</Text> : null}
				</View>

				<Text style={styles.sectionTitle}>Отзывы ({reviews.length})</Text>

				{!isOwner && !alreadyReviewed ? (
					<View style={styles.reviewForm}>
						<View style={styles.starRow}>
							{[1, 2, 3, 4, 5].map((n) => (
								<Pressable key={n} onPress={() => setReviewRating(n)}>
									<Text style={[styles.star, n <= reviewRating && styles.starActive]}>★</Text>
								</Pressable>
							))}
						</View>
						<BerxInput placeholder="Ваш отзыв" value={reviewText} onChangeText={setReviewText} multiline />
						<BerxButton label="Отправить" loading={submitting} disabled={reviewText.trim().length === 0} onPress={submitReview} />
					</View>
				) : isOwner ? (
					<Text style={styles.note}>Нельзя оставить отзыв о собственном месте.</Text>
				) : (
					<Text style={styles.note}>Вы уже оставили отзыв.</Text>
				)}

				{reviews.map((r) => (
					<View key={r.guid} style={styles.reviewRow}>
						<Text style={styles.reviewAuthor}>{r.author?.fullname ?? 'Пользователь'}</Text>
						<Text style={styles.reviewStars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
						{r.text ? <Text style={styles.reviewText}>{r.text}</Text> : null}

						{r.owner_reply ? (
							<View style={styles.replyBlock}>
								<Text style={styles.replyLabel}>Ответ владельца</Text>
								<Text style={styles.replyText}>{r.owner_reply.text}</Text>
							</View>
						) : isOwner ? (
							<View style={styles.replyForm}>
								<BerxInput
									placeholder="Ответить на отзыв"
									value={replyDrafts[r.guid] ?? ''}
									onChangeText={(t: string) => setReplyDrafts((prev) => ({...prev, [r.guid]: t}))}
									multiline
								/>
								<BerxButton
									label="Ответить"
									variant="secondary"
									loading={replyBusy === r.guid}
									disabled={!(replyDrafts[r.guid] ?? '').trim()}
									onPress={() => submitReply(r.guid)}
								/>
							</View>
						) : null}
					</View>
				))}

				<BerxDiscussion api={api} type="place" id={place.guid} myGuid={myGuid || undefined} />
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	hero: {aspectRatio: 1.6, backgroundColor: colors.graphite},
	heroImage: {width: '100%', height: '100%'},
	heroFallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	heroInitial: {fontSize: typography.sizeHero, color: colors.textFaint},
	body: {padding: spacing.md, gap: spacing.md},
	metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	chip: {paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.surface2},
	chipText: {fontSize: typography.sizeXs, color: colors.textDim},
	priceText: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold},
	ratingText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	verifiedBadge: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
	address: {fontSize: typography.sizeSm, color: colors.textDim},
	actions: {flexDirection: 'row', gap: spacing.sm},
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	infoBlock: {gap: spacing.xs},
	infoLine: {fontSize: typography.sizeSm, color: colors.textDim},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	reviewForm: {gap: spacing.sm},
	starRow: {flexDirection: 'row', gap: spacing.xs},
	star: {fontSize: 24, color: colors.border},
	starActive: {color: colors.accent},
	note: {fontSize: typography.sizeSm, color: colors.textFaint},
	reviewRow: {gap: 4, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	reviewAuthor: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium},
	reviewStars: {fontSize: typography.sizeXs, color: colors.accent},
	reviewText: {fontSize: typography.sizeSm, color: colors.textDim},
	replyBlock: {marginTop: 4, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.accent},
	replyLabel: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
	replyText: {fontSize: typography.sizeSm, color: colors.textDim},
	replyForm: {marginTop: spacing.xs, gap: spacing.xs},
});
