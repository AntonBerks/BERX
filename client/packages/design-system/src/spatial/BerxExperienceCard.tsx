/**
 * BerxExperienceCard — a shared experience.
 *
 * Participants and the viewer's own response are real, server-held
 * state (respondToExperience), so the card shows what the viewer has
 * actually answered rather than an aspirational "join" that has no
 * record behind it.
 */
import {berxPlural} from '@berx/domain';
import {BerxObjectCard, type BerxObjectCardFact} from './BerxObjectCard';
import {sharedElementTag} from '@berx/spatial';
import type {ImageSourcePropType} from 'react-native';

export type BerxExperienceResponse = 'going' | 'maybe' | 'declined' | 'none';

export interface BerxExperienceCardProps {
	experienceGuid: number;
	title: string;
	description?: string;
	cover?: ImageSourcePropType;
	whenLabel?: string;
	participantCount?: number;
	response?: BerxExperienceResponse;
	onPress: () => void;
	actions?: React.ReactNode;
	testID?: string;
}

const RESPONSE_LABEL: Record<BerxExperienceResponse, string | undefined> = {
	going: 'вы идёте',
	maybe: 'возможно',
	declined: 'вы отказались',
	none: undefined,
};

export function BerxExperienceCard({
	experienceGuid,
	title,
	description,
	cover,
	whenLabel,
	participantCount,
	response = 'none',
	onPress,
	actions,
	testID,
}: BerxExperienceCardProps) {
	const facts: BerxObjectCardFact[] = [];
	if (participantCount !== undefined) facts.push({label: berxPlural(participantCount, 'участник', 'участника', 'участников'), value: participantCount});

	return (
		<BerxObjectCard
			testID={testID}
			title={title}
			subtitle={[whenLabel, RESPONSE_LABEL[response]].filter(Boolean).join(' · ') || undefined}
			body={description}
			media={cover}
			mediaAlt={cover ? `Обложка впечатления ${title}` : undefined}
			facts={facts}
			actions={actions}
			onPress={onPress}
			sharedTag={sharedElementTag('heroMedia', experienceGuid)}
		/>
	);
}
