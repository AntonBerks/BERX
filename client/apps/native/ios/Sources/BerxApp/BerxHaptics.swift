import UIKit

/// Haptics on iOS.
///
/// The pattern table lives in the shared 5D core
/// (client/packages/spatial/src/haptics.ts, BERX_HAPTICS) so that
/// "focus" means the same thing in the hand on every platform. What is
/// iOS-specific is HOW it is played, and it is genuinely different:
/// UIKit does not take a waveform. `UIImpactFeedbackGenerator` plays a
/// system-tuned impact of a given style, and
/// `UINotificationFeedbackGenerator` plays a fixed success/warning/error
/// signature. Handing either of them a millisecond array would do
/// nothing at all — which is why the core carries an `ios` field naming
/// the generator, rather than leaving this file to invent a mapping.
///
/// `prepare()` is not decoration. Without it the Taptic Engine is warmed
/// on first use, and the first impact of a session lands tens of
/// milliseconds late — long enough to feel disconnected from the touch
/// that caused it.
///
/// Everything here is a no-op on hardware without a Taptic Engine, which
/// is UIKit's own behaviour and is reported as `false` rather than
/// hidden: a haptic that did not happen must not be counted as one that
/// did.
@objc public final class BerxHaptics: NSObject {

    /// Mirrors BerxHapticPattern in the shared core, one for one.
    @objc public enum Pattern: Int {
        case selection
        case focus
        case transition
        case success
        case error
    }

    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private let notification = UINotificationFeedbackGenerator()

    /// Reduced motion silences haptics too — the same accessibility
    /// signal the core applies, applied here as well so a native screen
    /// that plays directly does not bypass it.
    @objc public var reducedMotion: Bool = UIAccessibility.isReduceMotionEnabled

    @objc public override init() {
        super.init()
        prepare()
    }

    /// Warm the engine. Cheap, and the difference between a tap that
    /// feels like the touch and one that feels like a notification.
    @objc public func prepare() {
        light.prepare()
        medium.prepare()
        heavy.prepare()
        notification.prepare()
    }

    /// - Returns: whether UIKit was actually asked to play something.
    @discardableResult
    @objc public func play(_ pattern: Pattern, intensity: CGFloat = 1.0) -> Bool {
        guard !reducedMotion else { return false }
        let scaled = max(0, min(1, intensity))
        guard scaled > 0 else { return false }

        switch pattern {
        case .selection:
            light.impactOccurred(intensity: scaled)
        case .focus:
            medium.impactOccurred(intensity: scaled)
        case .transition:
            heavy.impactOccurred(intensity: scaled)
        case .success:
            // Notification feedback takes no intensity. That is Apple's
            // API, not an omission — scaling it would mean playing a
            // different, weaker signature that no longer reads as
            // "done".
            notification.notificationOccurred(.success)
        case .error:
            notification.notificationOccurred(.error)
        }
        // Generators go cold after use; the next impact would be late.
        prepare()
        return true
    }

    /// The names the shared core uses, so a bridge can pass a string
    /// straight through without a second mapping table.
    @discardableResult
    @objc public func play(named name: String, intensity: CGFloat = 1.0) -> Bool {
        switch name {
        case "selection": return play(.selection, intensity: intensity)
        case "focus": return play(.focus, intensity: intensity)
        case "transition": return play(.transition, intensity: intensity)
        case "success": return play(.success, intensity: intensity)
        case "error": return play(.error, intensity: intensity)
        default: return false
        }
    }
}
