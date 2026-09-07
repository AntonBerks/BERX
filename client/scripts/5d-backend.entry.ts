/**
 * Node entry for the backend verification.
 *
 * Drives the real BERX API client — the same `BerxApiClient` every
 * BERX surface uses, unmodified — against a real OSSN server on a real
 * MySQL database. That is the point: a gate that spoke HTTP itself
 * would verify a server against a second, hand-written client, and the
 * thing that actually has to hold is that *this* client and *that*
 * server agree.
 */
import {BerxApiClient} from '@berx/api/client';
import type {BerxTokenStorage} from '@berx/core';

const base = process.argv[2];
const command = process.argv[3];
if (!base || !command) {
	console.error('usage: 5d-backend.entry <base-url> <command> [args...]');
	process.exit(2);
}

/** Tokens in memory: a verification process is its own device. */
function storage(): BerxTokenStorage & {token?: string} {
	let token: string | undefined;
	return {
		get token() {
			return token;
		},
		async getToken() {
			return token ?? null;
		},
		async setToken(next: string | null) {
			token = next ?? undefined;
		},
	};
}

const out = (value: unknown) => {
	console.log(JSON.stringify(value));
};

async function main(): Promise<void> {
	const store = storage();
	const client = new BerxApiClient(base, store);
	const args = process.argv.slice(4);

	switch (command) {
		case 'register': {
			const [username, firstname, lastname, email, password] = args;
			await client.register({username, firstname, lastname, email, password});
			out({registered: username});
			return;
		}
		case 'login': {
			const [identifier, password] = args;
			const session = await client.login(identifier, password, 'berx-verify');
			out({token: session.token, guid: session.user_guid, expiresAt: session.expires_at});
			return;
		}
		case 'session': {
			/* Everything a real session does, in the order a client does
			   it — each step named, so a failure says which call the
			   server answered wrongly rather than only that one did. */
			const [identifier, password, text] = args;
			const step = async <T>(name: string, run: () => Promise<T>): Promise<T> => {
				try {
					return await run();
				} catch (error) {
					(error as {step?: string}).step = name;
					throw error;
				}
			};
			const session = await step('login', () => client.login(identifier, password, 'berx-verify'));
			const me = await step('me', () => client.me());
			const created = await step('createPost', () => client.createPost(text));
			const feed = await step('feed', () => client.feed(20, 0));
			out({
				token: session.token,
				guid: session.user_guid,
				me: {guid: me.guid, username: me.username},
				created,
				feed: feed.items.map((p) => ({guid: p.guid, text: p.text, owner: p.owner_guid})),
			});
			return;
		}
		case 'feed-with-token': {
			const [token] = args;
			await store.setToken(token);
			const feed = await client.feed(20, 0);
			out({posts: feed.items.map((p) => ({guid: p.guid, text: p.text, owner: p.owner_guid}))});
			return;
		}
		case 'me-with-token': {
			const [token] = args;
			await store.setToken(token);
			const me = await client.me();
			out({guid: me.guid, username: me.username, email: me.email});
			return;
		}
		case 'logout-with-token': {
			const [token] = args;
			await store.setToken(token);
			await client.logout();
			out({loggedOut: true});
			return;
		}
		default:
			console.error(`5d-backend.entry: unknown command ${command}`);
			process.exit(2);
	}
}

main().catch((error) => {
	/* a failure is reported as data, so the gate can assert on the real
	   status and code the server sent rather than on a stack trace */
	const status = (error as {status?: number}).status;
	const body = (error as {body?: unknown}).body;
	out({
		failed: true,
		step: (error as {step?: string}).step ?? null,
		status: status ?? null,
		body: body ?? String(error),
		message: String(error?.message ?? error),
	});
});
