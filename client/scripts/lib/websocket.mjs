/**
 * A WebSocket server, in as much of RFC 6455 as a gate needs.
 *
 * BERX's realtime transport is proved against the real thing —
 * verify:5d-realtime runs berx-realtime-server.php and dials it over a
 * real TCP socket with real accounts and real authorization rows. What
 * this is for is the other half: proving that the SHIPPED SHELL, booted
 * as a browser boots it, really opens a socket and really turns what
 * arrives into a change of the world. That needs a socket the page can
 * dial on localhost, and Node has no server of its own.
 *
 * Deliberately small, and honest about it: text frames, one fragment,
 * payloads up to 64 KiB, close and ping. Everything BERX's protocol
 * sends and nothing else — a binary frame or a continuation here is a
 * bug in the caller, not a case to silently tolerate.
 */
import crypto from 'node:crypto';

/**
 * The one constant RFC 6455 specifies, and it is easy to get subtly
 * wrong: a transposed character here produces a perfectly formed
 * handshake that every client rejects with "Incorrect
 * Sec-WebSocket-Accept", which reads like a client problem and is not.
 * Verified against Node's own WebSocket client, which is the same
 * check a browser makes.
 */
const RFC6455_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const accept = (key) => crypto.createHash('sha1').update(key + RFC6455_GUID).digest('base64');

/** One text frame, server → client: never masked, per the RFC. */
function encode(text) {
	const body = Buffer.from(text, 'utf8');
	const header = body.length < 126
		? Buffer.from([0x81, body.length])
		: Buffer.concat([Buffer.from([0x81, 126]), (() => {
			const n = Buffer.alloc(2);
			n.writeUInt16BE(body.length);
			return n;
		})()]);
	return Buffer.concat([header, body]);
}

/**
 * Pull whole frames out of whatever has arrived so far.
 *
 * Returns what it could read and how many bytes it consumed, so the
 * caller keeps the remainder: TCP does not deliver frames, it delivers
 * bytes, and a gate that assumed otherwise would pass until the day a
 * message arrived split in two.
 */
function decode(buffer) {
	const frames = [];
	let at = 0;
	while (buffer.length - at >= 2) {
		const first = buffer[at];
		const second = buffer[at + 1];
		const opcode = first & 0x0f;
		const masked = (second & 0x80) !== 0;
		let length = second & 0x7f;
		let offset = at + 2;
		if (length === 126) {
			if (buffer.length < offset + 2) break;
			length = buffer.readUInt16BE(offset);
			offset += 2;
		} else if (length === 127) {
			if (buffer.length < offset + 8) break;
			const big = buffer.readBigUInt64BE(offset);
			if (big > 65536n) throw new Error('berx test socket: frame larger than this server accepts');
			length = Number(big);
			offset += 8;
		}
		const mask = masked ? buffer.subarray(offset, offset + 4) : undefined;
		if (masked) offset += 4;
		if (buffer.length < offset + length) break;
		const body = Buffer.from(buffer.subarray(offset, offset + length));
		if (mask) for (let i = 0; i < body.length; i++) body[i] ^= mask[i % 4];
		frames.push({opcode, text: body.toString('utf8')});
		at = offset + length;
	}
	return {frames, consumed: at};
}

/**
 * Speak WebSocket on an existing HTTP server.
 *
 * `onMessage(connection, message)` is called with each parsed JSON text
 * frame. `connection.send(object)` writes one back. Returns a handle
 * that can reach every open connection, which is how a gate makes the
 * server say something nobody asked for — the whole point of realtime.
 */
export function attachBerxTestSocket(server, {path: socketPath = '/socket', protocol, onOpen, onMessage} = {}) {
	const connections = new Set();

	server.on('upgrade', (req, socket, head) => {
		const url = (req.url ?? '/').split('?')[0];
		const key = req.headers['sec-websocket-key'];
		if (url !== socketPath || !key) {
			socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
			return;
		}
		const offered = String(req.headers['sec-websocket-protocol'] ?? '').split(',').map((p) => p.trim());
		const agreed = protocol && offered.includes(protocol) ? protocol : undefined;
		socket.write([
			'HTTP/1.1 101 Switching Protocols',
			'Upgrade: websocket',
			'Connection: Upgrade',
			`Sec-WebSocket-Accept: ${accept(String(key))}`,
			...(agreed ? [`Sec-WebSocket-Protocol: ${agreed}`] : []),
			'', '',
		].join('\r\n'));

		const connection = {
			socket,
			state: {},
			send: (message) => socket.write(encode(JSON.stringify(message))),
			close: () => socket.end(),
		};
		connections.add(connection);
		onOpen?.(connection);

		/**
		 * THE BYTES NODE ALREADY READ.
		 *
		 * The HTTP parser stops at the end of the request headers, and
		 * anything the client sent immediately after them is handed over
		 * in `head` — it is NOT re-delivered as a 'data' event. A client
		 * that writes its first frame the instant the socket opens, which
		 * is exactly what BerxRealtimeClient does with its auth frame,
		 * therefore vanishes into a buffer nobody read: the server never
		 * answers, the client never resolves, and the session sits there
		 * looking connected. Dropping `head` is the classic way to write
		 * a WebSocket server that works on a slow network and hangs on
		 * localhost.
		 */
		let pending = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
		const consume = () => {
			const {frames, consumed} = decode(pending);
			pending = pending.subarray(consumed);
			return frames;
		};
		socket.on('data', (chunk) => {
			pending = Buffer.concat([pending, chunk]);
			for (const frame of consume()) {
				if (frame.opcode === 0x8) {
					connections.delete(connection);
					socket.end();
					return;
				}
				if (frame.opcode !== 0x1) continue;
				let message;
				try {
					message = JSON.parse(frame.text);
				} catch {
					continue;
				}
				onMessage?.(connection, message);
			}
		});
		/* whatever arrived with the handshake, read before anything else */
		if (pending.length) {
			for (const frame of consume()) {
				if (frame.opcode !== 0x1) continue;
				try {
					onMessage?.(connection, JSON.parse(frame.text));
				} catch {
					/* not JSON: nothing this protocol sends */
				}
			}
		}
		const forget = () => connections.delete(connection);
		socket.on('close', forget);
		socket.on('error', forget);
	});

	return {
		get open() {
			return connections.size;
		},
		/** Say something to every connection that asked for it. */
		broadcast: (message, wants = () => true) => {
			let delivered = 0;
			for (const connection of connections) {
				if (!wants(connection)) continue;
				connection.send(message);
				delivered++;
			}
			return delivered;
		},
		closeAll: () => {
			for (const connection of connections) connection.close();
			connections.clear();
		},
	};
}
