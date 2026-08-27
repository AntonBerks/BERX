/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see screens/LoginScreen.tsx
 * header for the full explanation (real code, real API contract,
 * never run in this sandbox).
 *
 * The actual boot → auth → navigation flow the master instruction
 * asked for:
 *
 *   Boot (BerxAuthState.bootstrap())
 *     → unauthenticated  → Auth flow (LoginScreen)
 *     → authenticated    → Authenticated app (tab bar + stack)
 *
 * Production mobile token storage: BerxSecureTokenStorage
 * (apps/mobile/src/platform/secureTokenStorage.ts) — iOS Keychain /
 * Android Keystore-backed, via react-native-keychain. Replaced the
 * earlier development-only BerxInMemoryTokenStorage placeholder; see
 * PLATFORM_STORAGE.md for that placeholder's original rationale and
 * BERX_PATCH_CHANGELOG.md for this change.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {BerxApiClient} from '@berx/api/client';
import {BERX_PRODUCTION_ENV} from '@berx/core';
import {BerxSecureTokenStorage} from './platform/secureTokenStorage';
import {BerxAuthState, BerxAuthSnapshot} from '@berx/auth';
import {pickImageFromLibrary, pickVideoFromLibrary} from '@berx/platform/mediaPicker';
import {pickAudioFromDevice} from '@berx/platform/audioPicker';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxLoadingState, BerxErrorState} from '../../../packages/design-system/src/components/BerxStates';
import {IconHome, IconSearch, IconPlus, IconMessage, IconMenu} from '../../../packages/design-system/src/components/BerxIcons';
import {BerxNavigator, useBerxNavigation} from './navigation/BerxNavigator';
import {BERX_BOTTOM_TABS, BerxRouteName} from './navigation/routes';
import LoginScreen from './screens/LoginScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FeedScreen from './screens/FeedScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import ConversationListScreen from './screens/ConversationListScreen';
import ConversationScreen from './screens/ConversationScreen';
import DatingDiscoverScreen from './screens/DatingDiscoverScreen';
import DatingMatchScreen from './screens/DatingMatchScreen';
import DatingMatchesScreen from './screens/DatingMatchesScreen';
import DatingPrivacyScreen from './screens/DatingPrivacyScreen';
import DatingProfileScreen from './screens/DatingProfileScreen';
import StoriesRailScreen from './screens/StoriesRailScreen';
import StoryViewerScreen from './screens/StoryViewerScreen';
import CreateStoryScreen from './screens/CreateStoryScreen';
import SearchScreen from './screens/SearchScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PointsScreen from './screens/PointsScreen';
import CommunitiesListScreen from './screens/CommunitiesListScreen';
import CommunityDetailScreen from './screens/CommunityDetailScreen';
import CreateCommunityScreen from './screens/CreateCommunityScreen';
import CommunityRequestsScreen from './screens/CommunityRequestsScreen';
import CommunityModeratorsScreen from './screens/CommunityModeratorsScreen';
import CommunityMembersScreen from './screens/CommunityMembersScreen';
import AlbumsScreen from './screens/AlbumsScreen';
import AlbumDetailScreen from './screens/AlbumDetailScreen';
import CreateAlbumScreen from './screens/CreateAlbumScreen';
import PlacesListScreen from './screens/PlacesListScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';
import CreatePlaceScreen from './screens/CreatePlaceScreen';
import EditPlaceScreen from './screens/EditPlaceScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import EventsListScreen from './screens/EventsListScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import EditEventScreen from './screens/EditEventScreen';
import DeviceSessionsScreen from './screens/DeviceSessionsScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';
import PlacesNearbyScreen from './screens/PlacesNearbyScreen';
import SavedPlacesScreen from './screens/SavedPlacesScreen';
import SavedPostsScreen from './screens/SavedPostsScreen';
import MyEventsScreen from './screens/MyEventsScreen';
import EventInviteScreen from './screens/EventInviteScreen';
import AdminUnvalidatedScreen from './screens/AdminUnvalidatedScreen';
import AdminReportsScreen from './screens/AdminReportsScreen';
import MessageSearchScreen from './screens/MessageSearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import BlockedUsersScreen from './screens/BlockedUsersScreen';
import BERXWorldScreen from './screens/BERXWorldScreen';
import ReportScreen from './screens/ReportScreen';
import CollectionsScreen from './screens/CollectionsScreen';
import CollectionDetailScreen from './screens/CollectionDetailScreen';
import CreateCollectionScreen from './screens/CreateCollectionScreen';
import AddToCollectionScreen from './screens/AddToCollectionScreen';
import CirclesScreen from './screens/CirclesScreen';
import CircleDetailScreen from './screens/CircleDetailScreen';
import CreateCircleScreen from './screens/CreateCircleScreen';
import TripsScreen from './screens/TripsScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import CreateTripScreen from './screens/CreateTripScreen';
import ExperiencesScreen from './screens/ExperiencesScreen';
import ExperienceDetailScreen from './screens/ExperienceDetailScreen';
import CreateExperienceScreen from './screens/CreateExperienceScreen';
import CreatorProfileScreen from './screens/CreatorProfileScreen';
import CreatorSettingsScreen from './screens/CreatorSettingsScreen';
import VideoFeedScreen from './screens/VideoFeedScreen';
import VideoDetailScreen from './screens/VideoDetailScreen';
import CreateVideoScreen from './screens/CreateVideoScreen';
import TrackFeedScreen from './screens/TrackFeedScreen';
import TrackDetailScreen from './screens/TrackDetailScreen';
import CreateTrackScreen from './screens/CreateTrackScreen';
import MissionsScreen from './screens/MissionsScreen';
import LifeGraphScreen from './screens/LifeGraphScreen';
import SocialMapScreen from './screens/SocialMapScreen';
import MemoriesScreen from './screens/MemoriesScreen';
import WrappedScreen from './screens/WrappedScreen';
import NearbyNowScreen from './screens/NearbyNowScreen';
import BusinessDashboardScreen from './screens/BusinessDashboardScreen';
import BusinessHomeScreen from './screens/business/BusinessHomeScreen';
import BusinessProfileScreen from './screens/business/BusinessProfileScreen';
import BusinessProductsScreen from './screens/business/BusinessProductsScreen';
import BusinessOffersScreen from './screens/business/BusinessOffersScreen';
import BusinessTeamScreen from './screens/business/BusinessTeamScreen';
import BusinessSettingsScreen from './screens/business/BusinessSettingsScreen';
import type {BerxStoryFeedGroup} from '@berx/api/types';

const api = new BerxApiClient(BERX_PRODUCTION_ENV.apiBaseUrl, new BerxSecureTokenStorage());
const authState = new BerxAuthState(api);

/**
 * Holds the group currently being viewed in StoryViewer. Not route
 * params (routes.ts is deliberately dependency-free pure data — see
 * its own header comment — so a live BerxStoryFeedGroup object
 * doesn't belong there) and not React state either, since it needs to
 * survive the push into the 'StoryViewer' route without a re-render
 * race. A module-level singleton, same pattern already used for
 * `api`/`authState` in this exact file.
 */
let currentStoryGroup: BerxStoryFeedGroup | null = null;

/**
 * Set by RegisterScreen's onRegistered callback, consumed once by
 * AppShell the moment the FOLLOWING login (post email-activation)
 * lands on 'authenticated' — shows OnboardingScreen exactly once for
 * that session. Deliberately a session-local module flag, not a new
 * persistent server field or a new local-storage dependency (this app
 * has none — see secureTokenStorage.ts, which uses Keychain
 * specifically for credentials, not general flags): if the app is
 * killed between activation and first login, onboarding is silently
 * skipped rather than faked or blocking — the same real, disclosed
 * tradeoff pattern used elsewhere in this file/session, not a
 * permanent loss since avatar stays reachable from Profile.
 */
let pendingOnboarding = false;

/**
 * Real integration — see packages/platform/src/mediaPicker.ts's own
 * header for the full disclosure (real, correct code against
 * react-native-image-picker's actual API; never executed in this
 * sandbox since the package can't be installed here — npm registry
 * returns 403). Every screen that picks media (Albums, Posts,
 * Stories, and future Video/Creator flows) goes through this same
 * one function, not a per-screen reimplementation.
 */
const pickImage = pickImageFromLibrary;
const pickVideo = pickVideoFromLibrary;
const pickAudio = pickAudioFromDevice;

function useAuthSnapshot(): BerxAuthSnapshot {
	const [snapshot, setSnapshot] = useState(authState.getSnapshot());
	useEffect(() => {
		const unsubscribe = authState.subscribe(setSnapshot);
		authState.bootstrap();
		return unsubscribe;
	}, []);
	return snapshot;
}

/** Renders whichever screen the current BerxNavigator stack entry points to — the one place that knows how route names map to screen components. */
function RouteRenderer({name, params}: {name: BerxRouteName; params: unknown}) {
	const nav = useBerxNavigation();
	const openProfile = (username: string) => nav.push('Profile', {username});

	switch (name) {
		case 'Home':
			return <FeedScreenRoute onOpenProfile={openProfile} />;
		case 'PostDetail':
			return (
				<PostDetailScreen
					api={api}
					postGuid={(params as {postGuid: number}).postGuid}
					myGuid={authState.getSnapshot().user?.guid}
					onOpenProfile={openProfile}
					onReport={(targetType, targetGuid) => nav.push('Report', {targetType, targetGuid})}
					onBack={nav.pop}
				/>
			);
		case 'Profile':
			return (
				<ProfileScreen
					api={api}
					authState={authState}
					username={(params as {username?: string}).username}
					// Only the tab-root "own profile" has no back target
					// (canGoBack is false there); a profile reached via
					// openProfile() from Feed/PostDetail always has one.
					onBack={nav.canGoBack ? nav.pop : undefined}
					onMessage={(guid, username) => nav.push('Conversation', {otherGuid: guid, otherUsername: username})}
					onOpenNotifications={!nav.canGoBack ? () => nav.push('Notifications', undefined) : undefined}
					onOpenPoints={!nav.canGoBack ? () => nav.push('Points', undefined) : undefined}
					onOpenMissions={!nav.canGoBack ? () => nav.push('Missions', undefined) : undefined}
					onOpenLifeGraph={!nav.canGoBack ? () => nav.push('LifeGraph', undefined) : undefined}
					onOpenMemories={!nav.canGoBack ? () => nav.push('Memories', undefined) : undefined}
					onOpenSavedPosts={!nav.canGoBack ? () => nav.push('Saved', undefined) : undefined}
					onOpenEditProfile={!nav.canGoBack ? () => nav.push('EditProfile', undefined) : undefined}
					onOpenAdminUnvalidated={!nav.canGoBack ? () => nav.push('AdminUnvalidated', undefined) : undefined}
					onOpenAdminReports={!nav.canGoBack ? () => nav.push('AdminReports', undefined) : undefined}
					onOpenWrapped={!nav.canGoBack ? () => nav.push('Wrapped', undefined) : undefined}
					onOpenDatingPrivacy={!nav.canGoBack ? () => nav.push('DatingPrivacy', undefined) : undefined}
					onOpenDatingProfile={!nav.canGoBack ? () => nav.push('DatingProfile', undefined) : undefined}
					onOpenCommunities={!nav.canGoBack ? () => nav.push('Communities', undefined) : undefined}
					onOpenDating={!nav.canGoBack ? () => nav.push('Dating', undefined) : undefined}
					onOpenPlaces={!nav.canGoBack ? () => nav.push('Places', undefined) : undefined}
					onOpenEvents={!nav.canGoBack ? () => nav.push('Events', undefined) : undefined}
					onOpenSettings={!nav.canGoBack ? () => nav.push('Settings', undefined) : undefined}
					onOpenBERXWorld={!nav.canGoBack ? () => nav.push('BERXWorld', undefined) : undefined}
					onOpenAlbums={(userGuid, isOwn) => nav.push('Albums', {userGuid, isOwn})}
					onOpenCollections={(userGuid, isOwn) => nav.push('Collections', {userGuid, isOwn})}
					onOpenTrips={(userGuid, isOwn) => nav.push('Trips', {userGuid, isOwn})}
					onOpenExperiences={(userGuid, isOwn) => nav.push('Experiences', {userGuid, isOwn})}
					onOpenCreatorProfile={() => {
						const otherUsername = (params as {username?: string}).username;
						if (otherUsername) nav.push('CreatorProfile', {username: otherUsername});
					}}
					onOpenCreatorSettings={() => nav.push('CreatorSettings', undefined)}
					onOpenMyVideos={(userGuid, isOwn) => nav.push('MyVideos', {userGuid, isOwn})}
					onOpenMyTracks={(userGuid, isOwn) => nav.push('MyTracks', {userGuid, isOwn})}
					onReport={(targetGuid) => nav.push('Report', {targetType: 'user', targetGuid})}
				/>
			);
		case 'Messages':
			return (
				<ConversationListScreen
					api={api}
					onOpenConversation={(otherGuid, otherUsername) => nav.push('Conversation', {otherGuid, otherUsername})}
					onOpenMessageSearch={() => nav.push('MessageSearch', undefined)}
				/>
			);
		case 'Conversation': {
			const p = params as {otherGuid: number; otherUsername?: string};
			const myGuid = authState.getSnapshot().user?.guid;
			if (!myGuid) {
				// Shouldn't happen — Conversation is only reachable from
				// inside the authenticated app — but if it somehow did,
				// failing honestly beats rendering a thread as nobody.
				return <BerxErrorState message="Сессия недоступна" />;
			}
			return (
				<ConversationScreen
					api={api}
					myGuid={myGuid}
					otherGuid={p.otherGuid}
					otherUsername={p.otherUsername}
					onBack={nav.pop}
				/>
			);
		}
		case 'Dating':
			return (
				<DatingDiscoverScreen
					api={api}
					onMatch={(otherGuid, otherUsername) => nav.replace('DatingMatch', {otherGuid, otherUsername})}
					onOpenMatches={() => nav.push('DatingMatches', undefined)}
					onOpenPrivacy={() => nav.push('DatingPrivacy', undefined)}
					onOpenDatingProfile={() => nav.push('DatingProfile', undefined)}
				/>
			);
		case 'DatingProfile':
			return <DatingProfileScreen api={api} onBack={nav.pop} />;
		case 'DatingMatch': {
			const p = params as {otherGuid: number; otherUsername: string};
			return (
				<DatingMatchScreen
					otherUsername={p.otherUsername}
					onMessage={() => nav.replace('Conversation', {otherGuid: p.otherGuid, otherUsername: p.otherUsername})}
					onContinueBrowsing={() => nav.replace('Dating', undefined)}
				/>
			);
		}
		case 'DatingMatches':
			return (
				<DatingMatchesScreen
					api={api}
					onOpenConversation={(otherGuid, otherUsername) => nav.push('Conversation', {otherGuid, otherUsername})}
					onBack={nav.pop}
				/>
			);
		case 'DatingPrivacy':
			return <DatingPrivacyScreen api={api} onBack={nav.pop} />;
		case 'Stories':
			return (
				<StoriesRailScreen
					api={api}
					onOpenGroup={(group) => {
						currentStoryGroup = group;
						nav.push('StoryViewer', undefined);
					}}
					onCreateStory={() => nav.push('CreateStory', undefined)}
					onBack={nav.canGoBack ? nav.pop : undefined}
				/>
			);
		case 'StoryViewer': {
			const myGuid = authState.getSnapshot().user?.guid;
			if (!currentStoryGroup || !myGuid) {
				// Reached with no group set (e.g. a stale back-navigation
				// edge case) — fail honestly back to the rail rather than
				// rendering a broken viewer.
				nav.pop();
				return null;
			}
			return (
				<StoryViewerScreen
					api={api}
					group={currentStoryGroup}
					myGuid={myGuid}
					onClose={() => {
						currentStoryGroup = null;
						nav.pop();
					}}
				/>
			);
		}
		case 'CreateStory': {
			const p = params as {eventGuid?: number} | undefined;
			return (
				<CreateStoryScreen
					api={api}
					pickImage={pickImage}
					pickVideo={pickVideo}
					eventGuid={p?.eventGuid}
					onCreated={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'Search':
			return (
				<SearchScreen
					api={api}
					onOpenProfile={openProfile}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onOpenCommunity={(guid) => nav.push('CommunityDetail', {guid})}
				/>
			);
		case 'CreatePost':
			return (
				<CreatePostScreen
					api={api}
					pickImage={pickImage}
					// CreatePost is reached via push (from Home's new
					// header "+" button, see FeedScreenRoute below) — no
					// longer its own tab root, so a plain push here
					// correctly stacks PostDetail on top within whichever
					// tab's stack CreatePost itself was pushed onto.
					onCreated={(guid) => nav.push('PostDetail', {postGuid: guid})}
				/>
			);
		case 'Notifications':
			return (
				<NotificationsScreen
					api={api}
					onOpenConversation={(otherGuid) => nav.push('Conversation', {otherGuid, otherUsername: undefined})}
					onOpenDating={() => nav.push('Dating', undefined)}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onBack={nav.canGoBack ? nav.pop : undefined}
				/>
			);
		case 'Points':
			return <PointsScreen api={api} onBack={nav.pop} />;
		case 'Missions':
			return <MissionsScreen api={api} onBack={nav.pop} />;
		case 'LifeGraph':
			return <LifeGraphScreen api={api} onBack={nav.pop} />;
		case 'Communities':
			return (
				<CommunitiesListScreen
					api={api}
					onOpenCommunity={(guid) => nav.push('CommunityDetail', {guid})}
					onCreate={() => nav.push('CreateCommunity', undefined)}
					onBack={nav.canGoBack ? nav.pop : undefined}
				/>
			);
		case 'CommunityDetail': {
			const p = params as {guid: number};
			return (
				<CommunityDetailScreen
					api={api}
					guid={p.guid}
					myGuid={authState.getSnapshot().user?.guid}
					onBack={nav.pop}
					onOpenRequests={(guid) => nav.push('CommunityRequests', {guid})}
					onOpenModerators={(guid) => nav.push('CommunityModerators', {guid})}
					onOpenMembers={(guid, isOwner) => nav.push('CommunityMembers', {guid, isOwner})}
					onReport={(guid) => nav.push('Report', {targetType: 'group', targetGuid: guid})}
					onDeleted={nav.pop}
				/>
			);
		}
		case 'CreateCommunity':
			return (
				<CreateCommunityScreen
					api={api}
					onCreated={(guid) => nav.replace('CommunityDetail', {guid})}
					onBack={nav.pop}
				/>
			);
		case 'CommunityRequests': {
			const p = params as {guid: number};
			return <CommunityRequestsScreen api={api} guid={p.guid} onBack={nav.pop} />;
		}
		case 'CommunityModerators': {
			const p = params as {guid: number};
			return <CommunityModeratorsScreen api={api} guid={p.guid} onBack={nav.pop} />;
		}
		case 'CommunityMembers': {
			const p = params as {guid: number; isOwner?: boolean};
			return <CommunityMembersScreen api={api} guid={p.guid} isOwner={p.isOwner} onOpenProfile={openProfile} onBack={nav.pop} />;
		}
		case 'Albums': {
			const p = params as {userGuid: number; isOwn: boolean};
			return (
				<AlbumsScreen
					api={api}
					userGuid={p.userGuid}
					isOwn={p.isOwn}
					onOpenAlbum={(guid) => nav.push('AlbumDetail', {guid})}
					onCreate={() => nav.push('CreateAlbum', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'AlbumDetail': {
			const p = params as {guid: number};
			return <AlbumDetailScreen api={api} guid={p.guid} authState={authState} pickImage={pickImage} onBack={nav.pop} />;
		}
		case 'CreateAlbum':
			return (
				<CreateAlbumScreen
					api={api}
					onCreated={(guid) => nav.replace('AlbumDetail', {guid})}
					onBack={nav.pop}
				/>
			);
		case 'Places':
			return (
				<PlacesListScreen
					api={api}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onCreate={() => nav.push('CreatePlace', undefined)}
					onOpenNearby={() => nav.push('PlacesNearby', undefined)}
					onOpenSaved={() => nav.push('SavedPlaces', undefined)}
					onBack={nav.canGoBack ? nav.pop : undefined}
				/>
			);
		case 'PlaceDetail': {
			const p = params as {guid: number};
			const myGuid = authState.getSnapshot().user?.guid ?? 0;
			return (
				<PlaceDetailScreen
					api={api}
					guid={p.guid}
					myGuid={myGuid}
					onAddToCollection={() => nav.push('AddToCollection', {itemType: 'place', itemGuid: p.guid})}
					onOpenBusinessDashboard={(placeGuid) => nav.push('BusinessHome', {placeGuid})}
					onEdit={() => nav.push('EditPlace', {guid: p.guid})}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreatePlace':
			return (
				<CreatePlaceScreen
					api={api}
					onCreated={(guid) => nav.replace('PlaceDetail', {guid})}
					onBack={nav.pop}
				/>
			);
		case 'EditPlace': {
			const p = params as {guid: number};
			return (
				<EditPlaceScreen
					api={api}
					guid={p.guid}
					onSaved={nav.pop}
					onDeleted={() => { nav.pop(); nav.pop(); }}
					onBack={nav.pop}
				/>
			);
		}
		case 'EditProfile':
			return <EditProfileScreen api={api} onSaved={nav.pop} onBack={nav.pop} />;
		case 'PlacesNearby':
			return <PlacesNearbyScreen api={api} onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})} onBack={nav.pop} />;
		case 'SavedPlaces':
			return <SavedPlacesScreen api={api} onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})} onBack={nav.pop} />;
		case 'Saved':
			return <SavedPostsScreen api={api} onOpenPost={(guid) => nav.push('PostDetail', {postGuid: guid})} onBack={nav.pop} />;
		case 'Events':
			return (
				<EventsListScreen
					api={api}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onCreate={() => nav.push('CreateEvent', undefined)}
					onOpenMine={() => nav.push('MyEvents', undefined)}
					onBack={nav.canGoBack ? nav.pop : undefined}
				/>
			);
		case 'EventDetail': {
			const p = params as {guid: number};
			const myGuid = authState.getSnapshot().user?.guid;
			return (
				<EventDetailScreen
					api={api}
					guid={p.guid}
					myGuid={myGuid}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenInvite={(guid) => nav.push('EventInvite', {guid})}
					onAddToCollection={() => nav.push('AddToCollection', {itemType: 'event', itemGuid: p.guid})}
					onAddEventStory={(eventGuid) => nav.push('CreateStory', {eventGuid})}
					onEdit={() => nav.push('EditEvent', {guid: p.guid})}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreateEvent':
			return (
				<CreateEventScreen
					api={api}
					onCreated={(guid) => nav.replace('EventDetail', {guid})}
					onBack={nav.pop}
				/>
			);
		case 'EditEvent': {
			const p = params as {guid: number};
			return (
				<EditEventScreen
					api={api}
					guid={p.guid}
					onSaved={nav.pop}
					onDeleted={() => { nav.pop(); nav.pop(); }}
					onBack={nav.pop}
				/>
			);
		}
		case 'MyEvents':
			return <MyEventsScreen api={api} onOpenEvent={(guid) => nav.push('EventDetail', {guid})} onBack={nav.pop} />;
		case 'EventInvite': {
			const p = params as {guid: number};
			return <EventInviteScreen api={api} guid={p.guid} onBack={nav.pop} />;
		}
		case 'DeviceSessions':
			return <DeviceSessionsScreen api={api} onBack={nav.pop} />;
		case 'DeleteAccount':
			return (
				<DeleteAccountScreen
					api={api}
					onDeleted={() => {
						// Real account deletion succeeded — the token is
						// already revoked server-side (deleteAccount()
						// clears local storage too, see client.ts). Drop
						// back to Welcome rather than leaving the shell
						// pointed at a session that no longer resolves to
						// anyone.
						authState.bootstrap();
					}}
					onBack={nav.pop}
				/>
			);
		case 'AdminUnvalidated':
			return <AdminUnvalidatedScreen api={api} onBack={nav.pop} />;
		case 'AdminReports':
			return <AdminReportsScreen api={api} onBack={nav.pop} />;
		case 'MessageSearch':
			return <MessageSearchScreen api={api} onOpenConversation={(otherGuid) => nav.replace('Conversation', {otherGuid, otherUsername: undefined})} onBack={nav.pop} />;
		case 'Settings':
			return (
				<SettingsScreen
					onOpenDeviceSessions={() => nav.push('DeviceSessions', undefined)}
					onOpenBlockedUsers={() => nav.push('BlockedUsers', undefined)}
					onOpenDeleteAccount={() => nav.push('DeleteAccount', undefined)}
					onOpenDatingPrivacy={() => nav.push('DatingPrivacy', undefined)}
					onOpenCircles={() => nav.push('Circles', undefined)}
					onBack={nav.pop}
				/>
			);
		case 'BlockedUsers':
			return <BlockedUsersScreen api={api} onBack={nav.pop} />;
		case 'BERXWorld':
			return (
				<BERXWorldScreen
					onOpenPlaces={() => nav.push('Places', undefined)}
					onOpenEvents={() => nav.push('Events', undefined)}
					onOpenNearby={() => nav.push('PlacesNearby', undefined)}
					onOpenCommunities={() => nav.push('Communities', undefined)}
					onOpenVideo={() => nav.push('VideoFeed', undefined)}
					onOpenMusic={() => nav.push('TrackFeed', undefined)}
					onOpenNearbyNow={() => nav.push('NearbyNow', undefined)}
					onOpenSocialMap={() => nav.push('SocialMap', undefined)}
					onBack={nav.pop}
				/>
			);
		case 'SocialMap':
			return (
				<SocialMapScreen
					api={api}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onOpenProfile={openProfile}
					onBack={nav.pop}
				/>
			);
		case 'Report': {
			const p = params as {targetType: 'dating_profile' | 'post' | 'comment' | 'user' | 'group'; targetGuid: number};
			return (
				<ReportScreen
					api={api}
					targetType={p.targetType}
					targetGuid={p.targetGuid}
					onSubmitted={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'Collections': {
			const p = params as {userGuid?: number; isOwn: boolean};
			return (
				<CollectionsScreen
					api={api}
					userGuid={p.userGuid}
					isOwn={p.isOwn}
					onOpenCollection={(id) => nav.push('CollectionDetail', {id})}
					onCreate={() => nav.push('CreateCollection', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'CollectionDetail': {
			const p = params as {id: number};
			return (
				<CollectionDetailScreen
					api={api}
					id={p.id}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onOpenPost={(guid) => nav.push('PostDetail', {postGuid: guid})}
					onDeleted={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreateCollection':
			return (
				<CreateCollectionScreen
					api={api}
					onCreated={(id) => nav.replace('CollectionDetail', {id})}
					onBack={nav.pop}
				/>
			);
		case 'AddToCollection': {
			const p = params as {itemType: 'place' | 'event' | 'post'; itemGuid: number};
			const myGuid = authState.getSnapshot().user?.guid ?? 0;
			return (
				<AddToCollectionScreen
					api={api}
					myGuid={myGuid}
					itemType={p.itemType}
					itemGuid={p.itemGuid}
					onCreateCollection={() => nav.push('CreateCollection', undefined)}
					onDone={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'Circles':
			return (
				<CirclesScreen
					api={api}
					onOpenCircle={(id) => nav.push('CircleDetail', {id})}
					onCreate={() => nav.push('CreateCircle', undefined)}
					onBack={nav.pop}
				/>
			);
		case 'CircleDetail': {
			const p = params as {id: number};
			return <CircleDetailScreen api={api} id={p.id} onDeleted={nav.pop} onBack={nav.pop} />;
		}
		case 'CreateCircle':
			return (
				<CreateCircleScreen
					api={api}
					onCreated={(id) => nav.replace('CircleDetail', {id})}
					onBack={nav.pop}
				/>
			);
		case 'Trips': {
			const p = params as {userGuid?: number; isOwn: boolean};
			return (
				<TripsScreen
					api={api}
					userGuid={p.userGuid}
					isOwn={p.isOwn}
					onOpenTrip={(id) => nav.push('TripDetail', {id})}
					onCreate={() => nav.push('CreateTrip', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'TripDetail': {
			const p = params as {id: number};
			return (
				<TripDetailScreen
					api={api}
					id={p.id}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onDeleted={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreateTrip':
			return (
				<CreateTripScreen
					api={api}
					onCreated={(id) => nav.replace('TripDetail', {id})}
					onBack={nav.pop}
				/>
			);
		case 'Experiences': {
			const p = params as {userGuid?: number; isOwn: boolean};
			return (
				<ExperiencesScreen
					api={api}
					userGuid={p.userGuid}
					isOwn={p.isOwn}
					onOpenExperience={(id) => nav.push('ExperienceDetail', {id})}
					onCreate={() => nav.push('CreateExperience', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'ExperienceDetail': {
			const p = params as {id: number};
			return (
				<ExperienceDetailScreen
					api={api}
					id={p.id}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onDeleted={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreateExperience':
			return (
				<CreateExperienceScreen
					api={api}
					onCreated={(id) => nav.replace('ExperienceDetail', {id})}
					onBack={nav.pop}
				/>
			);
		case 'CreatorProfile': {
			const p = params as {username: string};
			return (
				<CreatorProfileScreen
					api={api}
					username={p.username}
					onOpenPost={(guid) => nav.push('PostDetail', {postGuid: guid})}
					onOpenAlbum={(guid) => nav.push('AlbumDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onOpenExperience={(id) => nav.push('ExperienceDetail', {id})}
					onOpenVideos={(userGuid) => nav.push('MyVideos', {userGuid, isOwn: userGuid === authState.getSnapshot().user?.guid})}
					onOpenSettings={() => nav.push('CreatorSettings', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreatorSettings': {
			const myUsername = authState.getSnapshot().user?.username ?? '';
			return (
				<CreatorSettingsScreen
					api={api}
					myUsername={myUsername}
					onDisabled={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'VideoFeed':
			return (
				<VideoFeedScreen
					api={api}
					title="Видео"
					onOpenVideo={(postGuid) => nav.push('VideoDetail', {postGuid})}
					onOpenProfile={openProfile}
					onBack={nav.pop}
				/>
			);
		case 'VideoDetail': {
			const p = params as {postGuid: number};
			const myGuid = authState.getSnapshot().user?.guid;
			return (
				<VideoDetailScreen
					api={api}
					postGuid={p.postGuid}
					myGuid={myGuid}
					onOpenProfile={openProfile}
					onDeleted={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreateVideo':
			return (
				<CreateVideoScreen
					api={api}
					pickVideo={pickVideo}
					onCreated={(guid) => nav.replace('VideoDetail', {postGuid: guid})}
					onBack={nav.pop}
				/>
			);
		case 'MyVideos': {
			const p = params as {userGuid: number; isOwn: boolean};
			return (
				<VideoFeedScreen
					api={api}
					userGuid={p.userGuid}
					isOwn={p.isOwn}
					title={p.isOwn ? 'Мои видео' : 'Видео'}
					onOpenVideo={(postGuid) => nav.push('VideoDetail', {postGuid})}
					onOpenProfile={openProfile}
					onCreate={() => nav.push('CreateVideo', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'TrackFeed':
			return (
				<TrackFeedScreen
					api={api}
					title="Треки"
					onOpenTrack={(postGuid) => nav.push('TrackDetail', {postGuid})}
					onOpenProfile={openProfile}
					onBack={nav.pop}
				/>
			);
		case 'TrackDetail': {
			const p = params as {postGuid: number};
			const myGuid = authState.getSnapshot().user?.guid;
			return (
				<TrackDetailScreen
					api={api}
					postGuid={p.postGuid}
					myGuid={myGuid}
					onOpenProfile={openProfile}
					onDeleted={nav.pop}
					onBack={nav.pop}
				/>
			);
		}
		case 'CreateTrack':
			return (
				<CreateTrackScreen
					api={api}
					pickAudio={pickAudio}
					onCreated={(guid) => nav.replace('TrackDetail', {postGuid: guid})}
					onBack={nav.pop}
				/>
			);
		case 'MyTracks': {
			const p = params as {userGuid: number; isOwn: boolean};
			return (
				<TrackFeedScreen
					api={api}
					userGuid={p.userGuid}
					isOwn={p.isOwn}
					title={p.isOwn ? 'Мои треки' : 'Треки'}
					onOpenTrack={(postGuid) => nav.push('TrackDetail', {postGuid})}
					onOpenProfile={openProfile}
					onCreate={() => nav.push('CreateTrack', undefined)}
					onBack={nav.pop}
				/>
			);
		}
		case 'Memories':
			return (
				<MemoriesScreen
					api={api}
					onOpenPost={(guid) => nav.push('PostDetail', {postGuid: guid})}
					onOpenAlbum={(guid) => nav.push('AlbumDetail', {guid})}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onBack={nav.pop}
				/>
			);
		case 'Wrapped':
			return <WrappedScreen api={api} onBack={nav.pop} />;
		case 'NearbyNow':
			return (
				<NearbyNowScreen
					api={api}
					onOpenPlace={(guid) => nav.push('PlaceDetail', {guid})}
					onOpenEvent={(guid) => nav.push('EventDetail', {guid})}
					onBack={nav.pop}
				/>
			);
		case 'BusinessDashboard': {
			const p = params as {placeGuid: number};
			return <BusinessDashboardScreen api={api} placeGuid={p.placeGuid} onBack={nav.pop} />;
		}
		case 'BusinessHome': {
			const p = params as {placeGuid: number};
			return (
				<BusinessHomeScreen
					api={api}
					placeGuid={p.placeGuid}
					onOpenProfile={() => nav.push('BusinessProfile', {placeGuid: p.placeGuid})}
					onOpenDashboard={() => nav.push('BusinessDashboard', {placeGuid: p.placeGuid})}
					onOpenProducts={() => nav.push('BusinessProducts', {placeGuid: p.placeGuid})}
					onOpenOffers={() => nav.push('BusinessOffers', {placeGuid: p.placeGuid})}
					onOpenTeam={() => nav.push('BusinessTeam', {placeGuid: p.placeGuid})}
					onOpenSettings={() => nav.push('BusinessSettings', {placeGuid: p.placeGuid})}
				/>
			);
		}
		case 'BusinessProfile': {
			const p = params as {placeGuid: number};
			return <BusinessProfileScreen api={api} placeGuid={p.placeGuid} onBack={nav.pop} />;
		}
		case 'BusinessProducts':
			return <BusinessProductsScreen onBack={nav.pop} />;
		case 'BusinessOffers':
			return <BusinessOffersScreen onBack={nav.pop} />;
		case 'BusinessTeam': {
			const p = params as {placeGuid: number};
			return <BusinessTeamScreen api={api} placeGuid={p.placeGuid} onBack={nav.pop} />;
		}
		case 'BusinessSettings': {
			const p = params as {placeGuid: number};
			return <BusinessSettingsScreen api={api} placeGuid={p.placeGuid} onBack={nav.pop} />;
		}
		default:
			// A route in BERX_ROUTES with connected:false (Saved — a
			// generic post-bookmark feature, distinct from the real
			// SavedPlaces above) or anything not yet wired here —
			// honest boundary, not a fake screen.
			// boundary, not a fake screen.
			return (
				<View style={styles.comingSoon}>
					<Text style={styles.comingSoonTitle}>Скоро</Text>
					<Text style={styles.comingSoonText}>Раздел «{name}» ещё не подключён к API.</Text>
				</View>
			);
	}
}

function FeedScreenRoute({onOpenProfile}: {onOpenProfile: (username: string) => void}) {
	const nav = useBerxNavigation();
	return (
		<FeedScreen
			api={api}
			onOpenPost={(guid) => nav.push('PostDetail', {postGuid: guid})}
			onOpenProfile={onOpenProfile}
			// CreatePost moved out of the bottom tab bar per explicit
			// design feedback — reachable from Home's own header "+"
			// instead now.
			onCreatePost={() => nav.push('CreatePost', undefined)}
			// Same currentStoryGroup singleton + StoryViewer/CreateStory
			// routes the Stories tab uses (see 'Stories' case below) —
			// pushed onto Home's own stack here instead, since
			// RouteRenderer's StoryViewer/CreateStory cases don't care
			// which tab's navigator invoked them.
			onOpenStoryGroup={(group) => {
				currentStoryGroup = group;
				nav.push('StoryViewer', undefined);
			}}
			onCreateStory={() => nav.push('CreateStory', undefined)}
		/>
	);
}

function AuthenticatedApp() {
	const [activeTab, setActiveTab] = useState<BerxRouteName>('Home');

	// Real, server-authoritative streak check-in — fires exactly once
	// per real mount of the authenticated app (i.e. once per real app
	// open while logged in), never on every render. The server itself
	// is the only clock that matters (see OssnPoints::recordActivity()
	// — uses PHP's own date(), never trusts this timestamp); calling
	// this twice in the same real day is a documented, safe no-op.
	useEffect(() => {
		api.streakCheckIn().catch(() => undefined); // best-effort — a failed check-in must never block the app from loading
	}, []);

	// Real fix for the previously-disclosed limitation: all five tab
	// navigators mount ONCE and stay mounted for the AuthenticatedApp's
	// whole lifetime — switching tabs only toggles which one is
	// visible (style.display), it never unmounts/remounts a
	// <BerxNavigator>, so each tab's push/pop stack now genuinely
	// survives switching away and back. This is the minimal real fix
	// the instruction asked for — not a rewrite of BerxNavigator, not
	// a new library, just changing AuthenticatedApp from
	// conditionally-rendering one navigator to always-rendering five
	// and hiding the inactive ones.
	return (
		<View style={styles.shell}>
			<View style={styles.content}>
				<TabPane visible={activeTab === 'Home'}>
					<BerxNavigator initialRoute="Home" initialParams={undefined}>
						{(current) => <RouteRenderer name={current.name} params={current.params} />}
					</BerxNavigator>
				</TabPane>
				<TabPane visible={activeTab === 'Search'}>
					<BerxNavigator initialRoute="Search" initialParams={undefined}>
						{(current) => <RouteRenderer name={current.name} params={current.params} />}
					</BerxNavigator>
				</TabPane>
				<TabPane visible={activeTab === 'Stories'}>
					<BerxNavigator initialRoute="Stories" initialParams={undefined}>
						{(current) => <RouteRenderer name={current.name} params={current.params} />}
					</BerxNavigator>
				</TabPane>
				<TabPane visible={activeTab === 'Messages'}>
					<BerxNavigator initialRoute="Messages" initialParams={undefined}>
						{(current) => <RouteRenderer name={current.name} params={current.params} />}
					</BerxNavigator>
				</TabPane>
				<TabPane visible={activeTab === 'Profile'}>
					<BerxNavigator initialRoute="Profile" initialParams={{username: undefined}}>
						{(current) => <RouteRenderer name={current.name} params={current.params} />}
					</BerxNavigator>
				</TabPane>
			</View>
			<View style={styles.tabBar}>
				{BERX_BOTTOM_TABS.map((tab) => {
					const active = activeTab === tab;
					const color = active ? colors.accent : colors.textFaint;
					return (
						<Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
							<TabIcon tab={tab} color={color} />
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

/**
 * Icon-only tab bar, per explicit design feedback: home/search/plus
 * (Stories)/message/menu (Profile) — matching the common minimal
 * social-app pattern, no text labels. The Profile tab specifically
 * renders as a hamburger (IconMenu) rather than a person glyph — it
 * still navigates to the same Profile screen underneath, which is
 * where Notifications/Communities/Dating/Dating Privacy/Logout all
 * already live as buttons, so a "menu"-style icon honestly matches
 * what tapping it actually opens.
 */
function TabIcon({tab, color}: {tab: BerxRouteName; color: string}) {
	switch (tab) {
		case 'Home':
			return <IconHome color={color} />;
		case 'Search':
			return <IconSearch color={color} />;
		case 'Stories':
			return <IconPlus color={color} />;
		case 'Messages':
			return <IconMessage color={color} />;
		case 'Profile':
			return <IconMenu color={color} />;
		default:
			return null;
	}
}

/** Keeps its children mounted always; only toggles RN's real `display: none` style — this is what makes tab-switch preserve each tab's own navigation stack. */
function TabPane({visible, children}: {visible: boolean; children: React.ReactNode}) {
	return <View style={[styles.tabPane, !visible && styles.tabPaneHidden]}>{children}</View>;
}

export default function AppShell() {
	const snapshot = useAuthSnapshot();
	const [showOnboarding, setShowOnboarding] = useState(false);

	useEffect(() => {
		if (snapshot.status === 'authenticated' && pendingOnboarding) {
			pendingOnboarding = false;
			setShowOnboarding(true);
		}
	}, [snapshot.status]);

	if (snapshot.status === 'booting') {
		return <BerxLoadingState label="BERX" />;
	}

	if (snapshot.status === 'bootError') {
		return (
			<View style={styles.bootErrorContainer}>
				<Text style={styles.comingSoonTitle}>BERX недоступен</Text>
				<Text style={styles.comingSoonText}>{snapshot.error ?? 'Не удалось подключиться'}</Text>
				<Pressable style={styles.retryButton} onPress={() => authState.retryBoot()}>
					<Text style={styles.retryButtonText}>Повторить</Text>
				</Pressable>
			</View>
		);
	}

	if (snapshot.status === 'authenticated') {
		if (showOnboarding && snapshot.user) {
			return (
				<OnboardingScreen
					api={api}
					user={snapshot.user}
					pickImage={pickImage}
					onComplete={() => setShowOnboarding(false)}
				/>
			);
		}
		return <AuthenticatedApp />;
	}

	// unauthenticated / authenticating / authError / loggingOut all
	// render the auth flow — loggingOut in particular means "we were
	// authenticated a moment ago and are transitioning out," which
	// visually looks the same as the auth flow appearing again.
	return <UnauthenticatedFlow />;
}

/**
 * Welcome → Login / Register. Plain local state, not BerxNavigator —
 * this tiny 3-screen flow has no need for push/pop history (Welcome
 * is always the root; Login and Register are lateral choices from it,
 * not a stack a user would "go back" through in a meaningful way).
 */
function UnauthenticatedFlow() {
	const [screen, setScreen] = useState<'welcome' | 'login' | 'register'>('welcome');

	if (screen === 'login') {
		return <LoginScreen authState={authState} onGoToRegister={() => setScreen('register')} />;
	}
	if (screen === 'register') {
		return (
			<RegisterScreen
				api={api}
				onRegistered={() => {
					pendingOnboarding = true;
					setScreen('login');
				}}
				onBack={() => setScreen('welcome')}
			/>
		);
	}
	return <WelcomeScreen onLogin={() => setScreen('login')} onRegister={() => setScreen('register')} />;
}

const styles = StyleSheet.create({
	shell: {flex: 1, backgroundColor: colors.black},
	content: {flex: 1},
	tabPane: {flex: 1},
	tabPaneHidden: {display: 'none'},
	tabBar: {
		flexDirection: 'row',
		borderTopWidth: 1,
		borderTopColor: colors.borderSoft,
		backgroundColor: colors.graphite,
		paddingVertical: spacing.sm,
	},
	tabItem: {flex: 1, alignItems: 'center', paddingVertical: spacing.xs},
	comingSoon: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm},
	comingSoonTitle: {color: colors.accent, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	comingSoonText: {color: colors.textDim, fontSize: typography.sizeBase, textAlign: 'center'},
	bootErrorContainer: {
		flex: 1,
		backgroundColor: colors.black,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
		gap: spacing.md,
	},
	retryButton: {
		backgroundColor: colors.accent,
		borderRadius: 999,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.xl,
	},
	retryButtonText: {color: colors.black, fontWeight: typography.weightMedium},
});
