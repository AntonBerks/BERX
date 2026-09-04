/**
 * There is one business dashboard, and it is
 * apps/mobile/src/screens/BusinessDashboardScreen.tsx (BERX-291).
 *
 * This file used to be a second, unrouted "design reference" copy of
 * the same screen — same three API calls, different styling, drifting
 * quietly alongside the real one. The v9 pass folded its intent into
 * the routed screen, so this is now a re-export rather than a
 * duplicate: existing imports keep working and there is only one
 * implementation to keep honest.
 */
export {default} from '../BusinessDashboardScreen';
export type {BusinessDashboardScreenProps} from '../BusinessDashboardScreen';
