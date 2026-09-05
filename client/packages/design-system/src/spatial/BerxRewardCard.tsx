/**
 * BerxRewardCard — something real points can be spent on.
 *
 * Affordability is computed against the viewer's real balance, and
 * the redeem action is disabled with a stated reason when they cannot
 * afford it — a control that looks available and then fails is worse
 * than one that explains itself up front.
 *
 * Points are the currency here because points are what BERX actually
 * has; there is no money in the system.
 */
import {StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxObjectCard} from './BerxObjectCard';
import {colors, typography} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxRewardCardProps {
	rewardId: string;
	title: string;
	description?: string;
	media?: ImageSourcePropType;
	/** Real cost in BERX points. */
	costPoints: number;
	/** The viewer's real, server-held balance. */
	balancePoints: number;
	actions?: React.ReactNode;
	testID?: string;
}

export function BerxRewardCard({
	rewardId,
	title,
	description,
	media,
	costPoints,
	balancePoints,
	actions,
	testID,
}: BerxRewardCardProps) {
	const {scene} = useBerxScene();
	const affordable = balancePoints >= costPoints;
	const short = costPoints - balancePoints;

	return (
		<BerxObjectCard
			testID={testID}
			title={title}
			body={description}
			media={media}
			mediaAlt={media ? `Изображение награды ${title}` : undefined}
			accessibilityLabel={`${title}, ${costPoints} баллов${affordable ? '' : `, не хватает ${short}`}`}
			badges={
				<View
					style={[
						styles.cost,
						{
							backgroundColor: rgba(affordable ? scene.accent : colors.textDim, 0.12),
							borderColor: rgba(affordable ? scene.accent : colors.textDim, 0.36),
						},
					]}>
					<Text style={[styles.costText, {color: affordable ? scene.accent : colors.textDim}]}>{costPoints} баллов</Text>
				</View>
			}
			actions={
				<>
					{actions}
					{!affordable ? (
						<BerxText role="meta" emphasis="secondary" style={styles.short} liveRegion="polite">
							Не хватает {short} баллов
						</BerxText>
					) : null}
				</>
			}
			sharedTag={`berx:reward:${rewardId}`}
		/>
	);
}

const styles = StyleSheet.create({
	cost: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1},
	costText: {fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	short: {alignSelf: 'center'},
});
