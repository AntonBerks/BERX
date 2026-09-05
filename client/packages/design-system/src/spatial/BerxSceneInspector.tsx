/**
 * The scene a contract actually resolves to, rendered.
 *
 * The archive defines 300 contracts and gives product logic to 29 of
 * them. The other 271 are numbered scene definitions — "Home / Feed /
 * Stories 15" — with no behaviour behind them, and inventing behaviour
 * for them is precisely what the constitution forbids.
 *
 * So their real runtime experience is the scene itself: the six depth
 * layers as the contract specifies them, in the contract's material,
 * under the contract's light recipe, with the contract's camera and
 * motion — plus an explicit, readable account of what the contract
 * asks for, which components resolve, which are blocked and why, and
 * whether a data source exists.
 *
 * This is not a placeholder screen. Nothing here is invented, nothing
 * claims to be finished, and every number on it is the number the
 * runtime resolved a moment earlier. A contract that renders through
 * this is honestly represented, not quietly borrowed from another.
 */
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {BERX_DEPTH_KEYS, type BerxDepthKey} from '@berx/spatial';
import type {BerxResolvedScreen} from '@berx/scenes';
import {colors, spacing, typography} from '../tokens';
import {BerxDepthLayer} from './BerxDepthLayer';
import {BerxSpatialCard} from './BerxSpatialCard';
import {BerxEnergyHalo} from './BerxEnergyHalo';
import {useBerxScene, useBerxSceneScroll} from './BerxSpatialScene';
import {BerxText} from './BerxText';

export interface BerxSceneInspectorProps {
	screen: BerxResolvedScreen;
	/** Rendered above the layers — the real screen, when the contract has one. */
	children?: React.ReactNode;
	testID?: string;
}

const DEPTH_TITLE: Record<BerxDepthKey, string> = {
	D0: 'D0 · среда',
	D1: 'D1 · атмосфера',
	D2: 'D2 · структура',
	D3: 'D3 · содержимое',
	D4: 'D4 · действия',
	D5: 'D5 · фокус',
};

export function BerxSceneInspector({screen, children, testID}: BerxSceneInspectorProps) {
	const {scene} = useBerxScene();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const blurred = BERX_DEPTH_KEYS.filter((d) => scene.layers[d].blurred);

	return (
		<ScrollView
			testID={testID}
			onScroll={onScroll}
			scrollEventThrottle={scrollEventThrottle}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}>
			<BerxText role="meta" emphasis="tertiary">{screen.screenId}</BerxText>
			<BerxText role="title" heading>
				{screen.contract.title}
			</BerxText>
			<BerxText role="meta" emphasis="secondary" style={styles.meta}>
				{screen.family} · {screen.route.path} · {screen.contract.experience.mood}
			</BerxText>

			{children}

			{/* the six planes, each rendered in its own resolved material and light */}
			<BerxText role="micro" emphasis="tertiary" style={styles.section} heading>
				Пространственные слои
			</BerxText>
			{BERX_DEPTH_KEYS.map((depth) => {
				const layer = scene.layers[depth];
				return (
					<BerxDepthLayer key={depth} depth={depth} surface radius={18} style={styles.layerCard} decorative={false}>
						<View style={styles.layerBody}>
							<View style={styles.layerHead}>
								<BerxText role="label">{DEPTH_TITLE[depth]}</BerxText>
								{depth === 'D5' ? <BerxEnergyHalo size={22} intensity={0.9} /> : null}
							</View>
							<BerxText role="meta" emphasis="tertiary">
								{layer.surface.material} · z {layer.z} · {layer.translateZ}px
								{layer.blurred ? ` · blur ${layer.surface.blurPx}px` : ' · непрозрачно'}
							</BerxText>
							<BerxText role="meta" emphasis="tertiary">
								параллакс {layer.parallaxFactor} · контраст {layer.surface.textContrast}:1
							</BerxText>
						</View>
					</BerxDepthLayer>
				);
			})}

			<BerxText role="micro" emphasis="tertiary" style={styles.section} heading>
				Сцена
			</BerxText>
			<BerxSpatialCard depth="D2" padding={spacing.lg}>
				<Fact label="Материал" value={screen.contract.scene.material} />
				<Fact label="Свет" value={screen.contract.scene.lightRecipe} />
				<Fact
					label="Камера"
					value={`${scene.camera.perspectivePx}px · ${scene.camera.fovDeg}° · наклон ≤ ${scene.camera.maxTiltDeg}°`}
				/>
				<Fact label="Цветовой мир" value={scene.colorWorld} />
				<Fact label="Слоёв с размытием" value={`${blurred.length} из 6 (бюджет ${scene.budget.maxBlurLayers})`} />
				<Fact label="Класс устройства" value={`${screen.platform} · ${scene.budget.tier}`} />
				<Fact label="Оболочка навигации" value={screen.navShell} />
				<Fact label="Движение" value={scene.reducedMotion ? 'сокращённое' : `${scene.motion.enter.durationMs}ms вход`} />
			</BerxSpatialCard>

			<BerxText role="micro" emphasis="tertiary" style={styles.section} heading>
				Данные
			</BerxText>
			<BerxSpatialCard depth="D2" padding={spacing.lg}>
				{screen.dataMode === 'bound' ? (
					<>
						<Text style={styles.body}>
							Экран подключён к реальным данным: {screen.data?.domains.join(', ') || '—'}.
						</Text>
						{screen.data && screen.data.reads.length > 0 ? (
							<Fact label="Чтение" value={screen.data.reads.join(', ')} />
						) : null}
						{screen.data && screen.data.mutations.length > 0 ? (
							<Fact label="Действия" value={screen.data.mutations.join(', ')} />
						) : null}
					</>
				) : screen.dataMode === 'dataless' ? (
					<Text style={styles.body}>
						У этого экрана нет серверных данных — и не должно быть. Он ничего не загружает и ничего не показывает как
						загруженное.
					</Text>
				) : (
					<Text style={styles.body}>
						Это нумерованный контракт архива: он задаёт сцену — глубину, материал, свет, движение — но не описывает
						продуктовую логику. BERX не придумывает её и не подставляет данные другого экрана. Сцена настоящая,
						содержимого пока нет.
					</Text>
				)}
				{screen.data?.blocked?.map((b) => (
					<View key={b.capability} style={styles.blocked}>
						<Text style={styles.blockedTitle}>Недоступно: {b.capability}</Text>
						<BerxText role="meta" emphasis="secondary" style={styles.blockedReason}>{b.reason}</BerxText>
					</View>
				))}
			</BerxSpatialCard>

			<BerxText role="micro" emphasis="tertiary" style={styles.section} heading>
				Компоненты
			</BerxText>
			<BerxSpatialCard depth="D2" padding={spacing.lg}>
				{screen.components.map((c) => (
					<Fact key={c.contractName} label={c.contractName} value={`${c.resolution}${c.implementation ? ` · ${c.implementation}` : ''}`} />
				))}
				{screen.blockedComponents.map((c) => (
					<View key={c.contractName} style={styles.blocked}>
						<Text style={styles.blockedTitle}>{c.contractName} — недоступен</Text>
						<BerxText role="meta" emphasis="secondary" style={styles.blockedReason}>{c.note}</BerxText>
					</View>
				))}
			</BerxSpatialCard>

			<BerxText role="micro" emphasis="tertiary" style={styles.section} heading>
				Состояния
			</BerxText>
			<BerxSpatialCard depth="D2" padding={spacing.lg}>
				<Text style={styles.body}>{screen.states.join(' · ')}</Text>
			</BerxSpatialCard>

			{scene.adaptations.length > 0 ? (
				<>
					<BerxText role="micro" emphasis="tertiary" style={styles.section} heading>
						Адаптация под устройство
					</BerxText>
					<BerxSpatialCard depth="D2" padding={spacing.lg}>
						{scene.adaptations.map((a) => (
							<Text key={a} style={styles.body}>
								{a}
							</Text>
						))}
					</BerxSpatialCard>
				</>
			) : null}
		</ScrollView>
	);
}

function Fact({label, value}: {label: string; value: string}) {
	return (
		<View style={styles.fact} accessible accessibilityLabel={`${label}: ${value}`}>
			<BerxText role="meta" emphasis="tertiary" style={styles.factLabel}>{label}</BerxText>
			<BerxText role="meta" style={styles.factValue}>{value}</BerxText>
		</View>
	);
}

const styles = StyleSheet.create({
	content: {padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl},
	meta: {marginBottom: spacing.md},
	section: {marginTop: spacing.lg},
	layerCard: {marginBottom: spacing.sm},
	layerBody: {padding: spacing.md, gap: 2},
	layerHead: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	body: {color: colors.textDim, fontSize: typography.sizeSm, lineHeight: typography.sizeSm * 1.5},
	fact: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 3},
	factLabel: {flexShrink: 0},
	factValue: {flex: 1, textAlign: 'right'},
	blocked: {marginTop: spacing.sm, paddingLeft: spacing.md, borderLeftWidth: 2, borderLeftColor: colors.danger},
	blockedTitle: {color: colors.danger, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	blockedReason: {marginTop: 2},
});
