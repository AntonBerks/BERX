/**
 * BerxCountdown — time until a real event start.
 *
 * Ticks once a second only while the scene allows ambient motion;
 * under reduced motion or a tight frame budget it renders the same
 * value statically and updates on the minute instead. Either way the
 * remaining time is computed from the event's real server timestamp,
 * never from a duration the client invented.
 *
 * Announced politely rather than assertively — a countdown that
 * interrupts a screen reader every second is unusable.
 */
import {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {rgba} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {colors, spacing, typography} from '../tokens';

export interface BerxCountdownProps {
	/** Unix seconds, from the server. */
	startsAtUnix: number;
	/** Injected for tests; defaults to the real clock. */
	nowUnix?: number;
	label?: string;
	testID?: string;
}

function parts(seconds: number) {
	const s = Math.max(0, seconds);
	return {
		days: Math.floor(s / 86400),
		hours: Math.floor((s % 86400) / 3600),
		minutes: Math.floor((s % 3600) / 60),
		seconds: Math.floor(s % 60),
	};
}

export function formatCountdown(remainingSeconds: number): string {
	if (remainingSeconds <= 0) return 'уже идёт';
	const p = parts(remainingSeconds);
	if (p.days > 0) return `через ${p.days} д ${p.hours} ч`;
	if (p.hours > 0) return `через ${p.hours} ч ${p.minutes} мин`;
	if (p.minutes > 0) return `через ${p.minutes} мин`;
	return `через ${p.seconds} с`;
}

export function BerxCountdown({startsAtUnix, nowUnix, label = 'Начало', testID}: BerxCountdownProps) {
	const {scene} = useBerxScene();
	const live = scene.budget.allowAmbientMotion && !scene.reducedMotion;
	const [now, setNow] = useState(() => nowUnix ?? Math.floor(Date.now() / 1000));

	useEffect(() => {
		if (nowUnix !== undefined) return;
		/* one second when motion is welcome, one minute when it is not */
		const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), live ? 1000 : 60000);
		return () => clearInterval(interval);
	}, [nowUnix, live]);

	const remaining = startsAtUnix - now;
	const text = formatCountdown(remaining);
	const started = remaining <= 0;

	return (
		<View
			testID={testID}
			accessible
			accessibilityRole="text"
			accessibilityLiveRegion="polite"
			accessibilityLabel={`${label}: ${text}`}
			style={[
				styles.root,
				{
					backgroundColor: rgba(started ? colors.success : scene.accent, 0.12),
					borderColor: rgba(started ? colors.success : scene.accent, 0.36),
				},
			]}>
			<Text style={[styles.text, {color: started ? colors.success : scene.accent}]}>{text}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: 999, borderWidth: 1},
	text: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
});
