/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Pressable, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingMatch} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername: string) => void;
	onBack: () => void;
}

export default function DatingMatchesScreen({api, onOpenConversation, onBack}: Props) {
	const [matches, setMatches] = useState<BerxDatingMatch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const res = await api.datingMatches();
			setMatches(res.matches);
			setError(null);
		} catch {
			setError('Не удалось загрузить совпадения');
		} finally {
			setLoading(false);
		}
	}, [api]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Совпадения" />
			{loading ? (
				<BerxLoadingState label="Загрузка..." />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : matches.length === 0 ? (
				<BerxEmptyState title="Пока нет совпадений" subtitle="Лайкните кого-то в разделе Знакомства." />
			) : (
				<FlatList
					data={matches}
					keyExtractor={(m: BerxDatingMatch) => String(m.guid)}
					renderItem={({item}: {item: BerxDatingMatch}) => (
						<Pressable style={styles.row} onPress={() => onOpenConversation(item.guid, item.username)}>
							<Text style={styles.name}>{item.fullname || item.username}</Text>
							<Text style={styles.username}>@{item.username}</Text>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	row: {padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	username: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
});
