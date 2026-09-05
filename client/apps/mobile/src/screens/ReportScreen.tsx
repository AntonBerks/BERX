/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Real submit: api.submitReport() (components/OssnApi/v1/report.php),
 * one screen reused across all 4 real target types
 * (post/comment/user/group/dating_profile — confirmed against
 * OssnReport::VALID_TARGET_TYPES). Deliberately NOT offered for
 * places/events: those two are not in the real server whitelist, and
 * a report button there would 422 on every submission.
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxReportTargetType, BerxReportReason} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface ReportScreenProps {
	api: BerxApiClient;
	targetType: BerxReportTargetType;
	targetGuid: number;
	onSubmitted: () => void;
	onBack?: () => void;
}

const REASONS: {key: BerxReportReason; label: string}[] = [
	{key: 'spam', label: 'Спам'},
	{key: 'fake_profile', label: 'Фейковый профиль'},
	{key: 'harassment', label: 'Домогательства или травля'},
	{key: 'inappropriate_content', label: 'Неприемлемый контент'},
	{key: 'underage', label: 'Несовершеннолетний'},
	{key: 'other', label: 'Другое'},
];

export default function ReportScreen(props: ReportScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="social" testID="report">
			<ReportScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function ReportScreenBody({api, targetType, targetGuid, onSubmitted, onBack}: ReportScreenProps) {
	const [reason, setReason] = useState<BerxReportReason | null>(null);
	const [note, setNote] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (!reason) {
			setError('Выберите причину.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await api.submitReport(targetType, targetGuid, reason, note.trim() || undefined);
			onSubmitted();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось отправить жалобу');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Пожаловаться" onBack={onBack} />
			<View style={styles.body}>
				<Text style={styles.label}>Причина</Text>
				<View style={styles.chipWrap}>
					{REASONS.map((r) => (
						<Pressable key={r.key} style={[styles.chip, reason === r.key && styles.chipActive]} onPress={() => setReason(r.key)}>
							<Text style={[styles.chipText, reason === r.key && styles.chipTextActive]}>{r.label}</Text>
						</Pressable>
					))}
				</View>

				<BerxInput placeholder="Дополнительные детали (необязательно)" value={note} onChangeText={setNote} multiline />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Отправить жалобу" variant="danger" loading={submitting} disabled={!reason} onPress={submit} fullWidth />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
	chip: {paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface},
	chipActive: {backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent},
	chipText: {fontSize: typography.sizeSm, color: colors.textDim},
	chipTextActive: {color: colors.accent, fontWeight: typography.weightMedium},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
