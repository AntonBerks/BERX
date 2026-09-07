# BERX on iOS

The renderer is `berx-spatial-native`, the same Rust crate the desktop
shell and the Android app use, built as a static library for
`aarch64-apple-ios` and reached from Swift through its C ABI. The world
is not here: it is the shared TypeScript core, and what crosses into
this process is the draw list it produced.

Unlike Android, this cannot be checked in the environment BERX is being
built in at all. The `aarch64-apple-ios` Rust target is installed, and
`cargo check` still fails before it reaches this crate — several of
wgpu's dependencies run build scripts that need `xcrun`, which is part
of Xcode's toolchain. So the Metal surface path is written and is
unverified, and the launch gate says so.

To build it where Xcode exists:

```sh
rustup target add aarch64-apple-ios
cargo build --release --no-default-features --target aarch64-apple-ios
swift build   # or add Sources/ to an Xcode target and link libberx_spatial_native.a
```

Until an app has been built and run on a real device, iOS stays a
blocker in the launch gate. A compiled backend is not a running one, and
a phone is the only thing that proves a phone.
