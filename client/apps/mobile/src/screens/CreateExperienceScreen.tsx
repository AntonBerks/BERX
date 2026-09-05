/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real submit: api.createExperience() (components/OssnApi/v1/
 * experiences.php). Anchor must be a real place or event — search
 * results come from the real api.searchPlaces()/searchEvents().
 */
import React, {useState} from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import type {BerxPlaceSearchResult, BerxEventSearchResult, BerxCollectionVisibility} from '@berx/api/types';
import {colors, spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxActionShelf} from '../../../../packages/design-system/src/spatial/BerxActionShelf';
import {BerxSegmentTabs} from '../../../../packages/design-system/src/components/BerxBusinessPrimitives';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

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
	const [title, setTitle] = useState('');
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

	/** +1 day at 19:00 — a default the user could later be given control over; not silently different from what's submitted. */
	const scheduledStart = (() => {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		d.setHours(19, 0, 0, 0);
		return Math.floor(d.getTime() / 1000);
	})();

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
			<View style={styles.body}>
				{/* D2 — the form is a structural object in the room, not
				    fields floating on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название" value={title} onChangeText={setTitle} />
					<BerxInput placeholder="Описание (необязательно)" value={description} onChangeText={setDescription} multiline />

					<Text style={styles.label}>Привязать к</Text>
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
						<View style={styles.anchorSelected}>
							<Text style={styles.anchorSelectedText}>{anchor.title}</Text>
							<Pressable onPress={() => setAnchor(null)}><Text style={styles.anchorClear}>Изменить</Text></Pressable>
						</View>
					) : (
						<>
							<BerxInput placeholder={anchorTab === 'place' ? 'Искать место' : 'Искать событие'} value={anchorQuery} onChangeText={searchAnchor} />
							{anchorTab === 'place' ? (
								<FlatList
									data={places}
									keyExtractor={(p: BerxPlaceSearchResult) => String(p.guid)}
									renderItem={({item}: {item: BerxPlaceSearchResult}) => (
										<Pressable style={styles.resultRow} onPress={() => setAnchor({type: 'place', guid: item.guid, title: item.title})}>
											<Text style={styles.resultText}>{item.title}</Text>
										</Pressable>
									)}
								/>
							) : (
								<FlatList
									data={events}
									keyExtractor={(e: BerxEventSearchResult) => String(e.guid)}
									renderItem={({item}: {item: BerxEventSearchResult}) => (
										<Pressable style={styles.resultRow} onPress={() => setAnchor({type: 'event', guid: item.guid, title: item.title})}>
											<Text style={styles.resultText}>{item.title}</Text>
										</Pressable>
									)}
								/>
							)}
						</>
					)}

					<Text style={styles.label}>Доступ</Text>
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
		</View>
	);
}

const styles = StyleSheet.create({
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	form: {gap: spacing.md},
	label: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase'},
	row: {flexDirection: 'row', gap: spacing.sm},
	resultRow: {paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft},
	resultText: {fontSize: typography.sizeSm, color: colors.white},
	anchorSelected: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm},
	anchorSelectedText: {fontSize: typography.sizeSm, color: colors.white, fontWeight: typography.weightMedium},
	anchorClear: {fontSize: typography.sizeXs, color: colors.accent},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
