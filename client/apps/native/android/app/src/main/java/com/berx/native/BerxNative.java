package com.berx.native;

import android.view.Surface;

/**
 * The BERX renderer, across JNI.
 *
 * Every method here maps to one entry point in the Rust crate. There is
 * deliberately nothing else: no world, no camera, no navigation and no
 * domain state, because BERX has exactly one of each and they live in
 * the shared core. What is passed in is the draw list that core
 * produced, as JSON, exactly as it is on every other platform.
 */
public final class BerxNative {
    static {
        System.loadLibrary("berx_spatial_native");
    }

    private long session;

    /** Open a renderer on this surface. Returns false when the device has no usable GPU. */
    public boolean open(Surface surface, int width, int height) {
        session = nativeOpen(surface, width, height);
        return session != 0L;
    }

    /** Present one frame of a draw list. Returns 0, or a negative reason code. */
    public int present(String drawListJson) {
        if (session == 0L) return -1;
        return nativePresent(session, drawListJson);
    }

    /** The surface changed size — a rotation, a split screen, a keyboard. */
    public void resize(int width, int height) {
        if (session != 0L) nativeResize(session, width, height);
    }

    /** Release the renderer and everything it holds on the GPU. */
    public void close() {
        if (session != 0L) {
            nativeClose(session);
            session = 0L;
        }
    }

    private static native long nativeOpen(Surface surface, int width, int height);
    private static native int nativePresent(long session, String drawListJson);
    private static native void nativeResize(long session, int width, int height);
    private static native void nativeClose(long session);
}
