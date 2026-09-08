//! The chamfer, vertex for vertex against the web's own generator.
//!
//! Three backends build their own meshes, and a chamfer that differed
//! between them would be a different SHAPE — which the cross-renderer
//! comparison would catch as a silhouette disagreement, hundreds of
//! frames and several minutes later. This catches it in milliseconds,
//! and it catches the thing that actually matters: the numbers.
//!
//! The expected values are the web generator's real output, pasted in.
//! That duplication is the test: if either side changes, they disagree.

use berx_spatial_native::mesh::bevel_box_mesh;

#[test]
fn the_chamfer_is_the_same_shape_in_rust_as_it_is_on_the_web() {
    let m = bevel_box_mesh(1.0, 1.0, 0.32, 0.1);
    assert_eq!(m.vertices.len(), 336, "56 vertices of six floats: two faces, four sides, eight chamfer bands");
    assert_eq!(m.indices.len(), 84, "14 quads, two triangles each");

    /* The first face, inset by the bevel, and the first side — enough to
       pin the inset arithmetic, the winding and the normals. */
    let head: Vec<f32> = m.vertices[0..24].to_vec();
    assert_eq!(
        head,
        vec![
            -0.4, -0.4, 0.16, 0.0, 0.0, 1.0,
            0.4, -0.4, 0.16, 0.0, 0.0, 1.0,
            0.4, 0.4, 0.16, 0.0, 0.0, 1.0,
            -0.4, 0.4, 0.16, 0.0, 0.0, 1.0,
        ],
        "the front face is inset by the bevel on both axes and sits at full depth"
    );

    /* A chamfer band's normal is at 45 degrees — which is the entire
       point of the geometry: a face-on card with a grazing angle. */
    let bands = &m.vertices[6 * 24..];
    let r = std::f32::consts::FRAC_1_SQRT_2;
    assert!(
        (bands[3] - 0.0).abs() < 1e-6 && (bands[4] + r).abs() < 1e-6 && (bands[5] - r).abs() < 1e-6,
        "the first chamfer normal is (0, -1/sqrt2, 1/sqrt2): angled, so it catches the room where a flat face never could"
    );
}

#[test]
fn a_bevel_can_never_eat_the_face_it_is_meant_to_edge() {
    /* Asked for more bevel than the box has room for. */
    let m = bevel_box_mesh(1.0, 1.0, 0.32, 5.0);
    assert_eq!(m.vertices.len(), 336, "still a chamfered box rather than a degenerate one");
    let plain = bevel_box_mesh(1.0, 1.0, 0.32, 0.0);
    assert_eq!(plain.vertices.len(), 144, "zero bevel falls back to the plain box, six faces");
}
