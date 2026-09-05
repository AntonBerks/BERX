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
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxReportTargetType, BerxReportReason} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxChoiceChips} from '../../../../packages/design-system/src/spatial/BerxChoiceChips';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

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
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.body}>
					{/* D2 — the work sits on a structural surface, not on the substrate */}
					<BerxGlassSurface padding="lg" style={styles.form}>
						<BerxText role="micro" emphasis="tertiary">Причина</BerxText>
						{/* the reasons the API actually accepts, nothing invented */}
						<BerxChoiceChips
							accessibilityLabel="Причина жалобы"
							value={reason ?? undefined}
							onChange={(key) => setReason(key as BerxReportReason)}
							options={REASONS.map((r) => ({key: r.key, label: r.label}))}
						/>

						<BerxInput placeholder="Дополнительные детали (необязательно)" value={note} onChangeText={setNote} multiline />

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<BerxButton label="Отправить жалобу" variant="danger" loading={submitting} disabled={!reason} onPress={submit} fullWidth />
				</BerxGlassSurface>
				</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	form: {gap: spacing.md},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
