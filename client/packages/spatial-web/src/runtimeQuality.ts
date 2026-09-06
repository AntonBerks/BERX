/**
 * BERX 5D adaptive quality policy. It degrades effects, never spatial truth.
 *
 * Every field here is something the renderer actually reads. It used
 * to promise `shadows` and `postFx` as well, on a backend that has one
 * forward pass, no shadow map and no post chain — so three of the four
 * tiers advertised two capabilities that did not exist, and a
 * verification asserted that reduced motion switched them off. Turning
 * off something that was never on is not a check. They are gone; what
 * remains is resolution, how many objects are drawn, and whether the
 * world breathes.
 *
 * When a shadow pass or a post chain is genuinely implemented, they
 * come back here — as fields the renderer branches on.
 */
export type BerxSpatialQuality='cinematic'|'high'|'balanced'|'conservative';
export interface BerxSpatialQualityInput { devicePixelRatio:number; width:number; height:number; reducedMotion:boolean; visibleObjectCount:number; }
export interface BerxSpatialQualityResult {
  quality:BerxSpatialQuality;
  /** Backing-store scale. Capped below the device's own ratio under load. */
  pixelRatio:number;
  /** How many of the frame's visible objects are drawn, nearest first. */
  maxObjects:number;
  /** Whether the world keeps its idle motion. Always false under reduced motion. */
  ambientMotion:boolean;
}

/** Ordered heaviest to lightest, so a tier can be compared, not just named. */
export const BERX_SPATIAL_QUALITY_ORDER:readonly BerxSpatialQuality[]=['cinematic','high','balanced','conservative'];

export function resolveSpatialQuality(input:BerxSpatialQualityInput):BerxSpatialQualityResult {
  const pixels=Math.max(1,input.width*input.height);
  /* objects to shade, weighted by how many real pixels each one costs */
  const load=input.visibleObjectCount*Math.max(1,input.devicePixelRatio)/Math.sqrt(pixels/1000000);
  /* Reduced motion is a stated preference, not a measurement: it wins
     over any load reading, including a load light enough for cinematic. */
  if(input.reducedMotion) return {quality:'conservative',pixelRatio:Math.min(1.5,input.devicePixelRatio),maxObjects:40,ambientMotion:false};
  if(load<55 && input.devicePixelRatio<=2.5) return {quality:'cinematic',pixelRatio:Math.min(2.25,input.devicePixelRatio),maxObjects:120,ambientMotion:true};
  if(load<110) return {quality:'high',pixelRatio:Math.min(2,input.devicePixelRatio),maxObjects:100,ambientMotion:true};
  if(load<180) return {quality:'balanced',pixelRatio:Math.min(1.75,input.devicePixelRatio),maxObjects:80,ambientMotion:true};
  return {quality:'conservative',pixelRatio:Math.min(1.5,input.devicePixelRatio),maxObjects:60,ambientMotion:false};
}
