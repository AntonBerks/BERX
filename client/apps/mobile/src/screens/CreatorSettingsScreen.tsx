/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 * Real actions: api.enableCreatorMode/disableCreatorMode/
 * updateCreatorProfile (components/OssnApi/v1/creator.php). Acts
 * only on the caller's own account — enforced server-side regardless
 * of what this screen sends.
 */
import {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState} from '../../../../packages/design-system/src/components/BerxStates';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';
import {BerxText} from '../../../../packages/design-system/src/spatial/BerxText';
import {BerxSceneScroll} from '../../../../packages/design-system/src/spatial/BerxSceneScroll';

export interface CreatorSettingsScreenProps {
	api: BerxApiClient;
	myUsername: string;
	onDisabled: () => void;
	onBack?: () => void;
}

export default function CreatorSettingsScreen(props: CreatorSettingsScreenProps) {
	return (
		<BerxFamilyScene family="CREATOR" atmosphereKind="identity" testID="creator-settings">
			<CreatorSettingsScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreatorSettingsScreenBody({api, myUsername, onDisabled, onBack}: CreatorSettingsScreenProps) {
	const [isCreator, setIsCreator] = useState<boolean | null>(null);
	const [category, setCategory] = useState('');
	const [bio, setBio] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function load() {
		setLoading(true);
		setError(null);
		try {
			const profile = await api.getCreatorProfile(myUsername);
			setIsCreator(true);
			setCategory(profile.category ?? '');
			setBio(profile.bio ?? '');
		} catch {
			// A 404 here means "not a creator yet" — a real, expected
			// state, not an error to surface as one.
			setIsCreator(false);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [myUsername]);

	async function enable() {
		setBusy(true);
		setError(null);
		try {
			await api.enableCreatorMode(category.trim() || undefined, bio.trim() || undefined);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось включить режим автора');
		} finally {
			setBusy(false);
		}
	}

	async function save() {
		setBusy(true);
		setError(null);
		try {
			await api.updateCreatorProfile({category: category.trim(), bio: bio.trim()});
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось сохранить');
		} finally {
			setBusy(false);
		}
	}

	async function disable() {
		setBusy(true);
		setError(null);
		try {
			await api.disableCreatorMode();
			onDisabled();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось выключить режим автора');
		} finally {
			setBusy(false);
		}
	}

	if (loading) return <BerxLoadingState />;

	return (
		<View style={styles.screen}>
			<BerxHeader title="Режим автора" onBack={onBack} />
			{/* the content scrolls. It used to be laid out below the
			    fold with nothing to scroll, so anything past the first
			    screenful could not be reached at all. Scrolling is also
			    what moves the room. */}
			<BerxSceneScroll contentContainerStyle={styles.scrollBody}>
				<View style={styles.body}>
					{/* D2 — the work sits on a structural surface, not on the substrate */}
					<BerxGlassSurface padding="lg" style={styles.form}>
						{!isCreator ? (
							<BerxText role="meta" emphasis="secondary">Режим автора открывает публичную страницу с вашими постами, альбомами, событиями и впечатлениями — с реальной статистикой просмотров.</BerxText>
						) : null}

						<BerxInput placeholder="Категория (например, «Фотограф»)" value={category} onChangeText={setCategory} />
						<BerxInput placeholder="Описание" value={bio} onChangeText={setBio} multiline />

						{error ? <Text style={styles.error}>{error}</Text> : null}

						{!isCreator ? (
							<BerxButton label="Включить режим автора" loading={busy} onPress={enable} fullWidth />
						) : (
							<>
								<BerxButton label="Сохранить" loading={busy} onPress={save} fullWidth />
								<BerxButton label="Выключить режим автора" variant="danger" loading={busy} onPress={disable} fullWidth />
							</>
						)}
				</BerxGlassSurface>
				</View>
			</BerxSceneScroll>
		</View>
	);
}

const styles = StyleSheet.create({
	scrollBody: {paddingBottom: 48},
	form: {gap: spacing.md},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	body: {padding: spacing.md, gap: spacing.md},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
