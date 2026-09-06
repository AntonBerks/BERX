export type BerxAccentRole = 'primary' | 'secondary' | 'tertiary' | 'quaternary';
export type BerxMotionLevel = 'cinematic' | 'standard' | 'reduced';

export interface BerxDesignPolicy {
  zero2DPrimary: true;
  singleWorldSource: true;
  primaryBackground: '#07080A';
  primaryAccent: '#4FD6E8';
  allowPurpleDominant: false;
  allowRandomVisualState: false;
  allowDemoEntities: false;
  allowDomAsWorldSource: false;
  allowCapabilityClaimWithoutEvidence: false;
  depth: {
    worldSpaceUI: true;
    parallax: true;
    volumetricLighting: true;
    physicallyBasedMaterials: true;
  };
  motion: {
    defaultLevel: BerxMotionLevel;
    reducedMotionSupported: true;
    cameraTransitions: true;
    temporalTransitions: true;
  };
  haptics: { enabled: true; intensityNormalized: true };
  spatialAudio: { enabled: true; positional: true; doppler: true; reverb: true };
  typography: {
    adaptiveScale: true;
    worldSpaceText: true;
    minimumLegibility: true;
  };
  accessibility: {
    highContrast: true;
    reducedMotion: true;
    reducedTransparency: true;
    keyboard: true;
    screenReaderBridge: true;
  };
}

export const BERX_FULL_MAX_5D_DESIGN_POLICY: BerxDesignPolicy = {
  zero2DPrimary: true,
  singleWorldSource: true,
  primaryBackground: '#07080A',
  primaryAccent: '#4FD6E8',
  allowPurpleDominant: false,
  allowRandomVisualState: false,
  allowDemoEntities: false,
  allowDomAsWorldSource: false,
  allowCapabilityClaimWithoutEvidence: false,
  depth: {
    worldSpaceUI: true,
    parallax: true,
    volumetricLighting: true,
    physicallyBasedMaterials: true,
  },
  motion: {
    defaultLevel: 'cinematic',
    reducedMotionSupported: true,
    cameraTransitions: true,
    temporalTransitions: true,
  },
  haptics: { enabled: true, intensityNormalized: true },
  spatialAudio: { enabled: true, positional: true, doppler: true, reverb: true },
  typography: { adaptiveScale: true, worldSpaceText: true, minimumLegibility: true },
  accessibility: {
    highContrast: true,
    reducedMotion: true,
    reducedTransparency: true,
    keyboard: true,
    screenReaderBridge: true,
  },
};

export interface BerxDesignRuntimeEvidence {
  rendererVerified: boolean;
  visualFeaturesVerified: boolean;
  platformVerified: boolean;
  evidence: string;
}

export function canUseFullMax5DDesign(evidence: BerxDesignRuntimeEvidence): boolean {
  return evidence.rendererVerified && evidence.visualFeaturesVerified && evidence.platformVerified;
}
