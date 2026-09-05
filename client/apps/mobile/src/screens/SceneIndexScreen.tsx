/**
 * The archive, browsable.
 *
 * All 300 contracts grouped by their 13 families, each showing what it
 * really is — bound to data, deliberately dataless, or a numbered
 * scene contract — so coverage can be inspected rather than taken on
 * trust. Opening one renders that contract's actual scene.
 */
import {useMemo, useState} from 'react';
import {SectionList, StyleSheet, View} from 'react-native';
import {BERX_FAMILIES, type BerxFamily} from '@berx/spatial';
import {BERX_V9_CONTRACTS, getFamilyContracts, getSceneDataBinding} from '@berx/scenes';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFilterBar} from '../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxSearchField} from '../../../../packages/design-system/src/spatial/BerxSearchField';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BERX_ROUTED_CONTRACTS} from './SceneScreen';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface SceneIndexScreenProps {
	onOpenScene: (screenId: string) => void;
	onBack?: () => void;
}

type Kind = 'bound' | 'dataless' | 'contract';

function kindOf(screenId: string): Kind {
	const binding = getSceneDataBinding(screenId);
	if (!binding) return 'contract';
	return binding.dataless && binding.reads.length === 0 && binding.mutations.length === 0 ? 'dataless' : 'bound';
}

const KIND_LABEL: Record<Kind, string> = {
	bound: 'реальные данные',
	dataless: 'без серверных данных',
	contract: 'контракт сцены',
};

export default function SceneIndexScreen(props: SceneIndexScreenProps) {
	return (
		<BerxFamilyScene family="EXPLORE" atmosphereKind="social" testID="scene-index">
			<SceneIndexBody {...props} />
		</BerxFamilyScene>
	);
}

function SceneIndexBody({onOpenScene, onBack}: SceneIndexScreenProps) {
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();
	const [family, setFamily] = useState<BerxFamily | null>(null);
	const [query, setQuery] = useState('');

	const sections = useMemo(() => {
		const families = family ? [family] : [...BERX_FAMILIES];
		const term = query.trim().toLowerCase();
		return families
			.map((f) => ({
				title: f,
				data: getFamilyContracts(f).filter(
					(c) => !term || c.screenId.toLowerCase().includes(term) || c.title.toLowerCase().includes(term),
				),
			}))
			.filter((s) => s.data.length > 0);
	}, [family, query]);

	const shown = sections.reduce((n, s) => n + s.data.length, 0);

	return (
		<View style={styles.screen}>
			<BerxHeader title={`Сцены BERX · ${BERX_V9_CONTRACTS.length}`} onBack={onBack} />

			<View style={styles.toolbar}>
				<BerxSearchField
					value={query}
					onChangeText={setQuery}
					placeholder="Номер или название"
					accessibilityLabel="Поиск по контрактам сцен"
					resultCount={query.trim() ? shown : undefined}
				/>
				<BerxFilterBar
					options={BERX_FAMILIES.map((f) => ({key: f, label: f, count: getFamilyContracts(f).length}))}
					selected={family ? [family] : []}
					onToggle={(key) => setFamily(family === key ? null : (key as BerxFamily))}
					multiple={false}
					accessibilityLabel="Семейство сцен"
				/>
			</View>

			<SectionList
				sections={sections}
				keyExtractor={(item) => item.screenId}
				onScroll={onScroll}
				scrollEventThrottle={scrollEventThrottle}
				contentContainerStyle={styles.list}
				removeClippedSubviews
				stickySectionHeadersEnabled={false}
				renderSectionHeader={({section}) => (
					<BerxText role="micro" emphasis="tertiary" style={styles.sectionHeader} heading>
						{section.title} · {section.data.length}
					</BerxText>
				)}
				renderItem={({item}) => {
					const kind = kindOf(item.screenId);
					const routed = BERX_ROUTED_CONTRACTS[item.screenId];
					return (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.md}
							radius={16}
							onPress={() => onOpenScene(item.screenId)}
							accessibilityLabel={`${item.screenId}, ${item.title}, ${KIND_LABEL[kind]}${routed ? ', есть экран' : ''}`}>
							<BerxText role="meta" emphasis="tertiary">{item.screenId}</BerxText>
							<BerxText role="callout" style={styles.itemTitle}>{item.title}</BerxText>
							<BerxText role="meta" emphasis="secondary" style={styles.itemMeta}>
								{KIND_LABEL[kind]}
								{routed ? ' · экран есть' : ''}
							</BerxText>
						</BerxSpatialCard>
					);
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	toolbar: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm},
	list: {padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxxl},
	sectionHeader: {marginTop: spacing.lg, marginBottom: spacing.xs},
	itemTitle: {marginTop: 2},
	itemMeta: {marginTop: 2},
});
