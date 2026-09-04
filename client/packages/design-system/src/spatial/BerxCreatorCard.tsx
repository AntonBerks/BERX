/**
 * BerxCreatorCard — a creator and their real reach.
 *
 * Views and content counts are real server aggregates. There is no
 * earnings figure: BERX has points and rewards but no money, so a
 * revenue line here would be invented (see BerxWalletCard, BLOCKED).
 */
import {BerxObjectCard, type BerxObjectCardFact} from './BerxObjectCard';
import {BerxIdentity} from './BerxIdentity';
import {sharedElementTag} from '@berx/spatial';
import type {ImageSourcePropType} from 'react-native';

export interface BerxCreatorCardProps {
	userGuid: number;
	name: string;
	handle?: string;
	avatarUrl?: string;
	cover?: ImageSourcePropType;
	tagline?: string;
	/** Real aggregates. Any that the endpoint does not return are omitted. */
	postCount?: number;
	videoCount?: number;
	trackCount?: number;
	viewCount?: number;
	verified?: boolean;
	onPress: () => void;
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxCreatorCard({
	userGuid,
	name,
	handle,
	avatarUrl,
	cover,
	tagline,
	postCount,
	videoCount,
	trackCount,
	viewCount,
	verified,
	onPress,
	actions,
	testID,
}: BerxCreatorCardProps) {
	const facts: BerxObjectCardFact[] = [];
	if (postCount !== undefined) facts.push({label: 'постов', value: postCount});
	if (videoCount !== undefined) facts.push({label: 'видео', value: videoCount});
	if (trackCount !== undefined) facts.push({label: 'треков', value: trackCount});
	if (viewCount !== undefined) facts.push({label: 'просмотров', value: viewCount});

	return (
		<BerxObjectCard
			testID={testID}
			title={name}
			body={tagline}
			media={cover}
			mediaAlt={cover ? `Обложка автора ${name}` : undefined}
			facts={facts}
			badges={<BerxIdentity userGuid={userGuid} name={name} handle={handle} avatarUrl={avatarUrl} verified={verified} size={34} />}
			actions={actions}
			onPress={onPress}
			accessibilityLabel={`${name}${handle ? `, @${handle}` : ''}${facts.length ? `, ${facts.map((f) => `${f.label}: ${f.value}`).join(', ')}` : ''}`}
			sharedTag={sharedElementTag('profileHeader', userGuid)}
		/>
	);
}
