/** BERX 5D adaptive quality policy. It degrades effects, never spatial truth. */
export type BerxSpatialQuality='cinematic'|'high'|'balanced'|'conservative';
export interface BerxSpatialQualityInput { devicePixelRatio:number; width:number; height:number; reducedMotion:boolean; visibleObjectCount:number; }
export interface BerxSpatialQualityResult { quality:BerxSpatialQuality; pixelRatio:number; maxObjects:number; shadows:boolean; postFx:boolean; ambientMotion:boolean; }

export function resolveSpatialQuality(input:BerxSpatialQualityInput):BerxSpatialQualityResult {
  const pixels=Math.max(1,input.width*input.height);
  const load=input.visibleObjectCount*Math.max(1,input.devicePixelRatio)/Math.sqrt(pixels/1000000);
  if(input.reducedMotion) return {quality:'conservative',pixelRatio:Math.min(1.5,input.devicePixelRatio),maxObjects:40,shadows:false,postFx:false,ambientMotion:false};
  if(load<55 && input.devicePixelRatio<=2.5) return {quality:'cinematic',pixelRatio:Math.min(2.25,input.devicePixelRatio),maxObjects:120,shadows:true,postFx:true,ambientMotion:true};
  if(load<110) return {quality:'high',pixelRatio:Math.min(2,input.devicePixelRatio),maxObjects:100,shadows:true,postFx:true,ambientMotion:true};
  if(load<180) return {quality:'balanced',pixelRatio:Math.min(1.75,input.devicePixelRatio),maxObjects:80,shadows:false,postFx:true,ambientMotion:true};
  return {quality:'conservative',pixelRatio:Math.min(1.5,input.devicePixelRatio),maxObjects:60,shadows:false,postFx:false,ambientMotion:false};
}
