/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data + real action: api.missions()/api.claimMission()
 * (components/OssnApi/v1/missions.php) — a fixed, real in-code
 * catalog (checkin/post/save_place/rsvp_event/review), real
 * completion state (today's OssnPoints reason-string claim), real
 * server-side re-verification on claim (a 409 means the underlying
 * action genuinely hasn't happened yet today — shown honestly, not
 * silently retried as success).
 *
 * Future UI pass: mission cards move onto BerxGlassSurface and the
 * list gets a real BerxFadeIn entrance, matching the rest of the
 * Rewards-adjacent screens.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMission} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function MissionsScreen({api, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [missions, setMissions] = useState<BerxMission[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [claimingKey, setClaimingKey] = useState<string | null>(null);
	const [noticeKey, setNoticeKey] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.missions();
			setMissions(res.missions);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function handleClaim(key: string) {
		setClaimingKey(key);
		setNoticeKey(null);
		try {
			await api.claimMission(key);
			setMissions((prev: BerxMission[] | null) => (prev ? prev.map((m: BerxMission) => (m.key === key ? {...m, completed: true} : m)) : prev));
		} catch (e) {
			// Honest, real server verdict — not a client guess: 409 means
			// the real action behind this mission hasn't happened yet
			// today (or was already claimed), shown inline on the card.
			if (e instanceof BerxApiError) {
				setNoticeKey(key);
			}
		} finally {
			setClaimingKey(null);
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !missions) return <BerxErrorState message={error ?? 'Не удалось загрузить'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Задания дня" onBack={onBack} />
			{missions.length === 0 ? (
				<BerxEmptyState title="Заданий пока нет" subtitle="Загляните позже — здесь появятся реальные ежедневные задания." />
			) : (
				<BerxFadeIn style={styles.list}>
					{missions.map((m: BerxMission) => (
						<View key={m.key}>
							<BerxGlassSurface padding="md" style={styles.card}>
								<View style={styles.cardInfo}>
									<Text style={styles.title}>{m.title}</Text>
									<Text style={styles.points}>+{m.points} баллов</Text>
									{noticeKey === m.key ? <Text style={styles.notice}>Пока не выполнено — попробуйте ещё раз после действия</Text> : null}
								</View>
								{m.completed ? (
									<Text style={styles.done}>Готово ✓</Text>
								) : (
									<BerxButton
										label="Получить"
										variant="secondary"
										loading={claimingKey === m.key}
										onPress={() => handleClaim(m.key)}
									/>
								)}
							</BerxGlassSurface>
						</View>
					))}
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	list: {padding: spacing.md, gap: spacing.sm},
	card: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm},
	cardInfo: {flex: 1, gap: spacing.xs},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightBold},
	points: {fontSize: typography.sizeSm, color: colors.accent},
	notice: {fontSize: typography.sizeSm, color: colors.textFaint},
	done: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightBold},
});
