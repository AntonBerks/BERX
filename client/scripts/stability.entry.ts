/**
 * Browser entry for the temporal-stability gate.
 *
 * Renders a SEQUENCE — a camera walking a smooth path — rather than a
 * frame, because that is the only way flicker exists. A still frame in
 * which an object is drawn and a still frame in which it is not are both
 * perfectly correct; the defect is the pair.
 */
import {BerxThreeRuntimeRenderer} from '@berx/spatial-web/threeRuntime';
import {BERX_CROSS_RENDERER_VIEWPORT, berxCrossRendererFrame} from '@berx/scenes';
import {berxBuildDrawList, berxRenderQuality, BERX_LOD_DISTANCE, type BerxFrameMemory} from '@berx/spatial';

/**
 * A SMALL frame, deliberately.
 *
 * This gate counts how many pixels changed between consecutive frames
 * and asks whether one frame changed out of proportion to its
 * neighbours. That ratio is scale-free — a pop is a pop at any
 * resolution — while the readback is not: every frame is a full
 * readPixels off a software rasteriser in CI, and at the cross-renderer
 * viewport a twenty-frame walk rendered twice spends minutes moving
 * bytes rather than measuring anything. A ninth of the area measures the
 * same thing in a ninth of the time.
 */
const WIDTH = Math.round(BERX_CROSS_RENDERER_VIEWPORT.width / 3);
const HEIGHT = Math.round(BERX_CROSS_RENDERER_VIEWPORT.height / 3);

const fresh = () => {
	const c = document.createElement('canvas');
	c.width = WIDTH; c.height = HEIGHT;
	document.body.appendChild(c);
	return c;
};

/**
 * A camera creeping forward while breathing — and the breathing is the
 * point.
 *
 * A pure walk was the first version of this and it proved nothing: none
 * of the fixture's objects happened to sit on a decision boundary during
 * it, so neither run flickered and the control had nothing to show. A
 * gate whose control cannot fail is not measuring anything.
 *
 * So the camera is placed so that one object sits EXACTLY at the LOD
 * distance, and then given a drift of a few centimetres — far smaller
 * than any deliberate movement, the size of a hand holding a phone. At
 * that amplitude the object crosses the threshold again and again while
 * the picture barely changes, which is precisely the condition that
 * makes a bare threshold flicker and a band not.
 */
/**
 * One object standing exactly on the LOD boundary, breathing across it.
 *
 * The first two versions of this fixture moved the CAMERA, and neither
 * worked: the core resolves its own camera from the frame — framing,
 * clamping to the world edge, the transition — so a position written
 * into the frame is a request rather than a fact, and the object that
 * was supposed to sit on the boundary did not. Measured, not assumed:
 * the walk produced zero decision changes in BOTH runs, and a control
 * that cannot fail is a gate that measures nothing.
 *
 * So this moves the OBJECT. An object's position is not renegotiated by
 * anything, so placing one at exactly the LOD distance from the resolved
 * eye and drifting it twelve centimetres — the size of a hand holding a
 * phone — puts a real decision on a real boundary. That is the condition
 * a bare threshold cannot survive and a band can.
 */
const wobbleWalk = (i: number) => {
	const base = berxCrossRendererFrame();
	/* The eye the CORE resolves, not the one the frame asks for. */
	const probe = berxBuildDrawList(base, {width: WIDTH, height: HEIGHT, maxObjects: 6});
	const eye = probe.camera;
	const target = base.world.objects.find((o) => o.visible);
	if (!target) return base;
	const p = target.transform.position;
	const dx = p.x - eye.x, dy = p.y - eye.y, dz = p.z - eye.z;
	const len = Math.hypot(dx, dy, dz) || 1;
	/* exactly on the boundary, then a slow drift across it: the sine's
	   period is about nine frames, so it crosses roughly every four */
	const want = BERX_LOD_DISTANCE + Math.sin(i * 0.7) * 0.12;
	const objects = base.world.objects.map((o) => o.id !== target.id ? o : {
		...o,
		transform: {
			...o.transform,
			position: {
				x: eye.x + (dx / len) * want,
				y: eye.y + (dy / len) * want,
				z: eye.z + (dz / len) * want,
			},
		},
	});
	return {
		...base,
		world: {...base.world, objects},
		transition: undefined,
		reducedMotion: true,
	};
};

declare global {
	interface Window { BERX_STABILITY: unknown }
}

window.BERX_STABILITY = {
	/**
	 * The walk, twice: once carrying the previous frame's decisions
	 * forward and once deciding everything afresh every frame.
	 *
	 * Two runs rather than one because a single sequence cannot say
	 * whether it is stable — stable compared with what? The no-memory run
	 * is the control, and the difference between them is the whole claim.
	 */
	walk(frames = 60, budget = 6) {
		const shoot = (withMemory: boolean) => {
			const canvas = fresh();
			const renderer = new BerxThreeRuntimeRenderer(canvas);
			renderer.resize(WIDTH, HEIGHT);
			const gl = canvas.getContext('webgl2')!;
			let memory: BerxFrameMemory | undefined;
			const shots: number[][] = [];
			const lods: Record<string, (0 | 1)>[] = [];
			const drawn: string[][] = [];
			for (let i = 0; i < frames; i++) {
				const frame = wobbleWalk(i);
				const list = berxBuildDrawList(frame, {
					width: WIDTH, height: HEIGHT,
					quality: berxRenderQuality('high'),
					maxObjects: budget,
					memory: withMemory ? memory : undefined,
				});
				memory = list.memory;
				lods.push({...list.memory.lod});
				drawn.push([...list.memory.drawn]);
				renderer.render(frame, {maxObjects: budget, stable: withMemory});
				const px = new Uint8Array(WIDTH * HEIGHT * 4);
				gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, px);
				shots.push(Array.from(px));
			}
			return {shots, lods, drawn};
		};
		return {withMemory: shoot(true), withoutMemory: shoot(false)};
	},
};
