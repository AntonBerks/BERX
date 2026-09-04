/**
 * The seven-state boundary every BERX scene renders through.
 *
 * default · loading · empty · error · success · disabled · offline
 *
 * Screens do not hand-roll these. Passing a real state in is the only
 * way to render, which is what stops a screen from quietly showing an
 * empty list when a request actually failed, or a spinner that never
 * resolves into anything.
 *
 * Two rules are enforced here rather than trusted:
 *  - loading preserves layout (skeletons at the real content's shape),
 *    so nothing jumps when data lands;
 *  - offline shows whatever cached data exists *plus* an offline
 *    indicator, and never silently pretends to be live.
 */
import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle} from 'react-native';
import {rgba, type BerxScreenState} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxSurface} from './BerxSurface';
import {colors, spacing, typography} from '../tokens';

export interface BerxDataBoundaryProps {
	state: BerxScreenState;
	children: React.ReactNode;
	/** Shown in the empty state — must say something real about this screen. */
	emptyTitle?: string;
	emptyBody?: string;
	emptyAction?: {label: string; onPress: () => void};
	/** The real server or transport error. Never a generic "something went wrong" when a real one exists. */
	errorMessage?: string;
	onRetry?: () => void;
	/** Why the screen is disabled — a reason the user can act on. */
	disabledReason?: string;
	/** Confirmation text for a mutation the server has already confirmed. */
	successMessage?: string;
	/** True when cached content is being shown without a live connection. */
	hasCachedContent?: boolean;
	/**
	 * Set to false where retrying cannot possibly help — a 403 or a 404
	 * is not a transient failure, and a Retry button there is a lie.
	 */
	retryable?: boolean;
	/** Offered on an expired session, where signing in is the real fix. */
	onSignIn?: () => void;
	/** Skeleton shape for loading. Defaults to three content-height rows. */
	loadingSkeleton?: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
}

export function BerxDataBoundary({
	state,
	children,
	emptyTitle,
	emptyBody,
	emptyAction,
	errorMessage,
	onRetry,
	disabledReason,
	successMessage,
	hasCachedContent,
	retryable = true,
	onSignIn,
	loadingSkeleton,
	style,
	testID,
}: BerxDataBoundaryProps) {
	const {scene} = useBerxScene();
	const structure = scene.layers.D2;

	if (state === 'loading') {
		return (
			<View
				testID={testID}
				style={style}
				accessible
				accessibilityRole="progressbar"
				accessibilityLabel="Загрузка"
				accessibilityState={{busy: true}}>
				{loadingSkeleton ?? <DefaultSkeleton />}
			</View>
		);
	}

	if (state === 'error') {
		return (
			<BoundaryCard testID={testID} style={style} tone="danger">
				<Text style={styles.title} accessibilityRole="header">
					Не удалось загрузить
				</Text>
				{/* the real error, not a placeholder — an unexplained failure is unactionable */}
				<Text style={styles.body}>{errorMessage ?? 'Сервер не вернул ответ.'}</Text>
				{onSignIn ? <BoundaryAction label="Войти снова" onPress={onSignIn} accent={scene.accent} /> : null}
				{onRetry && retryable ? <BoundaryAction label="Повторить" onPress={onRetry} accent={scene.accent} /> : null}
			</BoundaryCard>
		);
	}

	if (state === 'empty') {
		return (
			<BoundaryCard testID={testID} style={style}>
				<Text style={styles.title} accessibilityRole="header">
					{emptyTitle ?? 'Пока пусто'}
				</Text>
				{emptyBody ? <Text style={styles.body}>{emptyBody}</Text> : null}
				{emptyAction ? <BoundaryAction label={emptyAction.label} onPress={emptyAction.onPress} accent={scene.accent} /> : null}
			</BoundaryCard>
		);
	}

	if (state === 'disabled') {
		return (
			<BoundaryCard testID={testID} style={style}>
				<Text style={styles.title} accessibilityRole="header">
					Недоступно
				</Text>
				<Text style={styles.body}>{disabledReason ?? 'Это действие сейчас недоступно.'}</Text>
			</BoundaryCard>
		);
	}

	if (state === 'offline') {
		return (
			<View testID={testID} style={style}>
				<View
					accessible
					accessibilityRole="alert"
					accessibilityLabel="Нет соединения. Показаны сохранённые данные."
					style={[styles.offlineBar, {backgroundColor: rgba(colors.textDim, 0.12), borderColor: structure.surface.borderColor}]}>
					<Text style={styles.offlineText}>Нет соединения — показаны сохранённые данные</Text>
				</View>
				{hasCachedContent ? (
					children
				) : (
					<BoundaryCard>
						<Text style={styles.title} accessibilityRole="header">
							Нет соединения
						</Text>
						<Text style={styles.body}>Сохранённых данных для этого экрана нет.</Text>
						{onRetry ? <BoundaryAction label="Повторить" onPress={onRetry} accent={scene.accent} /> : null}
					</BoundaryCard>
				)}
			</View>
		);
	}

	if (state === 'success' && successMessage) {
		return (
			<View testID={testID} style={style}>
				<View
					accessible
					accessibilityRole="alert"
					accessibilityLabel={successMessage}
					style={[styles.successBar, {backgroundColor: rgba(colors.success, 0.12), borderColor: rgba(colors.success, 0.32)}]}>
					<Text style={[styles.offlineText, {color: colors.success}]}>{successMessage}</Text>
				</View>
				{children}
			</View>
		);
	}

	return (
		<View testID={testID} style={style}>
			{children}
		</View>
	);
}

function BoundaryCard({
	children,
	style,
	testID,
	tone,
}: {
	children: React.ReactNode;
	style?: ViewStyle;
	testID?: string;
	tone?: 'danger';
}) {
	const {scene} = useBerxScene();
	const layer = scene.layers.D2;
	return (
		<View testID={testID} style={[styles.cardWrap, style]}>
			<BerxSurface surface={layer.surface} lighting={layer.lighting} radius={22}>
				<View style={[styles.card, tone === 'danger' ? {borderLeftWidth: 2, borderLeftColor: colors.danger} : null]}>
					{children}
				</View>
			</BerxSurface>
		</View>
	);
}

function BoundaryAction({label, onPress, accent}: {label: string; onPress: () => void; accent: string}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			style={[styles.action, {borderColor: rgba(accent, 0.42), backgroundColor: rgba(accent, 0.1)}]}>
			<Text style={[styles.actionLabel, {color: accent}]}>{label}</Text>
		</Pressable>
	);
}

/**
 * Layout-preserving skeleton: the same block rhythm the loaded
 * content uses, so the page does not reflow when data arrives.
 */
function DefaultSkeleton() {
	const {scene} = useBerxScene();
	const fill = rgba(colors.white, 0.05);
	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.skeleton}>
			{[0, 1, 2].map((i) => (
				<View key={i} style={[styles.skeletonRow, {backgroundColor: fill, borderColor: scene.layers.D2.surface.borderColor}]}>
					<View style={[styles.skeletonAvatar, {backgroundColor: rgba(colors.white, 0.07)}]} />
					<View style={styles.skeletonLines}>
						<View style={[styles.skeletonLine, {backgroundColor: rgba(colors.white, 0.08), width: '62%'}]} />
						<View style={[styles.skeletonLine, {backgroundColor: rgba(colors.white, 0.06), width: '88%'}]} />
					</View>
				</View>
			))}
			<ActivityIndicator color={scene.accent} />
		</View>
	);
}

const styles = StyleSheet.create({
	cardWrap: {margin: spacing.lg},
	card: {padding: spacing.xl, gap: spacing.sm},
	title: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	body: {color: colors.textDim, fontSize: typography.sizeBase, lineHeight: typography.sizeBase * 1.45},
	action: {
		marginTop: spacing.md,
		minHeight: 44,
		paddingHorizontal: spacing.lg,
		borderRadius: 999,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
	},
	actionLabel: {fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	offlineBar: {
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderBottomWidth: 1,
		borderColor: 'transparent',
	},
	successBar: {paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1},
	offlineText: {color: colors.textDim, fontSize: typography.sizeSm},
	skeleton: {padding: spacing.lg, gap: spacing.md},
	skeletonRow: {flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: 22, borderWidth: 1},
	skeletonAvatar: {width: 44, height: 44, borderRadius: 22},
	skeletonLines: {flex: 1, gap: spacing.sm, justifyContent: 'center'},
	skeletonLine: {height: 10, borderRadius: 5},
});
