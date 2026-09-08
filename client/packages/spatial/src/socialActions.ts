/** BERX MAX 5D — semantic social affordances.
 *
 * The runtime owns spatial intent, not server truth. UI controls resolve to
 * semantic commands; the domain/API layer decides whether a command is
 * allowed and persists the result. This prevents fake likes, follows,
 * bookings, payments or messages while allowing every social control to be
 * represented spatially.
 */

export type BerxSocialAction =
  | 'open'
  | 'focus'
  | 'back'
  | 'like'
  | 'unlike'
  | 'comment'
  | 'reply'
  | 'share'
  | 'save'
  | 'unsave'
  | 'follow'
  | 'unfollow'
  | 'message'
  | 'view-profile'
  | 'view-media'
  | 'view-place'
  | 'view-event'
  | 'view-experience'
  | 'view-community'
  | 'view-business'
  | 'join'
  | 'leave'
  | 'attend'
  | 'unattend'
  | 'reserve'
  | 'directions'
  | 'check-in'
  | 'create-moment'
  | 'create-story'
  | 'create-post'
  | 'create-event'
  | 'create-community'
  | 'send-message'
  | 'react'
  | 'report'
  | 'block'
  | 'mute'
  | 'more';

/**
 * What an affordance is doing right now.
 *
 * `focus` is the keyboard's: the one affordance Enter would activate.
 * It is a state rather than a flag on the side because the ring is
 * built from these, so marking it here is what puts a focus ring in the
 * WORLD instead of a browser outline around a canvas.
 *
 * Only states something actually produces AND something actually shows
 * are listed. An enum value nothing assigns is a promise the product
 * does not keep.
 */
export type BerxSocialActionState =
	/* offered and at rest */
	| 'available'
	/* the keyboard is on it */
	| 'focus'
	/* a pointer is over it */
	| 'hover'
	/* a pointer is near it, but not on it */
	| 'proximity'
	/* held down */
	| 'press'
	/* asked for; the server has not answered */
	| 'pending'
	/* the server confirmed it */
	| 'success'
	/* the server refused it, and the world is unchanged */
	| 'failure'
	/* the domain offers it here; this viewer cannot use it */
	| 'disabled'
	/* not to be seen, and therefore not to be touched */
	| 'hidden';

/**
 * The states a person can act on. Everything else is refused.
 *
 * Written as a set rather than as `!== 'disabled'` so that adding a
 * state cannot silently make it activatable — a new state is refused
 * until someone decides otherwise here.
 */
export const BERX_ACTIVATABLE_STATES: readonly BerxSocialActionState[] = [
	'available', 'focus', 'hover', 'proximity',
	/* A PRESS IS HOW A POINTER ACTIVATES. Leaving it out made a finger
	   set `press` on the way down and then be refused on the way up,
	   which is a state machine forbidding the gesture it exists to
	   describe. */
	'press',
];

export function berxCanActivate(state: BerxSocialActionState): boolean {
	return BERX_ACTIVATABLE_STATES.includes(state);
}

export interface BerxSpatialAffordance {
  id: string;
  objectId: string;
  action: BerxSocialAction;
  state: BerxSocialActionState;
  label: string;
  accessibilityLabel: string;
  icon?: string;
  priority: number;
  requiresConfirmation?: boolean;
  serverRequired?: boolean;
}

export interface BerxSpatialIntent {
  affordanceId: string;
  objectId: string;
  action: BerxSocialAction;
  issuedAt: number;
}

export interface BerxSocialActionAdapter {
  dispatch(intent: BerxSpatialIntent): void | Promise<void>;
}

export class BerxSpatialAffordanceRegistry {
  private readonly affordances = new Map<string, BerxSpatialAffordance>();

  upsert(affordance: BerxSpatialAffordance): void {
    this.affordances.set(affordance.id, { ...affordance });
  }

  remove(id: string): void {
    this.affordances.delete(id);
  }

  forObject(objectId: string): BerxSpatialAffordance[] {
    return [...this.affordances.values()]
      .filter((item) => item.objectId === objectId && item.state !== 'hidden')
      .sort((a, b) => b.priority - a.priority);
  }

  get(id: string): BerxSpatialAffordance | undefined {
    const value = this.affordances.get(id);
    return value ? { ...value } : undefined;
  }

  clearObject(objectId: string): void {
    for (const [id, item] of this.affordances) {
      if (item.objectId === objectId) this.affordances.delete(id);
    }
  }

  snapshot(): BerxSpatialAffordance[] {
    return [...this.affordances.values()].map((item) => ({ ...item }));
  }
}

export const createSpatialIntent = (affordance: BerxSpatialAffordance, now = Date.now()): BerxSpatialIntent => ({
  affordanceId: affordance.id,
  objectId: affordance.objectId,
  action: affordance.action,
  issuedAt: now,
});
