/**
 * Turning a real failure into the right screen state.
 *
 * The archive lists unauthorized and permission-denied alongside
 * error, and BERX's API distinguishes them for real: `BerxApiError`
 * carries the HTTP status and the server's own error code. Screens
 * were collapsing all of it into `error`, so "your session expired"
 * and "you are not allowed to see this" and "the server is down" all
 * produced the same unhelpful message and the same useless Retry.
 *
 * The seven states the scene contract defines stay seven — inventing
 * an eighth would break every contract. What changes is that the
 * boundary is now told *why*, so it can say something true and offer
 * the action that actually helps: sign in again, go back, or retry.
 */
import {BerxApiError} from '@berx/core';
import type {BerxScreenState} from '@berx/spatial';

export type BerxFailureKind = 'unauthorized' | 'forbidden' | 'notFound' | 'rateLimited' | 'offline' | 'server' | 'unknown';

export interface BerxFailure {
	kind: BerxFailureKind;
	/** The state the screen should render. */
	state: BerxScreenState;
	/** What to tell the user. The server's own message when it gave a usable one. */
	message: string;
	/** False where retrying cannot possibly help. */
	retryable: boolean;
}

const MESSAGE: Record<BerxFailureKind, string> = {
	unauthorized: 'Сессия истекла. Войдите снова.',
	forbidden: 'У вас нет доступа к этому.',
	notFound: 'Это больше не существует или было удалено.',
	rateLimited: 'Слишком часто. Подождите немного и попробуйте снова.',
	offline: 'Нет соединения.',
	server: 'BERX временно недоступен.',
	unknown: 'Не удалось выполнить запрос.',
};

/**
 * `offline` is passed in rather than inferred: a fetch that failed
 * while the device is genuinely offline is an offline state, and the
 * same fetch failing on a working connection is a server problem. The
 * difference matters to the person reading it.
 */
export function classifyFailure(error: unknown, offline = false): BerxFailure {
	if (offline) {
		return {kind: 'offline', state: 'offline', message: MESSAGE.offline, retryable: true};
	}

	if (error instanceof BerxApiError) {
		const kind: BerxFailureKind =
			error.status === 401
				? 'unauthorized'
				: error.status === 403
					? 'forbidden'
					: error.status === 404
						? 'notFound'
						: error.status === 429
							? 'rateLimited'
							: error.status >= 500
								? 'server'
								: 'unknown';
		return {
			kind,
			/**
			 * Forbidden renders as `disabled`, not `error`: the screen is
			 * working correctly and the action simply is not available to
			 * this person. A retry button there is a lie.
			 */
			state: kind === 'forbidden' ? 'disabled' : 'error',
			/* the server's own message wins when it gave one worth showing */
			message: error.message && error.message !== error.code ? error.message : MESSAGE[kind],
			retryable: kind !== 'forbidden' && kind !== 'notFound',
		};
	}

	return {
		kind: 'unknown',
		state: 'error',
		message: error instanceof Error && error.message ? error.message : MESSAGE.unknown,
		retryable: true,
	};
}
