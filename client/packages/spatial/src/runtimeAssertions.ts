/** BERX 5D executable invariants. These validate spatial truth, not screenshots. */
import { Berx5DRuntime } from './runtime5d';
import { BerxSpatialWorld } from './world';
import { BerxSpatialCamera } from './spatialCamera';

const person = {
  id: 'person:test',
  kind: 'person' as const,
  sourceId: 'test',
  transform: {
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  material: { material: 'pearl', emissive: 0, roughness: 0.3, metalness: 0.2, opacity: 1, transmission: 0 },
  visible: true,
  interactive: true,
  focusable: true,
  energy: 0,
  depth: 3,
  createdAt: 0,
  updatedAt: 0,
};

export function assertBerx5DRuntimeInvariants(): void {
  const runtime = new Berx5DRuntime({ transitionDuration: 0.01 });
  runtime.registerObject(person);
  const initial = runtime.worldState.camera;
  if (!runtime.focus(person.id)) throw new Error('5D invariant: focus target was not registered');
  runtime.frame(0.02);
  if (runtime.worldState.focusObjectId !== person.id) throw new Error('5D invariant: focus identity was not retained');

  runtime.enterWorld({ id: 'detail', sourceRoute: '/profile/test', focusObjectId: person.id });
  runtime.frame(0.02);
  if (!runtime.canGoBack) throw new Error('5D invariant: world history was not retained');
  if (!runtime.back()) throw new Error('5D invariant: back navigation did not restore world');
  runtime.frame(0.02);

  const restored = runtime.worldState.camera;
  if (Math.abs(restored.position.z - initial.position.z) > 2) throw new Error('5D invariant: back camera drifted beyond expected tolerance');
  if (!runtime.latestFrame.world.objects.some((object) => object.id === person.id)) throw new Error('5D invariant: world object was lost');

  const world = new BerxSpatialWorld();
  const camera = new BerxSpatialCamera();
  if (!world || !camera) throw new Error('5D invariant: spatial primitives failed to construct');
}
