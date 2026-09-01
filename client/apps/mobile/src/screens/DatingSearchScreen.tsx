/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.searchDatingProfiles() was
 * always a real, working client method (real GET /dating/search,
 * OssnDating::search() — pseudonym substring match, same block/pass/
 * match exclusion as discover()) with zero UI caller — the only way
 * to reach a dating profile was the algorithmic swipe deck; there was
 * no way to look someone up by the pseudonym they told you directly.
 *
 * Photos are not part of BerxDatingProfileCard — same real,
 * server-side-private-by-default architecture DatingDiscoverScreen's
 * own header comment discloses (a dating photo is only ever released
 * through the real request/grant flow built this session), so this
 * screen shows the same honest initial-letter treatment, not a photo
 * that doesn't exist yet for a searched stranger.
 */
import {useState, useMemo} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingProfileCard} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onMatch: (otherGuid: number, otherUsername: string) => void;
	onBack?: () => void;
}

export default function DatingSearchScreen({api, onMatch, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [q, setQ] = useState('');
	const [results, setResults] = useState<BerxDatingProfileCard[]>([]);
	const [searched, setSearched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	async function runSearch() {
		if (!q.trim()) return;
		setLoading(true);
		setMessage(null);
		try {
			const res = await api.searchDatingProfiles(q.trim());
			setResults(res.profiles);
			setSearched(true);
		} catch (e) {
			setMessage(e instanceof Error ? e.message : 'Не удалось выполнить поиск');
		} finally {
			setLoading(false);
		}
	}

	async function act(card: BerxDatingProfileCard, direction: 'like' | 'pass') {
		setBusyGuid(card.guid);
		setMessage(null);
		try {
			if (direction === 'like') {
				const res = await api.datingLike(card.guid);
				if (res.mutual) {
					onMatch(card.guid, card.pseudonym);
				}
			} else {
				await api.datingPass(card.guid);
			}
			setResults((prev: BerxDatingProfileCard[]) => prev.filter((p: BerxDatingProfileCard) => p.guid !== card.guid));
		} catch (e) {
			if (e instanceof BerxApiError && e.code === 'rate_limited') {
				setMessage('Слишком много действий — подождите минуту');
			} else {
				setMessage('Не удалось выполнить действие');
			}
		} finally {
			setBusyGuid(null);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Поиск анкет" onBack={onBack} />
			<View style={styles.searchRow}>
				<View style={styles.searchInput}>
					<BerxInput placeholder="Псевдоним" value={q} onChangeText={setQ} onSubmitEditing={runSearch} autoCapitalize="none" />
				</View>
				<BerxButton label="Найти" loading={loading} onPress={runSearch} />
			</View>
			{message ? <Text style={styles.message}>{message}</Text> : null}

			{searched && results.length === 0 ? (
				<BerxEmptyState title="Анкеты не найдены" subtitle="Проверьте псевдоним и попробуйте снова." />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={results}
						keyExtractor={(c: BerxDatingProfileCard) => String(c.guid)}
						contentContainerStyle={styles.list}
						renderItem={({item}: {item: BerxDatingProfileCard}) => (
							<View style={styles.card}>
								<View style={styles.avatar}>
									<Text style={styles.avatarInitial}>{item.pseudonym.charAt(0).toUpperCase()}</Text>
								</View>
								<View style={styles.cardBody}>
									<Text style={styles.name}>{item.pseudonym}{item.age ? `, ${item.age}` : ''}</Text>
									{item.city ? <Text style={styles.city}>{item.city}</Text> : null}
									{item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
								</View>
								<View style={styles.actions}>
									<Pressable onPress={() => act(item, 'pass')} disabled={busyGuid === item.guid} hitSlop={8}>
										<Text style={styles.pass}>Пропустить</Text>
									</Pressable>
									<Pressable onPress={() => act(item, 'like')} disabled={busyGuid === item.guid} hitSlop={8}>
										<Text style={styles.like}>{busyGuid === item.guid ? '…' : 'Нравится'}</Text>
									</Pressable>
								</View>
							</View>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	searchRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
	searchInput: {flex: 1},
	message: {fontSize: typography.sizeSm, color: colors.textFaint, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	card: {backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs, marginBottom: spacing.sm, flexDirection: 'row'},
	avatar: {width: 48, height: 48, borderRadius: 24, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm},
	avatarInitial: {fontSize: typography.sizeLg, color: colors.textFaint},
	cardBody: {flex: 1, gap: 2},
	name: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	city: {fontSize: typography.sizeXs, color: colors.textFaint},
	bio: {fontSize: typography.sizeSm, color: colors.textDim},
	actions: {gap: spacing.sm, alignItems: 'flex-end', justifyContent: 'center'},
	pass: {fontSize: typography.sizeSm, color: colors.textFaint},
	like: {fontSize: typography.sizeSm, color: colors.accent, fontWeight: typography.weightMedium},
});
