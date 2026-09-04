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
 */
import {StyleSheet, Pressable, Text, View} from 'react-native';
import {rgba, sharedElementTag} from '@berx/spatial';
import {useBerxScene} from './BerxSpatialScene';
import {BerxAvatar} from '../components/BerxAvatar';
import {colors, spacing, typography} from '../tokens';

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
		<View testID={testID} accessibilityRole="list" accessibilityLabel="Истории" style={styles.root}>
			{onCreate ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Добавить свою историю"
					onPress={onCreate}
					style={styles.item}>
					<View style={[styles.ring, {borderColor: rgba(scene.accent, 0.5), borderStyle: 'dashed'}]}>
						<Text style={[styles.plus, {color: scene.accent}]}>+</Text>
					</View>
					<Text style={styles.name} numberOfLines={1}>
						Вы
					</Text>
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
					<Text style={styles.name} numberOfLines={1}>
						{item.name}
					</Text>
				</Pressable>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md},
	item: {alignItems: 'center', gap: spacing.xs, width: 68, minHeight: 44},
	ring: {width: 62, height: 62, borderRadius: 31, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
	plus: {fontSize: typography.sizeXl, fontWeight: typography.weightMedium},
	name: {color: colors.textDim, fontSize: typography.sizeXs, maxWidth: 64},
});
