/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real gap: api.unmatchDating() was always a
 * real, working client method (real POST /dating/unmatch route,
 * OssnDating::unmatch() removes the real match relation both
 * directions) with zero UI caller — a match could be created but
 * never undone from the app.
 *
 * MAX BUILD — real Dating <-> Places connection: "Идеи для свидания"
 * expands inline per match into real top-rated places near the
 * caller's own dating location (api.datingDateIdeas(), real
 * OssnGeo::near() query) — fetched on demand, never eagerly for every
 * match on load. A real 422 no_location surfaces as an honest prompt
 * to set a dating location first, not a silent empty list.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, FlatList, Pressable, Text, Image, Alert, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxDatingMatch, BerxDateIdea} from '@berx/api/types';
import {BerxApiError} from '@berx/core';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	onOpenConversation: (otherGuid: number, otherUsername: string) => void;
	onOpenPhotos?: (userGuid: number, username: string) => void;
	onBack: () => void;
}

export default function DatingMatchesScreen({api, onOpenConversation, onOpenPhotos, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [matches, setMatches] = useState<BerxDatingMatch[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const [expandedGuid, setExpandedGuid] = useState<number | null>(null);
	const [ideas, setIdeas] = useState<Record<number, BerxDateIdea[]>>({});
	const [ideasError, setIdeasError] = useState<Record<number, string>>({});
	const [ideasLoading, setIdeasLoading] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await api.datingMatches();
			setMatches(res.matches);
			setError(null);
		} catch {
			setError('Не удалось загрузить совпадения');
		} finally {
			setLoading(false);
			setRefreshing(false);
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

	async function toggleIdeas(matchGuid: number) {
		if (expandedGuid === matchGuid) {
			setExpandedGuid(null);
			return;
		}
		setExpandedGuid(matchGuid);
		if (ideas[matchGuid] || ideasError[matchGuid]) return;
		setIdeasLoading(true);
		try {
			const res = await api.datingDateIdeas(matchGuid);
			setIdeas((prev) => ({...prev, [matchGuid]: res.places}));
		} catch (e) {
			const msg = e instanceof BerxApiError && e.code === 'no_location'
				? 'Укажите свою геопозицию в настройках знакомств, чтобы видеть идеи для свидания.'
				: 'Не удалось загрузить идеи';
			setIdeasError((prev) => ({...prev, [matchGuid]: msg}));
		} finally {
			setIdeasLoading(false);
		}
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
				<BerxFadeIn style={styles.fadeFlex}>
				<FlatList
					data={matches}
					keyExtractor={(m: BerxDatingMatch) => String(m.guid)}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={() => {
								setRefreshing(true);
								load();
							}}
							tintColor={colors.accent}
						/>
					}
					renderItem={({item}: {item: BerxDatingMatch}) => (
						<View>
							<Pressable style={styles.row} onPress={() => onOpenConversation(item.guid, item.username)}>
								<View style={styles.rowBody}>
									<Text style={styles.name}>{item.fullname || item.username}</Text>
									<Text style={styles.username}>@{item.username}</Text>
								</View>
								<Pressable onPress={() => toggleIdeas(item.guid)} hitSlop={8}>
									<Text style={styles.photosLink}>{expandedGuid === item.guid ? 'Скрыть идеи' : '💡 Идеи'}</Text>
								</Pressable>
								{onOpenPhotos ? (
									<Pressable onPress={() => onOpenPhotos(item.guid, item.username)} hitSlop={8}>
										<Text style={styles.photosLink}>Фото</Text>
									</Pressable>
								) : null}
								<Pressable onPress={() => confirmUnmatch(item)} disabled={busyGuid === item.guid} hitSlop={8}>
									<Text style={styles.unmatch}>{busyGuid === item.guid ? '…' : 'Разорвать'}</Text>
								</Pressable>
							</Pressable>
							{expandedGuid === item.guid ? (
								<View style={styles.ideasPanel}>
									{ideasLoading && !ideas[item.guid] && !ideasError[item.guid] ? (
										<Text style={styles.ideasEmpty}>Загрузка…</Text>
									) : ideasError[item.guid] ? (
										<Text style={styles.ideasEmpty}>{ideasError[item.guid]}</Text>
									) : (ideas[item.guid] ?? []).length === 0 ? (
										<Text style={styles.ideasEmpty}>Рядом с вами пока нет мест с рейтингом.</Text>
									) : (
										(ideas[item.guid] ?? []).map((p) => (
											<View key={p.guid} style={styles.ideaRow}>
												{p.cover_url ? <Image source={{uri: p.cover_url}} style={styles.ideaCover} /> : <View style={[styles.ideaCover, styles.ideaCoverFallback]} />}
												<View style={styles.ideaBody}>
													<Text style={styles.ideaTitle} numberOfLines={1}>{p.title}</Text>
													<Text style={styles.ideaMeta}>
														{p.category ? `${p.category} · ` : ''}
														{p.rating_count > 0 ? `★ ${p.rating.toFixed(1)} · ` : ''}
														{p.distance_km.toFixed(1)} км
													</Text>
												</View>
											</View>
										))
									)}
								</View>
							) : null}
						</View>
					)}
				/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.black},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	rowBody: {flex: 1},
	name: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	username: {color: colors.textDim, fontSize: typography.sizeSm, marginTop: spacing.xs},
	unmatch: {color: colors.danger, fontSize: typography.sizeSm},
	photosLink: {color: colors.accent, fontSize: typography.sizeSm, marginRight: spacing.md},
	ideasPanel: {padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	ideasEmpty: {color: colors.textFaint, fontSize: typography.sizeSm},
	ideaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
	ideaCover: {width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.graphite},
	ideaCoverFallback: {},
	ideaBody: {flex: 1},
	ideaTitle: {color: colors.text, fontSize: typography.sizeSm, fontWeight: typography.weightMedium},
	ideaMeta: {color: colors.textFaint, fontSize: typography.sizeXs, marginTop: 2},
});
