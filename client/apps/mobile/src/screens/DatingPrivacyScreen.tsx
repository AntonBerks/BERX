/**
 * Dating / Privacy — a SOCIAL-family v9 scene.
 *
 * Every toggle maps to a real, server-enforced field on
 * `PATCH /dating/privacy`. `invisible_mode` in particular was once
 * saved but never enforced; that was fixed server-side, and this
 * screen is what lets a user reach the working toggle.
 *
 * `hide_profile` was accepted by the endpoint and had no control at
 * all — five real fields, four switches. It is here now.
 *
 * Honest limitation, stated on the screen and not just in a comment:
 * there is no read for privacy state. `/dating/profile` returns
 * pseudonym, age, city, goal, bio and interests — no privacy flags —
 * and `/dating/privacy` is PATCH-only. So the switches cannot show
 * the server's current settings, and the screen says so instead of
 * rendering "off" as though it were confirmed. Only the fields the
 * user actually touches are sent, so opening this screen and saving
 * cannot silently switch something off that was on.
 */
import {useCallback, useState} from 'react';
import {ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface DatingPrivacyScreenProps {
	api: BerxApiClient;
	onBack: () => void;
}

/** The five real fields `PATCH /dating/privacy` accepts. */
type PrivacyField = 'invisibleMode' | 'hideProfile' | 'hideAge' | 'hideCity' | 'hideOnline';

const FIELDS: {key: PrivacyField; label: string; description: string}[] = [
	{
		key: 'invisibleMode',
		label: 'Невидимый режим',
		description: 'Ваша анкета не показывается в рекомендациях и поиске.',
	},
	{
		key: 'hideProfile',
		label: 'Скрыть анкету',
		description: 'Анкета остаётся, но её не видят другие пользователи.',
	},
	{key: 'hideAge', label: 'Скрыть возраст', description: 'Другие не увидят ваш точный возраст.'},
	{key: 'hideCity', label: 'Скрыть город', description: 'Другие не увидят ваш город.'},
	{key: 'hideOnline', label: 'Скрыть статус онлайн', description: 'Другие не увидят, когда вы в сети.'},
];

export default function DatingPrivacyScreen(props: DatingPrivacyScreenProps) {
	return (
		<BerxFamilyScene family="SOCIAL" atmosphereKind="identity" testID="dating-privacy">
			<DatingPrivacySceneBody {...props} />
		</BerxFamilyScene>
	);
}

function DatingPrivacySceneBody({api, onBack}: DatingPrivacyScreenProps) {
	const {scene} = useBerxScene();
	const [values, setValues] = useState<Partial<Record<PrivacyField, boolean>>>({});
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<{tone: 'ok' | 'error'; text: string} | null>(null);

	/** Touched fields only — an untouched switch is never sent. */
	const touched = Object.keys(values) as PrivacyField[];

	const save = useCallback(async () => {
		if (touched.length === 0) return;
		setSaving(true);
		setStatus(null);
		try {
			await api.datingUpdatePrivacy(values);
			/* confirmed by the server before anything is called saved */
			setStatus({tone: 'ok', text: 'Сохранено'});
		} catch {
			setStatus({tone: 'error', text: 'Не удалось сохранить. Убедитесь, что анкета знакомств заполнена.'});
		} finally {
			setSaving(false);
		}
	}, [api, values, touched.length]);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Приватность знакомств" />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<BerxSpatialCard depth="D2" padding={spacing.lg}>
					<BerxText role="meta" emphasis="secondary">
						BERX не отдаёт текущие настройки приватности через API — их можно только записать. Поэтому переключатели
						ниже не показывают ваше текущее состояние. Отправляются только те, которые вы измените.
					</BerxText>
				</BerxSpatialCard>

				{FIELDS.map((field) => {
					const value = values[field.key] ?? false;
					const isTouched = values[field.key] !== undefined;
					return (
						<BerxSpatialCard key={field.key} depth="D3" padding={spacing.lg} radius={18}>
							<View style={styles.row}>
								<View style={styles.rowText}>
									<BerxText role="callout">{field.label}</BerxText>
									<BerxText role="meta" emphasis="tertiary" style={styles.rowDescription}>{field.description}</BerxText>
									<Text style={[styles.rowState, isTouched ? {color: scene.accent} : null]}>
										{isTouched ? (value ? 'будет включено' : 'будет выключено') : 'не изменено'}
									</Text>
								</View>
								<Switch
									value={value}
									onValueChange={(next) => setValues((prev) => ({...prev, [field.key]: next}))}
									accessibilityLabel={field.label}
									accessibilityHint={field.description}
									trackColor={{false: colors.glass2, true: colors.accentSoft}}
									thumbColor={value ? scene.accent : colors.textFaint}
								/>
							</View>
						</BerxSpatialCard>
					);
				})}

				<BerxButton
					label={touched.length === 0 ? 'Нечего сохранять' : `Сохранить (${touched.length})`}
					onPress={save}
					loading={saving}
					disabled={touched.length === 0}
					fullWidth
				/>
				{status ? (
					<Text
						accessibilityLiveRegion="polite"
						accessibilityRole={status.tone === 'error' ? 'alert' : 'text'}
						style={[styles.status, status.tone === 'error' ? {color: colors.danger} : {color: colors.success}]}>
						{status.text}
					</Text>
				) : null}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md},
	rowText: {flex: 1},
	rowDescription: {marginTop: spacing.xs},
	rowState: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
	status: {fontSize: typography.sizeSm, textAlign: 'center'},
});
