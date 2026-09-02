/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX ONBOARDING — the first-run sequence, on the same lit stage as
 * splash, welcome and discover (BerxStage). The camera rises step by
 * step, so the last step is recognisably the same city as the first,
 * seen from further up: one continuous move through one place, not
 * seven backdrops.
 *
 * EVERY STEP DOES SOMETHING REAL, OR IT IS NOT HERE.
 *
 *  - Откуда   — real search over real places (GET /places?q=), and the
 *               chosen place's REAL coordinates drive a real GET
 *               /places/nearby. Nothing is persisted: BERX has no
 *               "home location" field, and inventing one to make the
 *               step feel weightier would be inventing data. Its real
 *               outcome is that the Places step below opens on that
 *               neighbourhood.
 *  - Интересы — real GET/POST /me/interests (ossn_user_interests,
 *               classes/OssnUserInterests.php, migration
 *               upgrade/upgrades/1785172200.php). The vocabulary comes
 *               down WITH the answer, so it is the same whitelist
 *               /places/categories serves, never a second copy. This
 *               is also the step that makes the next one work: Places
 *               is fetched with for_you=1, which re-orders on exactly
 *               these saved slugs.
 *  - Люди     — real GET /people/discovery (mutual friends / shared
 *               communities) and a real POST /friends/{guid}/add. BERX
 *               friendship, NOT a follower graph.
 *  - Места    — real places, real POST /places/{guid}/save.
 *  - Сообщества — real communities, real POST /communities/{guid}/join.
 *  - Профиль  — real POST /me/avatar. The BERX ID/name shown are the
 *               real values registration already collected, confirmed
 *               here, never re-asked and never fabricated.
 *
 * NO STEP IS MANDATORY and no step shows a number BERX cannot prove.
 * Where a list comes back empty, the step says so plainly and moves
 * on — an onboarding that invents three suggested friends to look
 * populated is the exact thing this file refuses to be.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, Image, Pressable, ScrollView, ActivityIndicator, Dimensions, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxUser, BerxPlace, BerxCommunity, BerxPeopleSuggestion, BerxPlaceCategory} from '@berx/api/types';
import {ruPlural} from '@berx/domain';
import {spacing, typography, radius, fonts} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxAvatar} from '../../../../packages/design-system/src/components/BerxAvatar';
import {BerxEntryStage} from '../../../../packages/design-system/src/components/BerxEntryStage';
import {BerxMark} from '../../../../packages/design-system/src/components/BerxLogo';
import {BerxPrimaryAction, BerxQuietAction} from '../../../../packages/design-system/src/components/BerxActions';
import {BERX_SCENE} from '../../../../packages/design-system/src/palette';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxPlaceCard} from '../../../../packages/design-system/src/components/BerxSpatialCards';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

type StepKey = 'location' | 'interests' | 'people' | 'places' | 'communities' | 'profile' | 'done';

const STEPS: StepKey[] = ['location', 'interests', 'people', 'places', 'communities', 'profile', 'done'];

/** Two tiles and a peek of the third: the rail reads as continuing. */
const PLACE_TILE_W = Math.round(Dimensions.get('window').width * 0.52);

interface Props {
	api: BerxApiClient;
	user: BerxUser;
	pickImage: () => Promise<BerxFilePart | null>;
	onComplete: () => void;
}

export default function OnboardingScreen({api, user, pickImage, onComplete}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [stepIndex, setStepIndex] = useState(0);
	const step = STEPS[stepIndex];

	// Carried between steps: the place chosen in step 1 seeds step 4, and
	// the interests saved in step 2 are what for_you=1 re-orders on.
	const [origin, setOrigin] = useState<BerxPlace | null>(null);
	const [interests, setInterests] = useState<string[]>([]);

	const next = useCallback(() => setStepIndex((i: number) => Math.min(i + 1, STEPS.length - 1)), []);

	return (
		<BerxEntryStage
			progress={0.4 + (stepIndex / (STEPS.length - 1)) * 0.6}
			field={0.42}
			presence={0.34}>
			{/* Progress is real: it counts the steps this sequence actually
			    has, and it is the only chrome above the content. */}
			{step !== 'done' ? (
				<View style={styles.progress}>
					{STEPS.slice(0, STEPS.length - 1).map((s: StepKey, i: number) => (
						<View key={s} style={[styles.tick, i <= stepIndex && styles.tickDone]} />
					))}
				</View>
			) : null}

			{step === 'location' ? (
				<LocationStep api={api} origin={origin} onPick={setOrigin} onNext={next} />
			) : step === 'interests' ? (
				<InterestsStep api={api} onSaved={setInterests} onNext={next} />
			) : step === 'people' ? (
				<PeopleStep api={api} onNext={next} />
			) : step === 'places' ? (
				<PlacesStep api={api} origin={origin} interests={interests} onNext={next} />
			) : step === 'communities' ? (
				<CommunitiesStep api={api} onNext={next} />
			) : step === 'profile' ? (
				<ProfileStep api={api} user={user} pickImage={pickImage} onNext={next} />
			) : (
				<DoneStep user={user} onComplete={onComplete} />
			)}
		</BerxEntryStage>
	);
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                       */
/* ------------------------------------------------------------------ */

function StepHead({eyebrow, lines, accentLine, body}: {eyebrow: string; lines: string[]; accentLine?: number; body: string}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<BerxFadeIn riseFrom={22} style={styles.head}>
			<Text style={styles.eyebrow}>{eyebrow}</Text>
			{lines.map((line: string, i: number) => (
				<Text key={line} style={[styles.display, i === accentLine && styles.displayAccent]}>
					{line}
				</Text>
			))}
			<Text style={styles.body}>{body}</Text>
		</BerxFadeIn>
	);
}

function StepFooter({
	primary,
	onPrimary,
	primaryDisabled,
	loading,
	onSkip,
	skipLabel = 'Пропустить',
}: {
	primary: string;
	onPrimary: () => void;
	primaryDisabled?: boolean;
	loading?: boolean;
	onSkip?: () => void;
	skipLabel?: string;
}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.footer}>
			<BerxPrimaryAction
				label={loading ? '…' : primary}
				onPress={primaryDisabled || loading ? () => undefined : onPrimary}
				tone={BERX_SCENE.light}
				ink="#26100A"
				style={primaryDisabled || loading ? styles.actionMuted : undefined}
			/>
			{onSkip ? <BerxQuietAction label={skipLabel} onPress={onSkip} /> : null}
		</View>
	);
}

/** Shown wherever a real list came back empty. Never a fabricated row. */
function EmptyNote({text}: {text: string}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return <Text style={styles.emptyNote}>{text}</Text>;
}

/* ------------------------------------------------------------------ */
/* 1. Откуда вы                                                        */
/* ------------------------------------------------------------------ */

/**
 * No device geolocation exists in this app: there is no geolocation
 * native module in the dependency tree (PlacesNearbyScreen's own header
 * documents the same constraint), so a "разрешить геолокацию" button
 * here would be a control that cannot do what it says. Instead the step
 * asks for a real place by name, searches REAL places, and uses that
 * place's REAL lat/lng for a real nearby lookup.
 */
function LocationStep({
	api,
	origin,
	onPick,
	onNext,
}: {
	api: BerxApiClient;
	origin: BerxPlace | null;
	onPick: (p: BerxPlace | null) => void;
	onNext: () => void;
}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<BerxPlace[]>([]);
	const [searching, setSearching] = useState(false);
	const [nearbyCount, setNearbyCount] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function search() {
		if (!query.trim()) return;
		setSearching(true);
		setError(null);
		try {
			const res = await api.places(query.trim());
			setResults(Array.isArray(res?.places) ? res.places : []);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось найти места');
		} finally {
			setSearching(false);
		}
	}

	async function choose(place: BerxPlace) {
		onPick(place);
		setNearbyCount(null);
		if (place.lat === null || place.lng === null) {
			// Real, honest branch: a place without coordinates cannot anchor
			// a nearby lookup, and the step says so instead of showing 0.
			return;
		}
		try {
			const res = await api.nearbyPlaces(place.lat, place.lng, 5);
			setNearbyCount(Array.isArray(res?.places) ? res.places.length : null);
		} catch {
			setNearbyCount(null);
		}
	}

	return (
		<>
			<BerxFadeIn riseFrom={20} scaleFrom={0.88} style={styles.objectSlot}>
				<BerxMark size={72} light={colors.accent} body="#4A2C2A" />
			</BerxFadeIn>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<StepHead
					eyebrow="Шаг 1 · Откуда"
					lines={['Где вы', 'обычно', 'бываете?']}
					accentLine={2}
					body="Назовите место, которое знаете — от него BERX покажет, что рядом. Ничего не сохраняется: это только точка отсчёта."
				/>
				<View style={styles.searchRow}>
					<BerxInput placeholder="Например, кофейня рядом с домом" value={query} onChangeText={setQuery} onSubmitEditing={search} />
				</View>
				<BerxButton label="Найти" variant="secondary" onPress={search} loading={searching} fullWidth />
				{error ? <Text style={styles.error}>{error}</Text> : null}
				{origin ? (
					<BerxGlassSurface level={3} padding="lg" radius={radius.xl} style={styles.chosen}>
						<Text style={styles.chosenTitle}>{origin.title}</Text>
						{origin.address ? <Text style={styles.chosenSub}>{origin.address}</Text> : null}
						<Text style={styles.chosenNote}>
							{origin.lat === null || origin.lng === null
								? 'У этого места пока нет координат — искать рядом не получится.'
								: nearbyCount === null
								? 'Смотрим, что рядом…'
								: nearbyCount === 0
								? 'Рядом пока ничего не добавлено. Вы можете стать первым.'
								: `Рядом ${nearbyCount} ${ruPlural(nearbyCount, 'место', 'места', 'мест')} в радиусе 5 км.`}
						</Text>
					</BerxGlassSurface>
				) : null}
				{!origin && results.length === 0 && !searching && query !== '' ? (
					<EmptyNote text="Ничего не нашлось. Попробуйте другое название — или пропустите шаг." />
				) : null}
				{results.map((p: BerxPlace) => (
					<Pressable key={p.guid} style={styles.resultRow} onPress={() => choose(p)}>
						<BerxIcon name="map-pin" size={16} color={colors.accentOnMedia} />
						<View style={styles.resultBody}>
							<Text style={styles.resultTitle}>{p.title}</Text>
							{p.address ? (
								<Text style={styles.resultSub} numberOfLines={1}>
									{p.address}
								</Text>
							) : null}
						</View>
					</Pressable>
				))}
			</ScrollView>
			<StepFooter primary="Дальше" onPrimary={onNext} onSkip={onNext} />
		</>
	);
}

/* ------------------------------------------------------------------ */
/* 2. Интересы                                                         */
/* ------------------------------------------------------------------ */

function InterestsStep({api, onSaved, onNext}: {api: BerxApiClient; onSaved: (v: string[]) => void; onNext: () => void}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [options, setOptions] = useState<BerxPlaceCategory[]>([]);
	const [chosen, setChosen] = useState<string[]>([]);
	const [max, setMax] = useState(0);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let alive = true;
		api
			.myInterests()
			.then((r) => {
				if (!alive) return;
				// Defensive on purpose: /me/interests is a NEW endpoint, so a
				// client that ships ahead of the server upgrade will get the
				// dispatcher's generic body here rather than this shape. Reading
				// .length off an absent array would take the whole onboarding
				// screen down; an empty vocabulary just renders the honest
				// "список тем недоступен" branch and the step stays skippable.
				setOptions(Array.isArray(r?.options) ? r.options : []);
				setChosen(Array.isArray(r?.interests) ? r.interests : []);
				setMax(typeof r?.max === 'number' ? r.max : 0);
			})
			.catch((e) => alive && setError(e instanceof Error ? e.message : 'Не удалось загрузить темы'))
			.finally(() => alive && setLoading(false));
		return () => {
			alive = false;
		};
	}, [api]);

	function toggle(slug: string) {
		setChosen((prev: string[]) =>
			prev.includes(slug) ? prev.filter((s: string) => s !== slug) : max > 0 && prev.length >= max ? prev : [...prev, slug],
		);
	}

	async function save() {
		setSaving(true);
		setError(null);
		try {
			const res = await api.saveInterests(chosen);
			// The server echoes back exactly what it stored, which is what the
			// next step re-orders on. Falling back to the local selection keeps
			// that step correct if an older server answers without the echo,
			// rather than passing `undefined` down as a saved set.
			onSaved(Array.isArray(res?.interests) ? res.interests : chosen);
			onNext();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось сохранить');
			setSaving(false);
		}
	}

	return (
		<>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<StepHead
					eyebrow="Шаг 2 · Интересы"
					lines={['Что вам', 'интересно', 'в городе?']}
					accentLine={2}
					body={
						max > 0
							? `Выберите до ${max}. BERX будет показывать такие места первыми — и это можно изменить в любой момент.`
							: 'BERX будет показывать такие места первыми — и это можно изменить в любой момент.'
					}
				/>
				{loading ? (
					<ActivityIndicator color={colors.accent} style={styles.loader} />
				) : options.length === 0 ? (
					<EmptyNote text="Список тем сейчас недоступен." />
				) : (
					<View style={styles.chipWrap}>
						{options.map((o: BerxPlaceCategory) => {
							const active = chosen.includes(o.slug);
							return (
								<Pressable key={o.slug} style={[styles.chip, active && styles.chipActive]} onPress={() => toggle(o.slug)}>
									<Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
								</Pressable>
							);
						})}
					</View>
				)}
				{error ? <Text style={styles.error}>{error}</Text> : null}
			</ScrollView>
			<StepFooter primary="Сохранить и дальше" onPrimary={save} loading={saving} onSkip={onNext} />
		</>
	);
}

/* ------------------------------------------------------------------ */
/* 3. Люди — BERX friendship, not followers                            */
/* ------------------------------------------------------------------ */

function PeopleStep({api, onNext}: {api: BerxApiClient; onNext: () => void}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [people, setPeople] = useState<BerxPeopleSuggestion[]>([]);
	const [sent, setSent] = useState<Record<number, boolean>>({});
	const [busy, setBusy] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		api
			.peopleDiscovery()
			.then((r) => alive && setPeople(Array.isArray(r?.people) ? r.people : []))
			.catch(() => undefined)
			.finally(() => alive && setLoading(false));
		return () => {
			alive = false;
		};
	}, [api]);

	async function add(guid: number) {
		setBusy(guid);
		try {
			await api.addFriend(guid);
			setSent((prev: Record<number, boolean>) => ({...prev, [guid]: true}));
		} catch {
			// Left un-sent on failure: a row that says "отправлено" when the
			// request did not go through is a lie the user acts on later.
		} finally {
			setBusy(null);
		}
	}

	return (
		<>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<StepHead
					eyebrow="Шаг 3 · Люди"
					lines={['Кого вы', 'уже', 'знаете?']}
					accentLine={2}
					body="Заявка в друзья — она должна быть принята. В BERX дружба взаимная, здесь нет подписчиков."
				/>
				{loading ? (
					<ActivityIndicator color={colors.accent} style={styles.loader} />
				) : people.length === 0 ? (
					<EmptyNote text="Пока некого предложить — у вас ещё нет общих друзей или сообществ. Людей можно найти поиском в любой момент." />
				) : (
					people.map((p: BerxPeopleSuggestion) => (
						<View key={p.guid} style={styles.personRow}>
							<BerxAvatar iconUrl={p.icon} fallbackInitial={p.username.charAt(0)} size={46} />
							<View style={styles.personBody}>
								<Text style={styles.personName} numberOfLines={1}>
									{p.fullname}
								</Text>
								{/* Only real, server-computed overlap is stated — and only
								    when it is genuinely non-zero. */}
								{p.mutual_count > 0 ? (
									<Text style={styles.personSub}>
										{p.mutual_count} {ruPlural(p.mutual_count, 'общий друг', 'общих друга', 'общих друзей')}
									</Text>
								) : p.mutual_communities_count > 0 ? (
									<Text style={styles.personSub}>
										{p.mutual_communities_count}{' '}
										{ruPlural(p.mutual_communities_count, 'общее сообщество', 'общих сообщества', 'общих сообществ')}
									</Text>
								) : (
									<Text style={styles.personSub}>@{p.username}</Text>
								)}
							</View>
							<Pressable
								style={[styles.pill, sent[p.guid] && styles.pillDone]}
								disabled={!!sent[p.guid] || busy === p.guid}
								onPress={() => add(p.guid)}>
								<Text style={[styles.pillText, sent[p.guid] && styles.pillTextDone]}>
									{sent[p.guid] ? 'Заявка отправлена' : busy === p.guid ? '…' : 'Добавить'}
								</Text>
							</Pressable>
						</View>
					))
				)}
			</ScrollView>
			<StepFooter primary="Дальше" onPrimary={onNext} onSkip={onNext} />
		</>
	);
}

/* ------------------------------------------------------------------ */
/* 4. Места — ordered by the interests just saved                      */
/* ------------------------------------------------------------------ */

function PlacesStep({
	api,
	origin,
	interests,
	onNext,
}: {
	api: BerxApiClient;
	origin: BerxPlace | null;
	interests: string[];
	onNext: () => void;
}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [places, setPlaces] = useState<BerxPlace[]>([]);
	const [saved, setSaved] = useState<Record<number, boolean>>({});
	const [loading, setLoading] = useState(true);
	// BerxPlace.category is a SLUG ('cafe'), not a label. Rendering it raw
	// puts an internal identifier in front of the user; the real labels
	// live on the server, so they are fetched rather than hardcoded here
	// (a client-side copy of the taxonomy would drift the first time the
	// server's list changes).
	const [labels, setLabels] = useState<Record<string, string>>({});

	useEffect(() => {
		let alive = true;
		api
			.placeCategories()
			.then((r) => {
				if (!alive || !Array.isArray(r?.categories)) return;
				const map: Record<string, string> = {};
				for (const c of r.categories) {
					map[c.slug] = c.label;
				}
				setLabels(map);
			})
			.catch(() => undefined);
		return () => {
			alive = false;
		};
	}, [api]);

	useEffect(() => {
		let alive = true;
		// If step 1 produced a real coordinate, this really is "рядом";
		// otherwise it is the real global list, re-ordered by the real
		// interests saved in step 2 (for_you=1). The heading below states
		// whichever of the two actually happened.
		const request =
			origin && origin.lat !== null && origin.lng !== null
				? api.nearbyPlaces(origin.lat, origin.lng, 10)
				: api.places(undefined, undefined, true);
		request
			.then((r) => alive && setPlaces(Array.isArray(r?.places) ? (r.places as BerxPlace[]) : []))
			.catch(() => undefined)
			.finally(() => alive && setLoading(false));
		return () => {
			alive = false;
		};
	}, [api, origin]);

	async function save(guid: number) {
		try {
			const res = await api.savePlace(guid);
			setSaved((prev: Record<number, boolean>) => ({...prev, [guid]: res.is_saved}));
		} catch {
			// Same rule as the people step: no optimistic tick on failure.
		}
	}

	const near = !!(origin && origin.lat !== null && origin.lng !== null);
	return (
		<>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<StepHead
					eyebrow="Шаг 4 · Места"
					lines={['Сохраните', 'то, куда', 'вернётесь']}
					accentLine={2}
					body={
						near
							? `Рядом с «${origin?.title}». Сохранённые места собираются в вашем профиле.`
							: interests.length > 0
							? 'Сначала — по выбранным вами темам. Сохранённые места собираются в вашем профиле.'
							: 'Сохранённые места собираются в вашем профиле.'
					}
				/>
				{loading ? (
					<ActivityIndicator color={colors.accent} style={styles.loader} />
				) : places.length === 0 ? (
					<EmptyNote text="В BERX пока нет мест, которые можно показать. Их можно добавить самому — с карты или из раздела «Создать»." />
				) : (
					// A rail of real photographs, not a settings list. A place is
					// chosen by how it looks; a 54pt thumbnail beside a title is
					// the shape of a preferences screen, and it puts controls
					// ahead of media.
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.railScroll}
						contentContainerStyle={styles.rail}>
						{places.slice(0, 12).map((p: BerxPlace) => {
							const isSaved = saved[p.guid] ?? p.is_saved;
							return (
								<Pressable key={p.guid} style={styles.placeTile} onPress={() => save(p.guid)}>
									<BerxPlaceCard
										title={p.title}
										imageUrl={p.cover_url}
										category={(p.category ? labels[p.category] : undefined) ?? p.address ?? undefined}
										rating={p.rating_count > 0 ? p.rating : undefined}
										width={PLACE_TILE_W}
										onPress={() => save(p.guid)}
									/>
									<View style={[styles.saveBadge, isSaved && styles.saveBadgeOn]}>
										<BerxIcon
											name={isSaved ? 'badge-check' : 'bookmark'}
											size={16}
											color={isSaved ? colors.onAccent : colors.onMedia}
										/>
									</View>
								</Pressable>
							);
						})}
					</ScrollView>
				)}
			</ScrollView>
			<StepFooter primary="Дальше" onPrimary={onNext} onSkip={onNext} />
		</>
	);
}

/* ------------------------------------------------------------------ */
/* 5. Сообщества                                                       */
/* ------------------------------------------------------------------ */

function CommunitiesStep({api, onNext}: {api: BerxApiClient; onNext: () => void}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [items, setItems] = useState<BerxCommunity[]>([]);
	const [joined, setJoined] = useState<Record<number, boolean>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;
		// Trending first — it is a real 7-day engagement ranking (OssnSignals),
		// not a curated list — and the plain list as a real fallback when
		// nothing has signals yet.
		api
			.trendingCommunities(10)
			.then((r) =>
				Array.isArray(r?.communities) && r.communities.length > 0
					? (r.communities as BerxCommunity[])
					: api.communities().then((c) => (Array.isArray(c?.communities) ? c.communities : [])),
			)
			.then((c) => alive && setItems(c))
			.catch(() => undefined)
			.finally(() => alive && setLoading(false));
		return () => {
			alive = false;
		};
	}, [api]);

	async function join(guid: number) {
		try {
			await api.joinCommunity(guid);
			setJoined((prev: Record<number, boolean>) => ({...prev, [guid]: true}));
		} catch {
			// Private communities need approval and public ones can fail; in
			// both cases the row stays un-ticked rather than claiming success.
		}
	}

	return (
		<>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<StepHead
					eyebrow="Шаг 5 · Сообщества"
					lines={['Найдите', 'своих', 'по интересу']}
					accentLine={2}
					body="Сообщества — это места для разговора и совместных планов, а не ленты для чтения."
				/>
				{loading ? (
					<ActivityIndicator color={colors.accent} style={styles.loader} />
				) : items.length === 0 ? (
					<EmptyNote text="Сообществ пока нет. Своё можно создать в разделе «Создать»." />
				) : (
					items.slice(0, 10).map((c: BerxCommunity) => {
						const isMember = joined[c.guid] ?? c.is_member;
						return (
							<View key={c.guid} style={styles.personRow}>
								{c.cover_url ? (
									<Image source={{uri: c.cover_url}} style={styles.communityCover} />
								) : (
									<View style={[styles.communityCover, styles.placeCoverBlank]}>
										<BerxIcon name="users" size={18} color={colors.onMediaFaint} />
									</View>
								)}
								<View style={styles.personBody}>
									<Text style={styles.personName} numberOfLines={1}>
										{c.name}
									</Text>
									<Text style={styles.personSub} numberOfLines={1}>
										{c.privacy === 'private' ? 'Закрытое · по заявке' : c.description || 'Открытое сообщество'}
									</Text>
								</View>
								<Pressable
									style={[styles.pill, isMember && styles.pillDone]}
									disabled={isMember}
									onPress={() => join(c.guid)}>
									<Text style={[styles.pillText, isMember && styles.pillTextDone]}>
										{isMember ? 'Вы участник' : c.privacy === 'private' ? 'Заявка' : 'Вступить'}
									</Text>
								</Pressable>
							</View>
						);
					})
				)}
			</ScrollView>
			<StepFooter primary="Дальше" onPrimary={onNext} onSkip={onNext} />
		</>
	);
}

/* ------------------------------------------------------------------ */
/* 6. Профиль                                                          */
/* ------------------------------------------------------------------ */

function ProfileStep({
	api,
	user,
	pickImage,
	onNext,
}: {
	api: BerxApiClient;
	user: BerxUser;
	pickImage: () => Promise<BerxFilePart | null>;
	onNext: () => void;
}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [iconUrl, setIconUrl] = useState(user.icon_url);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handlePick() {
		const picked = await pickImage();
		if (!picked) return; // cancelled — a real optional action, not an error
		setUploading(true);
		setError(null);
		try {
			const res = await api.uploadAvatar(picked);
			setIconUrl(res.icon_url);
		} catch {
			setError('Не удалось загрузить фото. Можно пропустить и добавить его позже в профиле.');
		} finally {
			setUploading(false);
		}
	}

	return (
		<>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<StepHead
					eyebrow="Шаг 6 · Профиль"
					lines={['Как вас', 'узнают', 'в BERX']}
					accentLine={2}
					body="BERX ID уже занят за вами — по нему вас найдут друзья, места и события."
				/>
				<BerxGlassSurface level={3} padding="lg" radius={radius.xl} style={styles.identity}>
					<Pressable onPress={handlePick} style={styles.avatarSlot}>
						<BerxAvatar iconUrl={iconUrl} fallbackInitial={user.username.charAt(0)} size={92} />
						<View style={styles.avatarBadge}>
							<BerxIcon name="camera" size={15} color={colors.onAccent} />
						</View>
					</Pressable>
					<Text style={styles.identityName}>{user.fullname}</Text>
					<Text style={styles.identityHandle}>@{user.username}</Text>
					{error ? <Text style={styles.error}>{error}</Text> : null}
					<BerxButton
						label={iconUrl ? 'Сменить фото' : 'Добавить фото'}
						variant="secondary"
						onPress={handlePick}
						loading={uploading}
						fullWidth
					/>
				</BerxGlassSurface>
			</ScrollView>
			<StepFooter primary="Готово" onPrimary={onNext} onSkip={onNext} skipLabel="Добавлю позже" />
		</>
	);
}

/* ------------------------------------------------------------------ */
/* 7. Готово                                                           */
/* ------------------------------------------------------------------ */

function DoneStep({user, onComplete}: {user: BerxUser; onComplete: () => void}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const first = user.first_name || user.fullname;
	return (
		<>
			<BerxFadeIn riseFrom={26} scaleFrom={0.86} style={styles.doneObject}>
				<BerxMark size={110} light={colors.accent} body="#4A2C2A" />
			</BerxFadeIn>
			<View style={styles.doneCopy}>
				<BerxFadeIn delayMs={200} riseFrom={22}>
					<Text style={styles.eyebrow}>Готово</Text>
					<Text style={styles.display}>{first},</Text>
					<Text style={[styles.display, styles.displayAccent]}>город ваш</Text>
					<Text style={styles.body}>
						Всё, что вы выбрали, уже сохранено. Остальное — в приложении: карта, события и люди рядом.
					</Text>
				</BerxFadeIn>
			</View>
			<View style={styles.footer}>
				<BerxPrimaryAction label="Открыть BERX" onPress={onComplete} tone={BERX_SCENE.light} ink="#26100A" />
			</View>
		</>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	progress: {flexDirection: 'row', gap: 4, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl},
	tick: {flex: 1, height: 2, borderRadius: radius.pill, backgroundColor: colors.onMediaFaint, opacity: 0.4},
	tickDone: {backgroundColor: colors.accent, opacity: 1},
	objectSlot: {position: 'absolute', top: '8%', right: '6%'},
	scroll: {paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 190, gap: spacing.sm},
	head: {marginBottom: spacing.lg},
	eyebrow: {
		fontSize: typography.sizeXs,
		color: colors.accent,
		textTransform: 'uppercase',
		letterSpacing: 2.4,
		marginBottom: spacing.md,
		fontWeight: typography.weightBold,
	},
	display: {fontFamily: fonts.display, fontSize: 44, lineHeight: 47, color: colors.onMedia, letterSpacing: -0.6},
	displayAccent: {fontFamily: fonts.displayItalic, color: colors.accent},
	actionMuted: {opacity: 0.42},
	body: {fontSize: typography.sizeSm, lineHeight: 20, color: colors.onMediaDim, marginTop: spacing.lg, maxWidth: 320},
	footer: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl, gap: spacing.sm},
	loader: {marginTop: spacing.xl},
	error: {color: colors.danger, fontSize: typography.sizeSm, marginTop: spacing.sm},
	emptyNote: {color: colors.onMediaDim, fontSize: typography.sizeSm, lineHeight: 20, marginTop: spacing.md},

	searchRow: {marginBottom: spacing.sm},
	chosen: {marginTop: spacing.md, gap: 4},
	chosenTitle: {color: colors.onMedia, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	chosenSub: {color: colors.onMediaDim, fontSize: typography.sizeSm},
	chosenNote: {color: colors.accent, fontSize: typography.sizeSm, marginTop: spacing.sm},
	resultRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md},
	resultBody: {flex: 1},
	resultTitle: {color: colors.onMedia, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	resultSub: {color: colors.onMediaFaint, fontSize: typography.sizeXs, marginTop: 2},

	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm},
	chip: {paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderSoft},
	chipActive: {backgroundColor: colors.accentSoft, borderColor: colors.accent},
	chipText: {color: colors.onMediaDim, fontSize: typography.sizeSm},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},

	personRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		marginBottom: spacing.sm,
		borderRadius: radius.lg,
		backgroundColor: colors.glass1,
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	personBody: {flex: 1},
	personName: {color: colors.onMedia, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	personSub: {color: colors.onMediaFaint, fontSize: typography.sizeXs, marginTop: 2},
	pill: {paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.accent},
	pillDone: {borderColor: colors.borderSoft},
	pillText: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	pillTextDone: {color: colors.onMediaFaint},

	railScroll: {flexGrow: 0, flexShrink: 0, marginHorizontal: -spacing.xl},
	rail: {paddingHorizontal: spacing.xl, gap: spacing.md, paddingVertical: spacing.xs},
	placeTile: {width: PLACE_TILE_W},
	saveBadge: {
		position: 'absolute',
		top: spacing.sm,
		right: spacing.sm,
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.mediaScrim,
		opacity: 0.86,
	},
	saveBadgeOn: {backgroundColor: colors.accent, opacity: 1},
	placeCoverBlank: {alignItems: 'center', justifyContent: 'center'},
	communityCover: {width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.glass2},

	identity: {alignItems: 'center', marginTop: spacing.md, gap: spacing.sm},
	avatarSlot: {marginBottom: spacing.sm},
	avatarBadge: {
		position: 'absolute',
		right: -2,
		bottom: -2,
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
	},
	identityName: {color: colors.onMedia, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	identityHandle: {color: colors.accent, fontSize: typography.sizeBase, marginBottom: spacing.md},

	doneObject: {position: 'absolute', top: '16%', alignSelf: 'center'},
	doneCopy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 190},
});
