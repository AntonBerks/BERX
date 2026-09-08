//! The BERX primitive catalogue, tessellated on the CPU.
//!
//! A port of `primitiveGeometry.ts`, with the same parameters at the
//! same levels of detail, because the mesh is the one thing a renderer
//! genuinely has to own — buffers are per-API — and two backends that
//! tessellate the same form differently would never agree pixel for
//! pixel. The winding is the corrected winding: counter-clockwise seen
//! from outside, so back-face culling keeps the world rather than
//! discarding it, and the ring stands upright in XY rather than lying
//! flat where a camera at eye level sees a hairline.

pub struct Mesh {
    /// Interleaved position (3) and normal (3), stride 24 bytes.
    pub vertices: Vec<f32>,
    pub indices: Vec<u16>,
}

fn push(v: &mut Vec<f32>, x: f32, y: f32, z: f32, nx: f32, ny: f32, nz: f32) {
    v.extend_from_slice(&[x, y, z, nx, ny, nz]);
}

/// A box with its silhouette CHAMFERED, vertex for vertex the same as
/// createBevelBox in @berx/spatial-web's primitiveGeometry.
///
/// BERX's environment IS its own background — the sky is #07080A at the
/// horizon, which is the clear colour — so a diffuse face lit only by
/// the room is `sky x albedo` with albedo below one, and is therefore
/// always DARKER than the space around it. Measured on the real
/// product: a collection's face at exactly (7, 8, 10), the clear colour
/// to the last bit, with a hard step at its edge. A hole in the room
/// rather than an object in it.
///
/// A sphere never has this problem because it presents grazing angles,
/// where Fresnel lifts the specular environment and draws the rim that
/// separates a dark object from a dark background. A flat card has no
/// grazing angle anywhere. A chamfer gives it one — as geometry, so it
/// behaves from every angle and needs no outline shader, glow or second
/// light.
///
/// The bevel was in the shared geometry spec all along and no mesh
/// builder in any of the three backends ever read it.
/// A ring with a real cross-section — a torus, not a disc. Vertex for
/// vertex the same as createTorus in @berx/spatial-web.
///
/// The annulus this replaces had every normal at (0, 0, 1): a flat
/// washer facing the camera. On the real product that made an event
/// read as a uniform patch of #4FD6E8 with no shading and no depth in
/// it — the most "cheap UI" object in a frame where everything else has
/// material response, and for exactly the reason the flat slabs read as
/// holes. A face-on flat surface presents NO GRAZING ANGLE, so the
/// environment never lifts a rim off it and only a fill remains.
///
/// A swept circle has grazing angles all the way around, which is why
/// the orbs never had the problem.
pub fn torus_mesh(outer: f32, inner: f32, segments: u16, tube: u16) -> Mesh {
    let centre = (outer + inner) / 2.0;
    let r = ((outer - inner) / 2.0).max(1e-4);
    let mut v: Vec<f32> = Vec::new();
    let mut q: Vec<u16> = Vec::new();
    for i in 0..=segments {
        let a = i as f32 / segments as f32 * std::f32::consts::TAU;
        let (sa, ca) = a.sin_cos();
        for j in 0..=tube {
            let b = j as f32 / tube as f32 * std::f32::consts::TAU;
            let (sb, cb) = b.sin_cos();
            push(&mut v, (centre + r * cb) * ca, (centre + r * cb) * sa, r * sb, ca * cb, sa * cb, sb);
        }
    }
    let row = tube + 1;
    for i in 0..segments {
        for j in 0..tube {
            let a = i * row + j;
            let (b, c, d) = (a + 1, a + row, a + row + 1);
            q.extend_from_slice(&[a, c, b, b, c, d]);
        }
    }
    Mesh { vertices: v, indices: q }
}

pub fn bevel_box_mesh(width: f32, height: f32, depth: f32, bevel: f32) -> Mesh {
    let b = bevel
        .max(0.0)
        .min(width.min(height) * 0.4)
        .min(depth * 0.5);
    if b <= 0.0 {
        return box_mesh(width, height, depth);
    }
    let (x, y, z) = (width / 2.0, height / 2.0, depth / 2.0);
    let (ix, iy, iz) = (x - b, y - b, z - b);
    let mut v: Vec<f32> = Vec::new();
    let mut q: Vec<u16> = Vec::new();
    let mut quad = |p: [f32; 12], n: [f32; 3]| {
        let o = (v.len() / 6) as u16;
        for i in 0..4 {
            push(&mut v, p[i * 3], p[i * 3 + 1], p[i * 3 + 2], n[0], n[1], n[2]);
        }
        q.extend_from_slice(&[o, o + 1, o + 2, o, o + 2, o + 3]);
    };
    let r = std::f32::consts::FRAC_1_SQRT_2;
    /* the two faces, inset by the bevel */
    quad([-ix, -iy, z, ix, -iy, z, ix, iy, z, -ix, iy, z], [0.0, 0.0, 1.0]);
    quad([ix, -iy, -z, -ix, -iy, -z, -ix, iy, -z, ix, iy, -z], [0.0, 0.0, -1.0]);
    /* the four sides, inset in depth */
    quad([x, -iy, iz, x, -iy, -iz, x, iy, -iz, x, iy, iz], [1.0, 0.0, 0.0]);
    quad([-x, -iy, -iz, -x, -iy, iz, -x, iy, iz, -x, iy, -iz], [-1.0, 0.0, 0.0]);
    quad([-ix, y, iz, ix, y, iz, ix, y, -iz, -ix, y, -iz], [0.0, 1.0, 0.0]);
    quad([-ix, -y, -iz, ix, -y, -iz, ix, -y, iz, -ix, -y, iz], [0.0, -1.0, 0.0]);
    /* THE CHAMFERS: the bands that catch the room, at 45 degrees */
    quad([-ix, -y, iz, ix, -y, iz, ix, -iy, z, -ix, -iy, z], [0.0, -r, r]);
    quad([-ix, iy, z, ix, iy, z, ix, y, iz, -ix, y, iz], [0.0, r, r]);
    quad([x, -iy, iz, x, iy, iz, ix, iy, z, ix, -iy, z], [r, 0.0, r]);
    quad([-ix, -iy, z, -ix, iy, z, -x, iy, iz, -x, -iy, iz], [-r, 0.0, r]);
    quad([ix, -y, -iz, -ix, -y, -iz, -ix, -iy, -z, ix, -iy, -z], [0.0, -r, -r]);
    quad([ix, iy, -z, -ix, iy, -z, -ix, y, -iz, ix, y, -iz], [0.0, r, -r]);
    quad([x, iy, -iz, x, -iy, -iz, ix, -iy, -z, ix, iy, -z], [r, 0.0, -r]);
    quad([-x, -iy, -iz, -x, iy, -iz, -ix, iy, -z, -ix, -iy, -z], [-r, 0.0, -r]);
    Mesh { vertices: v, indices: q }
}

pub fn box_mesh(width: f32, height: f32, depth: f32) -> Mesh {
    let (x, y, z) = (width / 2.0, height / 2.0, depth / 2.0);
    let faces: [[f32; 15]; 6] = [
        [-x, -y, z, x, -y, z, x, y, z, -x, y, z, 0.0, 0.0, 1.0],
        [x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z, 0.0, 0.0, -1.0],
        [-x, y, z, x, y, z, x, y, -z, -x, y, -z, 0.0, 1.0, 0.0],
        [-x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z, 0.0, -1.0, 0.0],
        [x, -y, z, x, -y, -z, x, y, -z, x, y, z, 1.0, 0.0, 0.0],
        [-x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z, -1.0, 0.0, 0.0],
    ];
    let mut v = Vec::new();
    for f in faces.iter() {
        for i in 0..4 {
            push(&mut v, f[i * 3], f[i * 3 + 1], f[i * 3 + 2], f[12], f[13], f[14]);
        }
    }
    let mut q = Vec::new();
    for i in 0..6u16 {
        let o = i * 4;
        q.extend_from_slice(&[o, o + 1, o + 2, o, o + 2, o + 3]);
    }
    Mesh { vertices: v, indices: q }
}

pub fn sphere_mesh(radius: f32, segments: u16, rings: u16) -> Mesh {
    let mut v = Vec::new();
    let mut q = Vec::new();
    for y in 0..=rings {
        let py = y as f32 / rings as f32 * std::f32::consts::PI;
        let (sy, sr) = (py.cos(), py.sin());
        for x in 0..=segments {
            let a = x as f32 / segments as f32 * std::f32::consts::PI * 2.0;
            let (c, s) = (a.cos(), a.sin());
            push(&mut v, radius * sr * c, radius * sy, radius * sr * s, sr * c, sy, sr * s);
        }
    }
    for y in 0..rings {
        for x in 0..segments {
            let a = y * (segments + 1) + x;
            let b = a + 1;
            let c = a + segments + 1;
            let d = c + 1;
            q.extend_from_slice(&[a, b, c, b, d, c]);
        }
    }
    Mesh { vertices: v, indices: q }
}

pub fn ring_mesh(outer: f32, inner: f32, segments: u16) -> Mesh {
    let mut v = Vec::new();
    let mut q = Vec::new();
    for i in 0..segments {
        let a = i as f32 / segments as f32 * std::f32::consts::PI * 2.0;
        let (c, s) = (a.cos(), a.sin());
        push(&mut v, outer * c, outer * s, 0.0, 0.0, 0.0, 1.0);
        push(&mut v, inner * c, inner * s, 0.0, 0.0, 0.0, 1.0);
    }
    let back = segments * 2;
    for i in 0..segments {
        let a = i as f32 / segments as f32 * std::f32::consts::PI * 2.0;
        let (c, s) = (a.cos(), a.sin());
        push(&mut v, outer * c, outer * s, 0.0, 0.0, 0.0, -1.0);
        push(&mut v, inner * c, inner * s, 0.0, 0.0, 0.0, -1.0);
    }
    for i in 0..segments {
        let n = (i + 1) % segments;
        let (a, b, c, d) = (i * 2, i * 2 + 1, n * 2, n * 2 + 1);
        q.extend_from_slice(&[a, c, b, b, c, d]);
    }
    for i in 0..segments {
        let n = (i + 1) % segments;
        let (a, b, c, d) = (back + i * 2, back + i * 2 + 1, back + n * 2, back + n * 2 + 1);
        q.extend_from_slice(&[a, b, c, b, d, c]);
    }
    Mesh { vertices: v, indices: q }
}

pub fn frame_mesh(width: f32, height: f32, bar: f32) -> Mesh {
    let parts = [
        box_mesh(width, bar, 0.12),
        box_mesh(width, bar, 0.12),
        box_mesh(bar, height, 0.12),
        box_mesh(bar, height, 0.12),
    ];
    let poses = [
        [0.0, height / 2.0, 0.0],
        [0.0, -height / 2.0, 0.0],
        [-width / 2.0, 0.0, 0.0],
        [width / 2.0, 0.0, 0.0],
    ];
    let mut v: Vec<f32> = Vec::new();
    let mut q: Vec<u16> = Vec::new();
    for (m, pose) in parts.iter().zip(poses.iter()) {
        let base = (v.len() / 6) as u16;
        let mut i = 0;
        while i < m.vertices.len() {
            push(
                &mut v,
                m.vertices[i] + pose[0],
                m.vertices[i + 1] + pose[1],
                m.vertices[i + 2] + pose[2],
                m.vertices[i + 3],
                m.vertices[i + 4],
                m.vertices[i + 5],
            );
            i += 6;
        }
        for idx in &m.indices {
            q.push(base + idx);
        }
    }
    Mesh { vertices: v, indices: q }
}

/// The mesh for a primitive at a level of detail.
///
/// The same table as the web backend's `meshFor`: `lod` 1 is the same
/// form with fewer segments, never a different or a dropped object.
/// An unknown primitive is an error, not a silent box — a form BERX
/// does not have must not be invented by the renderer.
pub fn mesh_for(primitive: &str, lod: u8) -> Result<Mesh, String> {
    let far = lod == 1;
    Ok(match primitive {
        "orb" => sphere_mesh(0.5, if far { 10 } else { 24 }, if far { 7 } else { 16 }),
        "ring" => torus_mesh(0.62, 0.42, if far { 18 } else { 48 }, if far { 6 } else { 12 }),
        "frame" => frame_mesh(1.0, 1.0, 0.12),
        "surface" => bevel_box_mesh(1.0, 1.0, 0.06, 0.02),
        "portal" => frame_mesh(1.0, 1.2, 0.16),
        "node" => sphere_mesh(0.58, if far { 9 } else { 20 }, if far { 6 } else { 12 }),
        "stack" => bevel_box_mesh(1.0, 1.0, 0.32, 0.1),
        "message" => bevel_box_mesh(1.0, 0.46, 0.12, 0.05),
        "create" => sphere_mesh(0.58, if far { 11 } else { 28 }, if far { 7 } else { 18 }),
        other => return Err(format!("BERX 5D native: unknown primitive '{other}'")),
    })
}
