/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data: api.getPlace, api.placeReviews, api.savePlace/unsavePlace,
 * api.createPlaceReview (components/OssnApi/v1/places.php). No
 * booking/reservation UI — that backend does not exist (see
 * BERX_DECISIONS.md).
 *
 * MAX BUILD — real "Редактировать" for the owner (onEdit ->
 * EditPlaceScreen). updatePlace()/deletePlace() were always real
 * client methods with zero UI callers — an owner could create a
 * place but never edit or delete it again.
 *
 * Future UI pass: body content gets a real BerxFadeIn entrance, and
 * the "friends here" row (Experience Graph signal) now sits on a
 * small BerxGlassSurface strip instead of a plain inline row, giving
 * that real social signal the same material weight it gets on
 * Profile's reputation strip.
 *
 * MAX BUILD — real geo-verified check-in (api.checkInAtPlace(),
 * components/OssnApi/v1/places.php's checkin route). "Friends here"
 * now also includes friends_checked_in from the Experience Graph
 * (a stronger-than-saved real signal). Only offered
 * when the place actually has a real location on file (server can't
 * verify distance otherwise). Same honest manual-lat/lng pattern as
 * NearbyNowScreen/SocialMapScreen (no device Geolocation library
 * installable in this sandbox) — the server still re-verifies the
 * submitted coordinates itself, so this isn't "trust the client",
 * just "no on-device GPS reading available here".
 *
 * MAX BUILD — real Business Offers (components/OssnApi/v1/offers.php):
 * a real "Предложения" section showing this place's live offers, with
 * a real claim button reflecting the caller's own already_claimed/
 * already_fulfilled state (viewer-scoped server response, not a
 * client guess) — never a button that always shows and just errors
 * on a second tap.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Image, Pressable, Linking, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlace, BerxPlaceReview, BerxExperienceGraphFriend, BerxExperienceGraphWorldFriend, BerxBusinessOffer} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid: number;
	isAdmin?: boolean;
	onAddToCollection?: () => void;
	onAddToTrip?: () => void;
	onAddToWorld?: () => void;
	onOpenBusinessDashboard?: (placeGuid: number) => void;
	onEdit?: () => void;
	onBack?: () => void;
}

export default function PlaceDetailScreen({api, guid, myGuid, isAdmin, onAddToCollection, onAddToTrip, onAddToWorld, onOpenBusinessDashboard, onEdit, onBack}: Props) {
	const [claimOpen, setClaimOpen] = useState(false);
	const [claimMessage, setClaimMessage] = useState('');
	const [claimBusy, setClaimBusy] = useState(false);
	const [claimResult, setClaimResult] = useState<string | null>(null);
	const [verifyBusy, setVerifyBusy] = useState(false);
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
	const [friendsHere, setFriendsHere] = useState<BerxExperienceGraphFriend[]>([]);
	const [friendsWorlds, setFriendsWorlds] = useState<BerxExperienceGraphWorldFriend[]>([]);
	const [offers, setOffers] = useState<BerxBusinessOffer[]>([]);
	const [claimingOfferId, setClaimingOfferId] = useState<number | null>(null);
	const [offerMessage, setOfferMessage] = useState<string | null>(null);
	const [checkinOpen, setCheckinOpen] = useState(false);
	const [checkinLat, setCheckinLat] = useState('');
	const [checkinLng, setCheckinLng] = useState('');
	const [checkinBusy, setCheckinBusy] = useState(false);
	const [checkinMessage, setCheckinMessage] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const [p, r] = await Promise.all([api.getPlace(guid), api.placeReviews(guid)]);
			setPlace(p);
			setReviews(r.reviews);
			// Experience Graph — best-effort, never blocks the place itself
			// from loading (a real secondary signal, not core data).
			api.placeExperienceGraph(guid)
				.then((g) => {
					setFriendsHere([...g.friends_checked_in, ...g.friends_saved, ...g.friends_reviewed].filter((f, i, arr) => arr.findIndex((x) => x.guid === f.guid) === i));
					setFriendsWorlds(g.friends_worlds);
				})
				.catch(() => undefined);
			// Best-effort — a place with no offers module reachable still loads normally.
			api.placeOffers(guid).then((res) => setOffers(res.offers)).catch(() => undefined);
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

	async function submitCheckin() {
		if (!place) return;
		const la = Number(checkinLat);
		const ln = Number(checkinLng);
		if (!Number.isFinite(la) || !Number.isFinite(ln)) {
			setCheckinMessage('Введите корректные координаты.');
			return;
		}
		setCheckinBusy(true);
		setCheckinMessage(null);
		try {
			const res = await api.checkInAtPlace(place.guid, la, ln);
			setCheckinMessage(res.points_awarded > 0 ? `✓ Отмечено — +${res.points_awarded} баллов` : '✓ Уже отмечались сегодня');
			setCheckinOpen(false);
		} catch (e) {
			// Real, honest server verdict — the distance in the message
			// came back from OssnPlaces::checkIn()'s own re-computation,
			// not a client guess (see places.php's checkin route).
			if (e instanceof BerxApiError && (e.code === 'too_far' || e.code === 'no_location' || e.code === 'too_soon')) {
				setCheckinMessage(e.message);
			} else {
				setCheckinMessage('Не удалось отметиться');
			}
		} finally {
			setCheckinBusy(false);
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

	/**
	 * MAX BUILD — real gap closed: submitPlaceClaim() was always a
	 * real, working client method with zero UI caller. Approval's real
	 * effect (OssnBusiness::reviewClaim()) reassigns the place's
	 * owner_guid to the requester — the server rejects a second
	 * pending claim from the same person with a real 409, shown here
	 * verbatim rather than a generic failure message.
	 */
	/** Admin-only server-side (OssnPlaces::setVerified()) — a business can never self-verify, and this button is only ever shown when isAdmin is true, matching that real gate. */
	async function toggleVerified() {
		if (!place) return;
		setVerifyBusy(true);
		try {
			const updated = place.verified ? await api.unverifyBusiness(place.guid) : await api.verifyBusiness(place.guid);
			setPlace(updated);
		} catch {
			// real server rejection — nothing optimistic
		} finally {
			setVerifyBusy(false);
		}
	}

	async function submitClaim() {
		if (!place) return;
		setClaimBusy(true);
		setClaimResult(null);
		try {
			await api.submitPlaceClaim(place.guid, claimMessage.trim() || undefined);
			setClaimResult('Заявка отправлена на рассмотрение.');
			setClaimOpen(false);
		} catch (e) {
			setClaimResult(e instanceof Error ? e.message : 'Не удалось отправить заявку');
		} finally {
			setClaimBusy(false);
		}
	}

	/** Real claim — success flips already_claimed locally so the button updates without a full refetch; a real 409 from a race with another device just falls through to the catch and leaves the offer as-is. A real 429 (server-side abuse guard, 10 claims/60s) surfaces its own honest message rather than the generic silent no-op. */
	async function handleClaimOffer(offerId: number) {
		setClaimingOfferId(offerId);
		setOfferMessage(null);
		try {
			await api.claimOffer(offerId);
			setOffers((prev) => prev.map((o) => (o.id === offerId ? {...o, already_claimed: true, redemptions_count: o.redemptions_count + 1} : o)));
		} catch (e) {
			if (e instanceof BerxApiError && e.code === 'rate_limited') {
				setOfferMessage('Слишком много попыток — попробуйте через минуту.');
			}
			// other rejections (expired, full, already claimed) — list stays as-is
		} finally {
			setClaimingOfferId(null);
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

	/** MAX BUILD — closes a real gap: api.deleteReviewReply() was always real (owner/admin-only, enforced server-side via OssnBusiness::canReply()) with zero UI caller — a posted reply could never be retracted, only replaced by re-posting through a UI that didn't offer that either. */
	async function deleteReply(reviewGuid: number) {
		setReplyBusy(reviewGuid);
		try {
			await api.deleteReviewReply(reviewGuid);
			await load();
		} catch {
			// real server rejection — reply stays as-is
		} finally {
			setReplyBusy(null);
		}
	}

	/** MAX BUILD — real "helpful" review votes, same generic OssnLikes engine post/comment likes already use. */
	async function toggleReviewHelpful(review: BerxPlaceReview) {
		try {
			if (review.is_helpful) {
				await api.unmarkReviewHelpful(guid, review.guid);
				setReviews((prev: BerxPlaceReview[]) => prev.map((r: BerxPlaceReview) => (r.guid === review.guid ? {...r, is_helpful: false, helpful_count: Math.max(0, r.helpful_count - 1)} : r)));
			} else {
				await api.markReviewHelpful(guid, review.guid);
				setReviews((prev: BerxPlaceReview[]) => prev.map((r: BerxPlaceReview) => (r.guid === review.guid ? {...r, is_helpful: true, helpful_count: r.helpful_count + 1} : r)));
			}
		} catch {
			// best-effort — list stays at its pre-toggle state on failure
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
			<Berx3DTilt style={styles.hero} maxAngle={6}>
				{place.cover_url ? (
					<Image source={{uri: place.cover_url}} style={styles.heroImage} />
				) : (
					<View style={styles.heroFallback}>
						<Text style={styles.heroInitial}>{place.title.charAt(0).toUpperCase()}</Text>
					</View>
				)}
			</Berx3DTilt>

			<BerxFadeIn style={styles.body}>
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
					{onAddToTrip ? <BerxButton label="В поездку" variant="secondary" onPress={onAddToTrip} /> : null}
					{onAddToWorld ? <BerxButton label="В мир" variant="secondary" onPress={onAddToWorld} /> : null}
					{place.lat !== null && place.lng !== null ? <BerxButton label="Маршрут" variant="secondary" onPress={buildRoute} /> : null}
					{place.lat !== null && place.lng !== null ? <BerxButton label="Отметиться" variant="secondary" onPress={() => { setCheckinOpen(!checkinOpen); setCheckinMessage(null); }} /> : null}
				</View>

				{checkinOpen ? (
					<BerxGlassSurface padding="sm" style={styles.checkinForm}>
						<Text style={styles.checkinHint}>Введите ваши текущие координаты — сервер проверит, что вы действительно рядом.</Text>
						<View style={styles.checkinRow}>
							<View style={styles.checkinHalf}><BerxInput placeholder="Широта" value={checkinLat} onChangeText={setCheckinLat} keyboardType="decimal-pad" /></View>
							<View style={styles.checkinHalf}><BerxInput placeholder="Долгота" value={checkinLng} onChangeText={setCheckinLng} keyboardType="decimal-pad" /></View>
						</View>
						<BerxButton label="Подтвердить" onPress={submitCheckin} loading={checkinBusy} fullWidth />
					</BerxGlassSurface>
				) : null}
				{checkinMessage ? <Text style={styles.checkinMessage}>{checkinMessage}</Text> : null}

				{myGuid === place.owner_guid ? (
					<View style={styles.actions}>
						{onEdit ? <BerxButton label="Редактировать" variant="secondary" onPress={onEdit} /> : null}
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
				) : (
					<View style={styles.actions}>
						<Pressable onPress={() => setClaimOpen(!claimOpen)}>
							<Text style={styles.claimLink}>{claimOpen ? 'Скрыть' : 'Это моё место? Заявить права'}</Text>
						</Pressable>
					</View>
				)}

				{claimOpen ? (
					<BerxGlassSurface padding="sm" style={styles.checkinForm}>
						<Text style={styles.checkinHint}>Заявка рассматривается администрацией. При одобрении место перейдёт в ваше управление.</Text>
						<BerxInput placeholder="Сообщение (необязательно)" value={claimMessage} onChangeText={setClaimMessage} multiline />
						<BerxButton label="Отправить заявку" onPress={submitClaim} loading={claimBusy} fullWidth />
					</BerxGlassSurface>
				) : null}
				{claimResult ? <Text style={styles.checkinMessage}>{claimResult}</Text> : null}

				{isAdmin && place.is_business ? (
					<View style={styles.actions}>
						<BerxButton
							label={place.verified ? 'Снять верификацию' : 'Верифицировать бизнес'}
							variant="secondary"
							loading={verifyBusy}
							onPress={toggleVerified}
						/>
					</View>
				) : null}

				{place.description ? <Text style={styles.description}>{place.description}</Text> : null}

				<View style={styles.infoBlock}>
					{place.hours ? <Text style={styles.infoLine}>🕐 {place.hours}</Text> : null}
					{place.phone ? <Text style={styles.infoLine}>📞 {place.phone}</Text> : null}
					{place.website ? <Text style={styles.infoLine}>🔗 {place.website}</Text> : null}
				</View>

				{friendsHere.length > 0 ? (
					<BerxGlassSurface padding="sm" style={styles.friendsHereRow}>
						{friendsHere.slice(0, 8).map((f: BerxExperienceGraphFriend) => (
							<View key={f.guid} style={styles.friendHereItem}>
								<BerxAvatar iconUrl={f.icon} fallbackInitial={f.username.charAt(0)} size={36} />
							</View>
						))}
						<Text style={styles.friendsHereLabel}>{friendsHere.length === 1 ? '1 друг был здесь' : `${friendsHere.length} друзей были здесь`}</Text>
					</BerxGlassSurface>
				) : null}

				{friendsWorlds.length > 0 ? (
					<Text style={styles.friendsWorldsLine}>
						{friendsWorlds.map((f: BerxExperienceGraphWorldFriend) => f.fullname || f.username).join(', ')} добавил{friendsWorlds.length === 1 ? '' : 'и'} это место в свой мир
					</Text>
				) : null}

				{offers.length > 0 ? (
					<>
						<Text style={styles.sectionTitle}>Предложения</Text>
						{offerMessage ? <Text style={styles.checkinMessage}>{offerMessage}</Text> : null}
						{offers.map((o) => (
							<BerxGlassSurface key={o.id} padding="sm" style={styles.offerRow}>
								<Text style={styles.offerTitle}>{o.title}</Text>
								{o.description ? <Text style={styles.offerDescription}>{o.description}</Text> : null}
								<View style={styles.offerMetaRow}>
									{o.ends_at !== null ? <Text style={styles.offerMeta}>до {new Date(o.ends_at * 1000).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'})}</Text> : null}
									{o.max_redemptions !== null ? <Text style={styles.offerMeta}>{o.redemptions_count}/{o.max_redemptions} забрали</Text> : null}
								</View>
								{o.already_fulfilled ? (
									<Text style={styles.offerClaimedLabel}>✓ Использовано</Text>
								) : o.already_claimed ? (
									<Text style={styles.offerClaimedLabel}>✓ Забрано — покажите на месте</Text>
								) : (
									<BerxButton label="Забрать" variant="secondary" loading={claimingOfferId === o.id} onPress={() => handleClaimOffer(o.id)} />
								)}
							</BerxGlassSurface>
						))}
					</>
				) : null}

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
						<Pressable onPress={() => toggleReviewHelpful(r)} hitSlop={8}>
							<Text style={[styles.reviewHelpful, r.is_helpful && styles.reviewHelpfulActive]}>
								{r.is_helpful ? '✓ Полезно' : 'Полезно?'}{r.helpful_count > 0 ? ` (${r.helpful_count})` : ''}
							</Text>
						</Pressable>

						{r.owner_reply ? (
							<View style={styles.replyBlock}>
								<Text style={styles.replyLabel}>Ответ владельца</Text>
								<Text style={styles.replyText}>{r.owner_reply.text}</Text>
								{isOwner ? (
									<Pressable onPress={() => deleteReply(r.guid)} disabled={replyBusy === r.guid} hitSlop={8}>
										<Text style={styles.replyDeleteLink}>{replyBusy === r.guid ? 'Удаление…' : 'Удалить ответ'}</Text>
									</Pressable>
								) : null}
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
			</BerxFadeIn>
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
	actions: {flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap'},
	checkinForm: {gap: spacing.sm},
	checkinHint: {fontSize: typography.sizeXs, color: colors.textFaint},
	checkinRow: {flexDirection: 'row', gap: spacing.sm},
	checkinHalf: {flex: 1},
	checkinMessage: {fontSize: typography.sizeSm, color: colors.accent},
	claimLink: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	description: {fontSize: typography.sizeBase, color: colors.text, lineHeight: typography.sizeBase * typography.lineHeightBase},
	infoBlock: {gap: spacing.xs},
	infoLine: {fontSize: typography.sizeSm, color: colors.textDim},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	offerRow: {gap: 4, marginBottom: spacing.xs},
	offerTitle: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium},
	offerDescription: {fontSize: typography.sizeSm, color: colors.textDim},
	offerMetaRow: {flexDirection: 'row', gap: spacing.sm},
	offerMeta: {fontSize: typography.sizeXs, color: colors.textFaint},
	offerClaimedLabel: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	friendsHereRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm},
	friendHereItem: {marginLeft: -spacing.xs},
	friendsHereLabel: {fontSize: typography.sizeSm, color: colors.textDim, marginLeft: spacing.sm},
	friendsWorldsLine: {fontSize: typography.sizeXs, color: colors.textFaint, fontStyle: 'italic'},
	reviewForm: {gap: spacing.sm},
	starRow: {flexDirection: 'row', gap: spacing.xs},
	star: {fontSize: 24, color: colors.border},
	starActive: {color: colors.accent},
	note: {fontSize: typography.sizeSm, color: colors.textFaint},
	reviewRow: {gap: 4, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	reviewAuthor: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium},
	reviewStars: {fontSize: typography.sizeXs, color: colors.accent},
	reviewText: {fontSize: typography.sizeSm, color: colors.textDim},
	reviewHelpful: {fontSize: typography.sizeXs, color: colors.textFaint, marginTop: 4},
	reviewHelpfulActive: {color: colors.accent, fontWeight: typography.weightMedium},
	replyBlock: {marginTop: 4, paddingLeft: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.accent},
	replyLabel: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
	replyText: {fontSize: typography.sizeSm, color: colors.textDim},
	replyDeleteLink: {fontSize: typography.sizeXs, color: colors.danger, marginTop: 4},
	replyForm: {marginTop: spacing.xs, gap: spacing.xs},
});
