import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { fetchSong, fetchLyrics, ApiSongDetail, BASE_URL, Track } from '../services/musicApi';
import { useAuth } from './AuthContext';
import axios from 'axios';



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
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([]);
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
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const lastFinishedId = useRef<string | null>(null);

  // Keep refs in sync with state for access in callbacks
  useEffect(() => { 
    queueRef.current = queue; 
  }, [queue]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log('Audio mode error:', e);
      }
    };
    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = async (status: any) => {
    if (status.isLoaded) {
      if (status.isPlaying !== isPlaying) setIsPlaying(status.isPlaying);
      
      const pos = status.positionMillis / 1000;
      if (Math.abs(pos - currentTime) > 0.8) {
        setCurrentTime(pos);
      }
      setDurationSeconds((status.durationMillis || 0) / 1000);
      
      if (status.didJustFinish && currentTrackRef.current?.id !== lastFinishedId.current) {
        lastFinishedId.current = currentTrackRef.current?.id || null;
        await handleNext();
      }
    } else if (status.error) {
      console.error(`FATAL PLAYER ERROR: ${status.error}`);
    }
  };

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    try {
      setIsLoading(true);
      
      if (newQueue && newQueue.length > 0) {
        setQueue(newQueue);
        queueRef.current = newQueue;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Check for local cached file first (Offline Support)
      const localUri = FileSystem.documentDirectory + 'track_' + track.id + '.m4a';
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      let streamUrl = '';
      let songDetail: ApiSongDetail | null = null;

      if (fileInfo.exists) {
        streamUrl = localUri;
        // Use existing track data as the 'detail' if offline/cached
        songDetail = {
          id: track.id,
          title: track.title,
          artist: track.artistName,
          album: track.albumTitle || '',
          image: track.cover,
          duration: track.duration || '0',
          has_lyrics: false,
          audio_url: '',
        };
      } else {
        // Online: Fetch fresh details
        try {
          songDetail = await fetchSong(track.id);
          streamUrl = songDetail.audio_url;
          // Background download for future offline play
          FileSystem.downloadAsync(streamUrl, localUri).catch(() => {});
        } catch (e) {
          throw new Error('Offline and not cached');
        }
      }

      if (!songDetail) return;

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

      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl },
        { shouldPlay: true, isLooping: repeatMode === 2 },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setHistory(prev => {
        const updated = [enrichedTrack, ...prev.filter(t => t.id !== enrichedTrack.id)].slice(0, 30);
        AsyncStorage.setItem('@history', JSON.stringify(updated));
        return updated;
      });
      setShowMiniPlayer(true);
      setIsLoading(false);
      
      if (songDetail.has_lyrics) {
        setLyricsLoading(true);
        fetchLyrics(track.id)
          .then(setLyrics)
          .catch(() => setLyrics(''))
          .finally(() => setLyricsLoading(false));
      } else {
        setLyrics('');
        setLyricsLoading(false);
      }
      setIsPlaying(true);

      // Background discovery (only if online)
      if (songDetail.audio_url && (!newQueue || newQueue.length === 0)) {
        axios.get(`${BASE_URL}/api/search/songs`, { params: { query: track.artistName, limit: 12 } })
          .then(res => {
            const data = (res.data as any)?.data || [];
            const discovery = [enrichedTrack, ...data.map((s: any) => ({
              id: s.id, 
              title: s.title, 
              artistName: s.artist, 
              cover: s.image, 
              color: '#1d1d1d', 
              artist_id: s.artist_id,
              album_id: s.album_id,
              liked: false
            })).filter((t: any) => t.id !== track.id)];
            setQueue(discovery);
          }).catch(() => {});
      }

    } catch (err) {
      console.error('Play error:', err);
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Toggle play error', e);
    }
  };

  const handleNext = async () => {
    const activeQueue = queueRef.current;
    const activeTrack = currentTrackRef.current;
    
    if (repeatMode === 2 && soundRef.current) {
        await soundRef.current.replayAsync();
        return;
    }

    const currentIndex = activeQueue.findIndex(t => t.id === activeTrack?.id);
    if (currentIndex !== -1 && currentIndex < activeQueue.length - 1) {
      await playTrack(activeQueue[currentIndex + 1]);
    } else if (repeatMode === 1 && activeQueue.length > 0) {
      await playTrack(activeQueue[0]);
    } else {
        setIsPlaying(false);
        setCurrentTime(0);
    }
  };

  const handlePrev = async () => {
    const activeQueue = queueRef.current;
    const activeTrack = currentTrackRef.current;
    const currentIndex = activeQueue.findIndex(t => t.id === activeTrack?.id);
    if (currentIndex > 0) {
      await playTrack(activeQueue[currentIndex - 1]);
    }
  };

  const seekTo = async (ratio: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(ratio * durationSeconds * 1000);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const toggleRepeat = () => {
      const next = ((repeatMode + 1) % 3) as 0 | 1 | 2;
      setRepeatMode(next);
      if (soundRef.current) {
          soundRef.current.setIsLoopingAsync(next === 2);
      }
  };

  const toggleLike = async (trackId: string) => {
    if (!user?.id) return;
    setLikedTracks(prev => {
      const isLiked = prev.some(t => t.id === trackId);
      let updated;
      if (isLiked) {
        updated = prev.filter(t => t.id !== trackId);
      } else {
        const t = (currentTrack?.id === trackId ? currentTrack : queue.find(x => x.id === trackId)) || { id: trackId, title: 'Unknown', artistName: 'Unknown', cover: '', color: '#1A0A2E', liked: true };
        updated = [...prev, { ...t, liked: true }];
      }
      
      AsyncStorage.setItem('@likedTracks', JSON.stringify(updated));
      axios.post(`${BASE_URL}/api/likes`, { userId: user.id, trackId }).catch(() => {});
      
      if (currentTrack?.id === trackId) {
        setCurrentTrack(prevTrack => prevTrack ? { ...prevTrack, liked: !isLiked } : null);
      }
      return updated;
    });
  };

  const addToQueue = (t: Track) => setQueue(prev => [...prev.filter(x => x.id !== t.id), t]);
  const playNext = (t: Track) => {
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
        userId: user.id, 
        name: c.title, 
        image: c.image, 
        description: c.type 
      }).catch(() => {});
      
      return updated;
    });
  };

  // Initial load from storage and sync from server
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@likedTracks');
        if (stored) setLikedTracks(JSON.parse(stored));
        const storedHistory = await AsyncStorage.getItem('@history');
        if (storedHistory) setHistory(JSON.parse(storedHistory));
        const storedCollections = await AsyncStorage.getItem('@savedCollections');
        if (storedCollections) setSavedCollections(JSON.parse(storedCollections));

        // Background sync if user is logged in
        if (user?.id) {
          const [likesRes] = await Promise.all([
            axios.get(`${BASE_URL}/api/likes/${user.id}`).catch(() => ({ data: [] }))
          ]);
          // To properly restore, we'd need a bulk track fetcher, 
          // but for now we ensure local state reflects at least the IDs
          console.log('Syncing cloud likes for', user.id);
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
      currentTrack, isPlaying, isLoading, progress: durationSeconds > 0 ? currentTime / durationSeconds : 0,
      currentTime, durationSeconds, repeatMode,
      showMiniPlayer, playerView, queue, likedTracks, history, lyrics, lyricsLoading,
      togglePlay, playTrack, handleNext, handlePrev, seekTo,
      toggleRepeat, toggleLike, setShowMiniPlayer, setPlayerView, formatTime,
      addToQueue, playNext, reorderQueue, savedCollections, toggleSaveCollection, clearHistory
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
