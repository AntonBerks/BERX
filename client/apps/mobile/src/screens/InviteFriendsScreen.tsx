/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real Referrals. `code` is the caller's own real guid,
 * base36-encoded server-side (classes/OssnReferrals.php's own
 * header) — not a fabricated invite string. `referred_count` is a
 * real COUNT() over ossn_referrals, never estimated. Both real point
 * rewards (50 for the referrer, 25 for the referred person) only fire
 * once the referred person actually logs in through an ACTIVATED
 * account (see auth.php's /login branch) — a registration alone earns
 * nothing, so this screen doesn't claim a reward is pending just
 * because someone typed the code in.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Share, StyleSheet} from 'react-native';
import {ruPlural} from '@berx/domain';
import type {BerxApiClient} from '@berx/api/client';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onBack?: () => void;
}

export default function InviteFriendsScreen({api, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [code, setCode] = useState<string | null>(null);
	const [referredCount, setReferredCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.referralInfo();
			setCode(res.code);
			setReferredCount(res.referred_count);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить код приглашения');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	async function share() {
		if (!code) return;
		try {
			await Share.share({message: `Заходи в BERX WORLD! Мой код приглашения: ${code}`});
		} catch {
			// user cancelled the real OS share sheet, or it failed — nothing to recover, not an app-level error
		}
	}

	if (loading) return <BerxLoadingState />;
	if (error || !code) return <BerxErrorState message={error ?? 'Код недоступен'} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Пригласить друзей" />
			<BerxFadeIn style={styles.content}>
				<BerxGlassSurface elevated padding="lg" style={styles.codeCard}>
					<Text style={styles.codeLabel}>Ваш код приглашения</Text>
					<Text style={styles.code}>{code}</Text>
				</BerxGlassSurface>
				<Text style={styles.hint}>
					Друг вводит этот код при регистрации. Когда он реально подтвердит почту и впервые войдёт в BERX — вы получите
					50 баллов, а он — 25.
				</Text>
				<BerxButton label="Поделиться кодом" onPress={share} fullWidth />
				<BerxGlassSurface padding="md" style={styles.statRow}>
					<Text style={styles.statValue}>{referredCount}</Text>
					<Text style={styles.statLabel}>{ruPlural(referredCount, 'друг присоединился', 'друга присоединились', 'друзей присоединилось')}</Text>
				</BerxGlassSurface>
			</BerxFadeIn>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	content: {padding: spacing.lg, gap: spacing.md},
	codeCard: {alignItems: 'center', gap: spacing.xs},
	codeLabel: {fontSize: typography.sizeSm, color: colors.textFaint},
	code: {fontSize: typography.sizeTitle, color: colors.accent, fontWeight: typography.weightBold, letterSpacing: 2},
	hint: {fontSize: typography.sizeSm, color: colors.textDim, lineHeight: typography.sizeSm * typography.lineHeightBase},
	statRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md},
	statValue: {fontSize: typography.sizeLg, color: colors.white, fontWeight: typography.weightBold},
	statLabel: {fontSize: typography.sizeSm, color: colors.textDim},
});
