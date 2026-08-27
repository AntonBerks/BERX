/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.experiences() (components/OssnApi/v1/experiences.php,
 * new domain this session). Includes both owned experiences and ones
 * you've been invited to, with your real invite status shown.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, RefreshControl, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxExperience} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';

interface Props {
	api: BerxApiClient;
	userGuid?: number;
	isOwn: boolean;
	onOpenExperience: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
	invited: 'Приглашение',
	accepted: 'Вы идёте',
	declined: 'Отклонено',
};

function fmtWhen(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

export default function ExperiencesScreen({api, userGuid, isOwn, onOpenExperience, onCreate, onBack}: Props) {
	const [items, setItems] = useState<BerxExperience[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.experiences(userGuid);
			setItems(res.experiences);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить впечатления');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [api, userGuid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Впечатления" onBack={onBack} />
			{isOwn ? (
				<View style={styles.toolbar}>
					<BerxButton label="Создать впечатление" onPress={onCreate} fullWidth />
				</View>
			) : null}
			{items.length === 0 ? (
				<BerxEmptyState title="Впечатлений пока нет" subtitle={isOwn ? 'Соберите место или событие в план с друзьями.' : undefined} />
			) : (
				<BerxFadeIn style={styles.fadeFlex}>
					<FlatList
						data={items}
						keyExtractor={(e: BerxExperience) => String(e.id)}
						contentContainerStyle={styles.list}
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
						renderItem={({item}: {item: BerxExperience}) => (
							<Pressable style={styles.row} onPress={() => onOpenExperience(item.id)}>
								{item.anchor?.image_url ? <Image source={{uri: item.anchor.image_url}} style={styles.thumb} /> : <View style={styles.thumbFallback} />}
								<View style={styles.rowBody}>
									<Text style={styles.title} numberOfLines={1}>{item.title}</Text>
									<Text style={styles.meta}>{fmtWhen(item.scheduled_start)}{item.anchor ? ` · ${item.anchor.title}` : ''}</Text>
									{item.my_status && !item.is_own ? <Text style={styles.status}>{STATUS_LABEL[item.my_status]}</Text> : null}
								</View>
							</Pressable>
						)}
					/>
				</BerxFadeIn>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	toolbar: {padding: spacing.md},
	list: {padding: spacing.md, gap: spacing.sm},
	fadeFlex: {flex: 1},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm},
	thumb: {width: 56, height: 56, borderRadius: radius.sm},
	thumbFallback: {width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.graphite},
	rowBody: {flex: 1, gap: 2},
	title: {fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	meta: {fontSize: typography.sizeXs, color: colors.textFaint},
	status: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightMedium},
});
