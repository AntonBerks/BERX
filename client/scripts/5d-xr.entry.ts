/**
 * Node entry for the XR verification.
 *
 * Takes a headset's own eye poses — the kind ARKit, ARCore and OpenXR
 * report — through the shared world application, and writes the two
 * draw lists it resolves. Nothing about the stereo is decided by a
 * renderer: the interpupillary distance and the per-eye field of view
 * are the runtime's, and the world is the same world for both eyes.
 */
import fs from 'node:fs';
import {berxBuildDrawList, berxPoseIpd, type BerxXrViews} from '@berx/spatial';
import {BERX_CROSS_RENDERER_VIEWPORT, berxCrossRendererFrame} from '@berx/scenes';
import {Berx5DWorldApp, berxTemporalCursor} from '@berx/spatial';

const [leftOut, rightOut, reportOut] = process.argv.slice(2);
if (!leftOut || !rightOut || !reportOut) {
	console.error('usage: 5d-xr.entry <left.json> <right.json> <report.json>');
	process.exit(2);
}

/* A real headset's report: two eyes 63mm apart at eye height, each with
   its own optics. These are the numbers an OpenXR runtime hands over,
   not a constant BERX chose. */
const views: BerxXrViews = {
	left: {position: {x: -0.0315, y: 1.62, z: 4}, orientation: {x: 0, y: 0, z: 0, w: 1}, fovDegrees: 96},
	right: {position: {x: 0.0315, y: 1.62, z: 4}, orientation: {x: 0, y: 0, z: 0, w: 1}, fovDegrees: 96},
};

const frame = berxCrossRendererFrame();
/* the same world, driven by a world application that takes the pose */
const app = new Berx5DWorldApp({cursor: berxTemporalCursor(1_800_000_000), transitionDuration: 0.01});
for (const object of frame.world.objects) app.runtime.registerObject(object);
const cameras = app.setHeadViews(views);
if (!cameras?.right) {
	console.error('the shared core produced no second eye from a headset that reported one');
	process.exit(1);
}

const size = {width: BERX_CROSS_RENDERER_VIEWPORT.width, height: BERX_CROSS_RENDERER_VIEWPORT.height};
const left = berxBuildDrawList({...frame, camera: cameras.left}, size);
const right = berxBuildDrawList({...frame, camera: cameras.right!}, size);
fs.writeFileSync(leftOut, JSON.stringify(left));
fs.writeFileSync(rightOut, JSON.stringify(right));
fs.writeFileSync(reportOut, JSON.stringify({
	ipd: berxPoseIpd(views),
	fov: {left: cameras.left.fov, right: cameras.right!.fov},
	eyePositions: {left: cameras.left.position, right: cameras.right!.position},
	/* the same entities in both eyes: a headset shows one world */
	items: {left: left.items.map((i) => i.id), right: right.items.map((i) => i.id)},
	/* and each eye's own view matrix, which must not be the same */
	view: {left: left.view, right: right.view},
	projection: {left: left.projection, right: right.projection},
}));
console.log(`two eyes ${berxPoseIpd(views)?.toFixed(4)}m apart at ${cameras.left.fov}°, ${left.items.length} entities in each`);
