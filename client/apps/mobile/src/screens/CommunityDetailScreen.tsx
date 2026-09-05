/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * Honest scope: no group feed/posts/comments/members list here —
 * OssnGroup has real methods for members (getMembers) but this pass
 * only wires join/leave/view, consistent with "add what's actually
 * built and tested, not a guessed full feature set."
 */
import {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxCommunity} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxSceneHero} from '../../../../packages/design-system/src/spatial/BerxSceneHero';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

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
			{/* the name lives in the hero now, so the way back does not
			    say it a second time */}
			<BerxHeader onBack={onBack} />

			{/* The community as the scene's subject rather than as the
			    first card in a stack.
			    The API carries no cover or icon for a community, so the
			    hero has no media — and it is built for that: it renders
			    the room's own lit surface rather than a stock photograph.
			    Its identity here is its name, its openness and what it
			    says about itself, at the sizes those things deserve. */}
			<BerxSceneHero
				title={community.name}
				meta={community.privacy === 'private' ? 'Закрытое сообщество' : 'Открытое сообщество'}
				height={200}
				actions={
					<>
						<BerxButton
							label={community.is_member ? 'Покинуть' : 'Вступить'}
							variant={community.is_member ? 'secondary' : 'primary'}
							onPress={handleJoinLeave}
							loading={acting}
						/>
						{onOpenMembers ? <BerxButton label="Участники" variant="secondary" onPress={() => onOpenMembers(guid)} /> : null}
					</>
				}
			/>

			<View style={styles.content}>
				{community.description ? (
					<BerxText role="body" emphasis="secondary">
						{community.description}
					</BerxText>
				) : null}

				{myGuid && community.owner_guid === myGuid ? (
					/* the owner's tools are a separate object: managing the
					   community is not the same act as being in it */
					<BerxActionShelf variant="anchored" align="stack" style={styles.ownerActions}>
						{onOpenRequests ? <BerxButton label="Заявки на вступление" variant="secondary" onPress={() => onOpenRequests(guid)} fullWidth /> : null}
						{onOpenModerators ? <BerxButton label="Модераторы" variant="secondary" onPress={() => onOpenModerators(guid)} fullWidth /> : null}
					</BerxActionShelf>
				) : null}

				{myGuid && community.owner_guid !== myGuid && onReport ? (
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Пожаловаться на сообщество"
						onPress={() => onReport(guid)}
						hitSlop={8}>
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
	reportLink: {color: colors.textFaint, fontSize: typography.sizeXs, textDecorationLine: 'underline', textAlign: 'center', marginTop: spacing.sm},
});
