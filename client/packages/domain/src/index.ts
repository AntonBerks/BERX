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
 * Russian plural agreement, in one place.
 *
 * Russian has three forms where English has two, and the split is not
 * singular-vs-plural: 1 takes one form, 2–4 take a second, 5–20 and
 * everything ending in 0 or 5–9 take a third, and the teens are an
 * exception to all of it. Six screens had each written their own
 * two-branch version of this, so every count from 2 to 4 printed the
 * wrong word — "2 отзывов", "3 участников", "2 дней подряд". Nobody
 * reads that as a rendering bug; they read it as an app that was not
 * finished.
 *
 * Pure, no I/O, and the same arithmetic every caller was approximating:
 *
 *   berxPlural(2, 'отзыв', 'отзыва', 'отзывов') === 'отзыва'
 */
export function berxPlural(count: number, one: string, few: string, many: string): string {
	const n = Math.abs(Math.trunc(count));
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod10 === 1 && mod100 !== 11) return one;
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
	return many;
}

/** The count and its agreeing word: `berxCount(3, 'отзыв', 'отзыва', 'отзывов')` → "3 отзыва". */
export function berxCount(count: number, one: string, few: string, many: string): string {
	return `${count} ${berxPlural(count, one, few, many)}`;
}

/**
 * When a thing happens, including when it ends.
 *
 * BERX stores an end time on events and on experiences, and every
 * screen showed only the start — so a concert read as "14 июня ·
 * 19:00" and said nothing about whether it finished at nine or at
 * three in the morning. That is a real fact the server already
 * returns, and it is usually the one that decides whether someone
 * goes.
 *
 * The end is omitted when there isn't one, rather than guessed at:
 * `ends` is nullable in the API and an event with no recorded end is
 * different from one that ends at midnight. When start and end fall
 * on the same day the date is said once — "14 июня · 19:00 – 23:00" —
 * and when they do not, both dates are, because an event that runs
 * past midnight is a different plan from one that does not.
 */
export function berxWhenRange(
	startUnix: number,
	endUnix?: number | null,
	locale = 'ru-RU',
): string {
	const start = new Date(startUnix * 1000);
	const dayFmt: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'long'};
	const timeFmt: Intl.DateTimeFormatOptions = {hour: '2-digit', minute: '2-digit'};
	const startDay = start.toLocaleDateString(locale, dayFmt);
	const startTime = start.toLocaleTimeString(locale, timeFmt);

	if (endUnix === undefined || endUnix === null || endUnix <= startUnix) {
		return `${startDay} · ${startTime}`;
	}

	const end = new Date(endUnix * 1000);
	const endDay = end.toLocaleDateString(locale, dayFmt);
	const endTime = end.toLocaleTimeString(locale, timeFmt);

	return startDay === endDay
		? `${startDay} · ${startTime} – ${endTime}`
		: `${startDay}, ${startTime} – ${endDay}, ${endTime}`;
}
