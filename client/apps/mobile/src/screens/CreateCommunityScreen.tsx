/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 */
import {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxGlassSurface} from '../../../../packages/design-system/src/components/BerxGlassSurface';
import {BerxFamilyScene} from '../spatial/BerxScreenScene';

export interface CreateCommunityScreenProps {
	api: BerxApiClient;
	onCreated: (guid: number) => void;
	onBack: () => void;
}

export default function CreateCommunityScreen(props: CreateCommunityScreenProps) {
	return (
		<BerxFamilyScene family="COMMUNITY" testID="create-community">
			<CreateCommunityScreenBody {...props} />
		</BerxFamilyScene>
	);
}

function CreateCommunityScreenBody({api, onCreated, onBack}: CreateCommunityScreenProps) {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleCreate() {
		if (!name.trim()) return;
		setCreating(true);
		setError(null);
		try {
			const res = await api.createCommunity(name.trim(), description.trim(), privacy);
			onCreated(res.guid);
		} catch {
			setError('Не удалось создать сообщество');
		} finally {
			setCreating(false);
		}
	}

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title="Новое сообщество" />
			<View style={styles.content}>
				{/* D2 — the work sits on a structural surface, not on the substrate */}
				<BerxGlassSurface padding="lg" style={styles.form}>
					<BerxInput placeholder="Название" value={name} onChangeText={setName} />
					<BerxInput placeholder="Описание" value={description} onChangeText={setDescription} multiline style={styles.descInput} />

					<View style={styles.privacyRow}>
						<BerxButton
							label="Открытое"
							variant={privacy === 'public' ? 'primary' : 'secondary'}
							onPress={() => setPrivacy('public')}
						/>
						<BerxButton
							label="Закрытое"
							variant={privacy === 'private' ? 'primary' : 'secondary'}
							onPress={() => setPrivacy('private')}
						/>
					</View>

					{error ? <Text style={styles.error}>{error}</Text> : null}
					<BerxButton label="Создать" onPress={handleCreate} loading={creating} disabled={!name.trim()} fullWidth />
			</BerxGlassSurface>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	form: {gap: spacing.md},
	/* no opaque fill: the scene paints the room this screen stands in */
	screen: {flex: 1},
	content: {padding: spacing.lg, gap: spacing.md},
	descInput: {minHeight: 100, textAlignVertical: 'top'},
	privacyRow: {flexDirection: 'row', gap: spacing.sm},
	error: {color: colors.danger, fontSize: typography.sizeSm},
});
