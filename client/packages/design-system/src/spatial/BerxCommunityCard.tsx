/**
 * BerxCommunityCard — a community and the viewer's real membership.
 *
 * Membership drives the action: a member sees "Выйти", a non-member
 * "Вступить", and a community with approval sees "Заявка отправлена"
 * once the server has recorded the request. Three real states, no
 * button that pretends the answer is already known.
 */
import {BerxObjectCard, type BerxObjectCardFact} from './BerxObjectCard';
import {BerxAvatarCluster, type BerxClusterMember} from './BerxAvatarCluster';
import {sharedElementTag} from '@berx/spatial';
import type {ImageSourcePropType} from 'react-native';

export type BerxMembership = 'member' | 'moderator' | 'requested' | 'none';

export interface BerxCommunityCardProps {
	communityGuid: number;
	name: string;
	description?: string;
	cover?: ImageSourcePropType;
	memberCount?: number;
	membership: BerxMembership;
	/** Real members loaded so far; the cluster shows the total separately. */
	members?: readonly BerxClusterMember[];
	onPress: () => void;
	actions?: React.ReactNode;
	testID?: string;
}

const MEMBERSHIP_LABEL: Record<BerxMembership, string | undefined> = {
	member: 'вы участник',
	moderator: 'вы модератор',
	requested: 'заявка отправлена',
	none: undefined,
};

export function BerxCommunityCard({
	communityGuid,
	name,
	description,
	cover,
	memberCount,
	membership,
	members,
	onPress,
	actions,
	testID,
}: BerxCommunityCardProps) {
	const facts: BerxObjectCardFact[] = [];
	if (memberCount !== undefined) facts.push({label: 'участников', value: memberCount});

	return (
		<BerxObjectCard
			testID={testID}
			title={name}
			subtitle={MEMBERSHIP_LABEL[membership]}
			body={description}
			media={cover}
			mediaAlt={cover ? `Обложка сообщества ${name}` : undefined}
			facts={facts}
			badges={members && members.length > 0 ? <BerxAvatarCluster members={members} total={memberCount} contextLabel="участники" size={26} /> : undefined}
			actions={actions}
			onPress={onPress}
			sharedTag={sharedElementTag('heroMedia', communityGuid)}
		/>
	);
}
