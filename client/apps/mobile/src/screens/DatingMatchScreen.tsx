/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Own BERX visual language, not a Tinder/Pure/Bumble clone: orange
 * glow, BERX typography, real actions (message the match / keep
 * browsing) — not a static congratulations graphic.
 */
import {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	otherUsername: string;
	onMessage: () => void;
	onContinueBrowsing: () => void;
}

export default function DatingMatchScreen({otherUsername, onMessage, onContinueBrowsing}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	return (
		<View style={styles.screen}>
			<View style={styles.glow} />
			<Text style={styles.title}>Это совпадение!</Text>
			<Text style={styles.subtitle}>Вы понравились друг другу с {otherUsername}</Text>

			<View style={styles.avatars}>
				<View style={styles.avatarPlaceholder} />
				<View style={styles.heart}>
					<Text style={styles.heartText}>♥</Text>
				</View>
				<View style={styles.avatarPlaceholder} />
			</View>

			<View style={styles.actions}>
				<BerxButton label="Написать" onPress={onMessage} fullWidth />
				<BerxButton label="Продолжить просмотр" variant="secondary" onPress={onContinueBrowsing} fullWidth />
			</View>
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.black,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing.xl,
	},
	glow: {
		position: 'absolute',
		top: -80,
		width: 320,
		height: 320,
		borderRadius: 160,
		backgroundColor: colors.accentSoft,
	},
	title: {color: colors.accent, fontSize: typography.sizeHero, fontWeight: typography.weightBold, marginBottom: spacing.sm},
	subtitle: {color: colors.textDim, fontSize: typography.sizeBase, marginBottom: spacing.xxl, textAlign: 'center'},
	avatars: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xxl},
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: colors.graphite,
		borderWidth: 3,
		borderColor: colors.accent,
	},
	heart: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center',
	},
	heartText: {color: colors.black, fontSize: 20},
	actions: {width: '100%', gap: spacing.md},
});
