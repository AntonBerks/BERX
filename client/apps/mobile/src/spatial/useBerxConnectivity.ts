/**
 * Real connectivity, so the `offline` state can actually happen.
 *
 * The archive requires an offline state on every applicable screen and
 * the seven-state boundary has always rendered one — cached data plus
 * an indicator, never a silent pretence of being live. Nothing ever
 * put a screen into it, because nothing was watching the network.
 *
 * `@react-native-community/netinfo` reports two different facts and
 * BERX cares about the stricter one: `isConnected` says a network
 * exists, `isInternetReachable` says it actually goes somewhere. A
 * captive-portal wifi is connected and useless, so a screen is treated
 * as offline when reachability is explicitly false. Reachability is
 * null while it is still being determined, and that is deliberately
 * not treated as offline — flashing an offline banner during the first
 * second of every launch would train people to ignore it.
 */
import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface BerxConnectivity {
	/** A network interface is up. */
	connected: boolean;
	/** The network actually reaches the internet. Null while undetermined. */
	reachable: boolean | null;
	/** What a screen should act on: known to be unusable. */
	offline: boolean;
	/** 'wifi', 'cellular', 'none'… — real, for the offline explanation. */
	type: string;
}

export function useBerxConnectivity(): BerxConnectivity {
	const [state, setState] = useState<BerxConnectivity>({
		connected: true,
		reachable: null,
		offline: false,
		type: 'unknown',
	});

	useEffect(() => {
		const apply = (s: {isConnected: boolean | null; isInternetReachable: boolean | null; type: string}) => {
			const connected = s.isConnected !== false;
			const reachable = s.isInternetReachable;
			setState({
				connected,
				reachable,
				/* only a definite answer counts; null means "still asking" */
				offline: !connected || reachable === false,
				type: s.type,
			});
		};

		NetInfo.fetch().then(apply).catch(() => undefined);
		return NetInfo.addEventListener(apply);
	}, []);

	return state;
}
