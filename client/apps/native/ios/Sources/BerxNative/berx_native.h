/*
 * The BERX native renderer, as C.
 *
 * Every declaration here matches an `extern "C"` function in
 * client/packages/spatial-native. Nothing is declared that is not
 * implemented: a header that promises a function the library does not
 * have fails at link time on a device and nowhere earlier.
 */
#ifndef BERX_NATIVE_H
#define BERX_NATIVE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* An opaque renderer that draws offscreen and reads the frame back. */
typedef struct BerxNative BerxNative;
/* An opaque renderer that draws to a surface the platform owns. */
typedef struct SurfaceSession BerxSurfaceSession;

BerxNative *berx_native_create(void);
int berx_native_render(BerxNative *handle, const char *draw_list_json);
int berx_native_frame_size(const BerxNative *handle, unsigned *width, unsigned *height, unsigned *bytes);
int berx_native_copy_frame(const BerxNative *handle, unsigned char *out, unsigned capacity);
int berx_native_last_error(const BerxNative *handle, char *out, unsigned capacity);
unsigned berx_native_capabilities(void);
void berx_native_destroy(BerxNative *handle);

/* iOS: a session on a CAMetalLayer. Null when the device has no usable GPU. */
BerxSurfaceSession *berx_native_surface_ios(void *metal_layer, uint32_t width, uint32_t height);
int berx_native_surface_present(BerxSurfaceSession *session, const char *draw_list_json);
void berx_native_surface_resize(BerxSurfaceSession *session, uint32_t width, uint32_t height);
void berx_native_surface_destroy(BerxSurfaceSession *session);

#ifdef __cplusplus
}
#endif

#endif /* BERX_NATIVE_H */
