/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.unmatchDating() was always a
 * real, working client method (real POST /dating/unmatch route,
 * OssnDating::unmatch() removes the real match relation both
 * directions) with zero UI caller — a match could be created but
 * never undone from the app.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, FlatList, Pressable, Text, Alert, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingMatch} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername: string) => void;
	onOpenPhotos?: (userGuid: number, username: string) => void;
	onBack: () => void;
}

export default function DatingMatchesScreen({api, onOpenConversation, onOpenPhotos, onBack}: Props) {
	const [matches, setMatches] = useState<BerxDatingMatch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);

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

	function confirmUnmatch(m: BerxDatingMatch) {
		Alert.alert(
			'Разорвать совпадение?',
			`Вы больше не будете видеть переписку с ${m.fullname || m.username} как совпадение.`,
			[
				{text: 'Отмена', style: 'cancel'},
				{
					text: 'Разорвать',
					style: 'destructive',
					onPress: async () => {
						setBusyGuid(m.guid);
						try {
							await api.unmatchDating(m.guid);
							setMatches((prev: BerxDatingMatch[]) => prev.filter((x: BerxDatingMatch) => x.guid !== m.guid));
						} catch {
							// list stays as-is on failure
						} finally {
							setBusyGuid(null);
						}
					},
				},
			]
		);
	}

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
							<View style={styles.rowBody}>
								<Text style={styles.name}>{item.fullname || item.username}</Text>
								<Text style={styles.username}>@{item.username}</Text>
							</View>
							{onOpenPhotos ? (
								<Pressable onPress={() => onOpenPhotos(item.guid, item.username)} hitSlop={8}>
									<Text style={styles.photosLink}>Фото</Text>
								</Pressable>
							) : null}
							<Pressable onPress={() => confirmUnmatch(item)} disabled={busyGuid === item.guid} hitSlop={8}>
								<Text style={styles.unmatch}>{busyGuid === item.guid ? '…' : 'Разорвать'}</Text>
							</Pressable>
						</Pressable>
					)}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	row: {flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	rowBody: {flex: 1},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	username: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	unmatch: {color: colors.danger, fontSize: typography.sizeSm},
	photosLink: {color: colors.accent, fontSize: typography.sizeSm, marginRight: spacing.md},
});
