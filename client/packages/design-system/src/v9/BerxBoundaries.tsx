/**
 * BERX V9 SYSTEM BOUNDARIES — the contract, made unavoidable.
 *
 * Every scene contract in the archive declares the same quality gates:
 * seven states, an analytics triple, a reduced-motion fallback, a
 * performance budget, a permission assumption, server-authoritative
 * data. Those were prose. These components are how a screen actually
 * obeys them, and — because they wrap — how a screen CANNOT quietly
 * skip them.
 *
 * They are deliberately small and real. None of them fakes a state it
 * cannot observe: BerxReducedMotionGate reads the OS setting,
 * BerxPerformanceGate reads real device signals, BerxDataBoundary
 * renders whichever real state its caller is actually in.
 */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {AccessibilityInfo, Platform, View, Text, StyleSheet} from 'react-native';
import {useBerxColors} from '../theme';
import {BerxLoadingState, BerxEmptyState, BerxErrorState} from '../components/BerxStates';
import {typography, spacing} from '../tokens';

/* ------------------------------------------------------------------ *
 * REDUCED MOTION
 * ------------------------------------------------------------------ */

const ReducedMotionContext = createContext(false);

/** The OS setting, read for real. Every spatial component reads this rather than each deciding for itself. */
export function BerxReducedMotionGate({children, force}: {children: ReactNode; force?: boolean}) {
	const [reduced, setReduced] = useState(force ?? false);
	useEffect(() => {
		if (force !== undefined) return;
		let alive = true;
		AccessibilityInfo.isReduceMotionEnabled?.()
			.then((v) => alive && setReduced(!!v))
			.catch(() => undefined);
		const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => alive && setReduced(!!v));
		return () => {
			alive = false;
			// RN returns a subscription on modern versions; older ones return void.
			(sub as {remove?: () => void} | undefined)?.remove?.();
		};
	}, [force]);
	return <ReducedMotionContext.Provider value={force ?? reduced}>{children}</ReducedMotionContext.Provider>;
}

export function useBerxReducedMotion(): boolean {
	return useContext(ReducedMotionContext);
}

/* ------------------------------------------------------------------ *
 * PERFORMANCE
 * ------------------------------------------------------------------ */

export interface BerxPerformanceBudget {
	/** The contracts' own cap: "blurLayersMobile <= 3". */
	maxBlurLayers: number;
	/** Particle budget for this device class. */
	particles: number;
	/** Whether parallax/tilt should run at all. */
	spatialEffects: boolean;
}

const PerformanceContext = createContext<BerxPerformanceBudget>({maxBlurLayers: 3, particles: 90, spatialEffects: true});

/**
 * Resolves a real budget from real signals, then holds every screen to
 * it. Android gets the lower particle budget this codebase already
 * uses; reduced motion turns spatial effects off entirely, which is
 * both an accessibility and a performance win.
 */
export function BerxPerformanceGate({children}: {children: ReactNode}) {
	const reduced = useBerxReducedMotion();
	const budget = useMemo<BerxPerformanceBudget>(
		() => ({
			maxBlurLayers: 3,
			particles: Platform.OS === 'android' ? 45 : 90,
			spatialEffects: !reduced,
		}),
		[reduced]
	);
	return <PerformanceContext.Provider value={budget}>{children}</PerformanceContext.Provider>;
}

export function useBerxPerformanceBudget(): BerxPerformanceBudget {
	return useContext(PerformanceContext);
}

/* ------------------------------------------------------------------ *
 * ANALYTICS
 * ------------------------------------------------------------------ */

export interface BerxAnalyticsSink {
	track(event: string, props?: Record<string, unknown>): void;
}

const AnalyticsContext = createContext<BerxAnalyticsSink | null>(null);

export function BerxAnalyticsProvider({sink, children}: {sink: BerxAnalyticsSink | null; children: ReactNode}) {
	return <AnalyticsContext.Provider value={sink}>{children}</AnalyticsContext.Provider>;
}

/**
 * Fires a scene's own `analytics.view` key on mount and hands back its
 * other two keys. No sink installed means no events — never a fabricated
 * "sent" — which is the honest behaviour until a real analytics
 * transport exists in this app.
 */
export function BerxAnalyticsBoundary({
	view,
	primaryAction,
	error,
	children,
}: {
	view: string;
	primaryAction?: string;
	error?: string;
	children: ReactNode;
}) {
	const sink = useContext(AnalyticsContext);
	useEffect(() => {
		sink?.track(view);
	}, [sink, view]);
	const value = useMemo(() => ({view, primaryAction, error, sink}), [view, primaryAction, error, sink]);
	return <SceneAnalyticsContext.Provider value={value}>{children}</SceneAnalyticsContext.Provider>;
}

const SceneAnalyticsContext = createContext<{view: string; primaryAction?: string; error?: string; sink: BerxAnalyticsSink | null} | null>(null);

/** The two commands a scene actually reports, bound to its own contract keys. */
export function useBerxSceneAnalytics() {
	const ctx = useContext(SceneAnalyticsContext);
	const trackPrimary = useCallback((props?: Record<string, unknown>) => {
		if (ctx?.primaryAction) ctx.sink?.track(ctx.primaryAction, props);
	}, [ctx]);
	const trackError = useCallback((props?: Record<string, unknown>) => {
		if (ctx?.error) ctx.sink?.track(ctx.error, props);
	}, [ctx]);
	return {trackPrimary, trackError, view: ctx?.view};
}

/* ------------------------------------------------------------------ *
 * DATA / STATES
 * ------------------------------------------------------------------ */

export interface BerxDataBoundaryProps {
	loading?: boolean;
	error?: string | null;
	empty?: boolean;
	offline?: boolean;
	onRetry?: () => void;
	/** What the empty state should tell the user to do next — the contracts require a next action, not a shrug. */
	emptyTitle?: string;
	emptyHint?: string;
	loadingLabel?: string;
	children: ReactNode;
}

/**
 * The seven-state contract, in one wrapper: default / loading / empty /
 * error / offline are rendered here; success and disabled belong to the
 * control that owns them. Order matters — offline outranks error
 * outranks loading — because a device with no connection should be told
 * that, not shown a generic failure.
 */
export function BerxDataBoundary({loading, error, empty, offline, onRetry, emptyTitle, emptyHint, loadingLabel, children}: BerxDataBoundaryProps) {
	if (offline) return <BerxOfflineState onRetry={onRetry} />;
	if (error) return <BerxErrorState message={error} onRetry={onRetry} />;
	if (loading) return <BerxLoadingState label={loadingLabel} />;
	if (empty) return <BerxEmptyState title={emptyTitle ?? "Пока пусто"} subtitle={emptyHint} />;
	return <>{children}</>;
}

/** The offline state the archive names and this app did not have. Distinct from an error: nothing failed, the device simply cannot reach the server. */
export function BerxOfflineState({onRetry}: {onRetry?: () => void}) {
	const colors = useBerxColors();
	return (
		<View style={styles.state}>
			<Text style={[styles.title, {color: colors.text}]}>Нет соединения</Text>
			<Text style={[styles.hint, {color: colors.textDim}]}>BERX покажет это пространство, как только связь вернётся.</Text>
			{onRetry ? (
				<Text accessibilityRole="button" onPress={onRetry} style={[styles.retry, {color: colors.accent}]}>
					Повторить
				</Text>
			) : null}
		</View>
	);
}

/* ------------------------------------------------------------------ *
 * ERRORS
 * ------------------------------------------------------------------ */

/**
 * A real React error boundary. A scene that throws must not take the
 * whole app down — the contracts require a recovery path, and a blank
 * screen is not one.
 */
export class BerxErrorBoundary extends React.Component<
	{children: ReactNode; onError?: (e: Error) => void; fallback?: ReactNode},
	{failed: boolean; message: string}
> {
	state = {failed: false, message: ''};

	static getDerivedStateFromError(e: Error) {
		return {failed: true, message: e.message};
	}

	componentDidCatch(e: Error) {
		this.props.onError?.(e);
	}

	render() {
		if (!this.state.failed) return this.props.children;
		if (this.props.fallback) return this.props.fallback;
		return <BerxErrorState message={this.state.message || 'Не удалось загрузить это пространство.'} onRetry={() => this.setState({failed: false, message: ''})} />;
	}
}

const styles = StyleSheet.create({
	state: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm},
	title: {fontSize: typography.sizeLg, fontWeight: typography.weightBold, textAlign: 'center'},
	hint: {fontSize: typography.sizeSm, textAlign: 'center'},
	retry: {fontSize: typography.sizeSm, fontWeight: typography.weightMedium, marginTop: spacing.sm},
});
