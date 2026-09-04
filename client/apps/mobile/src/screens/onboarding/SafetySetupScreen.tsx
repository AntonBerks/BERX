/**
 * BERX-009 — Safety Setup.
 *
 * Safety in BERX is three real, server-enforced capabilities, and this
 * screen exists to make sure a new person knows they have them before
 * they need them: blocking (`POST /block`, `DELETE /block`), the
 * blocked list (`GET /block`), and reporting (`POST /report`).
 *
 * It configures nothing, because there is nothing to configure: BERX
 * has no account-wide safety settings resource. So rather than a page
 * of switches that write nowhere, this shows what is real, opens the
 * real screens, and states the one honest limit — post visibility is
 * per-post, and there is no global privacy switch.
 */
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIcon, type BerxIconName} from '../../../../../packages/design-system/src/icons';
import {BerxActionShelf} from '../../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene} from '../../spatial/BerxScreenScene';

export interface SafetySetupScreenProps {
	onOpenBlockedUsers?: () => void;
	onOpenDatingPrivacy?: () => void;
	onDone: () => void;
	onBack?: () => void;
}

interface SafetyItem {
	icon: BerxIconName;
	title: string;
	body: string;
}

const ITEMS: SafetyItem[] = [
	{
		icon: 'shield',
		title: 'Блокировка',
		body: 'Заблокированный человек не увидит вас и не сможет написать. Действует сразу и проверяется на сервере, а не в приложении.',
	},
	{
		icon: 'report',
		title: 'Жалоба',
		body: 'На пост, комментарий, человека, сообщество или анкету знакомств. Жалоба уходит модераторам BERX с реальным поводом.',
	},
	{
		icon: 'lock',
		title: 'Видимость поста',
		body: 'У каждого поста своя видимость: все, друзья или конкретный круг. Выбирается при публикации.',
	},
];

export default function SafetySetupScreen(props: SafetySetupScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-009" testID="berx-009">
			<SafetySetupSceneBody {...props} />
		</BerxScreenScene>
	);
}

function SafetySetupSceneBody({onOpenBlockedUsers, onOpenDatingPrivacy, onDone, onBack}: SafetySetupScreenProps) {
	return (
		<View style={styles.screen}>
			<BerxHeader title="Безопасность" onBack={onBack} />

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.lead}>
					В BERX есть три реальных инструмента. Они работают на сервере, а не только в интерфейсе — стоит знать о них
					заранее.
				</Text>

				{ITEMS.map((item) => (
					<BerxSpatialCard key={item.title} depth="D3" padding={spacing.lg}>
						<View style={styles.row}>
							<BerxIcon name={item.icon} size={24} state="active" decorative />
							<View style={styles.text}>
								<Text style={styles.title}>{item.title}</Text>
								<Text style={styles.body}>{item.body}</Text>
							</View>
						</View>
					</BerxSpatialCard>
				))}

				<Text style={styles.note}>
					Общего переключателя приватности у аккаунта нет — в API BERX нет такого ресурса. Видимость задаётся у каждого
					поста, а приватность анкеты знакомств настраивается отдельно.
				</Text>

				<BerxActionShelf variant="anchored">
					{onOpenBlockedUsers ? (
						<BerxButton label="Заблокированные" variant="secondary" onPress={onOpenBlockedUsers} fullWidth />
					) : null}
					{onOpenDatingPrivacy ? (
						<BerxButton label="Приватность знакомств" variant="secondary" onPress={onOpenDatingPrivacy} fullWidth />
					) : null}
					<BerxButton label="Понятно" onPress={onDone} fullWidth />
				</BerxActionShelf>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	lead: {color: colors.textDim, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * 1.45},
	row: {flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start'},
	text: {flex: 1, gap: spacing.xs},
	title: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	body: {color: colors.textDim, fontSize: typography.sizeSm, lineHeight: typography.sizeSm * 1.5},
	note: {color: colors.textFaint, fontSize: typography.sizeXs, lineHeight: typography.sizeXs * 1.6},
	actions: {gap: spacing.sm, marginTop: spacing.md},
});
