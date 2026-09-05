/**
 * BerxCollectionCard — a saved collection.
 *
 * Visibility is real (public / friends / private) and is shown
 * because a user who cannot tell whether a collection is public will
 * eventually share something they meant to keep.
 */
import {berxPlural} from '@berx/domain';
import {StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxObjectCard, type BerxObjectCardFact} from './BerxObjectCard';
import {typography} from '../tokens';
import type {ImageSourcePropType} from 'react-native';

export type BerxCollectionVisibility = 'public' | 'friends' | 'private';

export interface BerxCollectionCardProps {
	collectionGuid: number;
	title: string;
	description?: string;
	cover?: ImageSourcePropType;
	itemCount?: number;
	visibility: BerxCollectionVisibility;
	onPress: () => void;
	testID?: string;
}

const VISIBILITY_LABEL: Record<BerxCollectionVisibility, string> = {
	public: 'Публичная',
	friends: 'Для друзей',
	private: 'Личная',
};

export function BerxCollectionCard({
	collectionGuid,
	title,
	description,
	cover,
	itemCount,
	visibility,
	onPress,
	testID,
}: BerxCollectionCardProps) {
	const {scene} = useBerxScene();
	const facts: BerxObjectCardFact[] = [];
	if (itemCount !== undefined) facts.push({label: berxPlural(itemCount, 'объект', 'объекта', 'объектов'), value: itemCount});

	return (
		<BerxObjectCard
			testID={testID}
			title={title}
			body={description}
			media={cover}
			mediaAlt={cover ? `Обложка коллекции ${title}` : undefined}
			facts={facts}
			onPress={onPress}
			accessibilityLabel={`${title}, ${VISIBILITY_LABEL[visibility].toLowerCase()}${itemCount !== undefined ? `, объектов: ${itemCount}` : ''}`}
			badges={
				<View style={[styles.badge, {borderColor: scene.layers.D4.surface.borderColor, backgroundColor: rgba(scene.accent, visibility === 'private' ? 0 : 0.1)}]}>
					<Text style={[styles.badgeText, {color: scene.accent}]}>{VISIBILITY_LABEL[visibility]}</Text>
				</View>
			}
			sharedTag={`berx:collection:${collectionGuid}`}
		/>
	);
}

const styles = StyleSheet.create({
	badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1},
	badgeText: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
});
