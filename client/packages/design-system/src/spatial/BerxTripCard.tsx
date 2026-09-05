/**
 * BerxTripCard — a trip with real stops.
 *
 * Stop count comes from the trip's real itinerary rows. A trip with
 * no stops yet says so, because "0 остановок" is a true and useful
 * statement about a trip being planned, unlike an invented preview.
 */
import {berxPlural} from '@berx/domain';
import {BerxObjectCard, type BerxObjectCardFact} from './BerxObjectCard';
import {sharedElementTag} from '@berx/spatial';
import type {ImageSourcePropType} from 'react-native';

export interface BerxTripCardProps {
	tripGuid: number;
	title: string;
	description?: string;
	cover?: ImageSourcePropType;
	datesLabel?: string;
	stopCount?: number;
	participantCount?: number;
	onPress: () => void;
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxTripCard({
	tripGuid,
	title,
	description,
	cover,
	datesLabel,
	stopCount,
	participantCount,
	onPress,
	actions,
	testID,
}: BerxTripCardProps) {
	const facts: BerxObjectCardFact[] = [];
	if (stopCount !== undefined) facts.push({label: berxPlural(stopCount, 'остановка', 'остановки', 'остановок'), value: stopCount});
	if (participantCount !== undefined) facts.push({label: berxPlural(participantCount, 'участник', 'участника', 'участников'), value: participantCount});

	return (
		<BerxObjectCard
			testID={testID}
			title={title}
			subtitle={datesLabel}
			body={description}
			media={cover}
			mediaAlt={cover ? `Обложка поездки ${title}` : undefined}
			facts={facts}
			actions={actions}
			onPress={onPress}
			sharedTag={sharedElementTag('heroMedia', tripGuid)}
		/>
	);
}
