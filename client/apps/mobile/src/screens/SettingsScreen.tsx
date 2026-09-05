/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real hub only: every row here links to a screen backed by a real
 * API. No rows for password/email change, notification preferences,
 * or theme — those either have no backend (per-user settings storage
 * doesn't exist in OSSN at all, see BERX_DECISIONS.md) or belong to
 * ProfileScreen's own edit flow, not duplicated here.
 */
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxListGroup, BerxListRow} from '../../../../packages/design-system/src/spatial/BerxListGroup';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface SettingsScreenProps {
	onOpenDeviceSessions: () => void;
	onOpenBlockedUsers: () => void;
	onOpenDeleteAccount: () => void;
	onOpenDatingPrivacy: () => void;
	onOpenCircles?: () => void;
	onBack?: () => void;
}

export default function SettingsScreen(props: SettingsScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="settings">
			<SettingsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function SettingsScreenBody({onOpenDeviceSessions, onOpenBlockedUsers, onOpenDeleteAccount, onOpenDatingPrivacy, onOpenCircles, onBack}: SettingsScreenProps) {
	return (
		<View style={styles.screen}>
			<BerxHeader title="Настройки" onBack={onBack} />
			<View style={styles.groups}>
				<BerxListGroup label="Приватность и безопасность">
					<BerxListRow label="Устройства и сессии" onPress={onOpenDeviceSessions} />
					<BerxListRow label="Заблокированные" onPress={onOpenBlockedUsers} />
					<BerxListRow label="Приватность знакомств" onPress={onOpenDatingPrivacy} />
					{onOpenCircles ? <BerxListRow label="Круги" onPress={onOpenCircles} last /> : null}
				</BerxListGroup>

				<BerxListGroup label="Аккаунт">
					<BerxListRow label="Удалить аккаунт" onPress={onOpenDeleteAccount} danger last />
				</BerxListGroup>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	groups: {paddingHorizontal: spacing.md, gap: spacing.md},
});
