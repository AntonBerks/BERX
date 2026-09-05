/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Every number here is real: balance/level/progress from
 * GET /api/v1/points, history from GET /api/v1/points/history, spend
 * via the real POST /api/v1/dating/boost (server-checked price, can't
 * be spoofed from the client — see points.php/dating.php). No level
 * definitions invented here — REWARDS/LEVEL_THRESHOLDS live once, in
 * OssnPoints.php, and this screen only displays what the server
 * computed from them.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPointsBalance, BerxPointsHistoryEntry} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxRewardCard} from '../../../../packages/design-system/src/spatial/BerxRewardCard';
import {BerxProgressRing} from '../../../../packages/design-system/src/spatial/BerxProgressRing';
import {BerxStatRail} from '../../../../packages/design-system/src/spatial/BerxStatRail';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxEyebrow} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface PointsScreenProps {
	api: BerxApiClient;
	onBack: () => void;
}

const REASON_LABELS: Record<string, string> = {
	post_created: 'Публикация поста',
	story_created: 'Публикация истории',
	dating_match: 'Взаимная симпатия',
	profile_completed: 'Заполненный профиль',
	dating_boost: 'Буст анкеты',
};

/**
 * The real cost of the one thing points buy. Named here so the number
 * on the card and the number the server charges cannot drift apart.
 */
const BOOST_COST_POINTS = 30;

export default function PointsScreen(props: PointsScreenProps) {
	return (
		<BerxFamilyScene family="PROFILE" atmosphereKind="premium" testID="points">
			<PointsSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function PointsSceneBody({api, onBack}: PointsScreenProps) {
	const [balance, setBalance] = useState<BerxPointsBalance | null>(null);
	const [history, setHistory] = useState<BerxPointsHistoryEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [boosting, setBoosting] = useState(false);
	const [boostMessage, setBoostMessage] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const [bal, hist] = await Promise.all([api.pointsBalance(), api.pointsHistory()]);
			setBalance(bal);
			setHistory(hist.history);
			setError(null);
		} catch {
			setError('Не удалось загрузить баллы');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleBoost() {
		setBoosting(true);
		setBoostMessage(null);
		try {
			await api.boostDatingProfile();
			setBoostMessage('Анкета в буст на 30 минут');
			await load(); // refresh balance after a real spend
		} catch {
			setBoostMessage('Недостаточно баллов или нет анкеты знакомств');
		} finally {
			setBoosting(false);
		}
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} title="Баллы" />
				<BerxLoadingState label="Загрузка..." />
			</View>
		);
	}
	if (error || !balance) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} title="Баллы" />
				<BerxErrorState message={error ?? 'Нет данных'} onRetry={load} />
			</View>
		);
	}

	const progressPercent = Math.round(balance.level_progress_ratio * 100);
	const isMaxLevel = balance.level_ceiling === null;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Баллы" />
			<FlatList
				data={history}
				keyExtractor={(item: BerxPointsHistoryEntry, i: number) => `${item.time_created}-${i}`}
				ListHeaderComponent={
					<View>
						<BerxSpatialCard depth="D3" padding={spacing.xl} style={styles.heroCard}>
							<View style={styles.heroRow}>
								{/* the real level_progress_ratio, announced as a percentage */}
								<BerxProgressRing
									progress={isMaxLevel ? 1 : balance.level_progress_ratio}
									size={72}
									thickness={4}
									accessibilityLabel={
										isMaxLevel
											? 'Максимальный уровень'
											: `Прогресс до уровня ${balance.level + 1}: ${progressPercent}%`
									}
								/>
								<View style={styles.heroText}>
									<BerxText role="callout" emphasis="accent">Уровень {balance.level}</BerxText>
									<Text style={styles.balanceValue}>{balance.balance}</Text>
									<BerxText role="meta" emphasis="secondary">баллов на счету</BerxText>
								</View>
							</View>
							<BerxText role="meta" emphasis="tertiary" style={styles.progressCaption}>
								{isMaxLevel
									? 'Максимальный уровень'
									: `${balance.lifetime_earned} / ${balance.level_ceiling} до уровня ${balance.level + 1}`}
							</BerxText>
							<BerxStatRail
								stats={[
									{key: 'lifetime', label: 'заработано всего', value: balance.lifetime_earned},
									{
										key: 'streak',
										label: 'дней подряд',
										/* omitted, not zeroed, when there is no streak */
										value: balance.current_streak > 0 ? balance.current_streak : undefined,
									},
									{
										key: 'longest',
										label: 'лучшая серия',
										value: balance.longest_streak > 0 ? balance.longest_streak : undefined,
									},
								]}
							/>
						</BerxSpatialCard>

						{balance.current_streak > 0 ? (
							<BerxSpatialCard depth="D3" padding={spacing.md} radius={18} style={styles.streakCard}>
					<View style={styles.streakRow}>
								<BerxText role="heading">🔥</BerxText>
								<View>
									<BerxText role="callout">{balance.current_streak} {balance.current_streak === 1 ? 'день' : 'дней'} подряд</BerxText>
									<BerxText role="meta" emphasis="tertiary">Лучший результат: {balance.longest_streak}</BerxText>
								</View>
							</View>
				</BerxSpatialCard>
						) : null}

						<View style={styles.spendSection}>
							<BerxEyebrow tone="quiet">
								Потратить
							</BerxEyebrow>
							{/**
							 * One reward, because BERX has exactly one thing
							 * points can be spent on: /points/spend accepts the
							 * single reason 'dating_boost'. A catalogue of
							 * rewards here would be a catalogue of buttons that
							 * do nothing.
							 */}
							<BerxRewardCard
								rewardId="dating_boost"
								title="Буст анкеты знакомств"
								description="Показ выше в Discover на 30 минут"
								costPoints={BOOST_COST_POINTS}
								balancePoints={balance.balance}
								actions={
									<BerxButton
										label={`Потратить ${BOOST_COST_POINTS}`}
										onPress={handleBoost}
										loading={boosting}
										disabled={balance.balance < BOOST_COST_POINTS}
									/>
								}
							/>
							{boostMessage ? (
								<Text accessibilityLiveRegion="polite" style={styles.boostMessage}>
									{boostMessage}
								</Text>
							) : null}
						</View>

						<BerxEyebrow tone="quiet">История</BerxEyebrow>
					</View>
				}
				renderItem={({item}: {item: BerxPointsHistoryEntry}) => (
					<View style={styles.historyRow}>
						<BerxText role="meta">{REASON_LABELS[item.reason] ?? item.reason}</BerxText>
						<View style={styles.historyRight}>
							<Text style={[styles.historyDelta, item.delta < 0 ? styles.historyDeltaNegative : styles.historyDeltaPositive]}>
								{item.delta > 0 ? `+${item.delta}` : item.delta}
							</Text>
							<Text style={styles.historyTime}>{relativeTimeLabel(item.time_created)}</Text>
						</View>
					</View>
				)}
				ListEmptyComponent={<BerxText role="meta" emphasis="tertiary" style={styles.emptyHistory}>Пока нет начислений</BerxText>}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	heroCard: {margin: spacing.lg},
	heroRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg},
	heroText: {flex: 1, gap: 2},
	/* the scene paints the background now */
	screen: {flex: 1},
	balanceValue: {color: colors.text, fontSize: 40, fontWeight: typography.weightBold},
	progressCaption: {marginTop: spacing.sm},
	streakCard: {marginHorizontal: spacing.lg},
	streakRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	spendSection: {padding: spacing.lg},
	boostMessage: {color: colors.textDim, fontSize: typography.sizeXs, marginTop: spacing.sm, paddingHorizontal: spacing.sm},
	historyRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
	},
	historyRight: {alignItems: 'flex-end'},
	historyDelta: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	historyDeltaPositive: {color: colors.success},
	historyDeltaNegative: {color: colors.danger},
	historyTime: {color: colors.textFaint, fontSize: 11, marginTop: 2},
	emptyHistory: {textAlign: 'center', padding: spacing.xl},
});
