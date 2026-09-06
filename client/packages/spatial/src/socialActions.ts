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

export type BerxSocialActionState = 'available' | 'disabled' | 'pending' | 'unavailable' | 'hidden';

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
