/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.circles() (components/OssnApi/v1/circles.php, new
 * domain this session). Always the caller's own — circles have no
 * public tier at all.
 */
import {berxPlural} from '@berx/domain';
import {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircle} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {BerxObjectCard} from '../../../../packages/design-system/src/spatial/BerxObjectCard';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';
import {BerxIconButton} from '../../../../packages/design-system/src/icons';

export interface CirclesScreenProps {
	api: BerxApiClient;
	onOpenCircle: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

const KIND_LABEL: Record<string, string> = {
	family: 'Семья',
	work: 'Работа',
	travel: 'Путешествия',
	close_friends: 'Близкие друзья',
};

export default function CirclesScreen(props: CirclesScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" atmosphereKind="community" testID="circles">
			<CirclesScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CirclesScreenBody({api, onOpenCircle, onCreate, onBack}: CirclesScreenProps) {
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [items, setItems] = useState<BerxCircle[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.circles();
			setItems(res.circles);
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different problems,
			   and being offline is a fourth. A 403 or a 404 also stops
			   offering a Retry that cannot work. */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
		} finally {
			setLoading(false);
		}
	}, [api, offline]);

	useEffect(() => {
		load();
	}, [load]);

	/* hoisted: the way back has to survive loading and failure — it
	   used to render only once the data arrived, so a failed fetch left
	   a pushed screen with no exit */
	const header = (
		<BerxHeader
			title="Круги" onBack={onBack}
			actions={<BerxIconButton name="plus" accessibilityLabel="Создать круг" onPress={onCreate} />}
		/>
	);

	if (loading)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxLoadingState />
			</View>
		);
	if (error)
		return (
			<View style={{flex: 1}}>
				{header}
				<BerxErrorState message={error} onRetry={retryable ? load : undefined} />
			</View>
		);

	return (
		<View style={styles.screen}>
			{/* one creation control, on the control plane beside the scene's
			    name — a full-width button across the top of a list is a
			    banner, and it pushed the first real object off the fold */}
			{header}

			{items.length === 0 ? (
				<BerxEmptyState title="Кругов пока нет" subtitle="Круги — приватные списки друзей для управления видимостью." />
			) : (
				<BerxSceneList
					data={items}
					keyExtractor={(c: BerxCircle) => String(c.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCircle}) => (
						<BerxObjectCard
							title={item.name}
							subtitle={item.kind ? (KIND_LABEL[item.kind] ?? item.kind) : undefined}
							facts={[{label: berxPlural(item.member_count, 'участник', 'участника', 'участников'), value: item.member_count}]}
							onPress={() => onOpenCircle(item.id)}
						/>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	list: {paddingBottom: spacing.xxxl},
	rowBody: {gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
