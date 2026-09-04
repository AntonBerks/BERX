/**
 * Business / Team — a BUSINESS-family v9 scene.
 *
 * Real data throughout: `businessTeam()`, `addBusinessTeamMember()`,
 * `removeBusinessTeamMember()` — owner/admin only, enforced
 * server-side, so a caller without rights gets a real rejection
 * rather than a hidden button.
 *
 * Adding a member needed a real user_guid, and this screen used to ask
 * the owner to type one in — a number they have no way to know.
 * `GET /search/users` already existed, so it now searches real people
 * by name or login and adds the one chosen. Nothing about the add
 * endpoint changed; the identifier just stopped being the owner's
 * problem.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxBusinessTeamMember, BerxBusinessTeamRole} from '@berx/api/types';
import type {BerxScreenState} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../../packages/design-system/src/components/BerxButton';
import {BerxSearchField} from '../../../../../packages/design-system/src/spatial/BerxSearchField';
import {BerxFilterBar} from '../../../../../packages/design-system/src/spatial/BerxFilterBar';
import {BerxIdentity} from '../../../../../packages/design-system/src/spatial/BerxIdentity';
import {BerxSpatialCard} from '../../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxDataBoundary} from '../../../../../packages/design-system/src/spatial/BerxDataBoundary';
import {BerxFamilyScene} from '../../spatial/BerxScreenScene';

interface SearchResultUser {
	guid: number;
	username: string;
	fullname: string;
}

export interface BusinessTeamScreenProps {
	api: BerxApiClient;
	placeGuid: number;
	onBack?: () => void;
}

const DEBOUNCE_MS = 400;

const ROLE_LABEL: Record<BerxBusinessTeamRole, string> = {manager: 'Менеджер', staff: 'Сотрудник'};

export default function BusinessTeamScreen(props: BusinessTeamScreenProps) {
	return (
		<BerxFamilyScene family="BUSINESS" testID="business-team">
			<BusinessTeamSceneBody {...props} />
		</BerxFamilyScene>
	);
}

function BusinessTeamSceneBody({api, placeGuid, onBack}: BusinessTeamScreenProps) {
	const [team, setTeam] = useState<BerxBusinessTeamMember[]>([]);
	const [state, setState] = useState<BerxScreenState>('loading');
	const [error, setError] = useState<string | null>(null);

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchResultUser[]>([]);
	const [searching, setSearching] = useState(false);
	const [searched, setSearched] = useState(false);
	const [role, setRole] = useState<BerxBusinessTeamRole>('staff');
	const [addingGuid, setAddingGuid] = useState<number | null>(null);
	const [addError, setAddError] = useState<string | null>(null);
	const [busyGuid, setBusyGuid] = useState<number | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const load = useCallback(async () => {
		setState('loading');
		setError(null);
		try {
			const res = await api.businessTeam(placeGuid);
			setTeam(res.team);
			setState(res.team.length === 0 ? 'empty' : 'default');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить команду');
			setState('error');
		}
	}, [api, placeGuid]);

	useEffect(() => {
		load();
	}, [load]);

	const search = useCallback(
		async (q: string) => {
			const term = q.trim();
			if (!term) {
				setResults([]);
				setSearched(false);
				return;
			}
			setSearching(true);
			try {
				const res = await api.searchUsers(term);
				setResults(res.users);
			} catch {
				setResults([]);
			} finally {
				setSearching(false);
				setSearched(true);
			}
		},
		[api],
	);

	const changeQuery = useCallback(
		(text: string) => {
			setQuery(text);
			setAddError(null);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => search(text), DEBOUNCE_MS);
		},
		[search],
	);

	const add = useCallback(
		async (guid: number) => {
			setAddingGuid(guid);
			setAddError(null);
			try {
				await api.addBusinessTeamMember(placeGuid, guid, role);
				setQuery('');
				setResults([]);
				setSearched(false);
				/* the team list is the server's answer, so re-read it */
				await load();
			} catch (e) {
				setAddError(e instanceof Error ? e.message : 'Не удалось добавить сотрудника');
			} finally {
				setAddingGuid(null);
			}
		},
		[api, placeGuid, role, load],
	);

	const remove = useCallback(
		async (guid: number) => {
			setBusyGuid(guid);
			try {
				await api.removeBusinessTeamMember(placeGuid, guid);
				setTeam((prev) => prev.filter((m) => m.guid !== guid));
			} catch {
				/* list stays as the server left it */
			} finally {
				setBusyGuid(null);
			}
		},
		[api, placeGuid],
	);

	const teamGuids = new Set(team.map((m) => m.guid));

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Команда" />
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.sectionTitle} accessibilityRole="header">
					Добавить сотрудника
				</Text>

				<BerxFilterBar
					options={[
						{key: 'staff', label: 'Сотрудник'},
						{key: 'manager', label: 'Менеджер'},
					]}
					selected={[role]}
					onToggle={(key) => setRole(key as BerxBusinessTeamRole)}
					multiple={false}
					accessibilityLabel="Роль нового участника"
				/>

				<BerxSearchField
					value={query}
					onChangeText={changeQuery}
					onSubmit={() => search(query)}
					placeholder="Имя или логин"
					accessibilityLabel="Поиск человека для добавления в команду"
					resultCount={searched && !searching ? results.length : undefined}
				/>

				{addError ? (
					<Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>
						{addError}
					</Text>
				) : null}

				{searched && results.length === 0 && !searching ? (
					<Text style={styles.hint}>Никого не нашлось по этому запросу.</Text>
				) : null}

				{results.map((user) => {
					const already = teamGuids.has(user.guid);
					return (
						<BerxSpatialCard key={user.guid} depth="D3" padding={spacing.md} radius={18}>
							<BerxIdentity
								userGuid={user.guid}
								name={user.fullname || user.username}
								handle={user.username}
								subtitle={already ? 'уже в команде' : undefined}
								trailing={
									<BerxButton
										label={already ? 'В команде' : `Добавить · ${ROLE_LABEL[role]}`}
										loading={addingGuid === user.guid}
										disabled={already}
										onPress={() => add(user.guid)}
									/>
								}
							/>
						</BerxSpatialCard>
					);
				})}

				<Text style={styles.sectionTitle} accessibilityRole="header">
					Команда
				</Text>

				<BerxDataBoundary
					state={state}
					onRetry={load}
					errorMessage={error ?? undefined}
					emptyTitle="Пока только вы"
					emptyBody="Найдите человека выше, чтобы добавить его в команду этого места.">
					<View style={styles.list}>
						{team.map((member) => (
							<BerxSpatialCard key={member.guid} depth="D3" padding={spacing.md} radius={18}>
								<BerxIdentity
									userGuid={member.guid}
									name={member.fullname || member.username}
									handle={member.username}
									avatarUrl={member.icon}
									subtitle={ROLE_LABEL[member.role]}
									trailing={
										<BerxButton
											label="Убрать"
											variant="secondary"
											loading={busyGuid === member.guid}
											onPress={() => remove(member.guid)}
										/>
									}
								/>
							</BerxSpatialCard>
						))}
					</View>
				</BerxDataBoundary>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	sectionTitle: {
		color: colors.textFaint,
		fontSize: typography.sizeXs,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginTop: spacing.sm,
	},
	list: {gap: spacing.md},
	error: {color: colors.danger, fontSize: typography.sizeSm},
	hint: {color: colors.textFaint, fontSize: typography.sizeSm},
});
