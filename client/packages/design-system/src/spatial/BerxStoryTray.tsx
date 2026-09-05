/**
 * BerxStoryTray — the D4 rail of live moments at the top of HOME.
 *
 * A ring's state must come from real knowledge. BERX's stories feed
 * returns each group's stories but no per-viewer seen flag — only
 * POST /stories/{id}/view, which writes one. So `seen` is optional
 * here: pass it when the caller genuinely knows (its own session, or
 * a server field once one exists) and leave it undefined otherwise.
 * An undefined ring is drawn as "not known to be seen" and says
 * nothing about it out loud, rather than claiming "просмотрено" from
 * a fact nobody has.
 *
 * It scrolls. It was a plain row, so on a phone the sixth person and
 * everyone after them was laid out past the right edge of the screen
 * with no way to reach them — the stories of everybody the viewer
 * follows beyond the first five were simply unreachable. The rail
 * bleeds past the scene's gutter on both sides, because a rail that
 * stops at the margin reads as a box of avatars rather than as
 * something continuing off the screen.
 */
import {ScrollView, StyleSheet, Pressable, View} from 'react-native';
import {rgba, sharedElementTag} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxAvatar} from '../components/BerxAvatar';
import {BerxIcon} from '../icons';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';

export interface BerxStoryTrayItem {
	ownerGuid: number;
	name: string;
	avatarUrl?: string;
	/**
	 * True when the viewer is known to have seen every story in the
	 * group. Undefined when nothing knows — not false.
	 */
	seen?: boolean;
	count: number;
}

export interface BerxStoryTrayProps {
	items: readonly BerxStoryTrayItem[];
	onOpen: (ownerGuid: number) => void;
	/** Own-story entry; rendered first when the viewer can post. */
	onCreate?: () => void;
	testID?: string;
}

export function BerxStoryTray({items, onOpen, onCreate, testID}: BerxStoryTrayProps) {
	const {scene} = useBerxScene();

	return (
		<ScrollView
			testID={testID}
			horizontal
			showsHorizontalScrollIndicator={false}
			accessibilityRole="list"
			accessibilityLabel="Истории"
			style={styles.rail}
			contentContainerStyle={styles.root}>
			{onCreate ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Добавить свою историю"
					onPress={onCreate}
					style={styles.item}>
					<View style={[styles.ring, {borderColor: rgba(scene.accent, 0.5), borderStyle: 'dashed'}]}>
						<BerxIcon name="plus" size={22} state="active" decorative />
					</View>
					<BerxText role="meta" emphasis="secondary" style={styles.name} numberOfLines={1}>
						Вы
					</BerxText>
				</Pressable>
			) : null}

			{items.map((item) => (
				<Pressable
					key={item.ownerGuid}
					accessibilityRole="button"
					accessibilityLabel={`Истории: ${item.name}, ${item.count}${item.seen === undefined ? '' : item.seen ? ', просмотрено' : ', новые'}`}
					onPress={() => onOpen(item.ownerGuid)}
					style={styles.item}
					nativeID={sharedElementTag('avatar', item.ownerGuid)}>
					<View
						style={[
							styles.ring,
							{
								/* known-seen rings fall back to a neutral hairline; unseen and
								   unknown both carry the scene's energy, because dimming a ring
								   the viewer may not have opened would be a claim we cannot make */
								borderColor: item.seen === true ? scene.layers.D4.surface.borderColor : scene.accent,
								borderWidth: item.seen === true ? 1 : 2,
							},
						]}>
						<BerxAvatar iconUrl={item.avatarUrl} fallbackInitial={item.name.slice(0, 1)} size={52} />
					</View>
					<BerxText role="meta" emphasis="secondary" style={styles.name} numberOfLines={1}>
						{item.name}
					</BerxText>
				</Pressable>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	/* the rail itself never grows past the scene; its content does */
	rail: {flexGrow: 0, marginHorizontal: -spacing.lg},
	root: {flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md},
	item: {alignItems: 'center', gap: spacing.xs, width: 68, minHeight: 44},
	ring: {width: 62, height: 62, borderRadius: 31, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
	name: {maxWidth: 64},
});
