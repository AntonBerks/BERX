package com.berx.native;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.Settings;

/**
 * Haptics on Android.
 *
 * The pattern table lives in the shared 5D core
 * (client/packages/spatial/src/haptics.ts, BERX_HAPTICS) so "focus"
 * means the same thing in the hand on every platform. This file only
 * decides how to hand a waveform to this OS, and Android has two real
 * complications that a sketch would miss:
 *
 * 1. Vibrator is deprecated as a system service from API 31. On
 *    Android 12 and later the vibrator comes from VibratorManager;
 *    reaching for the old service still works but is the path that
 *    stops working. Both are handled, chosen by SDK_INT rather than by
 *    a try/catch that would hide a real failure.
 * 2. `hasVibrator()` is a real answer. A device without a motor reports
 *    false, and this returns false rather than pretending it played.
 *
 * Written in Java, not Kotlin, because this Gradle project applies only
 * `com.android.application` — no Kotlin plugin and no Kotlin stdlib
 * dependency. A .kt file here would not compile, which is not an
 * implementation.
 *
 * The waveforms are duplicated from the core table as constants, and
 * that duplication is deliberate and bounded: this class runs before
 * any JavaScript exists in the process (it is what the native shell
 * uses), so it cannot read the core at call time. BerxHapticsTest-style
 * drift is prevented by the values being tiny, named, and checked
 * against the core by the shared-core gate.
 */
public final class BerxHaptics {

    /** Mirrors BerxHapticPattern in the shared core, one for one. */
    public enum Pattern {
        SELECTION(new long[]{10}),
        FOCUS(new long[]{16}),
        TRANSITION(new long[]{28, 22, 48}),
        SUCCESS(new long[]{18, 14, 18, 14, 56}),
        ERROR(new long[]{78, 48, 78});

        final long[] waveform;

        Pattern(long[] waveform) {
            this.waveform = waveform;
        }

        static Pattern named(String name) {
            switch (name) {
                case "selection": return SELECTION;
                case "focus": return FOCUS;
                case "transition": return TRANSITION;
                case "success": return SUCCESS;
                case "error": return ERROR;
                default: return null;
            }
        }
    }

    private final Vibrator vibrator;
    private boolean reducedMotion;

    public BerxHaptics(Context context) {
        Vibrator resolved;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager manager = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            resolved = manager != null ? manager.getDefaultVibrator() : null;
        } else {
            resolved = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        }
        this.vibrator = resolved;
        /* The same accessibility signal the core applies. Read from the
           real system setting rather than assumed, so a native screen
           that plays directly cannot bypass it. */
        this.reducedMotion = Settings.Global.getFloat(
                context.getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f;
    }

    public void setReducedMotion(boolean reduced) {
        this.reducedMotion = reduced;
    }

    /** False where the device has no motor, or reduced motion is on. */
    public boolean isAvailable() {
        return vibrator != null && vibrator.hasVibrator() && !reducedMotion;
    }

    /** @return whether the OS was really asked to play something. */
    public boolean play(Pattern pattern, double intensity) {
        if (pattern == null || !isAvailable()) {
            return false;
        }
        double scale = Math.max(0, Math.min(1, intensity));
        if (scale == 0) {
            return false;
        }
        long[] scaled = new long[pattern.waveform.length];
        for (int i = 0; i < pattern.waveform.length; i++) {
            /* Floored at 1ms, exactly as berxHapticWaveform() does: a
               motor cannot play a fraction of a millisecond, and
               rounding a quiet pattern down to nothing turns a setting
               into a fault. */
            scaled[i] = Math.max(1L, Math.round(pattern.waveform[i] * scale));
        }
        /* -1 means "do not repeat". A repeating waveform with no stop
           call is how a device ends up buzzing until it is rebooted. */
        vibrator.vibrate(VibrationEffect.createWaveform(scaled, -1));
        return true;
    }

    /** The names the shared core uses, passed straight through. */
    public boolean play(String name, double intensity) {
        return play(Pattern.named(name), intensity);
    }

    public void stop() {
        if (vibrator != null) {
            vibrator.cancel();
        }
    }
}
