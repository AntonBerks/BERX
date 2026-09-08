/**
 * BERX SSAO — contact darkening, computed once and ported three times.
 *
 * Ambient occlusion answers one question per pixel: how much of the
 * room can this point actually see? A point in the open sees all of it;
 * a point in the crease where a sphere meets a floor sees very little,
 * because the sphere is in the way. That is the darkening the eye reads
 * as CONTACT, and without it every object in BERX floats — the shadow
 * pass gives an object a shadow, but only occlusion tells you where it
 * touches.
 *
 * It occludes the ROOM and nothing else. The key light already has its
 * own shadow, and multiplying a direct light by an ambient term is how
 * a render ends up with a black core where two surfaces meet. So AO
 * scales the environment contribution (see berxEnvironment) and leaves
 * the key and the point lights exactly as they were — the same rule the
 * shadow pass follows in the other direction.
 *
 * WHY THIS FILE EXISTS RATHER THAN THREE SHADER COPIES. SSAO is not a
 * closed form like the environment: it samples its neighbours, so the
 * per-pixel loop has to live in a shader. What does NOT have to live
 * there is the part that decides the answer — the sample kernel, the
 * range check, the bias and the falloff curve. Those are here, and the
 * shaders read the kernel out of a buffer this file fills rather than
 * generating one each. Two shaders generating "the same" hemisphere
 * independently is two hemispheres.
 *
 * NO Math.random ANYWHERE. The kernel is a deterministic spiral (see
 * berxSSAOKernel), because a random kernel means a different picture
 * every run, and a picture that cannot be reproduced cannot be
 * compared against a prediction — which is the only way this file gets
 * verified at all.
 */
import type {BerxVec3} from '../world';

/**
 * How many neighbours each pixel asks about.
 *
 * Sixteen is the number where the noise stops being structured on this
 * kernel: fewer and the spiral's own turns show up as banding on a
 * curved surface, more and the cost rises with nothing visible to show
 * for it. It is also small enough that the whole kernel fits in one
 * uniform upload rather than needing a texture.
 */
export const BERX_SSAO_SAMPLES = 16;

export interface BerxSSAOParams {
	/** World units the hemisphere reaches. Beyond this, geometry is not "nearby". */
	radius: number;
	/**
	 * Depth difference, in world units, ignored as self-occlusion.
	 *
	 * Without it a flat surface occludes itself: neighbouring samples
	 * land microscopically in front of the plane through floating-point
	 * error alone, and the floor grows a uniform grey haze that looks
	 * like dirt.
	 */
	bias: number;
	/** How dark full occlusion gets. 1 would black the crease out entirely. */
	strength: number;
	/**
	 * The falloff exponent applied to the raw occlusion ratio.
	 *
	 * Above 1 this pulls the mid-tones back toward the light, which is
	 * what keeps AO reading as contact rather than as a grey wash over
	 * every slightly-concave thing in the frame.
	 */
	power: number;
}

/** The room's own occlusion settings. One place, so three backends cannot differ. */
export function berxSSAOParams(): BerxSSAOParams {
	return {radius: 0.65, bias: 0.025, strength: 0.75, power: 1.6};
}

/**
 * The sample kernel: points in the +Z hemisphere, deterministic.
 *
 * A Fibonacci (golden-angle) spiral rather than a random cloud, for
 * three reasons that all matter here: it is perfectly even, so sixteen
 * samples cover the hemisphere as well as a random forty would; it is
 * the SAME sixteen points on every machine and every run, which is what
 * makes a predicted pixel possible; and it needs no seed, so there is
 * no hidden state for a backend to get wrong.
 *
 * Lengths are scaled toward the centre so the kernel is denser near the
 * origin — occlusion from something touching matters more than
 * occlusion from something at arm's length, and a uniformly-spaced
 * hemisphere spends most of its samples far away where the answer is
 * almost always "not occluded".
 */
export function berxSSAOKernel(
	/**
	 * How many of the sixteen to return, for a quality tier that cannot
	 * afford all of them.
	 *
	 * A STRIDE through the spiral, not its first half. The spiral's reach
	 * grows with the index, so a prefix would only ever ask about what is
	 * touching: the occlusion would collapse into a dark line at every
	 * contact and vanish an arm's length away. Striding keeps the whole
	 * range and simply asks about fewer directions in it — and every tap
	 * is still one of the real sixteen, so two tiers are asking a subset
	 * of the same question rather than two different ones.
	 */
	samples: number = BERX_SSAO_SAMPLES,
): BerxVec3[] {
	/* The golden angle, in radians. */
	const GOLDEN = Math.PI * (3 - Math.sqrt(5));
	const out: BerxVec3[] = [];
	for (let i = 0; i < BERX_SSAO_SAMPLES; i++) {
		/* z from 1 down toward 0: the +Z hemisphere, evenly in solid angle */
		const z = 1 - (i + 0.5) / BERX_SSAO_SAMPLES;
		const r = Math.sqrt(Math.max(0, 1 - z * z));
		const theta = GOLDEN * i;
		/* pull samples toward the origin — see the note above */
		const t = (i + 1) / BERX_SSAO_SAMPLES;
		const scale = 0.1 + 0.9 * t * t;
		out.push({x: Math.cos(theta) * r * scale, y: Math.sin(theta) * r * scale, z: z * scale});
	}
	if (samples >= out.length) return out;
	const stride = out.length / samples;
	const cheap: BerxVec3[] = [];
	for (let i = 0; i < samples; i++) cheap.push(out[Math.floor(i * stride)]);
	return cheap;
}

/**
 * The kernel and the parameters, packed exactly as the shaders' buffer
 * declares them: BERX_SSAO_SAMPLES vec4s, then one vec4 of parameters.
 *
 * Written once for the same reason berxEnvironmentUniform is: three
 * hand-written packings is three chances to put the bias in the radius
 * slot.
 */
export function berxSSAOUniform(
	params: BerxSSAOParams = berxSSAOParams(),
	/** Taps a quality tier can afford. The buffer's LENGTH never changes. */
	samples: number = BERX_SSAO_SAMPLES,
): number[] {
	const out: number[] = [];
	const kernel = berxSSAOKernel(samples);
	for (const s of kernel) out.push(s.x, s.y, s.z, 0);
	/* Zero-fill the tail rather than shrink the buffer. The shaders loop
	   to a count they are handed separately, so the unused slots are never
	   read — and a uniform buffer whose SIZE changed with the tier would
	   mean re-creating the bind group every time quality moved, which is
	   the one thing a quality change must not cost. */
	for (let i = kernel.length; i < BERX_SSAO_SAMPLES; i++) out.push(0, 0, 0, 0);
	out.push(params.radius, params.bias, params.strength, params.power);
	return out;
}

/** How many floats berxSSAOUniform writes. The backends assert against this. */
export const BERX_SSAO_FLOATS = (BERX_SSAO_SAMPLES + 1) * 4;

/**
 * What a pixel of the G-buffer holds.
 *
 * View-space normal and view-space depth, not a hardware depth texture.
 * The reason is portability rather than convenience: reconstructing a
 * view position from a depth buffer needs the projection's own
 * conventions, and WGSL's depth range is 0..1 where GL's is -1..1 — so
 * three backends reconstructing "the same" position would be three
 * different reconstructions. A linear view depth written by the same
 * shared shader is the same number everywhere.
 */
export interface BerxSSAOSample {
	normal: BerxVec3;
	/** Metres in front of the eye. 0 means nothing was drawn here. */
	depth: number;
}

/**
 * The occlusion at one pixel — the reference implementation.
 *
 * This is the CPU twin of the shader loop, and its purpose is to be the
 * ORACLE: given the same G-buffer the GPU sampled, it produces the
 * number the GPU should have produced. Comparing a rendered AO buffer
 * against this is what makes "the shaders run the core's maths" a
 * measurement rather than a claim.
 *
 * `fetch` hands back a G-buffer pixel in the caller's own storage, so
 * this function neither knows nor cares how the buffer is held.
 */
export function berxSSAOAt(
	x: number,
	y: number,
	width: number,
	height: number,
	fetch: (px: number, py: number) => BerxSSAOSample,
	/** Focal length in pixels: height / (2 tan(fov/2)). Turns metres into pixels at a depth. */
	focalPx: number,
	params: BerxSSAOParams = berxSSAOParams(),
	kernel: BerxVec3[] = berxSSAOKernel(),
): number {
	const centre = fetch(x, y);
	/* Nothing was drawn here, so there is nothing to occlude. */
	if (centre.depth <= 0) return 1;

	const n = centre.normal;
	/*
	 * The hemisphere is turned to face the surface with a deterministic
	 * basis, NOT a per-pixel random rotation.
	 *
	 * The usual trick is a noise texture rotating the kernel per pixel,
	 * trading banding for noise and then blurring the noise away. That
	 * needs a blur pass whose radius is another number three backends
	 * must agree on, and it makes a pixel's value depend on its
	 * coordinates in a way an oracle would have to replicate exactly.
	 * An evenly-spaced kernel does not need the rotation in the first
	 * place.
	 */
	const up = Math.abs(n.z) < 0.999 ? {x: 0, y: 0, z: 1} : {x: 1, y: 0, z: 0};
	const txRaw = {
		x: up.y * n.z - up.z * n.y,
		y: up.z * n.x - up.x * n.z,
		z: up.x * n.y - up.y * n.x,
	};
	const tl = Math.hypot(txRaw.x, txRaw.y, txRaw.z) || 1;
	const tx = {x: txRaw.x / tl, y: txRaw.y / tl, z: txRaw.z / tl};
	const ty = {
		x: n.y * tx.z - n.z * tx.y,
		y: n.z * tx.x - n.x * tx.z,
		z: n.x * tx.y - n.y * tx.x,
	};

	/*
	 * SLOPE-SCALED BIAS, for the same reason the shadow pass has a normal
	 * bias: the constant one is only correct on a surface square to the
	 * eye.
	 *
	 * A sample is projected to a WHOLE pixel, and on an oblique surface
	 * the geometry actually at that pixel is up to half a pixel of slope
	 * away in depth. On the fixture's floor — tilted about 21° in view
	 * space — that exceeded a flat 0.025 and left every flat surface
	 * sitting at 0.99 instead of 1.0: a uniform 1% haze, which is the
	 * "dirt on everything" failure a bias exists to prevent. `n.z` is the
	 * view-space normal's own z, so it is 1 facing the eye and 0 edge-on.
	 */
	const slope = 1 - Math.min(1, Math.abs(n.z));
	const bias = params.bias * (1 + slope * 4);

	let occluded = 0;
	for (const k of kernel) {
		/* the sample, in view space, on the surface's own hemisphere */
		const s = {
			x: tx.x * k.x + ty.x * k.y + n.x * k.z,
			y: tx.y * k.x + ty.y * k.y + n.y * k.z,
			z: tx.z * k.x + ty.z * k.y + n.z * k.z,
		};
		/* Project the offset to pixels. The view looks down -Z, so a
		   sample nearer the eye has a smaller depth; the offset's own z
		   moves it along that axis. */
		const sampleDepth = centre.depth - s.z * params.radius;
		if (sampleDepth <= 0) continue;
		const px = Math.round(x + (s.x * params.radius * focalPx) / sampleDepth);
		const py = Math.round(y - (s.y * params.radius * focalPx) / sampleDepth);
		if (px < 0 || py < 0 || px >= width || py >= height) continue;

		const there = fetch(px, py);
		/* nothing drawn there: the room is visible in that direction */
		if (there.depth <= 0) continue;

		/*
		 * Occluded when the geometry actually at that pixel is NEARER
		 * than the point we asked about — something is between this
		 * surface and where the sample wanted to be.
		 */
		if (there.depth < sampleDepth - bias) {
			/*
			 * Range check. Without it a wall a hundred metres behind a
			 * foreground object occludes it completely, and every
			 * silhouette in the frame gets a dark halo — the classic SSAO
			 * artefact. Occlusion fades out as the occluder leaves the
			 * hemisphere's own radius.
			 */
			const range = params.radius / Math.max(Math.abs(centre.depth - there.depth), 1e-4);
			occluded += Math.min(1, range);
		}
	}

	/* Divided by the kernel actually used, not by sixteen. A quality tier
	   hands this eight taps, and dividing eight results by sixteen would
	   halve the occlusion — the oracle would then disagree with every
	   backend, and the disagreement would look like a shader bug. */
	const ratio = occluded / Math.max(1, kernel.length);
	/* 1 = fully lit, 0 = fully occluded, which is what the shader multiplies by. */
	return Math.max(0, 1 - Math.pow(ratio, params.power) * params.strength);
}
