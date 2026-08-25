# Video — integration point, not final

This folder is the drop-in location for BERX's finished video assets. Nothing
here is final yet, so no stock video has been substituted.

Expected files (referenced by /media.manifest.json):
- berx-trailer.mp4 / berx-trailer.webm — main brand trailer
- berx-trailer.poster.avif — poster frame shown before play
- berx-trailer.vtt — Russian captions (required before shipping)
- hero-ambient-loop.mp4 — optional ≤6s muted desktop-tier-3 hero loop, ≤900KB

Until these exist, the site shows an honest "not yet available" message in the
trailer modal (see scripts/berx.js → openTrailer()). Once a file is final,
add it here and set its `status` to `"final"` in /media.manifest.json.
