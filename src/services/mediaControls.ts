import { setAudioModeAsync } from 'expo-audio';
import { Track } from './musicApi';

/**
 * Groovli Media Controls Service
 * Uses expo-audio native MediaSession via `setActiveForLockScreen`.
 */

export interface MediaControlActions {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
}

export const initializeMediaControls = async (
  actions: MediaControlActions
): Promise<boolean> => {
  try {
    // expo-audio AudioMode: requires shouldPlayInBackground for background audio
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
    });
    console.log('[MediaControls] ✓ Audio mode initialized for background playback');
    return true;
  } catch (err) {
    console.error('[MediaControls] Init error:', err);
    return false;
  }
};

export const showMediaNotification = async (
  track: Track,
  isPlaying: boolean
): Promise<void> => {
  // Handled automatically by expo-audio's setActiveForLockScreen in PlayerContext
};

export const updateMediaMetadata = async (track: Track, isPlaying: boolean): Promise<void> => {
  // Handled automatically by expo-audio's setActiveForLockScreen in PlayerContext
};

export const dismissMediaNotification = async (): Promise<void> => {
  // Handled automatically by expo-audio when player is destroyed
};

export const cleanupMediaControls = (): void => {
  // No-op
};
