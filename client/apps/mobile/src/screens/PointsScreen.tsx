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
 *
 * Future UI pass: the streak row and the boost/spend card move onto
 * BerxGlassSurface, and the hero + spend section get a real BerxFadeIn
 * entrance. History stays a plain divided list, matching the same
 * "not every list is a card" convention used across Messages/Places.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPointsBalance, BerxPointsHistoryEntry} from '@berx/api/types';
import {relativeTimeLabel} from '@berx/domain';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
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

export default function PointsScreen({api, onBack}: Props) {
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
					<BerxFadeIn>
						<View style={styles.hero}>
							<Text style={styles.levelLabel}>Уровень {balance.level}</Text>
							<Text style={styles.balanceValue}>{balance.balance}</Text>
							<Text style={styles.balanceCaption}>баллов на счету</Text>

							<View style={styles.progressTrack}>
								<View style={[styles.progressFill, {width: `${isMaxLevel ? 100 : progressPercent}%`}]} />
							</View>
							<Text style={styles.progressCaption}>
								{isMaxLevel
									? 'Максимальный уровень'
									: `${balance.lifetime_earned} / ${balance.level_ceiling} до уровня ${balance.level + 1}`}
							</Text>
						</View>

						{balance.current_streak > 0 ? (
							<BerxGlassSurface padding="md" style={styles.streakRow}>
								<Text style={styles.streakGlyph}>🔥</Text>
								<View>
									<Text style={styles.streakValue}>{balance.current_streak} {balance.current_streak === 1 ? 'день' : 'дней'} подряд</Text>
									<Text style={styles.streakCaption}>Лучший результат: {balance.longest_streak}</Text>
								</View>
							</BerxGlassSurface>
						) : null}

						<View style={styles.spendSection}>
							<Text style={styles.sectionTitle}>Потратить</Text>
							<BerxGlassSurface elevated padding="lg" style={styles.spendCard}>
								<View style={styles.spendCardText}>
									<Text style={styles.spendCardTitle}>Буст анкеты знакомств</Text>
									<Text style={styles.spendCardSubtitle}>Показ выше в Discover на 30 минут</Text>
								</View>
								<BerxButton label="30" onPress={handleBoost} loading={boosting} disabled={balance.balance < 30} />
							</BerxGlassSurface>
							{boostMessage ? <Text style={styles.boostMessage}>{boostMessage}</Text> : null}
						</View>

						<Text style={styles.sectionTitle}>История</Text>
					</BerxFadeIn>
				}
				renderItem={({item}: {item: BerxPointsHistoryEntry}) => (
					<View style={styles.historyRow}>
						<Text style={styles.historyReason}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
						<View style={styles.historyRight}>
							<Text style={[styles.historyDelta, item.delta < 0 ? styles.historyDeltaNegative : styles.historyDeltaPositive]}>
								{item.delta > 0 ? `+${item.delta}` : item.delta}
							</Text>
							<Text style={styles.historyTime}>{relativeTimeLabel(item.time_created)}</Text>
						</View>
					</View>
				)}
				ListEmptyComponent={<Text style={styles.emptyHistory}>Пока нет начислений</Text>}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	hero: {
		alignItems: 'center',
		paddingVertical: spacing.xxl,
		paddingHorizontal: spacing.xl,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderSoft,
	},
	levelLabel: {color: colors.accent, fontSize: typography.sizeBase, fontWeight: typography.weightMedium, marginBottom: spacing.sm},
	balanceValue: {color: colors.text, fontSize: 48, fontWeight: typography.weightBold},
	balanceCaption: {color: colors.textDim, fontSize: typography.sizeSm, marginBottom: spacing.lg},
	progressTrack: {width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.glass2, overflow: 'hidden'},
	progressFill: {height: '100%', backgroundColor: colors.accent},
	progressCaption: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.sm},
	streakRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg},
	streakGlyph: {fontSize: typography.sizeXl},
	streakValue: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
	streakCaption: {fontSize: typography.sizeXs, color: colors.textFaint},
	spendSection: {padding: spacing.lg},
	sectionTitle: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium, marginBottom: spacing.sm, paddingHorizontal: spacing.sm},
	spendCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
	},
	spendCardText: {flex: 1},
	spendCardTitle: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	spendCardSubtitle: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: spacing.xs},
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
	historyReason: {color: colors.text, fontSize: typography.sizeSm},
	historyRight: {alignItems: 'flex-end'},
	historyDelta: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	historyDeltaPositive: {color: colors.success},
	historyDeltaNegative: {color: colors.danger},
	historyTime: {color: colors.textFaint, fontSize: 11, marginTop: 2},
	emptyHistory: {color: colors.textFaint, fontSize: typography.sizeSm, textAlign: 'center', padding: spacing.xl},
});
