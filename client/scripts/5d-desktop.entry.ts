/**
 * Node entry for the desktop verification.
 *
 * Runs the shared core — the same world application, the same mappers,
 * the same draw-list resolver the WebGL2 backend consumes — and writes
 * the resulting draw list to a file for the native renderer to draw.
 * Nothing about the world is computed on the native side, which is the
 * point: there is one BERX, and the desktop build is a renderer for it.
 */
import fs from 'node:fs';
import {berxBuildDrawList} from '@berx/spatial';
import {BERX_CROSS_RENDERER_VIEWPORT, berxCrossRendererFrame} from '@berx/scenes';

const out = process.argv[2];
if (!out) {
	console.error('usage: 5d-desktop.entry <out.json>');
	process.exit(2);
}
const frame = berxCrossRendererFrame();
const list = berxBuildDrawList(frame, {
	width: BERX_CROSS_RENDERER_VIEWPORT.width,
	height: BERX_CROSS_RENDERER_VIEWPORT.height,
});
fs.writeFileSync(out, JSON.stringify(list));
console.log(`${list.items.length} items · ${list.stats.inFrustum} of ${list.stats.visible} in frustum`);
