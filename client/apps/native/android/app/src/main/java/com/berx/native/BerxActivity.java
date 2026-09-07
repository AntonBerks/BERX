package com.berx.native;

import android.app.Activity;
import android.os.Bundle;

/**
 * The whole Android application: a surface with the world on it.
 *
 * There is no layout, no navigation graph and no fragment stack, because
 * BERX has no screens. Where the draw list comes from is the one thing
 * still to wire up on this platform — the shared core runs in
 * JavaScript, and bridging it is the work an APK build would come with.
 */
public final class BerxActivity extends Activity {
    private BerxSurfaceView world;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        world = new BerxSurfaceView(this);
        setContentView(world);
    }
}
