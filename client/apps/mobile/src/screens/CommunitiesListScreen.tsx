/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onOpenCommunity: (guid: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

export default function CommunitiesListScreen({api, onOpenCommunity, onCreate, onBack}: Props) {
	const [q, setQ] = useState('');
	const [items, setItems] = useState<BerxCommunity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.communities(q || undefined);
			setItems(res.communities);
			setError(null);
		} catch {
			setError('Не удалось загрузить сообщества');
		} finally {
			setLoading(false);
		}
	}, [api, q]);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Сообщества" />
			<View style={styles.searchRow}>
				<View style={styles.searchInput}>
					<BerxInput placeholder="Поиск сообществ..." value={q} onChangeText={setQ} onSubmitEditing={load} />
				</View>
				<BerxButton label="+" onPress={onCreate} />
			</View>

			{loading ? (
				<BerxLoadingState label="Загрузка..." />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : items.length === 0 ? (
				<BerxEmptyState title="Сообщества не найдены" subtitle="Попробуйте другой запрос или создайте своё." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(c: BerxCommunity) => String(c.guid)}
					renderItem={({item}: {item: BerxCommunity}) => (
						<Pressable style={styles.row} onPress={() => onOpenCommunity(item.guid)}>
							<Text style={styles.name}>{item.name}</Text>
							{item.description ? (
								<Text style={styles.description} numberOfLines={2}>
									{item.description}
								</Text>
							) : null}
							{item.is_member ? <Text style={styles.memberBadge}>Вы участник</Text> : null}
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	searchRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
	searchInput: {flex: 1},
	row: {padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	description: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	memberBadge: {color: colors.accent, fontSize: typography.sizeXs, marginTop: spacing.xs},
});
