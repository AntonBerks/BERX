/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * DISCOVER BERX — what the product is, before an account exists.
 *
 * EVERY CLAIM ON THIS SCREEN IS A THING BERX ACTUALLY DOES. Places
 * with real coordinates and real check-ins (classes/OssnPlaces.php,
 * v1/places.php), real friendships and real communities
 * (v1/friends.php, v1/communities.php), real stories/moments/memories
 * (classes/OssnStories.php, v1/moments.php). There is no count, no
 * "10,000 places", no testimonial and no screenshot of a screen that
 * does not exist — this page runs before login, where BERX genuinely
 * knows nothing, so it says what the product is and nothing about
 * what is in it.
 *
 * Visually it is the same BerxStage as splash and welcome, moving
 * through it: `depth` rises page by page, so the three pages are one
 * continuous camera move rather than three separate backdrops.
 */
import {useMemo, useRef, useState} from 'react';
import {View, Text, Animated, Dimensions, StyleSheet} from 'react-native';
import type {NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
import {spacing, typography, radius} from '@berx/design-system/tokens';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxStage} from '../../../../packages/design-system/src/components/BerxStage';
import {BerxEmblem} from '../../../../packages/design-system/src/components/BerxEmblem';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

interface Page {
	key: string;
	icon: string;
	eyebrow: string;
	lines: string[];
	accentLine: number;
	body: string;
}

/** Three real capabilities, in the order BERX puts them in the product. */
const PAGES: Page[] = [
	{
		key: 'places',
		icon: 'map-pin',
		eyebrow: 'Места',
		lines: ['Город,', 'который', 'уже открыт'],
		accentLine: 2,
		body: 'Реальные места на карте, отметки о посещении и отзывы людей, которые там были.',
	},
	{
		key: 'people',
		icon: 'users',
		eyebrow: 'Люди',
		lines: ['Свои —', 'рядом,', 'а не в ленте'],
		accentLine: 2,
		body: 'Друзья, сообщества и совместные планы. BERX показывает, кто уже собрался.',
	},
	{
		key: 'moments',
		icon: 'camera',
		eyebrow: 'Моменты',
		lines: ['То, что', 'было', 'на самом деле'],
		accentLine: 2,
		body: 'Истории на сутки, моменты с места события и воспоминания, которые остаются.',
	},
];

interface Props {
	onFinish: () => void;
	onSkip: () => void;
}

export default function DiscoverScreen({onFinish, onSkip}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const scrollX = useRef(new Animated.Value(0)).current;
	const listRef = useRef<Animated.FlatList<Page> | null>(null);
	const [index, setIndex] = useState(0);
	const last = index === PAGES.length - 1;

	function advance() {
		if (last) {
			onFinish();
			return;
		}
		const next = index + 1;
		setIndex(next);
		// The typed ref of an Animated.FlatList does not surface the
		// underlying list's imperative methods in this sandbox's tsc setup;
		// the instance really does have them (it is a FlatList).
		const node = listRef.current as unknown as {scrollToOffset?: (o: {offset: number; animated: boolean}) => void};
		node?.scrollToOffset?.({offset: next * SCREEN_W, animated: true});
	}

	return (
		// The camera rises as the pages advance: page 3 looks down on the
		// city that page 1 stood in.
		<BerxStage depth={index / (PAGES.length - 1)} seed={19} scrim={0.5}>
			<Animated.FlatList
				ref={listRef}
				data={PAGES}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				keyExtractor={(p: Page) => p.key}
				onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollX}}}], {
					useNativeDriver: true,
					listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
						const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
						if (i !== index) {
							setIndex(i);
						}
					},
				})}
				scrollEventThrottle={16}
				renderItem={({item, index: i}: {item: Page; index: number}) => {
					// Each page's object leans with the swipe: the 3D is carried
					// BY the gesture rather than animating on its own timer.
					const range = [(i - 1) * SCREEN_W, i * SCREEN_W, (i + 1) * SCREEN_W];
					const translate = scrollX.interpolate({
						inputRange: range,
						outputRange: [70, 0, -70],
						extrapolate: 'clamp',
					});
					const opacity = scrollX.interpolate({
						inputRange: range,
						outputRange: [0, 1, 0],
						extrapolate: 'clamp',
					});
					return (
						<View style={styles.page}>
							<Animated.View style={[styles.objectSlot, {opacity, transform: [{translateX: translate}]}]}>
								<BerxEmblem size={150} light={colors.accent} tilt={i * 4} />
							</Animated.View>
							<Animated.View style={[styles.copy, {opacity, transform: [{translateX: translate}]}]}>
								<View style={styles.eyebrowRow}>
									<BerxIcon name={item.icon} size={15} color={colors.accentOnMedia} />
									<Text style={styles.eyebrow}>{item.eyebrow}</Text>
								</View>
								{item.lines.map((line: string, li: number) => (
									<Text key={line} style={[styles.display, li === item.accentLine && styles.displayAccent]}>
										{line}
									</Text>
								))}
								<Text style={styles.body}>{item.body}</Text>
							</Animated.View>
						</View>
					);
				}}
			/>

			<View style={styles.footer}>
				<View style={styles.dots}>
					{PAGES.map((p: Page, i: number) => (
						<View key={p.key} style={[styles.dot, i === index && styles.dotActive]} />
					))}
				</View>
				<BerxButton label={last ? 'Начать' : 'Дальше'} onPress={advance} fullWidth />
				<BerxButton label="Пропустить" variant="secondary" onPress={onSkip} fullWidth />
			</View>
		</BerxStage>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	// EXPLICIT HEIGHT, not flex: 1. A horizontal FlatList sizes its items
	// to their content, so `flex: 1` collapsed each page to zero height —
	// and every absolutely-positioned child inside it (the whole copy
	// block) was then laid out against a zero-height box and pushed off
	// the top of the screen. The page renders as a full device frame.
	page: {width: SCREEN_W, height: SCREEN_H},
	objectSlot: {position: 'absolute', top: '15%', right: '8%'},
	copy: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: 250},
	eyebrowRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
	eyebrow: {
		fontSize: typography.sizeXs,
		color: colors.accentOnMedia,
		textTransform: 'uppercase',
		letterSpacing: 2.4,
	},
	display: {
		fontSize: 42,
		lineHeight: 46,
		fontWeight: typography.weightBold,
		color: colors.onMedia,
		letterSpacing: -1.4,
	},
	displayAccent: {color: colors.accentOnMedia},
	body: {
		fontSize: typography.sizeBase,
		lineHeight: 22,
		color: colors.onMediaDim,
		marginTop: spacing.lg,
		maxWidth: 300,
	},
	footer: {position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xxl, gap: spacing.sm},
	dots: {flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg},
	dot: {width: 22, height: 3, borderRadius: radius.pill, backgroundColor: colors.onMediaFaint},
	dotActive: {backgroundColor: colors.accentOnMedia, width: 34},
});
