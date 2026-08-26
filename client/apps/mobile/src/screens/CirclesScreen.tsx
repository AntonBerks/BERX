/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.circles() (components/OssnApi/v1/circles.php, new
 * domain this session). Always the caller's own — circles have no
 * public tier at all.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCircle} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	onOpenCircle: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

const KIND_LABEL: Record<string, string> = {
	family: 'Семья',
	work: 'Работа',
	travel: 'Путешествия',
	close_friends: 'Близкие друзья',
};

export default function CirclesScreen({api, onOpenCircle, onCreate, onBack}: Props) {
	const [items, setItems] = useState<BerxCircle[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.circles();
			setItems(res.circles);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить круги');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Круги" onBack={onBack} />
			<View style={styles.toolbar}>
				<BerxButton label="Создать круг" onPress={onCreate} fullWidth />
			</View>
			{items.length === 0 ? (
				<BerxEmptyState title="Кругов пока нет" subtitle="Круги — приватные списки друзей для управления видимостью." />
			) : (
				<FlatList
					data={items}
					keyExtractor={(c: BerxCircle) => String(c.id)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCircle}) => (
						<Pressable style={styles.row} onPress={() => onOpenCircle(item.id)}>
							<View style={styles.rowBody}>
								<Text style={styles.title}>{item.name}</Text>
								<Text style={styles.meta}>
									{item.member_count} {item.member_count === 1 ? 'человек' : 'человек'}
									{item.kind ? ` · ${KIND_LABEL[item.kind] ?? item.kind}` : ''}
								</Text>
							</View>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md},
	list: {padding: spacing.md, gap: spacing.sm},
	row: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm},
	rowBody: {gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
});
