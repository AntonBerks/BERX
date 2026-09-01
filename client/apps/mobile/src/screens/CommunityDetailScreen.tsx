/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real Community Wall: the earlier documented scope gap
 * ("no group feed/posts/comments here") closed for posts specifically.
 * Wraps the exact real, already-built core group-wall mechanism the
 * web UI itself uses (components/OssnWall/actions/wall/post/group.php)
 * — see communities.php's own header for the full mechanism. Tapping
 * a wall post opens the real, existing PostDetailScreen — likes/
 * comments on a group post already work through the existing real
 * /posts/{guid}/like and /posts/{guid}/comments routes (confirmed by
 * reading them: both key purely off the post guid via OssnWall::
 * GetPost(), with no branch on owner type), so no new detail view was
 * needed here.
 *
 * MAX BUILD — closes the same class of gap as EditPlaceScreen/
 * EditEventScreen/TripDetailScreen's inline edit: api.updateCommunity()/
 * deleteCommunity() were always real, working client methods (real
 * PATCH/DELETE routes in communities.php, ownership re-checked
 * server-side) with zero UI callers. A community is simple enough
 * (name/description only — updateGroup()'s own real scope, matching
 * the web edit action) that the edit form lives inline here, same
 * principle as TripDetailScreen.
 *
 * MAX BUILD — real Communities <-> Events connection: a real
 * "Ближайшие события" section (api.communityEvents(), real
 * OssnEvents::upcomingByGroup() — only events an actual member
 * organized and explicitly tagged to this community, never a guess).
 * Best-effort, never blocks the community itself from loading.
 *
 * MAX BUILD — real Community Cover Photo. Wraps OssnGroup's own
 * native UploadCover()/coverURL() (classes/OssnGroup.php) — a real
 * bug (subtype 'file:cover' vs the actual stored 'cover') fixed in
 * OssnGroups' own page handler so the URL this now returns actually
 * resolves, plus a new /communities/{guid}/cover JSON route wrapping
 * it. Same pickImage-injected-prop pattern as EditPlaceScreen.
 */
import {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxCommunity, BerxEvent, BerxFeedItem, BerxCommunityMember} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';
import {BerxPollView} from '../../../../packages/design-system/src/components/BerxPollView';
import {BerxAvatarStack} from '../../../../packages/design-system/src/components/BerxAvatarStack';
import {BerxEventCard} from '../../../../packages/design-system/src/components/BerxSpatialCards';

interface Props {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	pickImage?: () => Promise<BerxFilePart | null>;
	onBack: () => void;
	onOpenRequests?: (guid: number) => void;
	onOpenModerators?: (guid: number) => void;
	onOpenMembers?: (guid: number, isOwner: boolean) => void;
	onOpenEvent?: (guid: number) => void;
	/** MAX BUILD — real Community Wall (see this file's own header). */
	onOpenPost?: (guid: number) => void;
	onReport?: (guid: number) => void;
	onDeleted?: () => void;
}

export default function CommunityDetailScreen({api, guid, myGuid, pickImage, onBack, onOpenRequests, onOpenModerators, onOpenMembers, onOpenEvent, onOpenPost, onReport, onDeleted}: Props) {
	const [community, setCommunity] = useState<BerxCommunity | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState(false);
	const [uploadingCover, setUploadingCover] = useState(false);
	const [events, setEvents] = useState<BerxEvent[]>([]);
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [posts, setPosts] = useState<BerxFeedItem[]>([]);
	const [postText, setPostText] = useState('');
	const [posting, setPosting] = useState(false);
	const [postError, setPostError] = useState<string | null>(null);
	// BERX WORLD — real Post Polls on a community wall too (see
	// OssnPolls.php's own header) — same real composer shape as
	// CreatePostScreen's own poll editor.
	const [pollEnabled, setPollEnabled] = useState(false);
	const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
	const [votingPollGuid, setVotingPollGuid] = useState<number | null>(null);
	// BERX SPATIAL — a community should read as an inhabited space, not
	// a settings page. These are the community's REAL members
	// (api.communityMembers) — the avatar stack below shows actual
	// people and an actual count, never a decorative cluster.
	const [members, setMembers] = useState<BerxCommunityMember[]>([]);

	async function load() {
		setLoading(true);
		try {
			const data = await api.getCommunity(guid);
			setCommunity(data);
			setError(null);
			// Best-effort — a community with no tagged events still loads normally.
			api.communityEvents(guid).then((res) => setEvents(res.events)).catch(() => undefined);
			// Best-effort — a private community the caller isn't in yet 403s server-side, handled as "no posts to show" rather than surfacing a fetch error on the whole screen.
			api.communityPosts(guid).then((res) => setPosts(res.posts)).catch(() => undefined);
			// Best-effort — a private community the caller isn't in yet 403s server-side; no members shown rather than a fabricated count.
			api.communityMembers(guid).then((res) => setMembers(res.members)).catch(() => undefined);
		} catch {
			setError('Сообщество недоступно');
		} finally {
			setLoading(false);
		}
	}

	/** MAX BUILD — real Community Wall post. Server re-checks membership regardless of what this button already knows. */
	async function handlePost() {
		if (!postText.trim()) return;
		setPosting(true);
		setPostError(null);
		try {
			const validPollOptions = pollEnabled ? pollOptions.map((o: string) => o.trim()).filter((o: string) => o) : undefined;
			await api.createCommunityPost(guid, postText.trim(), validPollOptions && validPollOptions.length >= 2 ? validPollOptions : undefined);
			setPostText('');
			setPollEnabled(false);
			setPollOptions(['', '']);
			const res = await api.communityPosts(guid);
			setPosts(res.posts);
		} catch (e) {
			setPostError(e instanceof Error ? e.message : 'Не удалось опубликовать');
		} finally {
			setPosting(false);
		}
	}

	function updatePollOption(index: number, value: string) {
		setPollOptions((prev: string[]) => prev.map((o: string, i: number) => (i === index ? value : o)));
	}

	function addPollOption() {
		setPollOptions((prev: string[]) => (prev.length < 6 ? [...prev, ''] : prev));
	}

	function removePollOption(index: number) {
		setPollOptions((prev: string[]) => (prev.length > 2 ? prev.filter((_: string, i: number) => i !== index) : prev));
	}

	const pollValidOptionCount = pollOptions.filter((o: string) => o.trim()).length;

	async function handleVotePoll(post: BerxFeedItem, optionIndex: number) {
		setVotingPollGuid(post.guid);
		try {
			const res = await api.votePoll(post.guid, optionIndex);
			setPosts((prev: BerxFeedItem[]) => prev.map((p: BerxFeedItem) => (p.guid === post.guid ? {...p, poll: res.poll} : p)));
		} catch {
			// real server rejection — state left as-is
		} finally {
			setVotingPollGuid(null);
		}
	}

	/** BERX WORLD — real early close, poster_guid-gated server-side regardless of what this button already knows. */
	async function handleClosePoll(post: BerxFeedItem) {
		setVotingPollGuid(post.guid);
		try {
			const res = await api.closePoll(post.guid);
			setPosts((prev: BerxFeedItem[]) => prev.map((p: BerxFeedItem) => (p.guid === post.guid ? {...p, poll: res.poll} : p)));
		} catch {
			// real server rejection — state left as-is
		} finally {
			setVotingPollGuid(null);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [guid]);

	async function handleJoinLeave() {
		if (!community) return;
		setActing(true);
		try {
			if (community.is_member) {
				await api.leaveCommunity(guid);
			} else {
				await api.joinCommunity(guid);
			}
			await load();
		} finally {
			setActing(false);
		}
	}

	/** MAX BUILD — real cover upload, owner/admin only (re-checked server-side). */
	async function handleUploadCover() {
		if (!pickImage || !community) return;
		const picked = await pickImage();
		if (!picked) return;
		setUploadingCover(true);
		try {
			const res = await api.uploadCommunityCover(guid, picked);
			setCommunity({...community, cover_url: res.cover_url});
		} catch (e) {
			Alert.alert('Не удалось загрузить обложку', e instanceof Error ? e.message : 'Попробуйте ещё раз');
		} finally {
			setUploadingCover(false);
		}
	}

	/** api.deleteCommunityCover() was always real (owner/admin re-checked server-side) with no caller anywhere — a cover, once set, could never be removed. */
	async function handleRemoveCover() {
		if (!community) return;
		setUploadingCover(true);
		try {
			await api.deleteCommunityCover(guid);
			setCommunity({...community, cover_url: null});
		} catch (e) {
			Alert.alert('Не удалось удалить обложку', e instanceof Error ? e.message : 'Попробуйте ещё раз');
		} finally {
			setUploadingCover(false);
		}
	}

	function openEdit() {
		if (!community) return;
		setEditName(community.name);
		setEditDescription(community.description ?? '');
		setEditError(null);
		setEditing(true);
	}

	async function saveEdit() {
		if (!community) return;
		if (!editName.trim()) {
			setEditError('Введите название сообщества.');
			return;
		}
		setSaving(true);
		setEditError(null);
		try {
			await api.updateCommunity(guid, editName.trim(), editDescription.trim());
			setCommunity({...community, name: editName.trim(), description: editDescription.trim()});
			setEditing(false);
		} catch (e) {
			setEditError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSaving(false);
		}
	}

	function confirmDeleteCommunity() {
		Alert.alert(
			'Удалить сообщество?',
			'Это действие нельзя отменить. Участники, модераторы и заявки будут удалены.',
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Удалить',
					style: 'destructive',
					onPress: async () => {
						setDeleting(true);
						try {
							await api.deleteCommunity(guid);
							if (onDeleted) onDeleted();
							else onBack();
						} catch (e) {
							setEditError(e instanceof Error ? e.message : 'Не удалось удалить сообщество');
						} finally {
							setDeleting(false);
						}
					},
				},
			]
		);
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxLoadingState label="Загрузка..." />
			</View>
		);
	}
	if (error || !community) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxErrorState message={error ?? 'Сообщество не найдено'} onRetry={load} />
			</View>
		);
	}

	const isOwner = Boolean(myGuid && community.owner_guid === myGuid);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={community.name} />
			{!editing ? (
				<Berx3DTilt style={styles.hero} maxAngle={6}>
					{community.cover_url ? (
						<Image source={{uri: community.cover_url}} style={styles.heroImage} />
					) : (
						<View style={styles.heroPlaceholder} />
					)}
					{isOwner && pickImage ? (
						<Pressable style={styles.coverEditButton} onPress={handleUploadCover} disabled={uploadingCover} hitSlop={8}>
							<Text style={styles.coverEditLabel}>{uploadingCover ? 'Загрузка…' : 'Сменить обложку'}</Text>
						</Pressable>
					) : null}
					{isOwner && community.cover_url ? (
						<Pressable style={styles.coverRemoveButton} onPress={handleRemoveCover} disabled={uploadingCover} hitSlop={8}>
							<Text style={styles.coverEditLabel}>Убрать обложку</Text>
						</Pressable>
					) : null}
				</Berx3DTilt>
			) : null}
			<View style={styles.content}>
				{editing ? (
					<>
						<BerxInput placeholder="Название сообщества" value={editName} onChangeText={setEditName} />
						<BerxInput placeholder="Описание" value={editDescription} onChangeText={setEditDescription} multiline />
						{editError ? <Text style={styles.error}>{editError}</Text> : null}
						<BerxButton label="Сохранить" loading={saving} onPress={saveEdit} fullWidth />
						<Pressable onPress={() => setEditing(false)} disabled={saving}>
							<Text style={styles.reportLink}>Отмена</Text>
						</Pressable>
						<Pressable onPress={confirmDeleteCommunity} disabled={deleting} hitSlop={8}>
							<Text style={styles.deleteLink}>{deleting ? 'Удаление…' : 'Удалить сообщество'}</Text>
						</Pressable>
					</>
				) : (
					<>
						<Text style={styles.name}>{community.name}</Text>
						<View style={styles.identityRow}>
							<Text style={styles.privacy}>{community.privacy === 'private' ? 'Закрытое сообщество' : 'Открытое сообщество'}</Text>
							{members.length > 0 ? (
								<Pressable
									style={styles.membersInline}
									onPress={() => onOpenMembers && onOpenMembers(guid, isOwner)}
									disabled={!onOpenMembers}>
									<BerxAvatarStack
										people={members.map((m: BerxCommunityMember) => ({guid: m.guid, icon: m.icon, initial: (m.fullname || m.username).charAt(0)}))}
										size={22}
									/>
									<Text style={styles.membersCount}>{members.length} участников</Text>
								</Pressable>
							) : null}
						</View>
						{community.description ? <Text style={styles.description}>{community.description}</Text> : null}

						<BerxButton
							label={community.is_member ? 'Покинуть сообщество' : 'Вступить'}
							variant={community.is_member ? 'secondary' : 'primary'}
							onPress={handleJoinLeave}
							loading={acting}
							fullWidth
						/>

						{onOpenMembers ? <BerxButton label="Участники" variant="secondary" onPress={() => onOpenMembers(guid, isOwner)} fullWidth /> : null}

						{events.length > 0 ? (
							<View style={styles.eventsSection}>
								<Text style={styles.eventsTitle}>Ближайшие события</Text>
								{events.map((e: BerxEvent) => (
									<View key={e.guid} style={styles.eventCardWrap}>
										<BerxEventCard
											title={e.title}
											imageUrl={e.cover_url}
											starts={e.starts}
											placeTitle={e.place ? e.place.title : e.location}
											attendeeCount={e.attendee_count}
											friendsGoingCount={e.friends_going_count}
											seatsLeft={e.seats_left}
											isGoing={e.is_going}
											onPress={() => onOpenEvent && onOpenEvent(e.guid)}
										/>
									</View>
								))}
							</View>
						) : null}

						{community.is_member ? (
							<View style={styles.wallComposer}>
								<BerxInput placeholder="Написать в сообщество..." value={postText} onChangeText={setPostText} multiline />
								<BerxButton label={pollEnabled ? 'Убрать опрос' : 'Добавить опрос'} variant="secondary" onPress={() => setPollEnabled(!pollEnabled)} />
								{pollEnabled ? (
									<View style={styles.pollBox}>
										{pollOptions.map((opt: string, i: number) => (
											<View key={i} style={styles.pollOptionRow}>
												<BerxInput
													placeholder={`Вариант ${i + 1}`}
													value={opt}
													onChangeText={(v: string) => updatePollOption(i, v)}
													style={styles.pollOptionInput}
												/>
												{pollOptions.length > 2 ? (
													<Pressable onPress={() => removePollOption(i)} hitSlop={8}>
														<Text style={styles.pollOptionRemove}>✕</Text>
													</Pressable>
												) : null}
											</View>
										))}
										{pollOptions.length < 6 ? (
											<Pressable onPress={addPollOption} hitSlop={8}>
												<Text style={styles.pollAddOption}>+ Добавить вариант</Text>
											</Pressable>
										) : null}
										{pollValidOptionCount < 2 ? <Text style={styles.pollHint}>Нужно минимум 2 варианта</Text> : null}
									</View>
								) : null}
								<BerxButton label="Опубликовать" variant="secondary" onPress={handlePost} loading={posting} disabled={!postText.trim() || (pollEnabled && pollValidOptionCount < 2)} />
								{postError ? <Text style={styles.error}>{postError}</Text> : null}
							</View>
						) : null}

						{posts.length > 0 ? (
							<View style={styles.wallSection}>
								<Text style={styles.eventsTitle}>Стена сообщества</Text>
								{posts.map((p: BerxFeedItem) => (
									<View key={p.guid} style={styles.wallRow}>
										<Pressable onPress={() => onOpenPost && onOpenPost(p.guid)} disabled={!onOpenPost}>
											<Text style={styles.wallAuthor}>{p.poster_username ?? 'BERX'}</Text>
											<Text style={styles.wallText} numberOfLines={4}>{p.text}</Text>
											<Text style={styles.eventMeta}>{relativeTimeLabel(p.time_created)}</Text>
										</Pressable>
										{p.poll ? (
										<BerxPollView
											poll={p.poll}
											onVote={(optionIndex) => handleVotePoll(p, optionIndex)}
											voting={votingPollGuid === p.guid}
											onClose={myGuid === p.poster_guid ? () => handleClosePoll(p) : undefined}
											closing={votingPollGuid === p.guid}
										/>
									) : null}
									</View>
								))}
							</View>
						) : null}

						{isOwner ? (
							<View style={styles.ownerActions}>
								{onOpenRequests ? <BerxButton label="Заявки на вступление" variant="secondary" onPress={() => onOpenRequests(guid)} fullWidth /> : null}
								{onOpenModerators ? <BerxButton label="Модераторы" variant="secondary" onPress={() => onOpenModerators(guid)} fullWidth /> : null}
								<BerxButton label="Редактировать" variant="secondary" onPress={openEdit} fullWidth />
							</View>
						) : null}

						{myGuid && !isOwner && onReport ? (
							<Pressable onPress={() => onReport(guid)} hitSlop={8}>
								<Text style={styles.reportLink}>Пожаловаться на сообщество</Text>
							</Pressable>
						) : null}
					</>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	hero: {height: 160, backgroundColor: colors.surface, overflow: 'hidden'},
	heroImage: {width: '100%', height: '100%'},
	heroPlaceholder: {width: '100%', height: '100%', backgroundColor: colors.surface},
	coverEditButton: {position: 'absolute', right: spacing.sm, bottom: spacing.sm, backgroundColor: colors.black, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6, borderWidth: 1, borderColor: colors.accent},
	coverRemoveButton: {position: 'absolute', left: spacing.sm, bottom: spacing.sm, backgroundColor: colors.black, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6, borderWidth: 1, borderColor: colors.borderSoft},
	coverEditLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	content: {padding: spacing.lg, gap: spacing.md},
	ownerActions: {gap: spacing.sm, marginTop: spacing.sm},
	name: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	privacy: {color: colors.accent, fontSize: typography.sizeSm},
	description: {color: colors.textDim, fontSize: typography.sizeBase},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center', marginTop: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
	deleteLink: {fontSize: typography.sizeSm, color: colors.danger, textAlign: 'center', textDecorationLine: 'underline', marginTop: spacing.sm},
	eventsSection: {gap: spacing.xs, marginTop: spacing.sm},
	eventsTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	eventMeta: {color: colors.textFaint, fontSize: typography.sizeXs},
	wallComposer: {gap: spacing.xs, marginTop: spacing.sm},
	identityRow: {gap: spacing.sm},
	membersInline: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	membersCount: {color: colors.textDim, fontSize: typography.sizeXs},
	eventCardWrap: {marginBottom: spacing.sm},
	pollBox: {gap: spacing.xs},
	pollOptionRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	pollOptionInput: {flex: 1},
	pollOptionRemove: {color: colors.textFaint, fontSize: typography.sizeSm, padding: 4},
	pollAddOption: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	pollHint: {color: colors.textFaint, fontSize: typography.sizeXs},
	wallSection: {gap: spacing.xs, marginTop: spacing.sm},
	wallRow: {gap: 2, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSoft},
	wallAuthor: {color: colors.accent, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	wallText: {color: colors.text, fontSize: typography.sizeSm},
});
