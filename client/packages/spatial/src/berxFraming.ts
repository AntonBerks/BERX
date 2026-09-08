/**
 * BERX FRAMING — how much of the frame the world actually occupies.
 *
 * The composition question, asked as a number. A world that fills a
 * tenth of the frame reads as a diagram of a place; one that fills all
 * of it reads as a wall. Between roughly 40% and 60% it reads as a
 * space you are standing in, which is the whole claim BERX makes, so it
 * is worth being able to measure rather than judge by eye.
 *
 * COMPUTED FROM THE PROJECTION, NOT FROM PIXELS, and that is the point.
 * A pixel-counting version has to decide what counts as "world", and
 * every threshold for that is a guess that goes stale the moment the
 * lighting changes — which is exactly what happened when the exposure
 * landed and two gates that counted "lit" pixels started counting the
 * background too. The projection knows where the entities are without
 * being told what colour they came out.
 *
 * ONE MATH. The camera basis, the perspective and the bounding radius
 * are the draw list's own — imported, not re-derived — so a coverage
 * number cannot disagree with the frame it describes.
 */
import {berxLookAt, berxMultiplyMat4, berxPerspective, type BerxMat4} from './frustum';
import type {Berx5DFrame} from './runtime5d';
import type {BerxSpatialObject, BerxVec3} from './world';

/**
 * The bounding radius of an entity, in metres.
 *
 * 0.75 of the largest scale axis: the draw list culls with exactly this
 * number, so an object this says is on screen is an object the frame
 * agrees is on screen. Exported here and imported there rather than
 * written twice.
 */
export function berxBoundingRadius(o: BerxSpatialObject): number {
	return Math.max(o.transform.scale.x, o.transform.scale.y, o.transform.scale.z) * 0.75;
}

export interface BerxFraming {
	/** Fraction of the frame standing on an entity, 0..1. */
	readonly covered: number;
	/** How many entities contributed any area at all. */
	readonly onScreen: number;
	/**
	 * How many are WHOLLY inside the frame.
	 *
	 * The distinction is not pedantry: `onScreen` counts an entity whose
	 * disc merely overlaps the frame, so a world with everything half
	 * cut off scores full marks on it. A fit that used it drove the
	 * camera in until entities ran from -0.41 to 1.72 of the frame and
	 * reported all five present. This is the one a framing decision has
	 * to be made on.
	 */
	readonly whole: number;
	/**
	 * Where the world sits, as a fraction of the frame from its centre.
	 *
	 * 0 is dead centre, 1 is at the edge. A world that fills 50% of the
	 * frame from one corner is not composed, it is cropped, so coverage
	 * alone is not enough to describe a composition.
	 */
	readonly offCentre: number;
	/** The tightest box holding everything, in 0..1 frame coordinates. */
	readonly bounds?: {readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number};
}

/** BERX's composition band: below is a diagram, above is a wall. */
export const BERX_FRAMING_MIN = 0.4;
export const BERX_FRAMING_MAX = 0.6;

const project = (m: BerxMat4, p: BerxVec3): {x: number; y: number; w: number} => {
	const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
	const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
	const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
	return {x, y, w};
};

/**
 * What fraction of a `width`x`height` frame this world stands on.
 *
 * Each entity is projected as a sphere and rasterised into a coarse
 * occupancy grid, so two objects overlapping are counted once — a sum
 * of areas would report 120% coverage for a world you can see straight
 * through, which is the opposite of what the number is for.
 *
 * `grid` is the resolution of that occupancy test. 96 is about a
 * thousandth of a frame per cell: fine enough that a small entity still
 * registers, coarse enough to stay cheap enough to run every frame.
 */
export function berxFraming(frame: Berx5DFrame, width: number, height: number, grid = 96): BerxFraming {
	const c = frame.camera;
	const projection = berxPerspective(c.fov, Math.max(1e-6, width / height), c.near, c.far);
	const view = berxLookAt(c.position, c.target);
	const viewProjection = berxMultiplyMat4(projection, view);

	const cells = new Uint8Array(grid * grid);
	let onScreen = 0, whole = 0, sumX = 0, sumY = 0, weight = 0;
	let minX = 1, minY = 1, maxX = 0, maxY = 0;

	for (const o of frame.world.objects) {
		if (!o.visible) continue;
		const p = project(viewProjection, o.transform.position);
		/* Behind the eye: no area, and no contribution to where the
		   world sits either. */
		if (p.w <= 1e-6) continue;
		const ndcX = p.x / p.w, ndcY = p.y / p.w;
		/* The radius in NDC, from the same projection: a sphere of radius
		   r at distance w subtends r/w scaled by the projection's own
		   vertical term, which is m[5]. */
		const r = berxBoundingRadius(o);
		const radiusY = (r * projection[5]) / p.w;
		const radiusX = (r * projection[0]) / p.w;
		if (radiusX <= 0 || radiusY <= 0) continue;

		/* NDC (-1..1, y up) into frame coordinates (0..1, y down). */
		const fx = ndcX * 0.5 + 0.5, fy = 0.5 - ndcY * 0.5;
		const rx = radiusX * 0.5, ry = radiusY * 0.5;

		let touched = false;
		const x0 = Math.max(0, Math.floor((fx - rx) * grid));
		const x1 = Math.min(grid - 1, Math.ceil((fx + rx) * grid));
		const y0 = Math.max(0, Math.floor((fy - ry) * grid));
		const y1 = Math.min(grid - 1, Math.ceil((fy + ry) * grid));
		for (let gy = y0; gy <= y1; gy++) {
			for (let gx = x0; gx <= x1; gx++) {
				/* the cell's centre, in frame coordinates */
				const cx = (gx + 0.5) / grid, cy = (gy + 0.5) / grid;
				const dx = (cx - fx) / rx, dy = (cy - fy) / ry;
				if (dx * dx + dy * dy <= 1) {
					cells[gy * grid + gx] = 1;
					touched = true;
				}
			}
		}
		if (!touched) continue;
		onScreen++;
		if (fx - rx >= 0 && fx + rx <= 1 && fy - ry >= 0 && fy + ry <= 1) whole++;
		/* Weighted by apparent area: a distant entity should not pull the
		   composition's centre as hard as one filling the frame. */
		const w = rx * ry;
		sumX += fx * w; sumY += fy * w; weight += w;
		minX = Math.min(minX, fx - rx); maxX = Math.max(maxX, fx + rx);
		minY = Math.min(minY, fy - ry); maxY = Math.max(maxY, fy + ry);
	}

	let covered = 0;
	for (let i = 0; i < cells.length; i++) covered += cells[i];

	const centreX = weight > 0 ? sumX / weight : 0.5;
	const centreY = weight > 0 ? sumY / weight : 0.5;
	/* Distance from the middle, normalised so an entity at a frame edge
	   is 1 rather than 0.5. */
	const offCentre = weight > 0
		? Math.min(1, Math.hypot(centreX - 0.5, centreY - 0.5) * 2)
		: 0;

	return {
		covered: covered / cells.length,
		onScreen,
		whole,
		offCentre,
		bounds: onScreen > 0 ? {minX, minY, maxX, maxY} : undefined,
	};
}

/** Is this frame composed as a space rather than a diagram or a wall? */
export function berxWellFramed(f: BerxFraming): boolean {
	return f.covered >= BERX_FRAMING_MIN && f.covered <= BERX_FRAMING_MAX;
}

/**
 * Where the camera has to stand for this world to be composed.
 *
 * BERX's camera was fixed — 8 metres back, aimed at the origin, 42
 * degrees — and a fixed camera does not compose anything: it frames
 * whatever happens to be at the origin and lets the rest fall where it
 * falls. Measured on a real composed world that came to 6.5% of a
 * desktop frame, with two of five entities off it entirely.
 *
 * SOLVED WITH THE MEASUREMENT ITSELF, by bisection on distance, rather
 * than with a closed form. A closed form for "how much of a frame do
 * these scattered spheres cover" is an approximation, and an
 * approximation can disagree with `berxFraming` — at which point the
 * camera would be solving a different problem from the one the gate
 * checks. Coverage falls monotonically as the camera retreats, which is
 * what makes bisection exact enough and terminate.
 *
 * It returns a camera, and changes nothing: the caller decides whether
 * to adopt it, because a camera that re-framed itself mid-gesture would
 * be taking the world away from the person moving through it.
 */
export function berxFrameTheWorld(
	frame: Berx5DFrame,
	width: number,
	height: number,
	target = (BERX_FRAMING_MIN + BERX_FRAMING_MAX) / 2,
): {position: BerxVec3; target: BerxVec3; framing: BerxFraming} {
	const visible = frame.world.objects.filter((o) => o.visible);
	const camera = frame.camera;
	if (visible.length === 0) {
		return {position: camera.position, target: camera.target, framing: berxFraming(frame, width, height)};
	}

	/* Aim at the world, not at the origin. The centroid is weighted by
	   nothing: every entity is equally something the person asked to
	   see, and weighting by size would point the camera at whatever
	   happened to be modelled largest. */
	let cx = 0, cy = 0, cz = 0;
	for (const o of visible) {
		cx += o.transform.position.x; cy += o.transform.position.y; cz += o.transform.position.z;
	}
	const centre: BerxVec3 = {x: cx / visible.length, y: cy / visible.length, z: cz / visible.length};

	/* The direction the camera already looks from, kept: framing is
	   about distance and aim, and inventing a new angle would throw away
	   wherever the person had turned to.
	   
	   MEASURED FROM THE CENTRE, not from the camera's old target, and
	   that is what makes framing IDEMPOTENT. Using the old target meant
	   the first fit moved the target to the centroid, so a second fit
	   computed a different direction and moved the camera again — a
	   camera that crept every time anything was ingested. From the
	   centre, framing an already-framed world is a no-op. */
	let dx = camera.position.x - centre.x;
	let dy = camera.position.y - centre.y;
	let dz = camera.position.z - centre.z;
	const len = Math.hypot(dx, dy, dz) || 1;
	if (len <= 1e-6) { dx = 0; dy = 0; dz = 1; }
	dx /= len; dy /= len; dz /= len;

	/* How far out the world reaches from its own centre — the distance
	   at which everything is certainly inside the frame, and the far end
	   of the search. */
	let reach = 0;
	for (const o of visible) {
		reach = Math.max(reach, Math.hypot(
			o.transform.position.x - centre.x,
			o.transform.position.y - centre.y,
			o.transform.position.z - centre.z,
		) + berxBoundingRadius(o));
	}

	const at = (distance: number): {position: BerxVec3; framing: BerxFraming} => {
		const position: BerxVec3 = {
			x: centre.x + dx * distance, y: centre.y + dy * distance, z: centre.z + dz * distance,
		};
		return {
			position,
			framing: berxFraming({...frame, camera: {...camera, position, target: centre}}, width, height),
		};
	};

	/**
	 * THE CONSTRAINT IS NOT COVERAGE, IT IS COVERAGE WITH EVERYTHING
	 * STILL IN THE FRAME.
	 *
	 * The first version of this bisected on coverage alone and did
	 * exactly what that asks for: it drove the camera to within a third
	 * of a metre of the world's centre, took desktop coverage from 6.5%
	 * to 20%, and pushed a third of the entities off the frame while
	 * doing it. More of the frame covered by fewer of the things the
	 * person asked to see is not a better composition, it is a crop.
	 *
	 * So the search is for the NEAREST distance at which nothing is
	 * cropped — which maximises coverage subject to the world still
	 * being all there — and the band is a result to report, not a
	 * promise. When even a perfect fit leaves the world small, that is
	 * the ARRANGEMENT being too spread out for its entities, and no
	 * camera can fix it; `covered` says so and the caller can act.
	 */
	const wanted = visible.length;
	/* WHOLLY inside, not merely overlapping — see BerxFraming.whole. */
	const fits = (f: BerxFraming) => f.whole >= wanted;

	let near = Math.max(camera.near * 2, reach * 0.05);
	let far = Math.max(near * 2, reach * 12 + 1);
	/* If even the far end crops something the world is not framable
	   along this direction; the far end is still the best answer, and
	   its `covered` reports how little that is. */
	let best = at(far);
	if (!fits(best.framing)) return {position: best.position, target: centre, framing: best.framing};

	for (let i = 0; i < 24; i++) {
		const mid = (near + far) / 2;
		const probe = at(mid);
		if (fits(probe.framing)) {
			/* Still all there: we can afford to come closer. */
			best = probe;
			far = mid;
		} else {
			near = mid;
		}
	}
	/* Overshooting the band from below is impossible here — the fit is
	   the tightest framing that keeps the world whole — so `target` is
	   an upper bound the fit is allowed to stop short of. */
	if (best.framing.covered > target) {
		let lo = far, hi = Math.max(far * 2, reach * 12 + 1);
		for (let i = 0; i < 16; i++) {
			const mid = (lo + hi) / 2;
			const probe = at(mid);
			if (probe.framing.covered > target) lo = mid; else { best = probe; hi = mid; }
		}
	}
	return {position: best.position, target: centre, framing: best.framing};
}
