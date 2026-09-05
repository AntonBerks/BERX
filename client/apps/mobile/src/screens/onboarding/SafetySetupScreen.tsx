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
import {ScrollView, StyleSheet, View} from 'react-native';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxIcon, type BerxIconName} from '../../../../../packages/design-system/src/icons';
import {BerxActionShelf} from '../../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene} from '../../spatial/BerxScreenScene';
import {BerxText} from '../../../../../packages/design-system/src/spatial/BerxText';

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
				<BerxText role="body" emphasis="secondary">
					В BERX есть три реальных инструмента. Они работают на сервере, а не только в интерфейсе — стоит знать о них
					заранее.
				</BerxText>

				{ITEMS.map((item) => (
					<BerxSpatialCard key={item.title} depth="D3" padding={spacing.lg}>
						<View style={styles.row}>
							<BerxIcon name={item.icon} size={24} state="active" decorative />
							<View style={styles.text}>
								<BerxText role="subtitle">{item.title}</BerxText>
								<BerxText role="meta" emphasis="secondary">{item.body}</BerxText>
							</View>
						</View>
					</BerxSpatialCard>
				))}

				<BerxText role="meta" emphasis="tertiary">
					Общего переключателя приватности у аккаунта нет — в API BERX нет такого ресурса. Видимость задаётся у каждого
					поста, а приватность анкеты знакомств настраивается отдельно.
				</BerxText>

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
	row: {flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start'},
	text: {flex: 1, gap: spacing.xs},
	actions: {gap: spacing.sm, marginTop: spacing.md},
});
