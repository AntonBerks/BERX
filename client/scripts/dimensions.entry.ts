/**
 * Node entry for the five-dimensions gate.
 *
 * The world application itself, driven the way the product drives it —
 * not a fixture built to pass. What goes in is the shape the API
 * returns, through the same mappers the running shell uses.
 */
export {
	Berx5DWorldApp, berxTemporalCursor, berxProjectTemporal, berxApplyTemporal,
	berxRelationalLayout, berxRelationalWeight, berxWorldBounds, regionForKind,
	berxBuildDrawList,
} from '@berx/spatial';
export {mapUserToSpatial, mapFeedItemToSpatial, mapPlaceToSpatial, mapEventToSpatial} from '@berx/scenes';
