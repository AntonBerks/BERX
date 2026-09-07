package com.berx.native;

import android.content.Context;
import android.view.SurfaceHolder;
import android.view.SurfaceView;

/**
 * A surface for the world to be drawn on, and nothing more.
 *
 * It forwards the Android surface lifecycle to the renderer and hands it
 * whatever draw list it has been given. It does not decide what to draw:
 * the list arrives from the shared core, and a view that started
 * deciding would be a second BERX.
 */
public final class BerxSurfaceView extends SurfaceView implements SurfaceHolder.Callback {
    private final BerxNative renderer = new BerxNative();
    private String drawList;

    public BerxSurfaceView(Context context) {
        super(context);
        getHolder().addCallback(this);
    }

    /** The frame the shared core resolved. Drawn on the next present. */
    public void setDrawList(String json) {
        drawList = json;
        present();
    }

    public void present() {
        if (drawList != null) renderer.present(drawList);
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        renderer.open(holder.getSurface(), getWidth(), getHeight());
        present();
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
        renderer.resize(width, height);
        present();
    }

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        renderer.close();
    }
}
