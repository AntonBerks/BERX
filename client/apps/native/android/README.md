# BERX on Android

The renderer is `berx-spatial-native`, the same Rust crate the desktop
shell uses, built as a `cdylib` for `aarch64-linux-android` and reached
from Java through JNI. The world is not here: it is the shared
TypeScript core, and what crosses into this process is the draw list it
produced.

`npm run verify:5d-native-targets` type-checks that crate for
`aarch64-linux-android` with the Android surface path active, so the
Vulkan backend really does compile for this platform. What it cannot do
is build this project: linking the shared library needs the Android NDK
and assembling an APK needs the SDK, and neither is present in the
environment BERX is being built in.

To build it where they are:

```sh
rustup target add aarch64-linux-android
cargo ndk -t arm64-v8a -o app/src/main/jniLibs build --release --no-default-features
./gradlew :app:assembleDebug
```

Until an APK has been assembled and run on a real device, Android stays
a blocker in the launch gate — a compiled backend is not a running one,
and a phone is the only thing that proves a phone.
