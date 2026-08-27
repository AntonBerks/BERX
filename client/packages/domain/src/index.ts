/**
 * BERX Domain — the models features/screens actually work with.
 *
 * Deliberately thin: for endpoints whose API DTO already IS the
 * right shape for UI use (most of them, this early), the domain type
 * is a re-export, not a hand-duplicated parallel interface — the
 * instruction against "duplicate types" applies here too. Where a
 * domain type genuinely differs from the wire shape (adds a computed
 * display field, merges two DTOs), that's called out explicitly in a
 * comment so it's clear which fields are real API data and which are
 * derived.
 */
import type {
	BerxUser,
	BerxFeedItem,
	BerxPostDetail,
	BerxConversationSummary,
	BerxMessage,
	BerxDatingProfileCard,
	BerxDatingMatch,
	BerxNotification,
	BerxStorySummary,
	BerxStoryFeedGroup,
} from '@berx/api/types';

export type User = BerxUser;
export type Post = BerxFeedItem | BerxPostDetail;
export type Conversation = BerxConversationSummary;
export type Message = BerxMessage;
export type DatingProfile = BerxDatingProfileCard;
export type Match = BerxDatingMatch;
export type Notification = BerxNotification;
export type Story = BerxStorySummary;
export type StoryFeedGroup = BerxStoryFeedGroup;

/**
 * Comment and Like are NOT separate domain types yet — the real API
 * (posts/{id}/like, posts/{id}/comments) only returns {status:
 * string} on write, with no read-back list endpoint for either. A
 * Comment/Like domain model describing data the API can't actually
 * return yet would be exactly the kind of speculative type this
 * project has avoided all session — added the same day
 * GET /posts/{id}/comments (or similar) actually exists.
 */

/**
 * Derived, not wire data: a display-ready relative-time label. Pure
 * function, no I/O, safe to unit test without any API/runtime
 * dependency — this is the kind of thing that belongs in domain/
 * rather than duplicated per-screen.
 */
export function relativeTimeLabel(unixSeconds: number, nowMs: number = Date.now()): string {
	const diffSeconds = Math.max(0, Math.floor(nowMs / 1000) - unixSeconds);
	if (diffSeconds < 60) return 'только что';
	const diffMinutes = Math.floor(diffSeconds / 60);
	if (diffMinutes < 60) return `${diffMinutes} мин назад`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours} ч назад`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays} дн назад`;
	const date = new Date(unixSeconds * 1000);
	return date.toLocaleDateString('ru-RU');
}

/**
 * Real Russian plural-form selection (1/2-4/5-20 + exceptions) — used
 * wherever a live count (distinct_actors, viewer_count, etc.) needs a
 * correctly-declined noun next to it. Pure function, same rationale as
 * relativeTimeLabel above.
 */
export function ruPlural(n: number, one: string, few: string, many: string): string {
	const abs = Math.abs(n) % 100;
	const last = abs % 10;
	if (abs >= 11 && abs <= 14) return many;
	if (last === 1) return one;
	if (last >= 2 && last <= 4) return few;
	return many;
}

/** "1 человек" / "3 человека" / "5 человек" — real distinct-actor counts from OssnSignals::distinctActors(). */
export function ruPeopleLabel(n: number): string {
	return `${n} ${ruPlural(n, 'человек', 'человека', 'человек')}`;
}
