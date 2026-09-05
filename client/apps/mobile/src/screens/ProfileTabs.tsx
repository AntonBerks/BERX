/**
 * BERX-122 … BERX-127 — the profile as one tabbed surface.
 *
 * The archive names six profile screens, and they are not six
 * destinations: Moments, Places, Events, Experiences, About and
 * Connections are tabs on one profile, sharing its hero, its stats and
 * its atmosphere. BERX had the hero and then a menu of links to other
 * screens, which is a different product.
 *
 * Each tab shows real data or says why it cannot:
 *
 *   Moments      userAlbums(guid)      — real, any profile
 *   Places       savedPlaces()         — the caller's own saved places.
 *                                        There is no endpoint for
 *                                        another person's, so another
 *                                        person's profile says so.
 *   Events       BLOCKED               — /events is a discovery list
 *                                        with no user filter, and the
 *                                        per-user aggregation that
 *                                        exists is behind the creator
 *                                        extension. Not faked from the
 *                                        discovery list.
 *   Experiences  experiences(guid)     — real, any profile
 *   About        the loaded profile    — real fields only
 *   Connections  friends()             — the caller's own, same limit
 *                                        as Places
 *
 * A tab that cannot show another person's data renders that as a
 * stated absence, not as an empty list — "nothing here" and "BERX
 * cannot ask" are different things and the difference matters.
 */
import {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxAlbum, BerxExperience, BerxFriend, BerxPlace} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxScreenScene} from '../spatial/BerxScreenScene';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';

/** The archive's six, in the archive's order. */
export type BerxProfileTab = 'moments' | 'places' | 'events' | 'experiences' | 'about' | 'connections';

const TAB_CONTRACT: Record<BerxProfileTab, string> = {
	moments: 'BERX-122',
	places: 'BERX-123',
	events: 'BERX-124',
	experiences: 'BERX-125',
	about: 'BERX-126',
	connections: 'BERX-127',
};

const TAB_LABEL: Record<BerxProfileTab, string> = {
	moments: 'Моменты',
	places: 'Места',
	events: 'События',
	experiences: 'Впечатления',
	about: 'О себе',
	connections: 'Связи',
};

/**
 * Only what the tabs actually read. `me()` and `getProfile()` return
 * different shapes, and widening one to the other here would mean
 * claiming fields that are not always present.
 */
export interface ProfileTabsSubject {
	guid?: number;
	username: string;
	fullname: string;
	is_friend?: boolean;
	is_creator?: boolean;
}

export interface ProfileTabsProps {
	api: BerxApiClient;
	profile: ProfileTabsSubject;
	isOwn: boolean;
	onOpenAlbum?: (guid: number) => void;
	onOpenPlace?: (guid: number) => void;
	onOpenExperience?: (id: number) => void;
	onOpenProfile?: (username: string) => void;
}

export function ProfileTabs({
	api,
	profile,
	isOwn,
	onOpenAlbum,
	onOpenPlace,
	onOpenExperience,
	onOpenProfile,
}: ProfileTabsProps) {
	const [tab, setTab] = useState<BerxProfileTab>('moments');
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [albums, setAlbums] = useState<BerxAlbum[]>([]);
	const [places, setPlaces] = useState<BerxPlace[]>([]);
	const [experiences, setExperiences] = useState<BerxExperience[]>([]);
	const [friends, setFriends] = useState<BerxFriend[]>([]);

	const load = useCallback(async () => {
		if (!profile.guid) return;
		if (tab === 'about') {
			setState('default');
			return;
		}
		if ((tab === 'places' || tab === 'connections') && !isOwn) {
			/* not an error and not empty: the API has no endpoint for
			   another person's saved places or friends */
			setState('disabled');
			return;
		}
		if (tab === 'events') {
			setState('disabled');
			return;
		}
		setState('loading');
		setError(null);
		try {
			if (tab === 'moments') {
				const res = await api.userAlbums(profile.guid);
				setAlbums(res.albums);
				setState(res.albums.length === 0 ? 'empty' : 'default');
			} else if (tab === 'places') {
				const res = await api.savedPlaces();
				setPlaces(res.places);
				setState(res.places.length === 0 ? 'empty' : 'default');
			} else if (tab === 'experiences') {
				const res = await api.experiences(profile.guid);
				setExperiences(res.experiences);
				setState(res.experiences.length === 0 ? 'empty' : 'default');
			} else if (tab === 'connections') {
				const res = await api.friends();
				setFriends(res.friends);
				setState(res.friends.length === 0 ? 'empty' : 'default');
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
			setState('error');
		}
	}, [api, tab, profile.guid, isOwn]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<View style={styles.root} testID={`profile-tabs-${TAB_CONTRACT[tab]}`}>
			<BerxSegmentTabs
				options={(Object.keys(TAB_LABEL) as BerxProfileTab[]).map((k) => ({key: k, label: TAB_LABEL[k]}))}
				value={tab}
				onChange={(key) => setTab(key as BerxProfileTab)}
			/>

			{/**
			 * Each tab is its own v9 contract, resolved for real: the
			 * archive gives BERX-122…127 their own material, light
			 * recipe and depth profile, and rendering all six inside
			 * the overview's scene would mean five contracts that
			 * resolve nowhere. The scene is bounded by this panel, so
			 * it is a room inside the profile's room rather than a
			 * second full-screen environment, and each tab view is a
			 * real screen view in the archive's own analytics terms.
			 */}
			<View style={styles.panel}>
			<BerxScreenScene screenId={TAB_CONTRACT[tab]} testID={`profile-tab-${tab}`}>
			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				emptyTitle={emptyTitleFor(tab, isOwn)}
				disabledReason={disabledReasonFor(tab, isOwn)}
				/* a 403-shaped absence: retrying cannot make an endpoint exist */
				retryable={state !== 'disabled'}
				style={styles.body}>
				{tab === 'about' ? (
					<BerxSpatialCard depth="D3" padding={spacing.lg} radius={18}>
						<Text style={styles.aboutName}>{profile.fullname}</Text>
						<Text style={styles.aboutHandle}>@{profile.username}</Text>
						{/* only fields the API actually returns */}
						<Text style={styles.aboutFact}>{profile.is_creator ? 'Создаёт контент в BERX' : 'Участник BERX'}</Text>
						{!isOwn ? (
							<Text style={styles.aboutFact}>{profile.is_friend ? 'У вас в друзьях' : 'Не в друзьях'}</Text>
						) : null}
					</BerxSpatialCard>
				) : tab === 'moments' ? (
					<View style={styles.list}>
						{albums.map((a) => (
							<BerxSpatialCard
								key={a.guid}
								depth="D3"
								padding={spacing.md}
								radius={18}
								onPress={onOpenAlbum ? () => onOpenAlbum(a.guid) : undefined}
								accessibilityLabel={a.title}>
								<Text style={styles.itemTitle} numberOfLines={1}>
									{a.title}
								</Text>
							</BerxSpatialCard>
						))}
					</View>
				) : tab === 'places' ? (
					<View style={styles.list}>
						{places.map((p) => (
							<BerxSpatialCard
								key={p.guid}
								depth="D3"
								padding={spacing.md}
								radius={18}
								onPress={onOpenPlace ? () => onOpenPlace(p.guid) : undefined}
								accessibilityLabel={p.title}>
								<Text style={styles.itemTitle} numberOfLines={1}>
									{p.title}
								</Text>
								{p.address ? (
									<Text style={styles.itemMeta} numberOfLines={1}>
										{p.address}
									</Text>
								) : null}
							</BerxSpatialCard>
						))}
					</View>
				) : tab === 'experiences' ? (
					<View style={styles.list}>
						{experiences.map((x) => (
							<BerxSpatialCard
								key={x.id}
								depth="D3"
								padding={spacing.md}
								radius={18}
								onPress={onOpenExperience ? () => onOpenExperience(x.id) : undefined}
								accessibilityLabel={x.title}>
								<Text style={styles.itemTitle} numberOfLines={1}>
									{x.title}
								</Text>
								{x.anchor ? (
									<Text style={styles.itemMeta} numberOfLines={1}>
										{x.anchor.title}
									</Text>
								) : null}
							</BerxSpatialCard>
						))}
					</View>
				) : (
					<View style={styles.list}>
						{friends.map((f) => (
							<BerxSpatialCard key={f.guid} depth="D3" padding={spacing.md} radius={18}>
								<BerxIdentity
									userGuid={f.guid}
									name={f.fullname}
									handle={f.username}
									avatarUrl={f.icon}
									relationship="friend"
									onPress={onOpenProfile ? () => onOpenProfile(f.username) : undefined}
								/>
							</BerxSpatialCard>
						))}
					</View>
				)}
			</BerxDataBoundary>
			</BerxScreenScene>
			</View>
		</View>
	);
}

function emptyTitleFor(tab: BerxProfileTab, isOwn: boolean): string {
	switch (tab) {
		case 'moments':
			return isOwn ? 'У вас пока нет альбомов' : 'Альбомов пока нет';
		case 'places':
			return 'Сохранённых мест пока нет';
		case 'experiences':
			return 'Впечатлений пока нет';
		case 'connections':
			return 'Пока никого';
		default:
			return 'Пусто';
	}
}

/**
 * The exact dependency, not a shrug. A person reading this should be
 * able to tell whether BERX is hiding something or genuinely cannot
 * ask for it.
 */
function disabledReasonFor(tab: BerxProfileTab, isOwn: boolean): string {
	if (tab === 'events') {
		return 'В API нет выборки событий по пользователю: /events — это общий поиск, а агрегация по автору есть только в расширении «Создатель».';
	}
	if (isOwn) return 'Эти данные доступны только владельцу профиля.';
	return tab === 'places'
		? 'В API нет запроса сохранённых мест другого пользователя — только своих.'
		: 'В API нет запроса списка друзей другого пользователя — только своего.';
}

const styles = StyleSheet.create({
	root: {gap: spacing.md, paddingHorizontal: spacing.lg},
	/* the tab's room is bounded by its panel and clipped to it: a room
	   inside a room, not a second full-screen environment */
	panel: {borderRadius: 22, overflow: 'hidden', minHeight: 160},
	body: {minHeight: 120},
	list: {gap: spacing.sm},
	itemTitle: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	itemMeta: {color: colors.textDim, fontSize: typography.sizeXs, marginTop: 2},
	aboutName: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	aboutHandle: {color: colors.textDim, fontSize: typography.sizeSm, marginBottom: spacing.sm},
	aboutFact: {color: colors.textDim, fontSize: typography.sizeSm},
});
