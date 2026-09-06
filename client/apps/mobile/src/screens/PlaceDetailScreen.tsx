/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real data: api.getPlace, api.placeReviews, api.savePlace/unsavePlace,
 * api.createPlaceReview (components/OssnApi/v1/places.php). No
 * booking/reservation UI — that backend does not exist (see
 * BERX_DECISIONS.md).
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Pressable, Linking, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceHours, BerxPlace, BerxPlaceReview} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxPlaceHero} from '../../../../packages/design-system/src/spatial/BerxPlaceHero';
import {BerxIcon} from '../../../../packages/design-system/src/icons';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxStars} from '../../../../packages/design-system/src/spatial/BerxStars';
import {BerxListGroup, BerxListRow} from '../../../../packages/design-system/src/spatial/BerxListGroup';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxConfirm} from '../../../../packages/design-system/src/spatial/BerxConfirm';
import {BerxEditSheet} from '../../../../packages/design-system/src/spatial/BerxEditSheet';
import {pickImageFromLibrary} from '@berx/platform/mediaPicker';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxDiscussion} from '../../../../packages/design-system/src/components/BerxDiscussion';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxSection} from '../../../../packages/design-system/src/spatial/BerxSection';
import {berxCount} from '@berx/domain';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';

export interface PlaceDetailScreenProps {
	api: BerxApiClient;
	guid: number;
	myGuid: number;
	onAddToCollection?: () => void;
	onOpenBusinessDashboard?: (placeGuid: number) => void;
	onBack?: () => void;
}

export default function PlaceDetailScreen(props: PlaceDetailScreenProps) {
	/**
	 * The place's own cover becomes the scene's atmosphere layer.
	 *
	 * D1 is where the environment lives, and a place page whose
	 * atmosphere is that place is the difference between a card about
	 * somewhere and being somewhere. It is loaded before the scene so
	 * the whole screen — not just the hero — sits inside it, dimmed and
	 * parallaxed behind the content plane, and scrimmed hard enough
	 * that text contrast never depends on the photograph.
	 *
	 * No cover means no atmosphere. BERX does not substitute a stock
	 * image for a place that has none.
	 */
	const [cover, setCover] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		props.api
			.getPlace(props.guid)
			.then((place) => {
				if (!cancelled) setCover(place.cover_url ?? null);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [props.api, props.guid]);

	return (
		<BerxFamilyScene
			family="PLACES"
			atmosphere={cover ? {uri: cover} : undefined}
			testID="place-detail">
			<PlaceDetailSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function PlaceDetailSceneBody({api, guid, myGuid, onAddToCollection, onOpenBusinessDashboard, onBack}: PlaceDetailScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	/* the divider is the structure plane's own edge, not a flat grey
	   hairline: a rule between two comments belongs to the room they
	   are in, so it changes with the colour world like everything
	   else does */
	const {scene: placeScene} = useBerxScene();
	const dividerColor = placeScene.layers.D2.surface.borderColor;
	/* the scene's own accent, which changes with the colour world */
	const accent = placeScene.accent;
	const [place, setPlace] = useState<BerxPlace | null>(null);
	/** Structured opening hours — the endpoint this screen never called. */
	const [hours, setHours] = useState<BerxPlaceHours | null>(null);
	const [reviews, setReviews] = useState<BerxPlaceReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [businessBusy, setBusinessBusy] = useState(false);
	const [coverBusy, setCoverBusy] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [editing, setEditing] = useState(false);
	const [ownerError, setOwnerError] = useState<string | null>(null);
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
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different problems,
			   and being offline is a fourth. A 403 or a 404 also stops
			   offering a Retry that cannot work. */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
		} finally {
			setLoading(false);
		}
	}, [api, guid, offline]);

	useEffect(() => {
		load();
	}, [load]);

	/**
	 * Structured hours, best-effort: a place without them (or a
	 * caller without permission to read them) simply shows the
	 * free-text line, which is what happened before. `is_open_now`
	 * is the server's own answer, evaluated in the place's local
	 * time — something the device cannot do on its own.
	 */
	useEffect(() => {
		let cancelled = false;
		api
			.placeHours(guid)
			.then((h) => {
				if (!cancelled) setHours(h);
			})
			.catch(() => {
				if (!cancelled) setHours(null);
			});
		return () => {
			cancelled = true;
		};
	}, [api, guid]);

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

	/* The way back stays on screen while the scene is loading and after
	   it fails. It used to be inside the branch that only rendered once
	   the data had arrived, so an error left the person on a screen with
	   no exit — the dead end the archive forbids, on a screen reached by
	   a push. The name arrives when the data does. */
	const header = <BerxHeader title={place?.title} onBack={onBack} />;

	if (loading && !place)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error && !place)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);
	if (!place) return null;

	const isOwner = place.owner_guid === myGuid;

	async function pickCover() {
		if (!place) return;
		setOwnerError(null);
		const part = await pickImageFromLibrary();
		/* a cancelled picker is not a failure */
		if (!part) return;
		setCoverBusy(true);
		try {
			await api.uploadPlaceCover(place.guid, part);
			/* re-read: the cover URL belongs to the server */
			await load();
		} catch (e) {
			setOwnerError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
		} finally {
			setCoverBusy(false);
		}
	}

	async function removePlace() {
		if (!place) return;
		await api.deletePlace(place.guid);
		/* only once the server has confirmed it is gone */
		onBack?.();
	}

	/* `updatePlace` is a real PATCH, ownership-checked, and nothing
	   reached it: a place with a wrong phone number or moved address
	   could be given a cover photo or destroyed, and nothing in
	   between. Coordinates are deliberately not offered here — BERX has
	   no map picker, and asking someone to type a latitude is not an
	   edit, it is a trap. */
	async function saveEdits(changed: Record<string, string | number | null>) {
		if (!place) return;
		const updated = await api.updatePlace(place.guid, {
			...(typeof changed.title === 'string' ? {title: changed.title} : {}),
			...(typeof changed.description === 'string' ? {description: changed.description} : {}),
			...(typeof changed.category === 'string' ? {category: changed.category} : {}),
			...(typeof changed.address === 'string' ? {address: changed.address} : {}),
			...(typeof changed.phone === 'string' ? {phone: changed.phone} : {}),
			...(typeof changed.website === 'string' ? {website: changed.website} : {}),
			...(typeof changed.hours === 'string' ? {hours: changed.hours} : {}),
			...(typeof changed.price === 'number' ? {price: changed.price} : {}),
		});
		setPlace(updated);
	}
	const alreadyReviewed = reviews.some((r) => r.author?.guid === myGuid);

	return (
		<BerxSceneScroll style={styles.screen}>
			{header}

			{/**
			 * The hero carries the two facts a place page must lead with
			 * and BERX actually stores: the real rating over its real
			 * review count, and the real open/closed state from the
			 * structured hours endpoint. That endpoint existed but this
			 * screen never called it — it showed only the free-text
			 * `hours` field, so a place with real structured hours never
			 * showed whether it was open.
			 */}
			<BerxPlaceHero
				placeGuid={place.guid}
				name={place.title}
				category={place.category ?? undefined}
				address={place.address ?? undefined}
				cover={place.cover_url ? {uri: place.cover_url} : undefined}
				rating={place.rating_count > 0 ? place.rating : undefined}
				ratingCount={place.rating_count}
				hours={hours?.intervals}
				isOpenNow={hours ? hours.is_open_now : undefined}
				rawHours={place.hours ?? undefined}
			/>

			<View style={styles.body}>
				<View style={styles.metaRow}>
					{place.price ? <BerxText role="label" emphasis="tertiary">{'$'.repeat(place.price)}</BerxText> : null}
					{place.is_business && place.verified ? (
						<View style={styles.verifiedBadge}>
							<BerxIcon name="verified" size={13} state="active" decorative />
							<BerxText role="micro" emphasis="accent">
								Верифицированный бизнес
							</BerxText>
						</View>
					) : null}
				</View>

				<BerxActionShelf variant="anchored">
					<BerxButton
						label={place.is_saved ? 'Сохранено' : 'Сохранить'}
						variant={place.is_saved ? 'primary' : 'secondary'}
						loading={saving}
						onPress={toggleSave}
					/>
					{onAddToCollection ? <BerxButton label="В подборку" variant="secondary" onPress={onAddToCollection} /> : null}
					{place.lat !== null && place.lng !== null ? <BerxButton label="Маршрут" variant="secondary" onPress={buildRoute} /> : null}
				</BerxActionShelf>

				{isOwner ? (
					<BerxActionShelf variant="anchored">
						<BerxButton
							label={place.is_business ? 'Отключить бизнес-статус' : 'Стать бизнесом'}
							variant="secondary"
							loading={businessBusy}
							onPress={toggleBusiness}
						/>
						{place.is_business && onOpenBusinessDashboard ? (
							<BerxButton label="Панель бизнеса" variant="secondary" onPress={() => onOpenBusinessDashboard(place.guid)} />
						) : null}
					</BerxActionShelf>
				) : null}

				{/**
				 * The photograph and the removal — both real, both
				 * ownership-checked server-side, and neither reachable
				 * from anywhere in BERX until now. A place could be
				 * created and then never given a cover or taken down.
				 */}
				{isOwner ? (
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton
							label={place.cover_url ? 'Заменить фото' : 'Добавить фото'}
							variant="secondary"
							loading={coverBusy}
							onPress={pickCover}
							fullWidth
						/>
						<BerxButton label="Изменить место" variant="secondary" onPress={() => setEditing(true)} fullWidth />
						<BerxButton label="Удалить место" variant="danger" onPress={() => setConfirmDelete(true)} fullWidth />
					</BerxActionShelf>
				) : null}

				<BerxEditSheet
					visible={editing}
					title="Изменить место"
					offline={offline}
					fields={[
						{key: 'title', kind: 'text', label: 'Название', value: place.title, required: true},
						{key: 'description', kind: 'multiline', label: 'Описание', value: place.description},
						{key: 'category', kind: 'text', label: 'Категория', value: place.category ?? ''},
						{key: 'address', kind: 'text', label: 'Адрес', value: place.address ?? ''},
						{key: 'phone', kind: 'text', label: 'Телефон', value: place.phone ?? ''},
						{key: 'website', kind: 'text', label: 'Сайт', value: place.website ?? ''},
						{key: 'hours', kind: 'text', label: 'Часы работы', value: place.hours ?? '', hint: 'Как их читают люди, а не как их хранит сервер.'},
						{key: 'price', kind: 'number', label: 'Уровень цен', value: place.price},
					]}
					onSave={saveEdits}
					onClose={() => setEditing(false)}
					testID="place-edit"
				/>
				{ownerError ? (
					<BerxText role="meta" liveRegion="polite" style={styles.ownerError}>
						{ownerError}
					</BerxText>
				) : null}

				<BerxConfirm
					visible={confirmDelete}
					title={`Удалить «${place.title}»?`}
					body="Место исчезнет из поиска и с карты вместе с отзывами, часами работы и сохранениями других людей. Это нельзя отменить."
					confirmLabel="Удалить"
					destructive
					onConfirm={removePlace}
					onCancel={() => setConfirmDelete(false)}
					testID="place-delete-confirm"
				/>

				{place.description ? (
					<BerxSection leading>
						<BerxText role="body">{place.description}</BerxText>
					</BerxSection>
				) : null}

				{/* the practical facts about a place, as a real grouped
				    list with the icon set's own drawings. They were three
				    lines of grey text prefixed with emoji, and the phone
				    number appeared twice on the screen. */}
				{place.hours || place.phone || place.website ? (
					<BerxSection label="Контакты">
					<BerxListGroup>
						{place.hours ? <BerxListRow icon="clock" label={place.hours} last={!place.phone && !place.website} /> : null}
						{place.phone ? <BerxListRow icon="phone" label={place.phone} last={!place.website} /> : null}
						{place.website ? <BerxListRow icon="globe" label={place.website} last /> : null}
					</BerxListGroup>
					</BerxSection>
				) : null}

				<BerxSection label="Отзывы" detail={reviews.length > 0 ? berxCount(reviews.length, 'отзыв', 'отзыва', 'отзывов') : undefined}>
				{!isOwner && !alreadyReviewed ? (
					<View style={styles.reviewForm}>
						<View style={styles.starRow}>
							{[1, 2, 3, 4, 5].map((n) => (
								<Pressable
									key={n}
									accessibilityRole="radio"
									accessibilityLabel={`Оценка ${n} из 5`}
									accessibilityState={{selected: n <= reviewRating}}
									onPress={() => setReviewRating(n)}
									style={styles.starTarget}>
									{/* the icon set's own star, in the state it is in —
									    cyan is stateful by contract, so an unset star is
									    neutral rather than a dimmer accent */}
									<BerxIcon name="star" size={26} state={n <= reviewRating ? 'active' : 'default'} decorative />
								</Pressable>
							))}
						</View>
						<BerxInput placeholder="Ваш отзыв" value={reviewText} onChangeText={setReviewText} multiline />
						<BerxButton label="Отправить" loading={submitting} disabled={reviewText.trim().length === 0} onPress={submitReview} />
					</View>
				) : isOwner ? (
					<BerxText role="meta" emphasis="tertiary">
						Нельзя оставить отзыв о собственном месте.
					</BerxText>
				) : (
					<BerxText role="meta" emphasis="tertiary">
						Вы уже оставили отзыв.
					</BerxText>
				)}

				{reviews.map((r) => (
					<View key={r.guid} style={[styles.reviewRow, {borderTopColor: dividerColor}]}>
						<View style={styles.reviewHead}>
							<BerxText role="callout">{r.author?.fullname ?? 'Пользователь'}</BerxText>
							<BerxStars value={r.rating} />
						</View>
						{r.text ? (
							<BerxText role="body" emphasis="secondary">
								{r.text}
							</BerxText>
						) : null}

						{r.owner_reply ? (
							<View style={[styles.replyBlock, {borderLeftColor: accent}]}>
								<BerxText role="micro" emphasis="accent">
									Ответ владельца
								</BerxText>
								<BerxText role="meta" emphasis="secondary">
									{r.owner_reply.text}
								</BerxText>
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
				</BerxSection>

				<BerxSection label="Обсуждение">
					<BerxDiscussion api={api} type="place" id={place.guid} myGuid={myGuid || undefined} />
				</BerxSection>
			</View>
		</BerxSceneScroll>
	);
}

const styles = StyleSheet.create({
	ownerError: {color: colors.danger},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	hero: {aspectRatio: 1.6, backgroundColor: colors.graphite},
	heroImage: {width: '100%', height: '100%'},
	heroFallback: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	heroInitial: {fontSize: typography.sizeHero, color: colors.textFaint},
	/* the sections carry their own rhythm now, so the body only sets
	   the gutter */
	body: {paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl},
	metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	chipText: {fontSize: typography.sizeXs, color: colors.textDim},
	ratingText: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
	verifiedBadge: {flexDirection: 'row', alignItems: 'center', gap: 5},
	actions: {flexDirection: 'row', gap: spacing.sm},
	reviewForm: {gap: spacing.sm},
	starRow: {flexDirection: 'row', gap: spacing.xs},
	/* 44dp around a 26dp glyph: the target is not the drawing */
	starTarget: {minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center'},
	reviewRow: {gap: spacing.xs, paddingVertical: spacing.sm, borderTopWidth: 1},
	reviewHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
	/* the owner's reply is marked by the scene's own accent, passed
	   in below — the token accent is one colour in every colour world */
	replyBlock: {marginTop: 4, paddingLeft: spacing.sm, borderLeftWidth: 2},
	replyForm: {marginTop: spacing.xs, gap: spacing.xs},
});
