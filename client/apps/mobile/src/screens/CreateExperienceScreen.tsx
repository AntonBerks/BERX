/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createExperience() (components/OssnApi/v1/
 * experiences.php). Anchor must be a real place or event — search
 * results come from the real api.searchPlaces()/searchEvents().
 */
import {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceSearchResult, BerxEventSearchResult, BerxCollectionVisibility} from '@berx/api/types';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxWhenPicker} from '../../../../packages/design-system/src/spatial/BerxWhenPicker';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {useBerxScene} from '../../../../packages/design-system/src/spatial/BerxSpatialScene';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';

export interface CreateExperienceScreenProps {
	api: BerxApiClient;
	onCreated: (id: number) => void;
	onBack?: () => void;
}

type Anchor = {type: 'place' | 'event'; guid: number; title: string};

export default function CreateExperienceScreen(props: CreateExperienceScreenProps) {
	return (
		<BerxFamilyScene family="EXPERIENCE" testID="create-experience">
			<CreateExperienceScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateExperienceScreenBody({api, onCreated, onBack}: CreateExperienceScreenProps) {
	/* the rule between two entries is the structure plane's own edge:
	   a fixed grey hairline belongs to no plane and does not change
	   with the colour world */
	const dividerColor = useBerxScene().scene.layers.D2.surface.borderColor;
	const [title, setTitle] = useState('');
	/* where the picker opens, not what it submits */
	const [scheduledStart, setScheduledStart] = useState(() => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		d.setHours(19, 0, 0, 0);
		return Math.floor(d.getTime() / 1000);
	});
	const [description, setDescription] = useState('');
	const [anchorQuery, setAnchorQuery] = useState('');
	const [anchorTab, setAnchorTab] = useState<'place' | 'event'>('place');
	const [places, setPlaces] = useState<BerxPlaceSearchResult[]>([]);
	const [events, setEvents] = useState<BerxEventSearchResult[]>([]);
	const [anchor, setAnchor] = useState<Anchor | null>(null);
	const [visibility, setVisibility] = useState<BerxCollectionVisibility>('private');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function searchAnchor(q: string) {
		setAnchorQuery(q);
		if (!q.trim()) {
			setPlaces([]);
			setEvents([]);
			return;
		}
		try {
			if (anchorTab === 'place') {
				const res = await api.searchPlaces(q.trim());
				setPlaces(res.places);
			} else {
				const res = await api.searchEvents(q.trim());
				setEvents(res.events);
			}
		} catch {
			// search failure just shows no results — not a form-blocking error
		}
	}


	async function submit() {
		if (!title.trim() || !anchor) {
			setError('Укажите название и выберите место или событие.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await api.createExperience({
				title: title.trim(),
				description: description.trim() || undefined,
				placeGuid: anchor.type === 'place' ? anchor.guid : undefined,
				eventGuid: anchor.type === 'event' ? anchor.guid : undefined,
				scheduledStart,
				visibility,
			});
			onCreated(res.id);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось создать впечатление');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader title="Создать впечатление" onBack={onBack} />
			{/* the form scrolls. It was laid out in a plain view, so on a
			    phone the access control and the Create button sat below
			    the fold with nothing to scroll — a form whose submit you
			    cannot reach. Scrolling is also what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
			<View style={styles.body}>
				{/* D2 — the form is a structural object in the room, not
				    fields floating on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />
					<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />

					<BerxText role="micro" emphasis="tertiary">Привязать к</BerxText>
					<BerxSegmentTabs
						options={[
							{key: 'place', label: 'Место'},
							{key: 'event', label: 'Событие'},
						]}
						value={anchorTab}
						onChange={(key) => {
							setAnchorTab(key as 'place' | 'event');
							setAnchor(null);
						}}
					/>

					{anchor ? (
						<BerxSpatialCard depth="D3" padding={spacing.sm} radius={18}>
							<View style={styles.anchorSelected}>
								<BerxText role="label">{anchor.title}</BerxText>
								<Pressable
									onPress={() => setAnchor(null)}
									accessibilityRole="button"
									accessibilityLabel={`Изменить привязку, сейчас ${anchor.title}`}
									hitSlop={8}>
									<BerxText role="meta" emphasis="accent">Изменить</BerxText>
								</Pressable>
							</View>
						</BerxSpatialCard>
					) : (
						<>
							<BerxInput placeholder={anchorTab === 'place' ? 'Искать место' : 'Искать событие'} value={anchorQuery} onChangeText={searchAnchor} />
							{/* mapped, not virtualised: a vertical FlatList inside the
							    screen's own vertical scroller gives two scrollers
							    fighting for the same gesture, and this is a bounded
							    search result rather than a feed */}
							{anchorTab === 'place'
								? places.map((item: BerxPlaceSearchResult) => (
										<Pressable
											key={item.guid}
											style={[styles.resultRow, {borderBottomColor: dividerColor}]}
											accessibilityRole="button"
											accessibilityLabel={`Привязать к месту ${item.title}`}
											onPress={() => setAnchor({type: 'place', guid: item.guid, title: item.title})}>
											<BerxText role="meta">{item.title}</BerxText>
										</Pressable>
								  ))
								: events.map((item: BerxEventSearchResult) => (
										<Pressable
											key={item.guid}
											style={[styles.resultRow, {borderBottomColor: dividerColor}]}
											accessibilityRole="button"
											accessibilityLabel={`Привязать к событию ${item.title}`}
											onPress={() => setAnchor({type: 'event', guid: item.guid, title: item.title})}>
											<BerxText role="meta">{item.title}</BerxText>
										</Pressable>
								  ))}
						</>
					)}

					{/* when it happens — a real choice, not a fixed tomorrow at
					    seven that nobody's plan actually is */}
					<BerxWhenPicker value={scheduledStart} onChange={setScheduledStart} testID="create-experience-start" />

					<BerxText role="micro" emphasis="tertiary">Доступ</BerxText>
					<BerxSegmentTabs
						options={[
							{key: 'private', label: 'Приватное'},
							{key: 'public', label: 'Открытое'},
						]}
						value={visibility}
						onChange={setVisibility}
					/>

					{error ? <Text style={styles.error}>{error}</Text> : null}

					{/* D4 — the commit action, promoted onto the control plane */}
					<BerxActionShelf variant="anchored" align="stack">
						<BerxButton label="Создать" loading={submitting} onPress={submit} fullWidth />
					</BerxActionShelf>
				</BerxGlassSurface>
			</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	form: {gap: spacing.md},
	row: {flexDirection: 'row', gap: spacing.sm},
	resultRow: {paddingVertical: spacing.sm, borderBottomWidth: 1},
	anchorSelected: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
