/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real data: api.communityMembers() (components/OssnApi/v1/
 * communities.php), wraps OssnGroup::getMembers() verbatim.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, Image, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunityMember} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState, BerxEmptyState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxIdentity} from '../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface CommunityMembersScreenProps {
	api: BerxApiClient;
	guid: number;
	onOpenProfile: (username: string) => void;
	onBack?: () => void;
}

export default function CommunityMembersScreen(props: CommunityMembersScreenProps) {
	return (
		<BerxFamilyScene family="COMMUNITY" testID="community-members">
			<CommunityMembersScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CommunityMembersScreenBody({api, guid, onOpenProfile, onBack}: CommunityMembersScreenProps) {
	const [items, setItems] = useState<BerxCommunityMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.communityMembers(guid);
			setItems(res.members);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить участников');
		} finally {
			setLoading(false);
		}
	}, [api, guid]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) return <BerxLoadingState />;
	if (error) return <BerxErrorState message={error} onRetry={load} />;

	return (
		<View style={styles.screen}>
			<BerxHeader title={`Участники (${items.length})`} onBack={onBack} />
			{items.length === 0 ? (
				<BerxEmptyState title="Участников пока нет" />
			) : (
				<FlatList
					data={items}
					keyExtractor={(m: BerxCommunityMember) => String(m.guid)}
					contentContainerStyle={styles.list}
					renderItem={({item}: {item: BerxCommunityMember}) => (
						<BerxSpatialCard depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={item.guid}
								name={item.fullname}
								handle={item.username}
								avatarUrl={item.icon}
								/* real server field, not an inferred role */
								subtitle={item.is_owner ? 'Владелец' : undefined}
								onPress={() => onOpenProfile(item.username)}
							/>
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
	list: {padding: spacing.md, gap: spacing.sm},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	avatar: {width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite},
	name: {flex: 1, fontSize: typography.sizeBase, color: colors.white, fontWeight: typography.weightMedium},
	ownerBadge: {fontSize: typography.sizeXs, color: colors.accent, fontWeight: typography.weightBold},
});
