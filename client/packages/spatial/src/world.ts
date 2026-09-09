/**
 * BERX MAX 5D — persistent spatial world graph.
 *
 * The product is not modelled as a stack of flat screens. Real social
 * entities become persistent spatial objects with stable identities,
 * world coordinates and relationships. Renderers may project this state
 * into WebGL/Native GPU scenes without changing the domain model.
 */

import type {BerxEntityTime} from './temporal';

export type BerxSpatialEntityKind =
  | 'person'
  | 'moment'
  | 'place'
  | 'event'
  | 'experience'
  | 'community'
  | 'business'
  | 'collection'
  | 'message'
  | 'create';

export interface BerxVec3 {
  x: number;
  y: number;
  z: number;
}

export interface BerxEuler3 {
  x: number;
  y: number;
  z: number;
}

export interface BerxSpatialTransform {
  position: BerxVec3;
  rotation: BerxEuler3;
  scale: BerxVec3;
}

export interface BerxSpatialMaterialState {
  material: string;
  emissive: number;
  roughness: number;
  metalness: number;
  opacity: number;
  transmission: number;
}

/**
 * WHERE A THING REALLY IS, when the server knows.
 *
 * A place is somewhere. A person may be somewhere. Carried on the
 * object so the world can stand them where they are instead of only
 * where their relations put them — and OPTIONAL, because most entities
 * have no coordinates and inventing one would be inventing a fact.
 * `accuracyM` is the provider's own reported uncertainty in metres,
 * never a guess: absent means the provider did not say.
 */
export interface BerxSpatialGeoAnchor {
  lat: number;
  lng: number;
  accuracyM?: number;
}

export interface BerxSpatialObject {
  id: string;
  kind: BerxSpatialEntityKind;
  /**
   * The real-world coordinate the server gave for this entity, if it
   * gave one. No coordinate means no geographic claim: the entity
   * stands where the relational layout puts it, exactly as before.
   */
  geo?: BerxSpatialGeoAnchor;
  /**
   * Where this entity sits in time, from the server's own timestamps.
   * Absent for things that do not stop existing — a person, a place —
   * which the temporal projection reads as timeless rather than as
   * having happened at zero.
   */
  time?: BerxEntityTime;
  /**
   * What this object is called, for anyone who is not looking at it.
   * A world that can only be understood by seeing it is not one the
   * whole product can reach, so the name travels with the object
   * rather than being reconstructed by whatever happens to render it.
   */
  label?: string;
  sourceId?: string;
  parentId?: string;
  transform: BerxSpatialTransform;
  material: BerxSpatialMaterialState;
  visible: boolean;
  interactive: boolean;
  focusable: boolean;
  energy: number;
  depth: number;
  createdAt: number;
  updatedAt: number;
}

export interface BerxSpatialRelation {
  id: string;
  from: string;
  to: string;
  type: 'contains' | 'related' | 'located-at' | 'created-by' | 'attending' | 'shares' | 'messages';
  strength: number;
}

export interface BerxSpatialWorldSnapshot {
  objects: BerxSpatialObject[];
  relations: BerxSpatialRelation[];
  activeObjectId?: string;
  worldTime: number;
}

const copyVec3 = (v: BerxVec3): BerxVec3 => ({ ...v });
const copyEuler = (v: BerxEuler3): BerxEuler3 => ({ ...v });

export class BerxSpatialWorld {
  private readonly objects = new Map<string, BerxSpatialObject>();
  private readonly relations = new Map<string, BerxSpatialRelation>();
  private activeObjectId: string | undefined;
  private worldTime = 0;

  upsertObject(object: BerxSpatialObject): void {
    const now = Date.now();
    const existing = this.objects.get(object.id);
    this.objects.set(object.id, {
      ...object,
      createdAt: existing?.createdAt ?? object.createdAt ?? now,
      updatedAt: now,
      transform: {
        position: copyVec3(object.transform.position),
        rotation: copyEuler(object.transform.rotation),
        scale: copyVec3(object.transform.scale),
      },
      material: { ...object.material },
    });
  }

  removeObject(id: string): void {
    this.objects.delete(id);
    for (const [relationId, relation] of this.relations) {
      if (relation.from === id || relation.to === id) this.relations.delete(relationId);
    }
    if (this.activeObjectId === id) this.activeObjectId = undefined;
  }

  getObject(id: string): BerxSpatialObject | undefined {
    const object = this.objects.get(id);
    return object ? { ...object, transform: { position: copyVec3(object.transform.position), rotation: copyEuler(object.transform.rotation), scale: copyVec3(object.transform.scale) } } : undefined;
  }

  setActiveObject(id?: string): void {
    if (id !== undefined && !this.objects.has(id)) return;
    this.activeObjectId = id;
  }

  getActiveObject(): BerxSpatialObject | undefined {
    return this.activeObjectId ? this.getObject(this.activeObjectId) : undefined;
  }

  addRelation(relation: BerxSpatialRelation): void {
    if (!this.objects.has(relation.from) || !this.objects.has(relation.to)) return;
    this.relations.set(relation.id, { ...relation });
  }

  relatedTo(id: string): BerxSpatialObject[] {
    const ids = new Set<string>();
    for (const relation of this.relations.values()) {
      if (relation.from === id) ids.add(relation.to);
      if (relation.to === id) ids.add(relation.from);
    }
    return [...ids].map((objectId) => this.getObject(objectId)).filter(Boolean) as BerxSpatialObject[];
  }

  tick(deltaSeconds: number): void {
    this.worldTime += Math.max(0, deltaSeconds);
  }

  snapshot(): BerxSpatialWorldSnapshot {
    return {
      objects: [...this.objects.values()].map((object) => ({
        ...object,
        transform: {
          position: copyVec3(object.transform.position),
          rotation: copyEuler(object.transform.rotation),
          scale: copyVec3(object.transform.scale),
        },
        material: { ...object.material },
      })),
      relations: [...this.relations.values()].map((relation) => ({ ...relation })),
      activeObjectId: this.activeObjectId,
      worldTime: this.worldTime,
    };
  }

  restore(snapshot: BerxSpatialWorldSnapshot): void {
    this.objects.clear();
    this.relations.clear();
    for (const object of snapshot.objects) this.upsertObject(object);
    for (const relation of snapshot.relations) this.addRelation(relation);
    this.activeObjectId = snapshot.activeObjectId;
    this.worldTime = snapshot.worldTime;
  }
}
