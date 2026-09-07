/**
 * Spatial ids for the things the voice creates.
 *
 * Its own file so the voice does not import from @berx/scenes: the core
 * must not depend on the layer above it, and a letter of a name is a
 * spatial entity like any other.
 */
export function berxSpatialId(kind: string, id: string | number): string {
	return `${kind}:${id}`;
}
