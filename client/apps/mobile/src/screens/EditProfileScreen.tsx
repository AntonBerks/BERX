/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — closes a real, significant gap found in a broader sweep
 * of client.ts for zero-UI-caller methods: api.updateProfile() (real
 * PATCH /me, components/OssnApi/v1/me.php) had NO screen anywhere in
 * the app — a user could see their own name/email on ProfileScreen
 * but never change either from the app itself. `first_name`/
 * `last_name` are now real, separate fields on BerxUser (added this
 * batch alongside the existing combined `fullname`) so this screen
 * pre-fills exactly what the server holds, not a guessed split of
 * the display name.
 *
 * Password change is a separate, explicitly labeled section on the
 * same screen (not a separate route — updateProfile() is one real
 * endpoint for both). The server does NOT require the current
 * password to set a new one (confirmed by reading me.php's PATCH
 * branch directly — a pre-existing property of the endpoint, not
 * something this screen can fix), so the only real safeguard this
 * screen can honestly add is a client-side "repeat new password"
 * match check before submitting — never faked as a security control,
 * just a typo guard.
 *
 * MAX BUILD — real avatar + cover photo. api.uploadAvatar() previously
 * had zero UI caller outside onboarding (a user could never change
 * their photo again afterward); api.uploadProfileCover()/
 * deleteProfileCover() wrap OssnProfile's own native cover mechanism
 * (classes/OssnProfile.php), previously reachable only from a
 * session-cookie web action. Same pickImage-injected-prop pattern as
 * AlbumDetailScreen/EditPlaceScreen.
 */
import {useCallback, useEffect, useState, useMemo} from 'react';
import {View, Text, Image, Pressable, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient, BerxFilePart} from '@berx/api/client';
import type {BerxUser} from '@berx/api/types';
import {spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxInput} from '../../../../packages/design-system/src/components/BerxInput';
import {BerxButton} from '../../../../packages/design-system/src/components/BerxButton';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';
import {Berx3DTilt} from '../../../../packages/design-system/src/components/Berx3DTilt';

import {useBerxColors} from '../../../../packages/design-system/src/theme';
import type {BerxColorTokens} from '@berx/design-system/tokens';

interface Props {
	api: BerxApiClient;
	pickImage?: () => Promise<BerxFilePart | null>;
	onSaved: () => void;
	onBack?: () => void;
}

export default function EditProfileScreen({api, pickImage, onSaved, onBack}: Props) {
	const colors = useBerxColors();
	const styles = useMemo(() => makeStyles(colors), [colors]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [repeatPassword, setRepeatPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [iconUrl, setIconUrl] = useState<string | null>(null);
	const [coverUrl, setCoverUrl] = useState<string | null>(null);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [uploadingCover, setUploadingCover] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const user: BerxUser = await api.me();
			setFirstName(user.first_name);
			setLastName(user.last_name);
			setEmail(user.email);
			setIconUrl(user.icon_url);
			setCoverUrl(user.cover_url);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить профиль');
		} finally {
			setLoading(false);
		}
	}, [api]);

	async function handleChangeAvatar() {
		if (!pickImage) return;
		const picked = await pickImage();
		if (!picked) return;
		setUploadingAvatar(true);
		try {
			const res = await api.uploadAvatar(picked);
			setIconUrl(res.icon_url);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить фото');
		} finally {
			setUploadingAvatar(false);
		}
	}

	async function handleRemoveAvatar() {
		setUploadingAvatar(true);
		try {
			const res = await api.deleteAvatar();
			setIconUrl(res.icon_url);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось удалить фото');
		} finally {
			setUploadingAvatar(false);
		}
	}

	async function handleChangeCover() {
		if (!pickImage) return;
		const picked = await pickImage();
		if (!picked) return;
		setUploadingCover(true);
		try {
			const res = await api.uploadProfileCover(picked);
			setCoverUrl(res.cover_url);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось загрузить обложку');
		} finally {
			setUploadingCover(false);
		}
	}

	async function handleRemoveCover() {
		setUploadingCover(true);
		try {
			await api.deleteProfileCover();
			setCoverUrl(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось удалить обложку');
		} finally {
			setUploadingCover(false);
		}
	}

	useEffect(() => {
		load();
	}, [load]);

	async function submit() {
		if (!firstName.trim()) {
			setError('Укажите имя.');
			return;
		}
		if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			setError('Некорректный email.');
			return;
		}
		if (newPassword && newPassword !== repeatPassword) {
			setError('Пароли не совпадают.');
			return;
		}
		if (newPassword && newPassword.length < 6) {
			setError('Пароль должен быть не короче 6 символов.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await api.updateProfile({
				firstname: firstName.trim(),
				lastname: lastName.trim(),
				email: email.trim(),
				...(newPassword ? {password: newPassword} : {}),
			});
			onSaved();
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать профиль" onBack={onBack} />
				<BerxLoadingState />
			</View>
		);
	}
	if (error && !firstName && !email) {
		return (
			<View style={styles.screen}>
				<BerxHeader title="Редактировать профиль" onBack={onBack} />
				<BerxErrorState message={error} onRetry={load} />
			</View>
		);
	}

	return (
		<ScrollView style={styles.screen}>
			<BerxHeader title="Редактировать профиль" onBack={onBack} />

			<Berx3DTilt style={styles.hero} maxAngle={5}>
				{coverUrl ? <Image source={{uri: coverUrl}} style={styles.heroImage} /> : <View style={styles.heroPlaceholder} />}
				{pickImage ? (
					<View style={styles.coverActions}>
						<Pressable style={styles.coverActionButton} onPress={handleChangeCover} disabled={uploadingCover} hitSlop={8}>
							<Text style={styles.coverActionLabel}>{uploadingCover ? 'Загрузка…' : 'Сменить обложку'}</Text>
						</Pressable>
						{coverUrl ? (
							<Pressable style={styles.coverActionButton} onPress={handleRemoveCover} disabled={uploadingCover} hitSlop={8}>
								<Text style={styles.coverActionLabel}>Удалить</Text>
							</Pressable>
						) : null}
					</View>
				) : null}
				<View style={styles.avatarWrap}>
					<Pressable onPress={pickImage ? handleChangeAvatar : undefined} disabled={!pickImage || uploadingAvatar}>
						{iconUrl ? <Image source={{uri: iconUrl}} style={styles.avatar} /> : <View style={styles.avatar} />}
					</Pressable>
					{pickImage ? (
						<View style={styles.avatarActionsRow}>
							<Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar} hitSlop={6}>
								<Text style={styles.avatarEditLabel}>{uploadingAvatar ? '…' : 'Изменить'}</Text>
							</Pressable>
							<Pressable onPress={handleRemoveAvatar} disabled={uploadingAvatar} hitSlop={6}>
								<Text style={styles.avatarEditLabel}>Удалить</Text>
							</Pressable>
						</View>
					) : null}
				</View>
			</Berx3DTilt>

			<View style={styles.body}>
				<BerxInput placeholder="Имя" value={firstName} onChangeText={setFirstName} />
				<BerxInput placeholder="Фамилия" value={lastName} onChangeText={setLastName} />
				<BerxInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

				<Text style={styles.sectionTitle}>Сменить пароль (необязательно)</Text>
				<BerxInput placeholder="Новый пароль" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
				<BerxInput placeholder="Повторите новый пароль" value={repeatPassword} onChangeText={setRepeatPassword} secureTextEntry />

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<BerxButton label="Сохранить" loading={submitting} onPress={submit} fullWidth />
			</View>
		</ScrollView>
	);
}

const makeStyles = (colors: BerxColorTokens) => StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	hero: {height: 140, backgroundColor: colors.surface, marginBottom: 40},
	heroImage: {width: '100%', height: '100%'},
	heroPlaceholder: {width: '100%', height: '100%', backgroundColor: colors.surface},
	coverActions: {position: 'absolute', right: spacing.sm, bottom: spacing.sm, flexDirection: 'row', gap: spacing.xs},
	coverActionButton: {backgroundColor: colors.black, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6, borderWidth: 1, borderColor: colors.accent},
	coverActionLabel: {color: colors.accent, fontSize: typography.sizeXs, fontWeight: typography.weightMedium},
	avatarWrap: {position: 'absolute', left: spacing.lg, bottom: -32, alignItems: 'center'},
	avatar: {width: 72, height: 72, borderRadius: 36, backgroundColor: colors.graphite, borderWidth: 3, borderColor: colors.bg},
	avatarActionsRow: {flexDirection: 'row', gap: spacing.sm, marginTop: 2},
	avatarEditLabel: {color: colors.accent, fontSize: typography.sizeXs},
	body: {padding: spacing.md, gap: spacing.md},
	sectionTitle: {fontSize: typography.sizeXs, color: colors.textFaint, fontWeight: typography.weightBold, textTransform: 'uppercase', marginTop: spacing.sm},
	error: {fontSize: typography.sizeSm, color: colors.danger},
});
