/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * BERX CREATE — the spatial creation surface behind the wayfinder's
 * raised orb. Not a menu of links: a layered plane where each thing
 * BERX can actually create is a real, weighted destination, ordered by
 * what the concept is FOR — a lived moment first, a broadcast post
 * later — rather than alphabetically or by implementation age.
 *
 * EVERY DESTINATION IS A REAL, ALREADY-BUILT SCREEN. There is no
 * "coming soon" tile and no stub here: each row routes to a create
 * screen that already exists and already writes real server-side
 * objects. If BERX cannot really create it, it is not on this surface.
 */
import {useMemo} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxEditorialTitle} from '../../../../packages/design-system/src/components/BerxGreetingHeader';
import {BerxFadeIn} from '../../../../packages/design-system/src/components/BerxFadeIn';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

export interface CreateSurfaceProps {
	onCreateMoment?: () => void;
	onCreateStory: () => void;
	onCreatePost: () => void;
	onCreateVideo: () => void;
	onCreateTrack: () => void;
	onCreateEvent: () => void;
	onCreateExperience: () => void;
	onCreatePlace: () => void;
	onCreatePlan: () => void;
	onCreateWorld: () => void;
	onCreateCommunity: () => void;
	onBack?: () => void;
}

interface Entry {
	key: string;
	glyph: string;
	title: string;
	subtitle: string;
	onPress?: () => void;
	/** Primary entries get the elevated hero plane; the rest sit on the interactive plane. */
	primary?: boolean;
}

export default function CreateSurfaceScreen(props: CreateSurfaceProps) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	// LIVED FIRST — the things that record real life as it happens.
	const live: Entry[] = [
		{
			key: 'story',
			glyph: '◐',
			title: 'История',
			subtitle: 'Исчезает через 24 часа',
			onPress: props.onCreateStory,
			primary: true,
		},
		{
			key: 'moment',
			glyph: '◇',
			title: 'Момент',
			subtitle: 'Записывается на месте — на событии, впечатлении или отметке',
			onPress: props.onCreateMoment,
			primary: true,
		},
		{key: 'post', glyph: '▤', title: 'Пост', subtitle: 'Текст, фото, GIF или опрос', onPress: props.onCreatePost, primary: true},
	];

	// PLANNED — the things that put people somewhere together.
	const planned: Entry[] = [
		{key: 'plan', glyph: '◈', title: 'План', subtitle: 'Позвать друзей, пока это ещё идея'},
		{key: 'event', glyph: '◉', title: 'Событие', subtitle: 'Время, место, участники'},
		{key: 'experience', glyph: '❖', title: 'Впечатление', subtitle: 'То, что пережили вместе'},
	];
	planned[0].onPress = props.onCreatePlan;
	planned[1].onPress = props.onCreateEvent;
	planned[2].onPress = props.onCreateExperience;

	// SPACES — the things that outlive a single evening.
	const spaces: Entry[] = [
		{key: 'place', glyph: '⌖', title: 'Место', subtitle: 'Добавить реальное место на карту BERX'},
		{key: 'world', glyph: '◍', title: 'Мир', subtitle: 'Своя подборка мест, событий и планов'},
		{key: 'community', glyph: '⬡', title: 'Сообщество', subtitle: 'Пространство вокруг общего интереса'},
	];
	spaces[0].onPress = props.onCreatePlace;
	spaces[1].onPress = props.onCreateWorld;
	spaces[2].onPress = props.onCreateCommunity;

	// MEDIA — long-form things with their own players.
	const media: Entry[] = [
		{key: 'video', glyph: '▶', title: 'Видео', subtitle: 'С обложкой и описанием'},
		{key: 'track', glyph: '♪', title: 'Трек', subtitle: 'Аудио с обложкой'},
	];
	media[0].onPress = props.onCreateVideo;
	media[1].onPress = props.onCreateTrack;

	return (
		<View style={styles.screen}>
			{props.onBack ? <BerxHeader onBack={props.onBack} title="" /> : null}
			{/* Editorial header, as on NOW/PEOPLE/PLACES. A centred title bar
			    made CREATE read as a settings page rather than part of the
			    same product. */}
			<BerxEditorialTitle style={styles.head} accentIndex={1} lines={['Создать', 'что появится в BERX']} />
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<BerxFadeIn>
					<Section title="Прямо сейчас" entries={live} />
					<Section title="Собрать людей" entries={planned} />
					<Section title="Пространства" entries={spaces} />
					<Section title="Медиа" entries={media} />
				</BerxFadeIn>
			</ScrollView>
		</View>
	);
}

function Section({title, entries}: {title: string; entries: Entry[]}) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const visible = entries.filter((e: Entry) => !!e.onPress);
	if (visible.length === 0) {
		return null;
	}
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{visible.map((e: Entry) => (
				<View key={e.key} style={styles.entryWrap}>
					<Pressable onPress={e.onPress}>
						<BerxGlassSurface level={e.primary ? 3 : 2} padding="lg" radius={radius.lg}>
							<View style={styles.entryRow}>
								<View style={[styles.glyphPlate, e.primary && styles.glyphPlatePrimary]}>
									<Text style={[styles.glyph, e.primary && styles.glyphPrimary]}>{e.glyph}</Text>
								</View>
								<View style={styles.entryBody}>
									<Text style={styles.entryTitle}>{e.title}</Text>
									<Text style={styles.entrySubtitle}>{e.subtitle}</Text>
								</View>
							</View>
						</BerxGlassSurface>
					</Pressable>
				</View>
			))}
		</View>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	head: {paddingHorizontal: 0, paddingBottom: spacing.sm},
	scroll: {padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 132},
	section: {marginBottom: spacing.lg},
	sectionTitle: {
		color: colors.text,
		fontSize: typography.sizeLg,
		fontWeight: typography.weightBold,
		letterSpacing: -0.4,
		marginBottom: spacing.md,
	},
	entryWrap: {marginBottom: spacing.xs},
	entryRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
	glyphPlate: {
		width: 44,
		height: 44,
		borderRadius: radius.md,
		backgroundColor: colors.glass2,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: colors.borderSoft,
	},
	glyphPlatePrimary: {backgroundColor: colors.accentSoft, borderColor: colors.accentSoft},
	glyph: {color: colors.textDim, fontSize: 18},
	glyphPrimary: {color: colors.accent},
	entryBody: {flex: 1, gap: 2},
	entryTitle: {color: colors.text, fontSize: typography.sizeBase, fontWeight: typography.weightMedium},
	entrySubtitle: {color: colors.textFaint, fontSize: typography.sizeXs, lineHeight: 16},
});
