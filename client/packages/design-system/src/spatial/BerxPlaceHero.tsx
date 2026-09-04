/**
 * BerxPlaceHero — a place, at the top of its scene.
 *
 * Carries the two facts a place scene must lead with and BERX
 * actually stores: the real rating over its real review count, and
 * the real open/closed state where structured hours exist.
 */
import {BerxSceneHero} from './BerxSceneHero';
import {BerxPlaceRating} from './BerxPlaceRating';
import {BerxPlaceHours, type BerxOpeningInterval} from './BerxPlaceHours';
import {sharedElementTag} from '@berx/spatial';
import type {ImageSourcePropType} from 'react-native';

export interface BerxPlaceHeroProps {
	placeGuid: number;
	name: string;
	category?: string;
	address?: string;
	cover?: ImageSourcePropType;
	rating?: number;
	ratingCount?: number;
	hours?: readonly BerxOpeningInterval[];
	rawHours?: string;
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxPlaceHero({
	placeGuid,
	name,
	category,
	address,
	cover,
	rating,
	ratingCount = 0,
	hours,
	rawHours,
	actions,
	testID,
}: BerxPlaceHeroProps) {
	return (
		<BerxSceneHero
			testID={testID}
			title={name}
			meta={[category, address].filter(Boolean).join(' · ') || undefined}
			media={cover}
			mediaAlt={cover ? `Фотография места ${name}` : undefined}
			sharedTag={sharedElementTag('placePin', placeGuid)}
			badges={
				<>
					<BerxPlaceRating average={rating} count={ratingCount} />
					<BerxPlaceHours intervals={hours} rawHours={rawHours} />
				</>
			}
			actions={actions}
		/>
	);
}
