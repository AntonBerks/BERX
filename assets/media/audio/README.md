# Audio — integration point, not final

Expected file (referenced by /media.manifest.json):
- berx-atmosphere.m4a (+ .ogg fallback) — seamless-loop ambient soundtrack, ~-20 LUFS

Audio never autoplays. It loads and plays only after the user clicks the
sound toggle in the nav, per browser autoplay policy. Until this file is
final, clicking the toggle shows a toast explaining the track isn't ready
instead of playing silence or a stock track.
