/** Real media-to-space contract. URI/media identity remains owned by the existing BERX media API. */
import type {BerxSpatialObject} from './world';

export interface BerxSpatialMediaSurface {
  mediaId: string;
  uri: string;
  mimeType?: string;
  width?: number;
  height?: number;
  aspectRatio: number;
  objectId: string;
  fit: 'cover'|'contain';
  opacity: number;
}

export function createMediaSurface(object: BerxSpatialObject, media: Omit<BerxSpatialMediaSurface,'objectId'>): BerxSpatialMediaSurface {
  return {
    ...media,
    objectId: object.id,
    aspectRatio: media.aspectRatio > 0 ? media.aspectRatio : 1,
    opacity: Math.max(0, Math.min(1, media.opacity)),
  };
}
