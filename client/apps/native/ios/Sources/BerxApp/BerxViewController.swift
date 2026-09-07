import UIKit

/// The whole iOS application: a surface with the world on it.
///
/// There is no navigation controller, no tab bar and no table view,
/// because BERX has no screens. Where the draw list comes from is the
/// one thing still to wire up on this platform — the shared core runs in
/// JavaScript, and bridging it is the work an Xcode build would come
/// with.
public final class BerxViewController: UIViewController {
    private let world = BerxWorldView(frame: .zero)

    public override func loadView() {
        view = world
    }

    public override var prefersStatusBarHidden: Bool { true }

    /// Hand the world the frame the shared core resolved.
    public func show(drawList json: String) {
        world.setDrawList(json)
    }
}
