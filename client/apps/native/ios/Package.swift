// swift-tools-version:5.9
import PackageDescription

/// BERX on iOS.
///
/// `BerxNative` is the C ABI of the Rust renderer; `BerxApp` is the
/// Swift layer that owns a `CAMetalLayer` and hands the renderer draw
/// lists. Nothing here holds a world — that is the shared core's, on
/// every platform.
let package = Package(
    name: "BERX",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "BerxApp", targets: ["BerxApp"])
    ],
    targets: [
        /* built by: cargo build --release --no-default-features
           --target aarch64-apple-ios, then linked from
           target/aarch64-apple-ios/release/libberx_spatial_native.a */
        .systemLibrary(name: "BerxNative", path: "Sources/BerxNative"),
        .target(name: "BerxApp", dependencies: ["BerxNative"])
    ]
)
