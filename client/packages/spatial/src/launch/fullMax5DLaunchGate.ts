/**
 * The one BERX Full MAX 5D launch gate.
 *
 * Four separate attempts at this existed — two integrity audits, two
 * launch policies — none imported by anything and none agreeing on a
 * shape. This is the single one, and its whole purpose is that
 * readiness cannot be asserted, only recorded.
 *
 * Evidence is typed, complete and timestamped. There is no setter, no
 * default and no partial record: `berxEvidence` requires every field
 * at the moment of construction and freezes the result, so nothing
 * downstream can flip a requirement to verified after the fact. A
 * requirement with no record at all is a blocker, not a pass — the
 * gate is closed until something opens it.
 *
 * `verified` means: it ran, it was observed, and the observation is
 * quoted here. Not that a file exists, not that a type compiles, not
 * that a capability flag says so.
 */

/** Every requirement Full MAX 5D has to satisfy before it is open. */
export const BERX_LAUNCH_REQUIREMENTS = [
	'shared-core',
	'webgpu',
	'webgl2',
	'desktop',
	'ios-metal',
	'android-vulkan',
	'tablet',
	'watchos',
	'arkit',
	'arcore',
	'openxr',
	'spatial-audio',
	'media-pipeline',
	'authentication',
	'registration',
	'server-authorization',
	'persistence',
	'realtime-sync',
	'packaging',
	'real-device-verification',
	'design-integration',
	'temporal-integrity',
	'relational-integrity',
	'world-navigation',
	'deterministic-layout',
	'pose-persistence',
	'input-integration',
	'accessibility',
	'security',
	'privacy',
	'performance',
	'crash-recovery',
	'gpu-recovery',
] as const;

export type BerxLaunchRequirement = (typeof BERX_LAUNCH_REQUIREMENTS)[number];

/** Where an observation came from. Never 'unknown' — that is a blocker. */
export type BerxEvidenceSource = 'runtime' | 'browser' | 'device' | 'backend' | 'ci' | 'repository';

export type BerxLaunchStatus = 'verified' | 'blocked';

export interface BerxLaunchEvidence {
	readonly requirement: BerxLaunchRequirement;
	readonly status: BerxLaunchStatus;
	/** What was actually observed, quoted. Never a summary of intent. */
	readonly evidence: string;
	/** Unix milliseconds at which it was observed. */
	readonly observedAt: number;
	readonly source: BerxEvidenceSource;
	/** The exact command or file the observation came from. */
	readonly origin: string;
}

/**
 * Build a record. Every field is required, and the result is frozen —
 * which is the whole mechanism: there is no way to produce a verified
 * requirement except by having something to quote for it.
 */
export function berxEvidence(record: {
	requirement: BerxLaunchRequirement;
	status: BerxLaunchStatus;
	evidence: string;
	observedAt: number;
	source: BerxEvidenceSource;
	origin: string;
}): BerxLaunchEvidence {
	if (!record.evidence.trim()) throw new Error(`BERX launch gate: ${record.requirement} has no evidence text`);
	if (!record.origin.trim()) throw new Error(`BERX launch gate: ${record.requirement} has no origin`);
	if (!Number.isFinite(record.observedAt) || record.observedAt <= 0) {
		throw new Error(`BERX launch gate: ${record.requirement} has no observation time`);
	}
	return Object.freeze({...record});
}

export interface BerxLaunchReport {
	/** Open only when every requirement is verified. Never partially open. */
	readonly open: boolean;
	readonly verified: readonly BerxLaunchEvidence[];
	readonly blocked: readonly BerxLaunchEvidence[];
	/** Requirements with no record at all. These are the worst kind. */
	readonly unrecorded: readonly BerxLaunchRequirement[];
	/**
	 * True when every requirement has *some* honest record — verified
	 * with a quote, or blocked with a reason. This is what a build can
	 * be held to; being open is a release decision, not a build one.
	 */
	readonly honest: boolean;
}

/**
 * Evaluate. Fail-closed in both directions: a requirement nobody
 * recorded is unrecorded rather than assumed, and being blocked is
 * reported rather than rounded away.
 */
export function berxEvaluateLaunch(records: readonly BerxLaunchEvidence[]): BerxLaunchReport {
	const byRequirement = new Map<BerxLaunchRequirement, BerxLaunchEvidence>();
	for (const record of records) {
		/* a second record for the same requirement must not silently win:
		   blocked beats verified, because the pessimistic reading is the
		   safe one when two observations disagree */
		const existing = byRequirement.get(record.requirement);
		if (!existing || record.status === 'blocked') byRequirement.set(record.requirement, record);
	}
	const verified: BerxLaunchEvidence[] = [];
	const blocked: BerxLaunchEvidence[] = [];
	const unrecorded: BerxLaunchRequirement[] = [];
	for (const requirement of BERX_LAUNCH_REQUIREMENTS) {
		const record = byRequirement.get(requirement);
		if (!record) unrecorded.push(requirement);
		else if (record.status === 'verified') verified.push(record);
		else blocked.push(record);
	}
	return {
		open: unrecorded.length === 0 && blocked.length === 0,
		verified,
		blocked,
		unrecorded,
		honest: unrecorded.length === 0,
	};
}
