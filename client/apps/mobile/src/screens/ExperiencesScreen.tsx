/**
 * BERX-246 — Experiences. The EXPERIENCE family's v9 scene.
 *
 * Real data: api.experiences(userGuid) from
 * components/OssnApi/v1/experiences.php. The list includes both
 * experiences the viewer owns and ones they were invited to, and
 * my_status is the viewer's real, server-held answer — so a card says
 * "вы идёте" only because the server records that, and the respond
 * buttons appear only on an invitation that is genuinely pending.
 */
import {useCallback, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxExperience} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {spacing} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxExperienceCard} from '../../../../packages/design-system/src/spatial/BerxExperienceCard';
import type {BerxExperienceResponse} from '../../../../packages/design-system/src/spatial/BerxExperienceCard';
import {BerxDataBoundary} from '../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {useBerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxScreenScene, useBerxScreen} from '../spatial/BerxScreenScene';
import {classifyFailure} from '../spatial/screenState';
import {useBerxConnectivity} from '../spatial/useBerxConnectivity';
import {berxAnalytics} from '../spatial/analytics';
import {BerxSceneList} from '../../../../packages/design-system/src/spatial/BerxSceneList';

export interface ExperiencesScreenProps {
	api: BerxApiClient;
	userGuid?: number;
	isOwn: boolean;
	onOpenExperience: (id: number) => void;
	onCreate: () => void;
	onBack?: () => void;
}

function whenLabel(unix: number): string {
	return new Date(unix * 1000).toLocaleString('ru-RU', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
}

/** The server's participant status, mapped to what the card shows. */
function toResponse(status: BerxExperience['my_status']): BerxExperienceResponse {
	if (status === 'accepted') return 'going';
	if (status === 'declined') return 'declined';
	if (status === 'invited') return 'maybe';
	return 'none';
}

export default function ExperiencesScreen(props: ExperiencesScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-246" testID="berx-246">
			<ExperiencesSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ExperiencesSceneBody({api, userGuid, isOwn, onOpenExperience, onCreate, onBack}: ExperiencesScreenProps) {
	const screen = useBerxScreen();
	const {onScroll, scrollEventThrottle} = useBerxSceneScroll();

	const [items, setItems] = useState<BerxExperience[]>([]);
	/* a fetch that failed while the device is offline is an offline
	   state, not a server error — the difference is the whole point */
	const {offline} = useBerxConnectivity();
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);
	/* a 403 or a 404 is not transient; a Retry button there is a lie */
	const [retryable, setRetryable] = useState(true);
	const [busy, setBusy] = useState<number | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const res = await api.experiences(userGuid);
			setItems(res.experiences);
			setState(res.experiences.length === 0 ? 'empty' : 'default');
		} catch (e) {
			/* the real reason, not one generic error: an expired session,
			   a forbidden resource and a dead server are different
			   problems, and being offline is a fourth */
			const failure = classifyFailure(e, offline);
			setError(failure.message);
			setRetryable(failure.retryable);
			setState(failure.state);
			berxAnalytics.error(screen, 'experiences');
		}
	}, [api, userGuid, screen, offline]);

	useEffect(() => {
		load();
	}, [load]);

	const respond = useCallback(
		async (id: number, accept: boolean) => {
			setBusy(id);
			berxAnalytics.mutationStart(screen, id);
			const started = Date.now();
			try {
				await api.respondToExperience(id, accept);
				/* the status shown is the server's, so re-read it */
				await load();
				berxAnalytics.mutationSuccess(screen, Date.now() - started, id);
			} catch {
				berxAnalytics.mutationError(screen, 'experience-respond');
			} finally {
				setBusy(null);
			}
		},
		[api, load, screen],
	);

	return (
		<View style={styles.screen}>
			<BerxHeader title="Впечатления" onBack={onBack} />

			{isOwn ? (
				<BerxActionShelf variant="anchored">
					<BerxButton label="Создать впечатление" onPress={onCreate} />
				</BerxActionShelf>
			) : null}

			<BerxDataBoundary
				state={state}
				onRetry={load}
				errorMessage={error ?? undefined}
				/* a forbidden or missing resource cannot be retried into existence */
				retryable={retryable}
				emptyTitle="Впечатлений пока нет"
				emptyBody={
					isOwn
						? 'Соберите людей вокруг чего-то настоящего — места, события, поездки.'
						: 'У этого человека пока нет открытых впечатлений.'
				}
				emptyAction={isOwn ? {label: 'Создать впечатление', onPress: onCreate} : undefined}
				style={styles.body}>
				<BerxSceneList screen={screen}
					data={items}
					keyExtractor={(e: BerxExperience) => String(e.id)}
					onScroll={onScroll}
					scrollEventThrottle={scrollEventThrottle}
					/* the gutter and the rhythm come from the layout
					   contract; only the room for the floating tab bar at
					   the end of the list is this screen's business */
					contentContainerStyle={styles.list}
					removeClippedSubviews
					windowSize={Math.max(3, Math.round(screen.scene.budget.listWindowSize / 3))}
					renderItem={({item}: {item: BerxExperience}) => (
						<BerxExperienceCard
							experienceGuid={item.id}
							title={item.title}
							description={item.description}
							whenLabel={whenLabel(item.scheduled_start)}
							response={toResponse(item.my_status)}
							onPress={() => onOpenExperience(item.id)}
							actions={
								/* only a genuinely pending invitation gets a decision to make */
								item.my_status === 'invited' ? (
									<>
										<BerxButton label="Иду" loading={busy === item.id} onPress={() => respond(item.id, true)} />
										<BerxButton
											label="Не смогу"
											variant="secondary"
											loading={busy === item.id}
											onPress={() => respond(item.id, false)}
										/>
									</>
								) : undefined
							}
						/>
					)}
				/>
			</BerxDataBoundary>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	actions: {paddingHorizontal: spacing.lg, paddingTop: spacing.sm, flexDirection: 'row'},
	body: {flex: 1},
	list: {paddingBottom: spacing.xxxl},
});
