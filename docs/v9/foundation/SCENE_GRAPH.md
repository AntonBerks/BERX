# Spatial Scene Graph

A BERX screen is a scene, not a flat canvas.

```text
Scene
 ├─ Environment D0
 ├─ Media atmosphere D1
 ├─ Glass structure D2
 ├─ Primary content D3
 ├─ Controls / identity D4
 └─ Focus / energy D5
```

Each node declares:
`id, role, depth, x/y/z, scale, opacity, material, lightRecipe, interaction, accessibilityLabel, transitionId`.

### Camera
Default perspective is subtle. The user should feel depth before noticing "3D".
Do not rotate whole pages. Use micro parallax and local object transforms.
