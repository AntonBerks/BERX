/**
 * BERX-004 — Choose Color Vibe.
 *
 * Six worlds from the archive. Selecting one immediately re-resolves
 * every scene in the app: the accent that lighting, focus rings,
 * energy halos and stateful icons derive from changes, while the
 * near-black ground, the glass and the depth grammar stay exactly as
 * they are. Personalisation shifts the atmosphere; it never becomes a
 * different product.
 *
 * The preview is live rather than a swatch: each card renders on the
 * real spatial surface, with the real energy layer, in the world it
 * offers — so what the user sees on the card is what the app becomes.
 *
 * One capability is BLOCKED and said out loud on the screen rather
 * than hidden here: the choice does not follow the account.
 * `POST /api/v1/me` accepts firstname, lastname, email and password
 * only, and BERX has no profile-preference resource, so this is
 * device-local. Inventing an endpoint to sync it is exactly what the
 * constitution forbids.
 */
import {StyleSheet, Text, View} from 'react-native';
import {rgba, type BerxColorWorldName} from '@berx/spatial';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxSpatialCard} from '../../../../packages/design-system/src/spatial/BerxSpatialCard';
import {BerxEnergyHalo} from '../../../../packages/design-system/src/spatial/BerxEnergyHalo';
import {BerxIcon} from '../../../../packages/design-system/src/icons/BerxIcon';
import {BerxScreenScene} from '../spatial/BerxScreenScene';
import {useBerxColorWorld} from '../spatial/BerxColorWorld';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface ColorWorldScreenProps {
	onBack?: () => void;
	/** Shown during onboarding, where choosing a world leads somewhere next. */
	onContinue?: () => void;
}

export default function ColorWorldScreen(props: ColorWorldScreenProps) {
	return (
		<BerxScreenScene screenId="BERX-004" testID="berx-004">
			<ColorWorldSceneBody {...props} />
		</BerxScreenScene>
	);
}

function ColorWorldSceneBody({onBack, onContinue}: ColorWorldScreenProps) {
	const {world, available, setWorld} = useBerxColorWorld();

	return (
		<View style={styles.screen}>
			<BerxHeader title="Цветовой мир" onBack={onBack} />

			<BerxSceneScroll contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<BerxText role="body" emphasis="secondary">
					Мир меняет атмосферу BERX — свет, фокус, энергию. Тёмная основа и пространственная структура остаются
					прежними.
				</BerxText>

				{available.map(({name, definition}) => {
					const selected = name === world;
					return (
						<WorldCard
							key={name}
							name={name}
							accent={definition.accent}
							mood={definition.mood}
							energy={definition.energy}
							selected={selected}
							onSelect={() => setWorld(name)}
						/>
					);
				})}

				<BerxText role="meta" emphasis="tertiary" style={styles.note}>
					Выбор сохраняется на этом устройстве. BERX пока не хранит настройки оформления в аккаунте — в API нет
					такого поля, поэтому на другом устройстве мир нужно выбрать заново.
				</BerxText>

				{onContinue ? <BerxButton label="Продолжить" onPress={onContinue} fullWidth /> : null}
			</BerxSceneScroll>
		</View>
	);
}

function WorldCard({
	name,
	accent,
	mood,
	energy,
	selected,
	onSelect,
}: {
	name: BerxColorWorldName;
	accent: string;
	mood: string;
	energy: string;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<BerxSpatialCard
			depth={selected ? 'D4' : 'D3'}
			onPress={onSelect}
			accessibilityLabel={`Мир ${name}: ${mood}${selected ? ', выбран' : ''}`}
			accessibilityHint="Меняет атмосферу всего приложения"
			padding={spacing.lg}
			testID={`color-world-${name}`}>
			<View style={styles.row}>
				{/* a live preview in the world's own accent, not a flat swatch */}
				<View style={styles.preview}>
					<View
						style={[
							styles.swatch,
							{backgroundColor: rgba(accent, 0.16), borderColor: rgba(accent, selected ? 0.7 : 0.35)},
						]}
					/>
					{selected ? (
						<View style={styles.halo} pointerEvents="none">
							<BerxEnergyHalo size={54} intensity={0.9} />
						</View>
					) : null}
				</View>

				<View style={styles.text}>
					<Text style={[styles.name, selected ? {color: accent} : null]}>{name}</Text>
					<BerxText role="meta" emphasis="secondary">{mood}</BerxText>
					<BerxText role="meta" emphasis="tertiary">энергия: {energy}</BerxText>
				</View>

				{selected ? (
					<BerxIcon name="check" size={22} color={accent} decorative />
				) : (
					<View style={styles.checkSpacer} />
				)}
			</View>
		</BerxSpatialCard>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl},
	row: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg},
	preview: {width: 54, height: 54, alignItems: 'center', justifyContent: 'center'},
	swatch: {width: 42, height: 42, borderRadius: 21, borderWidth: 2},
	halo: {position: 'absolute'},
	text: {flex: 1, gap: 2},
	name: {color: colors.text, fontSize: typography.sizeLg, fontWeight: typography.weightMedium},
	checkSpacer: {width: 22},
	note: {marginTop: spacing.sm},
});
