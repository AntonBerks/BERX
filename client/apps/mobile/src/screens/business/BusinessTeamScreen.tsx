/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * DESIGN REFERENCE SCREEN. Real data: api.businessTeam()/
 * addBusinessTeamMember()/removeBusinessTeamMember() — owner/admin
 * only, enforced server-side. Adding a member needs their real
 * user_guid — this reference screen takes it as a manual field
 * (no "search users" picker exists in this pass); a real product
 * screen would wire a real user search here.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Image, ScrollView, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBusinessTeamMember, BerxBusinessTeamRole} from '@berx/api/types';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEyebrow} from '../../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../../packages/design-system/src/components/BerxStates';

import {useBerxColors} from '../../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

export default function BusinessTeamScreen({api, placeGuid, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [team, setTeam] = useState<BerxBusinessTeamMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [newGuid, setNewGuid] = useState('');
	const [newRole, setNewRole] = useState<BerxBusinessTeamRole>('staff');
	const [adding, setAdding] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.businessTeam(placeGuid);
			setTeam(res.team);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить команду');
		} finally {
			setLoading(false);
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleAdd() {
		const guid = parseInt(newGuid, 10);
		if (!guid) {
			setAddError('Введите корректный ID пользователя.');
			return;
		}
		setAdding(true);
		setAddError(null);
		try {
			await api.addBusinessTeamMember(placeGuid, guid, newRole);
			setNewGuid('');
			await load();
		} catch (e) {
			setAddError(e instanceof Error ? e.message : 'Не удалось добавить сотрудника');
		} finally {
			setAdding(false);
		}
	}

	async function handleRemove(guid: number) {
		setBusyGuid(guid);
		try {
			await api.removeBusinessTeamMember(placeGuid, guid);
			setTeam((prev) => prev.filter((m) => m.guid !== guid));
		} catch {
			// list stays as-is on failure
		} finally {
			setBusyGuid(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
			<BerxHeader onBack={onBack} />
			<Text style={styles.pageTitle}>Команда</Text>

			<BerxEyebrow>Добавить сотрудника</BerxEyebrow>
			<BerxGlassSurface style={styles.addCard}>
				<BerxInput placeholder="ID пользователя" value={newGuid} onChangeText={setNewGuid} />
				<View style={styles.roleRow}>
					<Pressable style={[styles.roleChip, newRole === 'manager' && styles.roleChipActive]} onPress={() => setNewRole('manager')}>
						<Text style={[styles.roleChipText, newRole === 'manager' && styles.roleChipTextActive]}>Менеджер</Text>
					</Pressable>
					<Pressable style={[styles.roleChip, newRole === 'staff' && styles.roleChipActive]} onPress={() => setNewRole('staff')}>
						<Text style={[styles.roleChipText, newRole === 'staff' && styles.roleChipTextActive]}>Сотрудник</Text>
					</Pressable>
				</View>
				{addError ? <Text style={styles.addError}>{addError}</Text> : null}
				<BerxButton label="Добавить" onPress={handleAdd} loading={adding} fullWidth />
			</BerxGlassSurface>

			<BerxEyebrow>{`Команда (${team.length})`}</BerxEyebrow>
			{team.length === 0 ? (
				<BerxGlassSurface><Text style={styles.emptyText}>Пока только вы управляете этим местом.</Text></BerxGlassSurface>
			) : (
				team.map((m) => (
					<BerxGlassSurface key={m.guid} style={styles.memberRow}>
						<Image source={{uri: m.icon}} style={styles.avatar} />
						<View style={styles.memberBody}>
							<Text style={styles.memberName}>{m.fullname}</Text>
							<Text style={styles.memberRole}>{m.role === 'manager' ? 'Менеджер' : 'Сотрудник'}</Text>
						</View>
						<Pressable onPress={() => handleRemove(m.guid)} disabled={busyGuid === m.guid} hitSlop={8}>
							<Text style={styles.removeText}>Убрать</Text>
						</Pressable>
					</BerxGlassSurface>
				))
			)}
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	pageTitle: {fontSize: typography.sizeTitle, color: colors.white, fontWeight: typography.weightBold},
	addCard: {gap: spacing.sm},
	roleRow: {flexDirection: 'row', gap: spacing.sm},
	roleChip: {flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.glass1},
	roleChipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	roleChipText: {fontSize: typography.sizeSm, color: colors.textDim},
	roleChipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	addError: {fontSize: typography.sizeSm, color: colors.danger},
	emptyText: {color: colors.textFaint, fontSize: typography.sizeSm},
	memberRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	memberBody: {flex: 1, gap: 2},
	memberName: {color: colors.white, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	memberRole: {color: colors.textFaint, fontSize: typography.sizeXs},
	removeText: {color: colors.danger, fontSize: typography.sizeSm},
});
