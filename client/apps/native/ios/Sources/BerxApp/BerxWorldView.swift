import BerxNative
import QuartzCore
import UIKit

/// A layer for the world to be drawn on, and nothing more.
///
/// It owns a `CAMetalLayer`, hands it to the Rust renderer, and forwards
/// the size changes iOS gives it. It does not decide what to draw: the
/// draw list arrives from the shared core, and a view that started
/// deciding would be a second BERX.
public final class BerxWorldView: UIView {
    public override class var layerClass: AnyClass { CAMetalLayer.self }

    private var session: OpaquePointer?
    private var drawList: String?

    public override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = UIColor(red: 7 / 255, green: 8 / 255, blue: 10 / 255, alpha: 1)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("BERX is not built from a storyboard") }

    /// The frame the shared core resolved. Drawn on the next present.
    public func setDrawList(_ json: String) {
        drawList = json
        present()
    }

    public override func didMoveToWindow() {
        super.didMoveToWindow()
        guard window != nil, session == nil else { return }
        let scale = window?.screen.scale ?? UIScreen.main.scale
        let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
        guard size.width >= 1, size.height >= 1 else { return }
        let pointer = Unmanaged.passUnretained(layer).toOpaque()
        session = OpaquePointer(berx_native_surface_ios(pointer, UInt32(size.width), UInt32(size.height)))
        present()
    }

    public override func layoutSubviews() {
        super.layoutSubviews()
        guard let session else { return }
        let scale = window?.screen.scale ?? UIScreen.main.scale
        berx_native_surface_resize(
            UnsafeMutableRawPointer(session).assumingMemoryBound(to: SurfaceSession.self),
            UInt32(bounds.width * scale),
            UInt32(bounds.height * scale)
        )
        present()
    }

    /// Present one frame. A negative code is reported, never swallowed:
    /// a frame that did not draw must not look like one that did.
    @discardableResult
    public func present() -> Int32 {
        guard let session, let drawList else { return -1 }
        return drawList.withCString { json in
            berx_native_surface_present(
                UnsafeMutableRawPointer(session).assumingMemoryBound(to: SurfaceSession.self),
                json
            )
        }
    }

    deinit {
        guard let session else { return }
        berx_native_surface_destroy(
            UnsafeMutableRawPointer(session).assumingMemoryBound(to: SurfaceSession.self)
        )
    }
}
