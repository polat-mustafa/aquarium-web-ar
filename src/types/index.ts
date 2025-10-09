export type CreatureType =
  | 'shark'
  | 'dolphin'
  | 'turtle'
  | 'octopus'
  | 'jellyfish'
  | 'whale'
  | string; // Allow custom creature types

export type AnimationState = 'entrance' | 'idle' | 'specialAction';

export interface SeaCreature {
  id?: string;
  name: string;
  type: CreatureType;
  modelPath?: string; // Optional - for custom 3D models
  scale: number;
  position: [number, number, number];
  animations?: AnimationState[];
  description: string;
  animation?: AnimationState; // Current animation
}

export interface ARMarker {
  id: string;
  imagePath: string;
  creatureId: string;
  size: number;
}

export interface AppState {
  isARInitialized: boolean;
  isRecording: boolean;
  isLoading: boolean;
  activeCreature: SeaCreature | null;
  currentAnimation: AnimationState;
  recordedVideo: Blob | null;
  hasCameraPermission: boolean;
}

export interface AppActions {
  initializeAR: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  setActiveCreature: (creature: SeaCreature) => void;
  triggerSpecialAnimation: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export type AppStore = AppState & AppActions;

export interface RecordingConfig {
  maxDuration: number;
  quality: 'low' | 'medium' | 'high';
  includeAudio: boolean;
}

export interface ARSceneConfig {
  backgroundColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  fog: {
    enabled: boolean;
    color: string;
    near: number;
    far: number;
  };
}

export interface SocialShareConfig {
  handle: string;
  hashtag: string;
  messageTemplate: string;
}
