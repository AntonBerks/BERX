# BERX — production package

Static site, no build step. `index.html` is the entry point.

## Structure

```
berx/
├─ index.html                  ← entry point
├─ robots.txt
├─ sitemap.xml
├─ media.manifest.json         ← brand/media asset status (placeholder|final)
├─ README.md                   ← this file
├─ styles/
│  └─ berx.css                 ← all site CSS (tokens, intro, nav, hero, demos)
├─ scripts/
│  └─ berx.js                  ← intro orchestrator, parallax, demos, a11y, media manifest fetch
├─ data/
│  ├─ feed.json                ← sample feed content (integration point)
│  └─ events.json              ← sample events content (integration point)
└─ assets/
   ├─ brand/                   ★ FINAL brand assets live here (status: final)
   │  ├─ berx-symbol.svg / berx-logo-wordmark.svg / berx-logo-lockup.svg
   │  ├─ berx-logo-animated.svg   (SMIL draw-on + glow pulse, no JS required)
   │  └─ favicon/ (favicon.svg, favicon.ico, apple-touch-icon-180.png,
   │      berx-icon-192.png, berx-icon-512.png, berx-icon-maskable-512.png,
   │      site.webmanifest)
   ├─ icons/
   │  ├─ berx-icons.svg        ← custom SVG icon sprite (<symbol id="i-…">)
   │  └─ app/                  ← final app-icon raster set (1024→40px, status: final)
   ├─ media/
   │  ├─ video/   berx-trailer.poster.jpg is FINAL; .mp4/.webm/.vtt/hero-ambient-loop.mp4
   │  │           are still the missing production files — see video/README.md
   │  ├─ audio/   atmosphere track — still missing, see audio/README.md
   │  ├─ photo/   city, product, team — still missing, see each README.md
   │  │           (BERX-Media-Pack photography board is reference-only, not
   │  │           licensed final photography — intentionally not substituted)
   │  ├─ atmosphere/berx-atmosphere-wallpaper-01.jpg  ← final generative wallpaper
   │  └─ og/berx-og-1200x630.jpg  ← final Open Graph / social preview image
```

Brand identity (logo system, app icons, OG image, trailer poster, atmosphere
wallpaper) is **final** — generated from the approved BERX Media Pack visual
direction (Obsidian Black / Electric Blue / Aurora Violet / Neon Cyan, no
gold), marked `"status": "final"` in `media.manifest.json`.

Trailer video/webm/captions, the hero ambient loop, the atmosphere soundtrack,
and location photography are genuinely **not yet produced** — real video,
licensed photography and audio can't be generated in this environment, so
those integration points are left exactly as honest placeholders
(`data-asset-status="placeholder"` / `"status": "placeholder"`). Drop the
final files into their existing folders and flip `status` to `"final"` —
no code changes required.

## Nginx (Ubuntu) deployment

1. Upload the contents of this `berx/` folder to e.g. `/var/www/berx`
   (everything except `assets/_dev/`, which should never ship).
2. Example server block:

```nginx
server {
    listen 80;
    server_name berx.online www.berx.online;
    root /var/www/berx;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location = /robots.txt { access_log off; }
    location = /sitemap.xml { access_log off; }

    location /assets/ {
        expires 30d;
        access_log off;
    }
    location ~* \.(?:css|js)$ {
        expires 7d;
        access_log off;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}
```

3. Point DNS, add TLS (e.g. `certbot --nginx -d berx.online -d www.berx.online`), reload:
   `sudo nginx -t && sudo systemctl reload nginx`.

## QA flags

- `?intro=full` — always play the full cinematic intro
- `?intro=off` — skip intro entirely
- `?dev=1` — show yellow "TEMP ASSET" badges on every placeholder asset
