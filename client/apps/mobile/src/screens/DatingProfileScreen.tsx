/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.saveDatingProfile()/
 * getOwnDatingProfile() were always real, working client methods
 * (backed by OssnDating::saveProfile()/getProfile(), audited earlier
 * this session for the boost/rate-limit fixes) but had zero callers
 * anywhere in the app — there was no screen to actually create or
 * edit a dating profile from mobile. DatingDiscoverScreen's own error
 * message ("заполните её на сайте") pointed users to the website
 * instead of a real in-app path. This screen is that real path: a
 * 404 from getOwnDatingProfile() means "no profile yet" (a real,
 * expected state for a new user, not an error), everything else
 * loads the real current values before editing.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {BerxApiError} from '@berx/core';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState} from '../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onBack: () => void;
}

export default function DatingProfileScreen({api, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [loading, setLoading] = useState(true);
	const [pseudonym, setPseudonym] = useState('');
	const [age, setAge] = useState('');
	const [city, setCity] = useState('');
	const [goal, setGoal] = useState('');
	const [bio, setBio] = useState('');
	const [interests, setInterests] = useState('');
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const profile = await api.getOwnDatingProfile();
			setPseudonym(profile.pseudonym);
			setAge(profile.age !== null ? String(profile.age) : '');
			setCity(profile.city ?? '');
			setGoal(profile.goal ?? '');
			setBio(profile.bio ?? '');
			setInterests(profile.interests ?? '');
		} catch (e) {
			// A 404 here is real and expected — no profile yet, not a
			// failure to show an error state for. Any other failure
			// still leaves the form at real defaults, ready to create.
			if (!(e instanceof BerxApiError && e.status === 404)) {
				setStatus('Не удалось загрузить текущую анкету — можно всё равно заполнить и сохранить.');
			}
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function save() {
		if (!pseudonym.trim()) {
			setStatus('Введите имя для анкеты');
			return;
		}
		setSaving(true);
		setStatus(null);
		try {
			await api.saveDatingProfile({
				pseudonym: pseudonym.trim(),
				age: age.trim() ? Number(age.trim()) : undefined,
				city: city.trim() || undefined,
				goal: goal.trim() || undefined,
				bio: bio.trim() || undefined,
				interests: interests.trim() || undefined,
			});
			setStatus('Сохранено');
		} catch {
			setStatus('Не удалось сохранить анкету');
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} title="Анкета знакомств" />
				<BerxLoadingState label="Загрузка анкеты..." />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Анкета знакомств" />
			<View style={styles.content}>
				<BerxInput placeholder="Имя в анкете" value={pseudonym} onChangeText={setPseudonym} />
				<BerxInput placeholder="Возраст" value={age} onChangeText={setAge} keyboardType="number-pad" />
				<BerxInput placeholder="Город" value={city} onChangeText={setCity} />
				<BerxInput placeholder="Что ищете" value={goal} onChangeText={setGoal} />
				<BerxInput placeholder="О себе" value={bio} onChangeText={setBio} multiline />
				<BerxInput placeholder="Интересы" value={interests} onChangeText={setInterests} />
				<BerxButton label="Сохранить" onPress={save} loading={saving} fullWidth />
				{status ? <Text style={styles.status}>{status}</Text> : null}
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	content: {padding: spacing.lg, gap: spacing.md},
	status: {color: colors.textDim, fontSize: typography.sizeSm, textAlign: 'center'},
});
