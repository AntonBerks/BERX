<?php
/**
 * BERX Realtime — the WebSocket server.
 *
 * WHY NOT RATCHET. This fork ships no composer.json and no vendor
 * tree: PHP dependencies are not part of how it is deployed. Writing
 * `use Ratchet\...` would produce a file that cannot run anywhere in
 * this repository, which is not a transport — it is a description of
 * one. RFC 6455 is a handshake, a four-byte mask and a length prefix;
 * the whole protocol is below, in the open, with nothing to install.
 *
 * WHAT IT IS. One process, one event loop (stream_select), no threads
 * and no fork. It holds NO policy of its own: every question about who
 * a socket is and what it may hear goes to OssnRealtime, which answers
 * from the same real rows the HTTP API uses. A bug here can drop a
 * message; it cannot invent a permission.
 *
 * PROTOCOL (subprotocol `berx-realtime-1`), JSON text frames:
 *   → {"type":"auth","token":"<from POST /api/v1/realtime/token>"}
 *   ← {"type":"auth:ok","user_guid":N} | {"type":"auth:error",...}
 *   → {"type":"subscribe","channels":["self:2","conversation:7"]}
 *   ← {"type":"subscribe:ok","granted":[...],"refused":[...]}
 *   → {"type":"publish","channel":"conversation:7","payload":{...}}
 *   ← (to every OTHER subscriber of that channel)
 *     {"type":"event","channel":...,"payload":...,"from":N,"ts":...}
 *   → {"type":"ping"}   ← {"type":"pong","ts":...}
 *
 * `from` is stamped by the server from the authenticated connection —
 * a client cannot attribute an event to anyone but itself — and a
 * publisher must itself be authorized for the channel it publishes to,
 * checked with the same call a subscriber is checked with.
 *
 * Usage:
 *   php berx-realtime-server.php [--host=127.0.0.1] [--port=8090]
 */

$options = getopt('', array('host::', 'port::', 'quiet::'));
$host  = isset($options['host']) && $options['host'] !== false ? $options['host'] : '127.0.0.1';
$port  = isset($options['port']) && $options['port'] !== false ? intval($options['port']) : 8090;
$quiet = isset($options['quiet']);

$root = dirname(__DIR__) . '/opensource-socialnetwork-master/';
if (!is_file($root . 'INSTALLED')) {
	fwrite(STDERR, "berx-realtime: OSSN is not installed\n");
	exit(2);
}

/* Same bridge berx-cli.php needs and for the same reason: OSSN reads
   its own site URL from the database, but several libraries still
   touch $_SERVER. */
$_SERVER['HTTP_HOST']      = $_SERVER['HTTP_HOST'] ?? '127.0.0.1';
$_SERVER['SERVER_NAME']    = $_SERVER['SERVER_NAME'] ?? '127.0.0.1';
$_SERVER['SERVER_PORT']    = $_SERVER['SERVER_PORT'] ?? '80';
$_SERVER['REQUEST_URI']    = $_SERVER['REQUEST_URI'] ?? '/';
$_SERVER['SCRIPT_NAME']    = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
$_SERVER['REMOTE_ADDR']    = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$_SERVER['REQUEST_METHOD'] = $_SERVER['REQUEST_METHOD'] ?? 'GET';

define('OSSN_ALLOW_SYSTEM_START', true);
require_once($root . 'system/start.php');

/* ------------------------------------------------------------------ */
/* RFC 6455                                                            */
/* ------------------------------------------------------------------ */

const BERX_WS_GUID       = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const BERX_WS_SUBPROTO   = 'berx-realtime-1';
/* One frame a client may send. Generous for a spatial payload, small
   enough that a socket cannot be used to buy unbounded server memory. */
const BERX_WS_MAX_FRAME  = 262144;
/* An unauthenticated socket is a stranger holding a file descriptor. */
const BERX_WS_AUTH_GRACE = 10;
const BERX_WS_MAX_CHANNELS = 64;

function berx_ws_log($line) {
	global $quiet;
	if (!$quiet) {
		fwrite(STDOUT, '[' . date('H:i:s') . '] ' . $line . "\n");
		fflush(STDOUT);
	}
}

/** Encode one server→client frame. Server frames are never masked. */
function berx_ws_encode($payload, $opcode = 0x1) {
	$length = strlen($payload);
	$head = chr(0x80 | $opcode);
	if ($length < 126) {
		$head .= chr($length);
	} elseif ($length < 65536) {
		$head .= chr(126) . pack('n', $length);
	} else {
		$head .= chr(127) . pack('J', $length);
	}
	return $head . $payload;
}

/**
 * Pull as many complete frames as the buffer holds.
 * Returns array('frames' => [[opcode, payload], ...], 'rest' => string)
 * or false when the peer broke the protocol.
 */
function berx_ws_decode(&$buffer) {
	$frames = array();
	while (true) {
		$length = strlen($buffer);
		if ($length < 2) {
			break;
		}
		$first  = ord($buffer[0]);
		$second = ord($buffer[1]);
		$opcode = $first & 0x0f;
		$masked = ($second & 0x80) !== 0;
		$len    = $second & 0x7f;
		$offset = 2;
		if ($len === 126) {
			if ($length < 4) {
				break;
			}
			$len = unpack('n', substr($buffer, 2, 2))[1];
			$offset = 4;
		} elseif ($len === 127) {
			if ($length < 10) {
				break;
			}
			$parts = unpack('J', substr($buffer, 2, 8));
			$len = $parts[1];
			$offset = 10;
		}
		/* RFC 6455 §5.1: every client frame MUST be masked, and an
		   oversized frame is refused before it is buffered rather than
		   after it is assembled. */
		if (!$masked || $len > BERX_WS_MAX_FRAME) {
			return false;
		}
		if ($length < $offset + 4 + $len) {
			break;
		}
		$mask = substr($buffer, $offset, 4);
		$data = substr($buffer, $offset + 4, $len);
		$out  = '';
		for ($i = 0; $i < $len; $i++) {
			$out .= $data[$i] ^ $mask[$i % 4];
		}
		$frames[] = array($opcode, $out);
		$buffer = substr($buffer, $offset + 4 + $len);
	}
	return array('frames' => $frames, 'rest' => $buffer);
}

/* ------------------------------------------------------------------ */
/* The loop                                                            */
/* ------------------------------------------------------------------ */

$errno = 0;
$errstr = '';
$listener = @stream_socket_server("tcp://{$host}:{$port}", $errno, $errstr);
if (!$listener) {
	fwrite(STDERR, "berx-realtime: cannot listen on {$host}:{$port} — {$errstr}\n");
	exit(1);
}
stream_set_blocking($listener, false);
berx_ws_log("listening on ws://{$host}:{$port} (" . BERX_WS_SUBPROTO . ')');

$realtime = new OssnRealtime();

/**
 * The loopback publish secret (upgrade/upgrades/1785172400.php).
 * Without it the BERX-PUBLISH branch below refuses everything, which
 * is the right failure: an unguarded fan-out port would let anything
 * that can reach the loopback interface speak as the server.
 */
/* OssnSite::getSettings(), not ossn_site_settings(): that helper only
   resolves OssnSite::reservedNames(), so a deployment setting read
   through it is always false — which would have silently disabled
   every server-originated publish. */
$publishSecret = (string) (new OssnSite())->getSettings('berx_realtime_secret');
if ($publishSecret === '') {
	berx_ws_log('WARNING: berx_realtime_secret is not set — server-originated publishes will be refused');
}

/** id => array(socket, buffer, handshaked, userGuid, channels, since) */
$clients = array();
$nextId  = 1;
$running = true;

if (function_exists('pcntl_signal')) {
	pcntl_async_signals(true);
	$stop = function () use (&$running) { $running = false; };
	pcntl_signal(SIGTERM, $stop);
	pcntl_signal(SIGINT, $stop);
}

function berx_ws_send($id, array $message) {
	global $clients;
	if (!isset($clients[$id])) {
		return;
	}
	@fwrite($clients[$id]['socket'], berx_ws_encode(json_encode($message, JSON_UNESCAPED_UNICODE)));
}

function berx_ws_drop($id, $reason = '') {
	global $clients;
	if (!isset($clients[$id])) {
		return;
	}
	@fclose($clients[$id]['socket']);
	unset($clients[$id]);
	berx_ws_log("closed #{$id}" . ($reason !== '' ? " — {$reason}" : ''));
}

while ($running) {
	$read = array($listener);
	foreach ($clients as $id => $client) {
		$read[] = $client['socket'];
	}
	$write = null;
	$except = null;
	/* One second, so an idle server still gets to expire sockets that
	   never authenticated. */
	if (@stream_select($read, $write, $except, 1) === false) {
		continue;
	}

	foreach ($read as $socket) {
		if ($socket === $listener) {
			$incoming = @stream_socket_accept($listener, 0);
			if ($incoming) {
				stream_set_blocking($incoming, false);
				$clients[$nextId] = array(
					'socket'     => $incoming,
					'buffer'     => '',
					'handshaked' => false,
					'userGuid'   => null,
					'channels'   => array(),
					'since'      => time(),
				);
				berx_ws_log("opened #{$nextId}");
				$nextId++;
			}
			continue;
		}

		$id = null;
		foreach ($clients as $candidate => $client) {
			if ($client['socket'] === $socket) {
				$id = $candidate;
				break;
			}
		}
		if ($id === null) {
			continue;
		}

		$chunk = @fread($socket, 8192);
		if ($chunk === '' || $chunk === false) {
			if (feof($socket)) {
				berx_ws_drop($id, 'peer closed');
			}
			continue;
		}
		$clients[$id]['buffer'] .= $chunk;

		/* ---- server-originated fan-out, over loopback ---- */
		if (!$clients[$id]['handshaked'] && strncmp($clients[$id]['buffer'], 'BERX-PUBLISH ', 13) === 0) {
			$newline = strpos($clients[$id]['buffer'], "\n");
			if ($newline === false) {
				if (strlen($clients[$id]['buffer']) > BERX_WS_MAX_FRAME) {
					berx_ws_drop($id, 'publish line too large');
				}
				continue;
			}
			$line = substr($clients[$id]['buffer'], 13, $newline - 13);
			$clients[$id]['buffer'] = '';
			$space = strpos($line, ' ');
			$offered = $space === false ? '' : substr($line, 0, $space);
			$body    = $space === false ? '' : substr($line, $space + 1);
			/* hash_equals, not ===: a timing-comparable secret is not a
			   secret, and this is the one door the server itself opens. */
			if ($publishSecret === '' || !hash_equals($publishSecret, $offered)) {
				@fwrite($socket, "REFUSED\n");
				berx_ws_drop($id, 'publish secret refused');
				continue;
			}
			$envelope = json_decode($body, true);
			$parsed = is_array($envelope) && isset($envelope['channel'])
				? OssnRealtime::parseChannel($envelope['channel'])
				: false;
			if (!$parsed) {
				@fwrite($socket, "BAD\n");
				berx_ws_drop($id, 'publish envelope rejected');
				continue;
			}
			/* No authorization check on the SENDER — it holds the
			   server's own secret, so it is the server. The RECEIVERS
			   are still filtered by what each of them was granted at
			   subscribe time, which is what actually protects the data. */
			$event = json_encode(array(
				'type'    => 'event',
				'channel' => $parsed['channel'],
				'payload' => isset($envelope['payload']) ? $envelope['payload'] : null,
				'from'    => isset($envelope['from']) ? intval($envelope['from']) : 0,
				'origin'  => 'server',
				'ts'      => time(),
			), JSON_UNESCAPED_UNICODE);
			$delivered = 0;
			foreach ($clients as $otherId => $other) {
				if ($other['userGuid'] === null || $otherId === $id) {
					continue;
				}
				if (in_array($parsed['channel'], $other['channels'], true)) {
					@fwrite($other['socket'], berx_ws_encode($event));
					$delivered++;
				}
			}
			@fwrite($socket, "OK {$delivered}\n");
			berx_ws_drop($id, "server publish to {$parsed['channel']} → {$delivered}");
			continue;
		}

		/* ---- handshake ---- */
		if (!$clients[$id]['handshaked']) {
			if (strlen($clients[$id]['buffer']) > 8192) {
				berx_ws_drop($id, 'handshake too large');
				continue;
			}
			$end = strpos($clients[$id]['buffer'], "\r\n\r\n");
			if ($end === false) {
				continue;
			}
			$headerText = substr($clients[$id]['buffer'], 0, $end);
			$clients[$id]['buffer'] = substr($clients[$id]['buffer'], $end + 4);
			$key = null;
			$version = null;
			foreach (explode("\r\n", $headerText) as $line) {
				if (stripos($line, 'Sec-WebSocket-Key:') === 0) {
					$key = trim(substr($line, 18));
				} elseif (stripos($line, 'Sec-WebSocket-Version:') === 0) {
					$version = trim(substr($line, 22));
				}
			}
			if (!$key || $version !== '13') {
				@fwrite($socket, "HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
				berx_ws_drop($id, 'bad handshake');
				continue;
			}
			$accept = base64_encode(sha1($key . BERX_WS_GUID, true));
			@fwrite($socket,
				"HTTP/1.1 101 Switching Protocols\r\n" .
				"Upgrade: websocket\r\n" .
				"Connection: Upgrade\r\n" .
				'Sec-WebSocket-Accept: ' . $accept . "\r\n" .
				'Sec-WebSocket-Protocol: ' . BERX_WS_SUBPROTO . "\r\n\r\n");
			$clients[$id]['handshaked'] = true;
			continue;
		}

		/* ---- frames ---- */
		$decoded = berx_ws_decode($clients[$id]['buffer']);
		if ($decoded === false) {
			berx_ws_drop($id, 'protocol violation');
			continue;
		}
		$clients[$id]['buffer'] = $decoded['rest'];

		foreach ($decoded['frames'] as $frame) {
			list($opcode, $payload) = $frame;
			if ($opcode === 0x8) {
				berx_ws_drop($id, 'close frame');
				break;
			}
			if ($opcode === 0x9) {
				@fwrite($socket, berx_ws_encode($payload, 0xA));
				continue;
			}
			if ($opcode !== 0x1) {
				continue;
			}
			$message = json_decode($payload, true);
			if (!is_array($message) || !isset($message['type'])) {
				berx_ws_send($id, array('type' => 'error', 'error' => 'malformed frame'));
				continue;
			}

			switch ($message['type']) {
				case 'ping':
					berx_ws_send($id, array('type' => 'pong', 'ts' => time()));
					break;

				case 'auth':
					if ($clients[$id]['userGuid'] !== null) {
						berx_ws_send($id, array('type' => 'auth:error', 'error' => 'already authenticated'));
						break;
					}
					$guid = $realtime->claimToken(isset($message['token']) ? $message['token'] : '');
					if (!$guid) {
						berx_ws_send($id, array('type' => 'auth:error', 'error' => 'invalid or expired token'));
						berx_ws_drop($id, 'auth failed');
						break 2;
					}
					$clients[$id]['userGuid'] = $guid;
					berx_ws_send($id, array('type' => 'auth:ok', 'user_guid' => $guid));
					berx_ws_log("authenticated #{$id} as {$guid}");
					break;

				case 'subscribe':
					if ($clients[$id]['userGuid'] === null) {
						berx_ws_send($id, array('type' => 'error', 'error' => 'not authenticated'));
						break;
					}
					$channels = isset($message['channels']) && is_array($message['channels']) ? $message['channels'] : array();
					if (count($channels) > BERX_WS_MAX_CHANNELS) {
						berx_ws_send($id, array('type' => 'error', 'error' => 'too many channels'));
						break;
					}
					$decision = $realtime->authorizeChannels($clients[$id]['userGuid'], $channels);
					foreach ($decision['granted'] as $channel) {
						if (!in_array($channel, $clients[$id]['channels'], true)) {
							$clients[$id]['channels'][] = $channel;
						}
					}
					berx_ws_send($id, array(
						'type'     => 'subscribe:ok',
						'granted'  => $decision['granted'],
						'refused'  => $decision['refused'],
					));
					break;

				case 'unsubscribe':
					$drop = isset($message['channels']) && is_array($message['channels']) ? $message['channels'] : array();
					$clients[$id]['channels'] = array_values(array_diff($clients[$id]['channels'], $drop));
					berx_ws_send($id, array('type' => 'unsubscribe:ok', 'channels' => $clients[$id]['channels']));
					break;

				case 'publish':
					if ($clients[$id]['userGuid'] === null) {
						berx_ws_send($id, array('type' => 'error', 'error' => 'not authenticated'));
						break;
					}
					$parsed = OssnRealtime::parseChannel(isset($message['channel']) ? $message['channel'] : '');
					if (!$parsed) {
						berx_ws_send($id, array('type' => 'error', 'error' => 'unknown channel'));
						break;
					}
					/* A publisher is authorized exactly the way a
					   subscriber is — same call, same rows. Being able to
					   hear a channel is what earns the right to speak on
					   it; nothing here is granted by having published
					   before. */
					if (!$realtime->authorizeChannel($clients[$id]['userGuid'], $parsed['channel'])) {
						berx_ws_send($id, array('type' => 'publish:refused', 'channel' => $parsed['channel']));
						break;
					}
					$event = json_encode(array(
						'type'    => 'event',
						'channel' => $parsed['channel'],
						'payload' => isset($message['payload']) ? $message['payload'] : null,
						'from'    => $clients[$id]['userGuid'],
						'ts'      => time(),
					), JSON_UNESCAPED_UNICODE);
					$delivered = 0;
					foreach ($clients as $otherId => $other) {
						if ($otherId === $id || $other['userGuid'] === null) {
							continue;
						}
						if (in_array($parsed['channel'], $other['channels'], true)) {
							@fwrite($other['socket'], berx_ws_encode($event));
							$delivered++;
						}
					}
					berx_ws_send($id, array(
						'type'      => 'publish:ok',
						'channel'   => $parsed['channel'],
						'delivered' => $delivered,
					));
					break;

				default:
					berx_ws_send($id, array('type' => 'error', 'error' => 'unknown type'));
			}
		}
	}

	/* A socket that connected and never said who it is does not get to
	   stay. */
	$now = time();
	foreach ($clients as $id => $client) {
		if ($client['userGuid'] === null && ($now - $client['since']) > BERX_WS_AUTH_GRACE) {
			berx_ws_drop($id, 'authentication grace expired');
		}
	}
}

foreach ($clients as $id => $client) {
	@fclose($client['socket']);
}
@fclose($listener);
berx_ws_log('stopped');
