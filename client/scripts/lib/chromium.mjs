/**
 * Find a Chromium wherever this machine actually keeps one.
 *
 * Shared, because two verification scripts need it and a hardcoded
 * path in one of them is what kept CI red for a week. Playwright is
 * asked first, which is correct on a clean runner that just ran
 * `playwright install`; when the pinned build is absent — a sandbox
 * with a different build number, say — whatever is really installed
 * under PLAYWRIGHT_BROWSERS_PATH is used instead. BERX_CHROMIUM_PATH
 * short-circuits both for a machine that keeps its browser somewhere
 * else entirely.
 *
 * No browser anywhere stays a real failure, reported with Playwright's
 * own error rather than one invented here.
 */
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

export function installedChromium() {
	const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
	if (!root || !fs.existsSync(root)) return undefined;
	/* the symlink a sandbox usually leaves pointing at the real build */
	const direct = path.join(root, 'chromium');
	if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
	/* otherwise the highest chromium-<build> that has a binary in it */
	const builds = fs
		.readdirSync(root)
		.filter((name) => /^chromium-\d+$/.test(name))
		.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
	for (const build of builds) {
		const binary = path.join(root, build, 'chrome-linux', 'chrome');
		if (fs.existsSync(binary)) return binary;
	}
	return undefined;
}

/**
 * The flags that give this browser a GPU.
 *
 * A container has no graphics hardware, so Chromium grants no WebGPU
 * adapter by default and every GPU gate reports blocked — which is
 * honest but proves nothing. With a software Vulkan driver present
 * (mesa's lavapipe), these are Chrome's own documented flags for
 * running WebGPU without hardware: `--enable-unsafe-webgpu` is the
 * switch Chrome ships for exactly this, and the Vulkan pair points it
 * at the installed ICD.
 *
 * This makes the GPU real rather than assumed. It is slow — everything
 * is rasterised on the CPU — and it is not a claim about performance;
 * it is what lets submission, execution and pixel readback actually
 * happen so a gate can measure them.
 *
 * Where no driver is installed the flags change nothing: the adapter
 * request still resolves null and the gates still report blocked.
 */
export const BERX_GPU_FLAGS = [
	'--enable-unsafe-webgpu',
	'--enable-features=Vulkan',
	'--use-vulkan=native',
];

/**
 * SHARED MEMORY GOES IN SHARED MEMORY.
 *
 * Playwright launches Chromium with `--disable-dev-shm-usage`, which is
 * right on a CI image whose /dev/shm is the Docker default 64 MB: the
 * renderer's buffers go to /tmp instead and nothing crashes. It is
 * wrong here, and expensively so. A gate that renders a few hundred
 * frames and reads pixels back leaves the renderer holding thousands of
 * those buffers — 13,096 open and deleted /tmp/.org.chromium.Chromium.*
 * files, 26 GB of them, measured during a single app-shell run — and
 * this container's writable space is a fixed allowance, so the run dies
 * of ENOSPC somewhere in the middle and every result after that point
 * is worthless.
 *
 * /dev/shm here is a 16 GB tmpfs, so the default is simply removed and
 * the buffers live where Chromium means them to live. Nothing about
 * what is measured changes: this decides where a renderer keeps its
 * scratch memory, not what it draws.
 */
export async function launchChromium(options = {}) {
	options = {
		...options,
		args: [...BERX_GPU_FLAGS, ...(options.args ?? [])],
		ignoreDefaultArgs: ['--disable-dev-shm-usage', ...(options.ignoreDefaultArgs ?? [])],
	};
	const override = process.env.BERX_CHROMIUM_PATH;
	if (override) return chromium.launch({...options, executablePath: override});
	try {
		return await chromium.launch(options);
	} catch (error) {
		const found = installedChromium();
		if (!found) throw error;
		return chromium.launch({...options, executablePath: found});
	}
}
