# BERX Material System

Every glass/3D surface must declare:
- material;
- opacity/transmission;
- blur;
- roughness;
- specular;
- border luminance;
- shadow recipe;
- environment pickup;
- fallback material.

Never use arbitrary `backdrop-filter`, opacity or shadow values without a token/recipe.

### Surface recipes
- ClearGlass: primary floating cards.
- DeepGlass: dense navigation/control surfaces.
- FrostGlass: overlays and modal surfaces.
- Crystal: premium hero objects / verified states.
- DarkMetal: strong structural anchors.
- Carbon: secondary structural surfaces.
- LiquidGlass: high-value interactive objects.
- MediaSurface: photos/video/content.
- NeonEnergy: active state only.
- SoftLight: ambient halo only.

### Fallback
If blur/transmission is unavailable or too expensive:
glass → opaque surface + edge border + correct contrast.
3D → static 2D composition.
Parallax → cross-fade.
Refraction → highlight only.
