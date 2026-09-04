/**
 * Any of the 300 contracts, rendered as the scene it actually
 * resolves to.
 *
 * This is what makes archive coverage a runtime fact rather than a
 * probe result: every contract is reachable, renders its own six
 * depth layers in its own material and light, and states plainly what
 * it is — a bound product screen, a scene with no server data, or a
 * numbered archive contract with no product logic.
 *
 * A contract that has a real BERX screen says so and offers to open
 * it. The rest are never dressed up as finished.
 */
import {StyleSheet, View} from 'react-native';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSceneInspector} from '../../../../packages/design-system/src/spatial/BerxSceneInspector';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';

export interface SceneScreenProps {
	screenId: string;
	/** Opens the real BERX screen for contracts that have one. */
	onOpenReal?: (screenId: string) => void;
	onBack?: () => void;
}

/** Contracts that have a real, routed BERX screen behind them. */
export const BERX_ROUTED_CONTRACTS: Record<string, string> = {
	'BERX-001': 'Welcome',
	'BERX-002': 'Login',
	'BERX-003': 'Register',
	'BERX-004': 'ColorWorld',
	'BERX-031': 'Home',
	'BERX-032': 'Stories',
	'BERX-061': 'Search',
	'BERX-091': 'NearbyNow',
	'BERX-121': 'Profile',
	'BERX-151': 'Connections',
	'BERX-176': 'Messages',
	'BERX-201': 'Places',
	'BERX-226': 'Events',
	'BERX-246': 'Experiences',
	'BERX-266': 'Communities',
	'BERX-281': 'CreatorProfile',
	'BERX-291': 'BusinessDashboard',
};

export default function SceneScreen(props: SceneScreenProps) {
	return (
		<BerxScreenScene screenId={props.screenId} testID={`scene-${props.screenId}`}>
			<SceneScreenBody {...props} />
		</BerxScreenScene>
	);
}

function SceneScreenBody({screenId, onOpenReal, onBack}: SceneScreenProps) {
	const screen = useBerxScreen();
	const routed = BERX_ROUTED_CONTRACTS[screenId];

	return (
		<View style={styles.screen}>
			<BerxHeader title={screenId} onBack={onBack} />
			<BerxSceneInspector screen={screen}>
				{routed && onOpenReal ? (
					<View style={styles.open}>
						<BerxButton label="Открыть реальный экран" onPress={() => onOpenReal(screenId)} fullWidth />
					</View>
				) : null}
			</BerxSceneInspector>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	open: {paddingBottom: 8},
});
