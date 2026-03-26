import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder, Animated, ActivityIndicator, ScrollView, Share } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../data/mockData';
import { BASE_URL } from '../services/musicApi';
import axios from 'axios';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Heart,
  ChevronLeft,
  MoreVertical,
  Music,
  PlusCircle,
  User,
  Disc,
  Share2,
  Volume2,
  ListMusic,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const SEEK_WIDTH = width - 48;

const PlayerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    currentTrack,
    isPlaying,
    isLoading,
    progress,
    currentTime,
    durationSeconds,
    repeatMode,
    playerView,
    lyrics,
    lyricsLoading,
    togglePlay,
    handleNext,
    handlePrev,
    seekTo,
    toggleRepeat,
    toggleLike,
    setPlayerView,
    setShowMiniPlayer,
    formatTime,
    queue,
    addToQueue,
    playNext,
    reorderQueue,
    playTrack,
  } = usePlayer();

  const { user } = useAuth();
  const [optionsVisible, setOptionsVisible] = React.useState(false);
  const [showPlaylistPicker, setShowPlaylistPicker] = React.useState(false);
  const [myPlaylists, setMyPlaylists] = React.useState<any[]>([]);
  
  const lyricsScrollRef = useRef<ScrollView>(null);
  const seekAnim = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);

  const handleAddToPlaylistPrompt = async () => {
    if (!user) {
      alert("Please login to use playlists.");
      return;
    }
    setOptionsVisible(false);
    try {
       const res = await axios.get(`${BASE_URL}/api/user-playlists/${user.id}`);
       setMyPlaylists(res.data as any[]);
       setShowPlaylistPicker(true);
    } catch(e) {
       console.error(e);
       alert("Failed to load playlists");
    }
  };

  const addSongToPlaylist = async (playlistId: string) => {
    if (!currentTrack) return;
    setShowPlaylistPicker(false);
    try {
      await axios.post(`${BASE_URL}/api/user-playlists/${playlistId}/tracks`, { track: currentTrack });
      alert("Added to playlist!");
    } catch (e) {
      console.error(e);
      alert("Could not add to playlist");
    }
  };

  const lyricLines = lyrics
    ? lyrics.split('\n').filter((l) => l.trim() !== '')
    : [];

  const activeTime = Math.max(0, currentTime - 3);
  const activeDuration = Math.max(1, durationSeconds - 8);
  const approxLineIdx =
    lyricLines.length > 0
      ? Math.min(
          Math.floor((activeTime / activeDuration) * lyricLines.length),
          lyricLines.length - 1
        )
      : -1;

  useEffect(() => {
    if (playerView === 'lyrics' && lyricsScrollRef.current && approxLineIdx !== -1) {
      const lineHeight = 70;
      const targetY = Math.max(0, approxLineIdx * lineHeight - height / 4);
      lyricsScrollRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [approxLineIdx, playerView]);

  useEffect(() => {
    if (!isDragging.current) {
      seekAnim.setValue(progress * SEEK_WIDTH);
    }
  }, [progress]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this song: ${currentTrack?.title} by ${currentTrack?.artistName} on Groovli!`,
        url: currentTrack?.cover,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { isDragging.current = true; },
    onPanResponderMove: (_, gs) => {
      const val = Math.min(Math.max(0, gs.moveX - 24), SEEK_WIDTH);
      seekAnim.setValue(val);
    },
    onPanResponderRelease: (_, gs) => {
      const val = Math.min(Math.max(0, gs.moveX - 24), SEEK_WIDTH);
      seekAnim.setValue(val);
      seekTo(val / SEEK_WIDTH);
      isDragging.current = false;
    },
  });

  if (!currentTrack) return null;

  const repeatColor = repeatMode === 0 ? COLORS.textMuted : COLORS.accent;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: currentTrack.cover }}
        style={styles.bgImage}
        contentFit="cover"
        blurRadius={40}
      />
      <LinearGradient
        colors={[currentTrack.color + 'AA', 'rgba(0,0,0,0.85)', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>{currentTrack.albumTitle || currentTrack.artistName}</Text>
          <TouchableOpacity style={styles.topBtn} onPress={() => setOptionsVisible(true)}>
            <MoreVertical size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, playerView === 'cover' && styles.toggleActive]}
            onPress={() => setPlayerView('cover')}
          >
            <Text style={[styles.toggleText, playerView === 'cover' && styles.toggleTextActive]}>Media</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, playerView === 'lyrics' && styles.toggleActive]}
            onPress={() => setPlayerView('lyrics')}
          >
            <Text style={[styles.toggleText, playerView === 'lyrics' && styles.toggleTextActive]}>Lyrics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, playerView === 'queue' && styles.toggleActive]}
            onPress={() => setPlayerView('queue')}
          >
            <Text style={[styles.toggleText, playerView === 'queue' && styles.toggleTextActive]}>Up Next</Text>
          </TouchableOpacity>
        </View>

        {/* Main content */}
        <View style={{ flex: 1 }}>
          {playerView === 'cover' ? (
            <View style={styles.coverView}>
              <View style={[styles.artShadow, isPlaying && styles.artPlaying]}>
                <Image
                  source={{ uri: currentTrack.cover }}
                  style={styles.albumArt}
                  contentFit="cover"
                />
              </View>
            </View>
          ) : playerView === 'lyrics' ? (
            <ScrollView
              ref={lyricsScrollRef}
              style={styles.lyricsContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.lyricsScrollContent}
              scrollEventThrottle={16}
            >
              {lyricsLoading ? (
                <View style={styles.lyricsCentered}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.lyricsStatusText}>Fetching lyrics...</Text>
                </View>
              ) : lyricLines.length === 0 ? (
                <View style={styles.lyricsCentered}>
                  <Music size={48} color={COLORS.textMuted} />
                  <Text style={styles.noLyrics}>No lyrics found for this song</Text>
                </View>
              ) : (
                lyricLines.map((line, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.lyricLine,
                      i === approxLineIdx && styles.lyricLineActive,
                      i < approxLineIdx && styles.lyricLinePast,
                    ]}
                  >
                    {line}
                  </Text>
                ))
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          ) : (
            <ScrollView style={styles.queueContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.queueHeader}>Current Queue ({queue.length})</Text>
              {queue.map((t, idx) => (
                <TouchableOpacity key={`${t.id}-${idx}`} style={[styles.queueItem, t.id === currentTrack.id && { borderColor: COLORS.accent, borderWidth: 1 }]} onPress={() => playTrack(t, queue)}>
                  <Image source={{ uri: t.cover }} style={styles.queueThumb} />
                  <View style={styles.queueInfo}>
                    <Text style={[styles.queueTitle, t.id === currentTrack.id && { color: COLORS.accent }]} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>{t.artistName}</Text>
                  </View>
                  
                  {/* Move Up/Down controls */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, gap: 12 }}>
                    {idx > 1 && (
                      <TouchableOpacity onPress={() => reorderQueue(idx, idx - 1)} style={{ padding: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 18 }}>↑</Text>
                      </TouchableOpacity>
                    )}
                    {idx > 0 && idx < queue.length - 1 && (
                      <TouchableOpacity onPress={() => reorderQueue(idx, idx + 1)} style={{ padding: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 18 }}>↓</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {t.id === currentTrack.id && (
                    <View style={styles.playingIndicator}>
                      <Volume2 size={16} color={COLORS.accent} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <Text style={styles.queueHeader}>You Might Also Like</Text>
              {queue.slice(0, 6).map((t, idx) => (
                <TouchableOpacity key={`suggest-${t.id}-${idx}`} style={styles.queueItem} onPress={() => playNext(t)}>
                  <Image source={{ uri: t.cover }} style={styles.queueThumb} />
                  <View style={styles.queueInfo}>
                    <Text style={styles.queueTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>{t.artistName}</Text>
                  </View>
                  <Text style={{ color: COLORS.accent, fontFamily: 'Nunito-SemiBold', fontSize: 12, marginRight: 8 }}>Play Next</Text>
                  <PlusCircle size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
              <View style={{ height: 120 }} />
            </ScrollView>
          )}
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomSheet}>
          <View style={styles.trackInfo}>
            <View style={styles.trackText}>
              <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artistName}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleLike(currentTrack.id)}>
              <Heart
                size={26}
                color={currentTrack.liked ? COLORS.accent : '#fff'}
                fill={currentTrack.liked ? COLORS.accent : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.seekContainer} {...panResponder.panHandlers}>
            <View style={styles.seekTrack}>
              <Animated.View
                style={[
                  styles.seekFill,
                  {
                    width: seekAnim.interpolate({
                      inputRange: [0, SEEK_WIDTH],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
              <Animated.View style={[styles.seekThumb, { left: seekAnim }]} />
            </View>
            <View style={styles.seekTimes}>
              <Text style={styles.seekTime}>{formatTime(currentTime)}</Text>
              <Text style={styles.seekTime}>{formatTime(durationSeconds)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setPlayerView(playerView === 'queue' ? 'cover' : 'queue')}>
              <ListMusic 
                size={22} 
                color={playerView === 'queue' ? COLORS.accent : '#fff'} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePrev} style={styles.ctrlBtn}>
              <SkipBack size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : isPlaying ? (
                <Pause size={28} color="#000" />
              ) : (
                <Play size={28} color="#000" />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.ctrlBtn}>
              <SkipForward size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleRepeat}>
              <Repeat size={22} color={repeatColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Options Modal */}
        {optionsVisible && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setOptionsVisible(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Image source={{ uri: currentTrack.cover }} style={styles.modalArt} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{currentTrack.title}</Text>
                  <Text style={styles.modalArtist}>{currentTrack.artistName}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalOption, !currentTrack.artist_id && { opacity: 0.5 }]}
                onPress={() => {
                  if (currentTrack.artist_id) {
                    setOptionsVisible(false);
                    navigation.navigate('Artist', { artistId: currentTrack.artist_id, name: currentTrack.artistName });
                  } else {
                    // Fallback to search-based artist navigation if ID is missing
                    setOptionsVisible(false);
                    navigation.navigate('Artist', { artistId: 'search', name: currentTrack.artistName });
                  }
                }}
              >
                <User size={22} color="#fff" />
                <Text style={styles.modalOptionText}>View Artist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, !currentTrack.album_id && { opacity: 0.5 }]}
                onPress={() => {
                  if (currentTrack.album_id) {
                    setOptionsVisible(false);
                    navigation.navigate('Album', { albumId: currentTrack.album_id });
                  }
                }}
              >
                <Disc size={22} color="#fff" />
                <Text style={styles.modalOptionText}>View Album</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleAddToPlaylistPrompt}
              >
                <PlusCircle size={22} color="#fff" />
                <Text style={styles.modalOptionText}>Add to Playlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleShare}
              >
                <Share2 size={22} color="#fff" />
                <Text style={styles.modalOptionText}>Share Song</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { marginTop: 12, borderTopWidth: 0 }]}
                onPress={() => setOptionsVisible(false)}
              >
                <Text style={[styles.modalOptionText, { color: COLORS.textMuted, textAlign: 'center', width: '100%', marginLeft: 0 }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Playlist Picker Modal */}
        {showPlaylistPicker && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowPlaylistPicker(false)} />
            <View style={[styles.modalContent, { maxHeight: height * 0.6 }]}>
              <Text style={[styles.modalTitle, { marginBottom: 20 }]}>Select a Playlist</Text>
              <ScrollView>
                {myPlaylists.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 20 }}>No playlists found. Create one first!</Text>
                ) : (
                  myPlaylists.map(pl => (
                    <TouchableOpacity key={pl.id} style={styles.modalOption} onPress={() => addSongToPlaylist(pl.id)}>
                      <Disc size={22} color={COLORS.accent} />
                      <Text style={styles.modalOptionText}>{pl.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  topBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: COLORS.textSecondary, fontFamily: 'Nunito-SemiBold', fontSize: 13, flex: 1, textAlign: 'center', paddingHorizontal: 12 },
  viewToggle: { flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 3, marginBottom: 12 },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 7, borderRadius: 20 },
  toggleActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  toggleText: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 13 },
  toggleTextActive: { color: '#fff' },
  coverView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  artShadow: { borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 16 },
  artPlaying: { shadowColor: COLORS.accent, shadowOpacity: 0.3 },
  albumArt: { width: width - 64, height: width - 64, borderRadius: 20 },
  lyricsContainer: { flex: 1 },
  lyricsScrollContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 40 },
  lyricsCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  lyricsStatusText: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 14, marginTop: 12 },
  noLyrics: { color: COLORS.textMuted, fontFamily: 'Nunito-Bold', fontSize: 18, textAlign: 'center', marginTop: 16 },
  lyricLine: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito-Bold', fontSize: 22, textAlign: 'left', marginVertical: 10, lineHeight: 32, letterSpacing: -0.5 },
  lyricLineActive: { color: '#fff', fontSize: 28, marginVertical: 16, lineHeight: 38 },
  lyricLinePast: { color: 'rgba(255,255,255,0.25)' },
  queueContainer: { flex: 1, paddingHorizontal: 24 },
  queueHeader: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 18, marginTop: 24, marginBottom: 16 },
  queueItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 },
  queueThumb: { width: 48, height: 48, borderRadius: 8 },
  queueInfo: { flex: 1, marginLeft: 12 },
  queueTitle: { color: '#fff', fontFamily: 'Nunito-SemiBold', fontSize: 15 },
  queueArtist: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 13, marginTop: 2 },
  playingIndicator: { marginLeft: 8 },
  bottomSheet: { paddingHorizontal: 24, paddingBottom: 16 },
  trackInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  trackText: { flex: 1 },
  trackTitle: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 22 },
  trackArtist: { color: COLORS.textSecondary, fontFamily: 'Nunito-SemiBold', fontSize: 15, marginTop: 4 },
  seekContainer: { marginBottom: 24 },
  seekTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, position: 'relative', justifyContent: 'center' },
  seekFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2, position: 'absolute', left: 0 },
  seekThumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', top: -5, marginLeft: -7 },
  seekTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  seekTime: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  ctrlBtn: { padding: 6 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  modalArt: { width: 60, height: 60, borderRadius: 8 },
  modalTitle: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 18 },
  modalArtist: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 14, marginTop: 2 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 16 },
  modalOptionText: { color: '#fff', fontFamily: 'Nunito-SemiBold', fontSize: 16, marginLeft: 4 },
});

export default PlayerScreen;
