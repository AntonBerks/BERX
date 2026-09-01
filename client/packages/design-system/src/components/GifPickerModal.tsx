/**
 * MAX BUILD — real GIF picker (OssnGiphy — a real server-side proxy to
 * api.giphy.com, admin-configured key). `available: false` (no key
 * configured on this deployment) is shown as an honest message, never
 * an empty "no results" search. Selecting a result hands the caller
 * the real gif_url — the caller is responsible for turning that into
 * a real file part (fetch(url).then(r => r.blob())) and sending it
 * through whatever real upload path it already has (e.g.
 * ConversationScreen's own attachment flow), so this component has no
 * upload logic of its own — it is purely a search/pick surface.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Modal, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxGifResult} from '@berx/api/types';
import {spacing, typography, radius} from '../tokens';
import {BerxInput} from './BerxInput';
import {BerxLoadingState, BerxEmptyState} from './BerxStates';

import {useBerxColors} from '../theme';
import type {BerxColorTokens} from '../tokens';

interface Props {
	visible: boolean;
	onClose: () => void;
	onSelect: (gif: BerxGifResult) => void;
	search: (q: string) => Promise<{available: boolean; results: BerxGifResult[]}>;
	trending: () => Promise<{available: boolean; results: BerxGifResult[]}>;
}

const COLUMN_COUNT = 3;

export function GifPickerModal({visible, onClose, onSelect, search, trending}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<BerxGifResult[]>([]);
	const [available, setAvailable] = useState(true);
	const [loading, setLoading] = useState(false);

	const loadTrending = useCallback(async () => {
		setLoading(true);
		try {
			const res = await trending();
			setAvailable(res.available);
			setResults(res.results);
		} catch {
			setResults([]);
		} finally {
			setLoading(false);
		}
	}, [trending]);

	useEffect(() => {
		if (visible) {
			setQuery('');
			loadTrending();
		}
	}, [visible, loadTrending]);

	async function runSearch() {
		if (!query.trim()) {
			loadTrending();
			return;
		}
		setLoading(true);
		try {
			const res = await search(query.trim());
			setAvailable(res.available);
			setResults(res.results);
		} catch {
			setResults([]);
		} finally {
			setLoading(false);
		}
	}

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
			<View style={styles.backdrop}>
				<View style={styles.sheet}>
					<View style={styles.header}>
						<Text style={styles.title}>GIF</Text>
						<Pressable onPress={onClose} hitSlop={8}>
							<Text style={styles.closeLabel}>Закрыть</Text>
						</Pressable>
					</View>
					<BerxInput placeholder="Поиск GIF" value={query} onChangeText={setQuery} onSubmitEditing={runSearch} autoCapitalize="none" />
					{loading ? (
						<BerxLoadingState label="Загрузка..." />
					) : !available ? (
						<BerxEmptyState title="GIF недоступны" subtitle="Администратор ещё не подключил Giphy на этом сервере." />
					) : results.length === 0 ? (
						<BerxEmptyState title="Ничего не найдено" />
					) : (
						<FlatList
							data={results}
							keyExtractor={(g: BerxGifResult) => g.id}
							numColumns={COLUMN_COUNT}
							contentContainerStyle={styles.grid}
							renderItem={({item}: {item: BerxGifResult}) => (
								<Pressable style={styles.tile} onPress={() => onSelect(item)}>
									<Image source={{uri: item.thumb_url}} style={styles.tileImage} />
								</Pressable>
							)}
						/>
					)}
				</View>
			</View>
		</Modal>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end'},
	sheet: {backgroundColor: colors.black, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, height: '75%', gap: spacing.sm},
	header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
	title: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightBold},
	closeLabel: {color: colors.accent, fontSize: typography.sizeSm},
	grid: {paddingVertical: spacing.sm},
	tile: {flex: 1 / COLUMN_COUNT, aspectRatio: 1, margin: 2, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surface},
	tileImage: {width: '100%', height: '100%'},
});
