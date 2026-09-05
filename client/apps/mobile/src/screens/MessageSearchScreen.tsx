/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.searchMessages() (components/OssnApi/v1/
 * messagesearch.php), which wraps the exact same
 * ossn_messagesearch_query() the web /messages-search page uses —
 * scoped to messages the caller sent/received, block-aware, real
 * bound-parameter LIKE match (not string-concatenated).
 */
import {useState} from 'react';
import {View, Image, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxMessageSearchResult} from '@berx/api/types';
import {colors, spacing, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface MessageSearchScreenProps {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number) => void;
	onBack?: () => void;
}

function fmtTime(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU');
}

export default function MessageSearchScreen(props: MessageSearchScreenProps) {
	return (
		<BerxFamilyScene family="MESSAGES" testID="message-search">
			<MessageSearchScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function MessageSearchScreenBody({api, onOpenConversation, onBack}: MessageSearchScreenProps) {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<BerxMessageSearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searched, setSearched] = useState(false);

	async function search() {
		if (query.trim().length === 0) return;
		setLoading(true);
		setError(null);
		setSearched(true);
		try {
			const res = await api.searchMessages(query.trim());
			setResults(res.results);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось выполнить поиск');
		} finally {
			setLoading(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Поиск по сообщениям" onBack={onBack} />
			<View style={styles.searchBar}>
				<BerxInput placeholder="Искать в переписках" value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
			</View>

			{loading ? (
				<BerxLoadingState />
			) : error ? (
				<BerxErrorState message={error} onRetry={search} />
			) : !searched ? (
				<BerxEmptyState title="Введите запрос" subtitle="Поиск охватывает все ваши переписки." />
			) : results.length === 0 ? (
				<BerxEmptyState title="Ничего не найдено" subtitle="Попробуйте другой запрос." />
			) : (
				<BerxSceneList rows
					data={results}
					keyExtractor={(r: BerxMessageSearchResult, i: number) => `${r.user.guid}-${r.time}-${i}`}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxMessageSearchResult}) => (
						<BerxSpatialCard
							depth="D3"
							padding={spacing.md}
							radius={18}
							onPress={() => onOpenConversation(item.user.guid)}
							accessibilityLabel={`Переписка с ${item.user.fullname}`}>
							<Image source={{uri: item.user.icon}} style={styles.avatar} />
							<View style={styles.body}>
								<BerxText role="callout" numberOfLines={1}>{item.user.fullname}</BerxText>
								<BerxText role="meta" emphasis="secondary" numberOfLines={2}>{item.outgoing ? 'Вы: ' : ''}{item.text}</BerxText>
								<BerxText role="meta" emphasis="tertiary">{fmtTime(item.time)}</BerxText>
							</View>
						</BerxSpatialCard>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	searchBar: {padding: spacing.md},
	list: {paddingBottom: spacing.xxxl},
	/* fill removed: a BerxSpatialCard wraps this row and paints the
	   content plane's own material — an opaque token fill on top of it
	   hides the surface the card just resolved */
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	body: {flex: 1, gap: 2},
});
