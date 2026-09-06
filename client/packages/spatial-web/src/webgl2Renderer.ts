import type { Berx5DFrame, BerxSpatialRenderer } from '@berx/spatial';
import { BerxThreeRuntimeRenderer } from './threeRuntime';

/**
 * Concrete adapter for the shared renderer contract. The underlying backend
 * is raw WebGL2 today; the contract deliberately leaves room for a future
 * Three/WebGPU backend without leaking it into the spatial domain.
 */
export class BerxWebGL2Renderer implements BerxSpatialRenderer {
  readonly kind='webgl2' as const;
  readonly capabilities={perspective:true,depthBuffer:true,physicallyLitMaterials:true,shadows:false,postProcessing:false};
  private readonly backend:BerxThreeRuntimeRenderer;
  constructor(canvas:HTMLCanvasElement){this.backend=new BerxThreeRuntimeRenderer(canvas);}
  resize(width:number,height:number){this.backend.resize(width,height);}
  render(frame:Berx5DFrame){this.backend.sync(frame);}
  dispose(){this.backend.dispose();}
}
