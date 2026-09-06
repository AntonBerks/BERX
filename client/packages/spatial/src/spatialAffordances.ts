/** BERX 5D interaction layer: every visible object can expose real, inspectable affordances. */
import type {BerxSpatialObject} from './world';
import type {BerxSocialAction, BerxSpatialAffordance} from './socialActions';

export interface BerxSpatialObjectAffordances { objectId:string; affordances:BerxSpatialAffordance[]; }

const primaryByKind:Partial<Record<BerxSpatialObject['kind'],BerxSocialAction[]>>={
  person:['view-profile','message','follow'], moment:['open','like','comment','share','save'], place:['view-place','directions','reserve'], event:['view-event','attend','share'], experience:['view-experience','reserve','share'], community:['view-community','join','share'], business:['view-business','directions','reserve'], collection:['open','save','share'], message:['open','reply','react'], create:['create-moment','create-story','create-post'],
};

export function affordancesForObject(object:BerxSpatialObject, labels:Partial<Record<BerxSocialAction,string>>={}):BerxSpatialObjectAffordances {
  const actions=primaryByKind[object.kind]??['open'];
  return {objectId:object.id,affordances:actions.map((action,index)=>({id:`${object.id}:${action}`,objectId:object.id,action,state:object.interactive?'available':'disabled',label:labels[action]??action,accessibilityLabel:labels[action]??action,priority:index,serverRequired:action!=='open'&&action!=='focus'}))};
}
