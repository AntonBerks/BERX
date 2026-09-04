/**
 * BerxEventHero — an event, at the top of its scene.
 *
 * Leads with the real countdown to the server-recorded start and the
 * viewer's real RSVP state. It does not render a ticket: BERX has
 * RSVP and capacity but no payment or ticket issuance, and a ticket
 * that cannot be redeemed is exactly the fake functionality the
 * constitution forbids.
 */
import {BerxSceneHero} from './BerxSceneHero';
import {BerxCountdown} from './BerxCountdown';
import {sharedElementTag} from '@berx/spatial';
import type {ImageSourcePropType} from 'react-native';

export interface BerxEventHeroProps {
	eventGuid: number;
	title: string;
	/** Unix seconds from the server. */
	startsAtUnix: number;
	placeName?: string;
	poster?: ImageSourcePropType;
	/** Real attendee count, when the endpoint returns one. */
	goingCount?: number;
	/** Real remaining capacity; undefined when the event is uncapped. */
	capacityLeft?: number;
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxEventHero({
	eventGuid,
	title,
	startsAtUnix,
	placeName,
	poster,
	goingCount,
	capacityLeft,
	actions,
	testID,
}: BerxEventHeroProps) {
	const meta = [
		placeName,
		goingCount !== undefined ? `идут: ${goingCount}` : undefined,
		capacityLeft !== undefined ? `осталось мест: ${capacityLeft}` : undefined,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<BerxSceneHero
			testID={testID}
			title={title}
			meta={meta || undefined}
			media={poster}
			mediaAlt={poster ? `Афиша события ${title}` : undefined}
			sharedTag={sharedElementTag('eventPoster', eventGuid)}
			badges={<BerxCountdown startsAtUnix={startsAtUnix} />}
			actions={actions}
		/>
	);
}
