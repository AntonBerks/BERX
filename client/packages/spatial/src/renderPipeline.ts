/**
 * BERX 5D RENDER PIPELINE — the order, declared once.
 *
 * Three backends each encode the same sequence of passes, and until this
 * file existed the sequence lived only in three functions that happened
 * to agree. "Happened to" is the operative phrase: they had already
 * stopped agreeing in two places by the time anyone looked — WebGPU
 * skipped the volumetric march whenever occlusion was off, and two of
 * the three read the march's parameters from their own constants instead
 * of from the draw list. Both are the same class of defect, and both are
 * invisible to a gate that only compares final pixels with everything
 * turned on.
 *
 * So the order is data now, and each backend REPORTS what it actually
 * encoded, in the order it encoded it. The gate compares the report
 * against this file. That is a much stronger claim than "the frames look
 * alike": it says the three renderers do the same things in the same
 * sequence, and it fails the moment one of them quietly stops.
 *
 * WHAT IS AND IS NOT A PASS. The product description of the pipeline is
 *
 *   Depth -> Shadows -> IBL -> SSAO -> Volumetric -> Particles ->
 *   Composition -> Post
 *
 * and three of those are not passes at all. IBL is a term inside the
 * world shader, not a stage before it — an analytic environment does not
 * need a pass, which is the whole reason berxEnvironment is a closed
 * form. Composition happens before any of this, in @berx/spatial's
 * composition.ts, and reaches the GPU as coordinates in the draw list.
 * Post does not exist yet. Writing all three down as `term`, `upstream`
 * and `absent` rather than leaving them out is the point: a reader
 * comparing the description to the code should find the difference
 * explained here rather than have to conclude something is missing.
 */

/** What a stage IS, which decides whether a backend can report it. */
export type BerxPipelineKind =
	/** A real GPU pass. Every backend encodes it and reports it by name. */
	| 'pass'
	/** Computed inside another stage's shader. Nothing to encode. */
	| 'term'
	/** Decided before any GPU work, and carried in the draw list. */
	| 'upstream'
	/** Named in the design, not built. Says so rather than being omitted. */
	| 'absent';

export interface BerxPipelineStage {
	/** The name a backend reports. Stable: gates compare against it. */
	id: string;
	kind: BerxPipelineKind;
	/** What it needs to already exist. Every one must come earlier. */
	needs: readonly string[];
	/** What later stages can use because this one ran. */
	produces: readonly string[];
	/** Whether a caller can turn it off, and what turns it off. */
	optional?: string;
	/** Why it is where it is. Read by the gate into its own output. */
	why: string;
}

/**
 * The whole pipeline, in order.
 *
 * The order is not a preference. Every entry's `needs` are produced by an
 * earlier entry, and the gate proves that mechanically rather than
 * trusting the list to be sorted.
 */
export const BERX_PIPELINE: readonly BerxPipelineStage[] = Object.freeze([
	{
		id: 'composition',
		kind: 'upstream',
		needs: [],
		produces: ['draw-list'],
		why: 'the arrangement of the world is a function from entities and relations to coordinates, so it happens in the core and arrives as a draw list — a composition implemented as a pass would be a composition only the GPU knew about',
	},
	{
		id: 'shadows',
		kind: 'pass',
		needs: ['draw-list'],
		produces: ['shadow-map'],
		optional: 'shadows: false, or a world with nothing to cast',
		why: 'depth from the light\'s own camera, first, because both the surfaces and the air ask it the same question and neither can ask before it exists',
	},
	{
		id: 'gbuffer',
		kind: 'pass',
		needs: ['draw-list'],
		produces: ['view-normals', 'view-depth'],
		optional: 'only when NEITHER occlusion nor the march is wanted',
		why: 'view-space normal and linear view depth for the two passes that need to know where the surfaces are. It has two consumers and gating it on one of them was a real bug: WebGPU tied it to occlusion, so asking for air without occlusion drew no air',
	},
	{
		id: 'ssao',
		kind: 'pass',
		needs: ['view-normals', 'view-depth'],
		produces: ['ao-map'],
		optional: 'ssao: false',
		why: 'how much of the room each point can see, computed from the G-buffer and read by the world pass — which is why it has to be before it',
	},
	{
		id: 'volumetric',
		kind: 'pass',
		needs: ['shadow-map', 'view-depth'],
		produces: ['in-scatter'],
		optional: 'volumetric: false, or a world with no shadow camera',
		why: 'the march needs the shadow map to know which air is lit and the G-buffer to know where each ray stops. It runs before the world pass because the composite that adds it runs INSIDE that pass and cannot sample a target the pass is writing',
	},
	{
		id: 'ibl',
		kind: 'term',
		needs: ['ao-map'],
		produces: ['ambient'],
		why: 'the room is an analytic function of direction — berxEnvironment — so it is four lines in the world shader rather than a pass. A cubemap would be a pass; this is why there is not one',
	},
	{
		id: 'world',
		kind: 'pass',
		needs: ['draw-list', 'shadow-map', 'ao-map', 'ambient'],
		produces: ['frame'],
		why: 'the surfaces, lit: the BRDF, the key light through the shadow map, the environment, and the occlusion scaling the ambient term',
	},
	{
		id: 'labels',
		kind: 'pass',
		needs: ['frame'],
		produces: ['frame'],
		why: 'names stand in the world beside their objects, so they are drawn into the same pass with the depth buffer already holding everything solid',
	},
	{
		id: 'particles',
		kind: 'pass',
		needs: ['frame'],
		produces: ['frame'],
		optional: 'particles: false, or a world with no viewer basis',
		why: 'after the world, so the depth buffer already holds everything a mote could be behind',
	},
	{
		id: 'composite',
		kind: 'pass',
		needs: ['in-scatter', 'frame'],
		produces: ['frame'],
		optional: 'follows volumetric exactly',
		why: 'the air goes on last and additively: light in the air ADDS to what is behind it, and a pass that blended over the world would darken something, which scattering never does',
	},
	{
		id: 'post',
		kind: 'absent',
		needs: ['frame'],
		produces: [],
		why: 'NOT BUILT. Named in the design and honestly absent: there is no tone-map, no bloom and no grade. The render target is linear rgba8 and the frame is what the world pass wrote. Listed so its absence is a statement rather than an omission',
	},
]);

/** Just the GPU passes, in order — what a backend reports and a gate compares. */
export function berxPipelinePasses(): string[] {
	return BERX_PIPELINE.filter((s) => s.kind === 'pass').map((s) => s.id);
}

export function berxPipelineStage(id: string): BerxPipelineStage | undefined {
	return BERX_PIPELINE.find((s) => s.id === id);
}

/**
 * Every stage's inputs, produced by something earlier?
 *
 * The gate calls this rather than reading the list and agreeing with it.
 * A pipeline that is merely WRITTEN in order is a pipeline nobody has
 * checked; this one cannot be reordered without the check failing.
 */
export function berxPipelineViolations(): string[] {
	const out: string[] = [];
	const available = new Set<string>();
	for (const stage of BERX_PIPELINE) {
		for (const need of stage.needs) {
			if (!available.has(need)) out.push(`${stage.id} needs ${need}, which nothing before it produces`);
		}
		for (const p of stage.produces) available.add(p);
	}
	return out;
}

/**
 * The passes a backend should have encoded, given what was turned off.
 *
 * This is the expectation a gate holds a backend's REPORT against. It
 * encodes the dependencies rather than a second hand-written list: turn
 * the march off and the composite goes with it, because the composite's
 * only input is what the march produced.
 */
export function berxExpectedPasses(enabled: {
	shadows?: boolean;
	ssao?: boolean;
	volumetric?: boolean;
	particles?: boolean;
	labels?: boolean;
}): string[] {
	const on = {shadows: true, ssao: true, volumetric: true, particles: true, labels: true, ...enabled};
	const out: string[] = [];
	for (const stage of BERX_PIPELINE) {
		if (stage.kind !== 'pass') continue;
		if (stage.id === 'shadows' && !on.shadows) continue;
		if (stage.id === 'ssao' && !on.ssao) continue;
		/* The march needs the shadow map: no shadow camera, no shaft. That
		   is not a limitation to work around — what the eye reads as a ray
		   IS the boundary between lit and unlit air, and uniform air has
		   no boundary in it. */
		if (stage.id === 'volumetric' && (!on.volumetric || !on.shadows)) continue;
		if (stage.id === 'composite' && (!on.volumetric || !on.shadows)) continue;
		/* Its two consumers are gone, so it has no reason to run. */
		if (stage.id === 'gbuffer' && !on.ssao && (!on.volumetric || !on.shadows)) continue;
		if (stage.id === 'labels' && !on.labels) continue;
		if (stage.id === 'particles' && !on.particles) continue;
		out.push(stage.id);
	}
	return out;
}
