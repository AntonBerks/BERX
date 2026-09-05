/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Honest scope: no group feed/posts/comments/members list here —
 * OssnGroup has real methods for members (getMembers) but this pass
 * only wires join/leave/view, consistent with "add what's actually
 * built and tested, not a guessed full feature set."
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface CommunityDetailScreenProps {
	api: BerxApiClient;
	guid: number;
	myGuid?: number;
	onBack: () => void;
	onOpenRequests?: (guid: number) => void;
	onOpenModerators?: (guid: number) => void;
	onOpenMembers?: (guid: number) => void;
	onReport?: (guid: number) => void;
}

export default function CommunityDetailScreen(props: CommunityDetailScreenProps) {
	return (
		<BerxFamilyScene family="COMMUNITY" testID="community-detail">
			<CommunityDetailScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CommunityDetailScreenBody({api, guid, myGuid, onBack, onOpenRequests, onOpenModerators, onOpenMembers, onReport}: CommunityDetailScreenProps) {
	const [community, setCommunity] = useState<BerxCommunity | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [acting, setActing] = useState(false);

	async function load() {
		setLoading(true);
		try {
			const data = await api.getCommunity(guid);
			setCommunity(data);
			setError(null);
		} catch {
			setError('Сообщество недоступно');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [guid]);

	async function handleJoinLeave() {
		if (!community) return;
		setActing(true);
		try {
			if (community.is_member) {
				await api.leaveCommunity(guid);
			} else {
				await api.joinCommunity(guid);
			}
			await load();
		} finally {
			setActing(false);
		}
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxLoadingState label="Загрузка..." />
			</View>
		);
	}
	if (error || !community) {
		return (
			<View style={styles.screen}>
				<BerxHeader onBack={onBack} />
				<BerxErrorState message={error ?? 'Сообщество не найдено'} onRetry={load} />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={community.name} />
			<View style={styles.content}>
				{/* D3 — who this community is. The API carries no cover or
				    icon for a community, so its identity is its name,
				    its openness and what it says about itself — stated,
				    not padded out with a stock image. */}
				<BerxSpatialCard depth="D3" padding={spacing.lg} radius={22}>
					<Text style={styles.name}>{community.name}</Text>
					<Text style={styles.privacy}>{community.privacy === 'private' ? 'Закрытое сообщество' : 'Открытое сообщество'}</Text>
					{community.description ? <Text style={styles.description}>{community.description}</Text> : null}

					{/* D4 — the membership decision, on the control plane */}
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton
							label={community.is_member ? 'Покинуть сообщество' : 'Вступить'}
							variant={community.is_member ? 'secondary' : 'primary'}
							onPress={handleJoinLeave}
							loading={acting}
							fullWidth
						/>
						{onOpenMembers ? <BerxButton label="Участники" variant="secondary" onPress={() => onOpenMembers(guid)} fullWidth /> : null}
					</BerxActionShelf>
				</BerxSpatialCard>

				{myGuid && community.owner_guid === myGuid ? (
					/* the owner's tools are a separate object: managing the
					   community is not the same act as being in it */
					<BerxActionShelf variant="anchored" align="stack" style={styles.ownerActions}>
						{onOpenRequests ? <BerxButton label="Заявки на вступление" variant="secondary" onPress={() => onOpenRequests(guid)} fullWidth /> : null}
						{onOpenModerators ? <BerxButton label="Модераторы" variant="secondary" onPress={() => onOpenModerators(guid)} fullWidth /> : null}
					</BerxActionShelf>
				) : null}

				{myGuid && community.owner_guid !== myGuid && onReport ? (
					<Pressable onPress={() => onReport(guid)} hitSlop={8}>
						<Text style={styles.reportLink}>Пожаловаться на сообщество</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md},
	ownerActions: {gap: spacing.sm, marginTop: spacing.sm},
	name: {color: colors.text, fontSize: typography.sizeXl, fontWeight: typography.weightBold},
	privacy: {color: colors.accent, fontSize: typography.sizeSm},
	description: {color: colors.textDim, fontSize: typography.sizeBase},
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center', marginTop: spacing.sm},
});
