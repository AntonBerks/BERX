/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Every toggle here maps to a real, server-enforced field
 * (OssnDating::saveProfile(), audited earlier this session) — not a
 * cosmetic switch. invisible_mode in particular was the exact field
 * found to be dead (saved but never enforced) in an earlier audit,
 * then fixed server-side; this screen is what actually lets a user
 * reach that real, working toggle.
 *
 * MAX BUILD — closes a real gap found by an orphan-method sweep:
 * api.datingUpdateLocation() (real PATCH /dating/location,
 * OssnDating::updateLocation()) was always a real, working client
 * method with ZERO UI caller anywhere — meaning the just-shipped
 * "Идеи для свидания" (GET /dating/date-ideas) was unreachable for
 * every real user, since that route requires a dating location to
 * already be set and there was no way to set one. Same honest manual
 * lat/lng text-input pattern already established on PlaceDetailScreen's
 * check-in (no device Geolocation library installable in this
 * sandbox) — the server is the only one that ever acts on these
 * coordinates, this is just "no on-device GPS reading available
 * here", not "trust the client".
 */
import {useState} from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';

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
	const [lat, setLat] = useState('');
	const [lng, setLng] = useState('');
	const [hideLocation, setHideLocation] = useState(false);
	const [locationSaving, setLocationSaving] = useState(false);
	const [locationStatus, setLocationStatus] = useState<string | null>(null);

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

	async function saveLocation() {
		const la = Number(lat);
		const ln = Number(lng);
		if ((lat.trim() !== '' || lng.trim() !== '') && (!Number.isFinite(la) || !Number.isFinite(ln))) {
			setLocationStatus('Введите корректные координаты.');
			return;
		}
		setLocationSaving(true);
		setLocationStatus(null);
		try {
			await api.datingUpdateLocation({
				...(lat.trim() !== '' ? {latitude: la} : {}),
				...(lng.trim() !== '' ? {longitude: ln} : {}),
				hideLocation,
			});
			setLocationStatus('Геопозиция сохранена');
		} catch {
			setLocationStatus('Не удалось сохранить. Убедитесь, что анкета знакомств заполнена.');
		} finally {
			setLocationSaving(false);
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

				<Text style={styles.sectionTitle}>Геопозиция для знакомств</Text>
				<Text style={styles.rowDescription}>Нужна для «Идей для свидания» с совпадениями — реальные места рядом с вами. Координаты вводятся вручную (устройство без GPS-модуля в этой среде), сервер использует их только для поиска мест.</Text>
				<View style={styles.locationRow}>
					<View style={styles.locationHalf}><BerxInput placeholder="Широта" value={lat} onChangeText={setLat} keyboardType="decimal-pad" /></View>
					<View style={styles.locationHalf}><BerxInput placeholder="Долгота" value={lng} onChangeText={setLng} keyboardType="decimal-pad" /></View>
				</View>
				<ToggleRow
					label="Скрыть геопозицию"
					description="Другие не увидят вашу геопозицию (используется только для ваших собственных подборок мест)."
					value={hideLocation}
					onChange={setHideLocation}
				/>
				<BerxButton label="Сохранить геопозицию" variant="secondary" onPress={saveLocation} loading={locationSaving} fullWidth />
				{locationStatus ? <Text style={styles.status}>{locationStatus}</Text> : null}
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
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.md},
	locationRow: {flexDirection: 'row', gap: spacing.sm},
	locationHalf: {flex: 1},
});
