/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Every toggle here maps to a real, server-enforced field
 * (OssnDating::saveProfile(), audited earlier this session) — not a
 * cosmetic switch. invisible_mode in particular was the exact field
 * found to be dead (saved but never enforced) in an earlier audit,
 * then fixed server-side; this screen is what actually lets a user
 * reach that real, working toggle.
 */
import {useState} from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

interface Props {
	api: BerxApiClient;
	onBack: () => void;
}

interface ToggleRowProps {
	label: string;
	description: string;
	value: boolean;
	onChange: (v: boolean) => void;
}

function ToggleRow({label, description, value, onChange}: ToggleRowProps) {
	return (
		<View style={styles.row}>
			<View style={styles.rowText}>
				<Text style={styles.rowLabel}>{label}</Text>
				<Text style={styles.rowDescription}>{description}</Text>
			</View>
			<Switch
				value={value}
				onValueChange={onChange}
				trackColor={{false: colors.glass2, true: colors.accentSoft}}
				thumbColor={value ? colors.accent : colors.textFaint}
			/>
		</View>
	);
}

export default function DatingPrivacyScreen({api, onBack}: Props) {
	const [invisibleMode, setInvisibleMode] = useState(false);
	const [hideAge, setHideAge] = useState(false);
	const [hideCity, setHideCity] = useState(false);
	const [hideOnline, setHideOnline] = useState(false);
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	// Honest limitation: there's no GET /dating/privacy to pre-load
	// current values — the real API only has PATCH endpoints for
	// location/privacy (see API_SECURITY_MATRIX.md), so this screen
	// starts from unchecked defaults rather than falsely showing
	// "off" as if it were confirmed to match the server's actual
	// current state.

	async function save() {
		setSaving(true);
		setStatus(null);
		try {
			await api.datingUpdatePrivacy({
				invisibleMode,
				hideAge,
				hideCity,
				hideOnline,
			});
			setStatus('Сохранено');
		} catch {
			setStatus('Не удалось сохранить. Убедитесь, что анкета знакомств заполнена.');
		} finally {
			setSaving(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Приватность знакомств" />
			<View style={styles.content}>
				<ToggleRow
					label="Невидимый режим"
					description="Ваша анкета не будет показываться в рекомендациях и поиске."
					value={invisibleMode}
					onChange={setInvisibleMode}
				/>
				<ToggleRow
					label="Скрыть возраст"
					description="Другие не увидят ваш точный возраст."
					value={hideAge}
					onChange={setHideAge}
				/>
				<ToggleRow
					label="Скрыть город"
					description="Другие не увидят ваш город."
					value={hideCity}
					onChange={setHideCity}
				/>
				<ToggleRow
					label="Скрыть статус онлайн"
					description="Другие не увидят, когда вы в сети."
					value={hideOnline}
					onChange={setHideOnline}
				/>

				<BerxButton label="Сохранить" onPress={save} loading={saving} fullWidth />
				{status ? <Text style={styles.status}>{status}</Text> : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	content: {padding: spacing.lg, gap: spacing.lg},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md},
	rowText: {flex: 1},
	rowLabel: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	rowDescription: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
	status: {color: colors.textDim, fontSize: typography.sizeSm, textAlign: 'center'},
});
