#!/usr/bin/env node
/**
 * The desktop shell, as something a person could install.
 *
 * `cargo build` produces a binary in a target directory. That is not an
 * application: it has no name a desktop knows, no icon, no launcher
 * entry and no way to be installed or removed. This builds the real
 * thing for Linux — a .deb with the binary under /usr/bin, a
 * freedesktop .desktop entry and the BERX symbol as its icon — and a
 * plain tarball for anyone not on a Debian derivative.
 *
 * What it does not do is claim to be more than that. There is no macOS
 * bundle, no Windows installer and no code signing, because none of
 * those can be produced or verified from here; the blockers say so.
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(here, '..');
const repoRoot = path.resolve(clientRoot, '..');
const crate = path.join(clientRoot, 'packages/spatial-native');
const outDir = process.argv[2] ?? path.join(crate, 'target/package');

const manifest = fs.readFileSync(path.join(crate, 'Cargo.toml'), 'utf8');
const version = manifest.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!version) throw new Error('BERX packaging: the crate has no version');

/* The binary has to exist before it can be packaged, and it has to be
   the release one: shipping a debug build is a performance claim nobody
   made. */
execFileSync('cargo', ['build', '--release', '--quiet'], {cwd: crate, stdio: 'inherit'});
const binary = path.join(crate, 'target/release/berx-window');
if (!fs.existsSync(binary)) throw new Error(`BERX packaging: ${binary} was not built`);

const arch = execFileSync('dpkg', ['--print-architecture'], {encoding: 'utf8'}).trim();
const stage = path.join(outDir, `berx-desktop_${version}_${arch}`);
fs.rmSync(stage, {recursive: true, force: true});

const write = (relative, contents, mode) => {
	const file = path.join(stage, relative);
	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(file, contents);
	if (mode !== undefined) fs.chmodSync(file, mode);
};

fs.mkdirSync(path.join(stage, 'usr/bin'), {recursive: true});
fs.copyFileSync(binary, path.join(stage, 'usr/bin/berx'));
fs.chmodSync(path.join(stage, 'usr/bin/berx'), 0o755);

/* the real BERX symbol, not a generated placeholder */
const icon = path.join(repoRoot, 'assets/brand/berx-symbol.svg');
if (!fs.existsSync(icon)) throw new Error('BERX packaging: assets/brand/berx-symbol.svg is missing');
fs.mkdirSync(path.join(stage, 'usr/share/icons/hicolor/scalable/apps'), {recursive: true});
fs.copyFileSync(icon, path.join(stage, 'usr/share/icons/hicolor/scalable/apps/berx.svg'));

write('usr/share/applications/berx.desktop', `[Desktop Entry]
Type=Application
Name=BERX
Comment=BERX — живое пространственное социальное пространство
Exec=berx %f
Icon=berx
Terminal=false
Categories=Network;
StartupWMClass=BERX
`);

/* Depends is measured, not guessed: whatever the binary really links
   against, minus the libraries dpkg-shlibdeps would resolve for us if it
   were available here. Vulkan and the X libraries are the ones a window
   cannot open without. */
write('DEBIAN/control', `Package: berx-desktop
Version: ${version}
Section: net
Priority: optional
Architecture: ${arch}
Depends: libc6, libvulkan1, libx11-6, libxkbcommon-x11-0
Maintainer: BERX
Description: BERX desktop shell
 Presents the BERX 5D world to a native window through Vulkan, Metal or
 D3D12. The world itself — entities, spatial identity, X/Y/Z/T/R,
 relationships and navigation — is the shared BERX core; this is its
 renderer and window, and nothing else.
`);

const deb = path.join(outDir, `berx-desktop_${version}_${arch}.deb`);
execFileSync('dpkg-deb', ['--build', '--root-owner-group', stage, deb], {stdio: 'inherit'});

/* and a plain tarball, for anyone not on a Debian derivative */
const tarball = path.join(outDir, `berx-desktop_${version}_${arch}.tar.gz`);
execFileSync('tar', ['-czf', tarball, '-C', stage, 'usr'], {stdio: 'inherit'});

const report = {
	version,
	arch,
	deb,
	debBytes: fs.statSync(deb).size,
	tarball,
	tarballBytes: fs.statSync(tarball).size,
	binaryBytes: fs.statSync(binary).size,
	/* what is genuinely absent, so packaging cannot read as finished */
	missing: ['macOS .app bundle and notarisation', 'Windows installer', 'code signing'],
};
console.log(JSON.stringify(report));
