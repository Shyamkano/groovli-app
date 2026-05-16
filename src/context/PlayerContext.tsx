import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { fetchSong, fetchLyrics, ApiSongDetail, BASE_URL, Track } from '../services/musicApi';
import { useAuth } from './AuthContext';
import axios from 'axios';
import {
  initializeMediaControls,
  updateMediaMetadata,
  cleanupMediaControls,
} from '../services/mediaControls';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  currentTime: number;
  durationSeconds: number;
  repeatMode: 0 | 1 | 2;
  showMiniPlayer: boolean;
  playerView: 'cover' | 'lyrics' | 'queue';
  queue: Track[];
  likedTracks: Track[];
  history: Track[];
  lyrics: string;
  lyricsLoading: boolean;
  togglePlay: () => Promise<void>;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  handleNext: () => Promise<void>;
  handlePrev: () => Promise<void>;
  seekTo: (ratio: number) => Promise<void>;
  toggleRepeat: () => void;
  toggleLike: (trackId: string) => void;
  setShowMiniPlayer: (v: boolean) => void;
  setPlayerView: (v: 'cover' | 'lyrics' | 'queue') => void;
  formatTime: (secs: number) => string;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  savedCollections: SavedCollection[];
  toggleSaveCollection: (collection: SavedCollection) => void;
  clearHistory: () => void;
}

export interface SavedCollection {
  id: string;
  type: 'playlist' | 'album' | 'artist';
  title: string;
  subtitle?: string;
  image: string;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const { user } = useAuth();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<0 | 1 | 2>(0);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [playerView, setPlayerView] = useState<'cover' | 'lyrics' | 'queue'>('cover');
  const [lyrics, setLyrics] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // expo-audio player ref (replaces expo-av Audio.Sound)
  const playerRef = useRef<AudioPlayer | null>(null);
  const statusListenerRef = useRef<any>(null);

  const queueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const lastFinishedId = useRef<string | null>(null);
  const repeatModeRef = useRef<0 | 1 | 2>(0);
  const playRequestIdRef = useRef<number>(0);

  // Keep refs in sync
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // Update lock screen notification when track or isPlaying changes
  useEffect(() => {
    if (currentTrack && showMiniPlayer) {
      updateMediaMetadata(currentTrack, isPlaying);
    }
  }, [isPlaying, currentTrack, showMiniPlayer]);

  // ── Playback status callback ──────────────────────────────────────────────
  // NOTE: expo-audio uses seconds (not ms), and 'playing' (not 'isPlaying')
  const onPlaybackStatusUpdate = async (status: any) => {
    if (!status.isLoaded) {
      if (status.error) console.error(`FATAL PLAYER ERROR: ${status.error}`);
      return;
    }

    setIsPlaying(status.playing);

    const pos = status.currentTime ?? 0; // already in seconds
    if (Math.abs(pos - currentTime) > 0.8) setCurrentTime(pos);
    setDurationSeconds(status.duration ?? 0); // already in seconds

    if (
      status.didJustFinish &&
      currentTrackRef.current?.id !== lastFinishedId.current
    ) {
      lastFinishedId.current = currentTrackRef.current?.id || null;
      await handleNext();
    }
  };

  // ── Cleanup helper ────────────────────────────────────────────────────────
  const _destroyPlayer = () => {
    statusListenerRef.current?.remove();
    statusListenerRef.current = null;
    if (playerRef.current) {
      try { playerRef.current.pause(); } catch (_) {} // stop audio immediately
      playerRef.current.remove();
      playerRef.current = null;
    }
  };

  // ── Initial setup ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Audio session + notification channel initialized inside initializeMediaControls
    return () => {
      _destroyPlayer();
      cleanupMediaControls();
    };
  }, []);

  // ── playTrack ─────────────────────────────────────────────────────────────
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    try {
      setIsLoading(true);
      const currentRequestId = ++playRequestIdRef.current;

      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        queueRef.current = newQueue;
      }

      _destroyPlayer();

      // Offline cache check
      const localUri = FileSystem.documentDirectory + 'track_' + track.id + '.m4a';
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      let streamUrl = '';
      let songDetail: ApiSongDetail | null = null;

      if (fileInfo.exists) {
        streamUrl = localUri;
        songDetail = {
          id: track.id, title: track.title, artist: track.artistName,
          album: track.albumTitle || '', image: track.cover,
          duration: track.duration || '0', has_lyrics: false, audio_url: '',
        };
      } else {
        try {
          songDetail = await fetchSong(track.id);
          streamUrl = songDetail.audio_url;
          FileSystem.downloadAsync(streamUrl, localUri).catch(() => {});
        } catch (e) {
          throw new Error('Offline and not cached');
        }
      }

      if (!songDetail) return;
      if (playRequestIdRef.current !== currentRequestId) return; // Abort if another track was played while fetching

      // Stop any audio that might have started from a concurrent fetch
      _destroyPlayer();

      const enrichedTrack: Track = {
        ...track,
        title: songDetail.title,
        artistName: songDetail.artist,
        cover: songDetail.image,
        albumTitle: songDetail.album,
        album_id: songDetail.album_id,
        artist_id: songDetail.artist_id,
        liked: likedTracks.some(lt => lt.id === track.id),
      };

      currentTrackRef.current = enrichedTrack;
      setCurrentTrack(enrichedTrack);

      // ── expo-audio: create player and attach status listener ──────────────
      const player = createAudioPlayer({ uri: streamUrl });
      player.loop = repeatModeRef.current === 2;

      statusListenerRef.current = player.addListener(
        'playbackStatusUpdate',
        onPlaybackStatusUpdate
      );

      player.setActiveForLockScreen(true, {
        title: enrichedTrack.title,
        artist: enrichedTrack.artistName,
        albumTitle: enrichedTrack.albumTitle,
        artworkUrl: enrichedTrack.cover,
      });

      player.play();
      playerRef.current = player;

      setHistory(prev => {
        const updated = [enrichedTrack, ...prev.filter(t => t.id !== enrichedTrack.id)].slice(0, 30);
        AsyncStorage.setItem('@history', JSON.stringify(updated));
        return updated;
      });
      setShowMiniPlayer(true);
      setIsLoading(false);
      setIsPlaying(true);

      // Always attempt to fetch lyrics because the API sometimes incorrectly returns has_lyrics: false
      setLyricsLoading(true);
      fetchLyrics(track.id)
        .then(setLyrics)
        .catch(() => setLyrics(''))
        .finally(() => setLyricsLoading(false));

      // Background discovery queue
      if (songDetail.audio_url && (!newQueue || newQueue.length === 0)) {
        axios.get(`${BASE_URL}/api/search/songs`, { params: { query: track.artistName, limit: 12 } })
          .then(res => {
            const data = (res.data as any)?.data || [];
            const discovery = [enrichedTrack, ...data.map((s: any) => ({
              id: s.id, title: s.title, artistName: s.artist,
              cover: s.image, color: '#1d1d1d',
              artist_id: s.artist_id, album_id: s.album_id, liked: false,
            })).filter((t: any) => t.id !== track.id)];
            setQueue(discovery);
          }).catch(() => {});
      }

    } catch (err) {
      console.error('Play error:', err);
      setIsLoading(false);
    }
  };

  // ── togglePlay ────────────────────────────────────────────────────────────
  const togglePlay = async () => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.playing) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Toggle play error', e);
    }
  };

  // ── handleNext ────────────────────────────────────────────────────────────
  const handleNext = async () => {
    const activeQueue = queueRef.current;
    const activeTrack = currentTrackRef.current;

    if (repeatModeRef.current === 2 && playerRef.current) {
      playerRef.current.seekTo(0); // expo-audio: seconds
      playerRef.current.play();
      return;
    }

    const currentIndex = activeQueue.findIndex(t => t.id === activeTrack?.id);
    if (currentIndex !== -1 && currentIndex < activeQueue.length - 1) {
      await playTrack(activeQueue[currentIndex + 1]);
    } else if (repeatModeRef.current === 1 && activeQueue.length > 0) {
      await playTrack(activeQueue[0]);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // ── handlePrev ────────────────────────────────────────────────────────────
  const handlePrev = async () => {
    const activeQueue = queueRef.current;
    const activeTrack = currentTrackRef.current;
    const currentIndex = activeQueue.findIndex(t => t.id === activeTrack?.id);
    if (currentIndex > 0) await playTrack(activeQueue[currentIndex - 1]);
  };

  // ── seekTo ────────────────────────────────────────────────────────────────
  const seekTo = async (ratio: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(ratio * durationSeconds); // expo-audio: seconds
    }
  };

  // ── formatTime ────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    if (!secs) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // ── toggleRepeat ──────────────────────────────────────────────────────────
  const toggleRepeat = () => {
    const next = ((repeatMode + 1) % 3) as 0 | 1 | 2;
    setRepeatMode(next);
    if (playerRef.current) {
      playerRef.current.loop = (next === 2); // expo-audio: property assignment
    }
  };

  // ── Media controls init (stale-closure safe via refs) ─────────────────────
  const togglePlayRef = useRef<() => Promise<void>>(togglePlay);
  const handleNextRef = useRef<() => Promise<void>>(handleNext);
  const handlePrevRef = useRef<() => Promise<void>>(handlePrev);

  useEffect(() => { togglePlayRef.current = togglePlay; }, [togglePlay]);
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);
  useEffect(() => { handlePrevRef.current = handlePrev; }, [handlePrev]);

  useEffect(() => {
    initializeMediaControls({
      play:     () => togglePlayRef.current(),
      pause:    () => togglePlayRef.current(),
      next:     () => handleNextRef.current(),
      previous: () => handlePrevRef.current(),
    }).catch(err => console.log('[PlayerContext] Media controls init error:', err));
  }, []);

  // ── toggleLike ────────────────────────────────────────────────────────────
  const toggleLike = async (trackId: string) => {
    if (!user?.id) return;
    setLikedTracks(prev => {
      const isLiked = prev.some(t => t.id === trackId);
      const updated = isLiked
        ? prev.filter(t => t.id !== trackId)
        : [...prev, (currentTrack?.id === trackId ? currentTrack : queue.find(x => x.id === trackId)) || { id: trackId, title: 'Unknown', artistName: 'Unknown', cover: '', color: '#1A0A2E', liked: true }];
      AsyncStorage.setItem('@likedTracks', JSON.stringify(updated));
      axios.post(`${BASE_URL}/api/likes`, { userId: user.id, trackId }).catch(() => {});
      if (currentTrack?.id === trackId) {
        setCurrentTrack(prev => prev ? { ...prev, liked: !isLiked } : null);
      }
      return updated as Track[];
    });
  };

  const addToQueue  = (t: Track) => setQueue(prev => [...prev.filter(x => x.id !== t.id), t]);
  const playNext    = (t: Track) => {
    const idx = queue.findIndex(x => x.id === currentTrack?.id);
    const newQ = [...queue];
    newQ.splice(idx + 1, 0, t);
    setQueue(newQ);
  };
  const reorderQueue = (from: number, to: number) => {
    const newQ = [...queue];
    const [moved] = newQ.splice(from, 1);
    newQ.splice(to, 0, moved);
    setQueue(newQ);
  };
  const toggleSaveCollection = (c: SavedCollection) => {
    if (!user?.id) return;
    setSavedCollections(prev => {
      const exists = prev.some(x => x.id === c.id);
      const updated = exists ? prev.filter(x => x.id !== c.id) : [...prev, c];
      AsyncStorage.setItem('@savedCollections', JSON.stringify(updated));
      axios.post(`${BASE_URL}/api/user-playlists`, {
        userId: user.id, name: c.title, image: c.image, description: c.type,
      }).catch(() => {});
      return updated;
    });
  };

  // ── Load from storage ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@likedTracks');
        if (stored) setLikedTracks(JSON.parse(stored));
        const storedHistory = await AsyncStorage.getItem('@history');
        if (storedHistory) setHistory(JSON.parse(storedHistory));
        const storedCollections = await AsyncStorage.getItem('@savedCollections');
        if (storedCollections) setSavedCollections(JSON.parse(storedCollections));
        if (user?.id) {
          await axios.get(`${BASE_URL}/api/likes/${user.id}`).catch(() => {});
        }
      } catch (e) {
        console.error('Initial load error', e);
      }
    })();
  }, [user?.id]);

  const clearHistory = () => {
    setHistory([]);
    AsyncStorage.removeItem('@history');
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, isLoading,
      progress: durationSeconds > 0 ? currentTime / durationSeconds : 0,
      currentTime, durationSeconds, repeatMode,
      showMiniPlayer, playerView, queue, likedTracks, history, lyrics, lyricsLoading,
      togglePlay, playTrack, handleNext, handlePrev, seekTo,
      toggleRepeat, toggleLike, setShowMiniPlayer, setPlayerView, formatTime,
      addToQueue, playNext, reorderQueue, savedCollections, toggleSaveCollection, clearHistory,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
