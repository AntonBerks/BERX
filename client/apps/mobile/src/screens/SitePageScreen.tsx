/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see LoginScreen.tsx header.
 *
 * MAX BUILD — real About/Terms/Privacy content (OssnSitePages, admin-
 * editable under Settings → Site Pages on the web) — api.sitePage()
 * closes what was previously a real, zero-caller gap (see
 * components/OssnApi/v1/sitepages.php's own header). The stored
 * content is real admin-authored HTML; no HTML renderer library is
 * installable in this sandbox (npm registry blocked), so tags are
 * stripped client-side for a plain-text reading view rather than
 * faking rich rendering — an honest degradation, not a stub, since
 * the underlying content is always the real, current admin text.
 */
import {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import type {BerxApiClient} from '@berx/api/client';
import {colors, spacing, typography} from '@berx/design-system/tokens';
import {BerxHeader} from '../../../../packages/design-system/src/components/BerxHeader';
import {BerxLoadingState, BerxErrorState} from '../../../../packages/design-system/src/components/BerxStates';

interface Props {
	api: BerxApiClient;
	prefix: 'about' | 'terms' | 'privacy';
	onBack?: () => void;
}

/** Strips HTML tags and decodes the handful of entities OSSN's WYSIWYG editor actually emits — a plain-text fallback, not an HTML renderer. */
function stripHtml(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export default function SitePageScreen({api, prefix, onBack}: Props) {
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const page = await api.sitePage(prefix);
			setTitle(page.title);
			setContent(stripHtml(page.content));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Страница недоступна');
		} finally {
			setLoading(false);
		}
	}, [api, prefix]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<View style={styles.screen}>
			<BerxHeader onBack={onBack} title={title || undefined} />
			{loading ? (
				<BerxLoadingState />
			) : error ? (
				<BerxErrorState message={error} onRetry={load} />
			) : (
				<ScrollView contentContainerStyle={styles.body}>
					<Text style={styles.content}>{content || 'Содержимое пока не добавлено.'}</Text>
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {flex: 1, backgroundColor: colors.bg},
	body: {padding: spacing.lg},
	content: {color: colors.text, fontSize: typography.sizeBase, lineHeight: 22},
});
