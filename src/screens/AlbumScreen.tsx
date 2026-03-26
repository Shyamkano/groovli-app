import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Play, Volume2, MoreHorizontal, Bookmark } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../data/mockData';
import { fetchAlbum, fetchPlaylist, ApiSong, Track } from '../services/musicApi';
import { usePlayer } from '../context/PlayerContext';

const { width } = Dimensions.get('window');

type RouteParams = {
  Album: { albumId: string; title?: string; image?: string; type?: 'album' | 'playlist' | 'user-playlist'; songs?: ApiSong[] };
};

const buildTrack = (song: any, albumImage: string, idx: number): Track => ({
  id: song.id,
  title: song.title,
  artistName: song.artistName || song.artist || 'Unknown Artist',
  cover: song.cover || song.image || albumImage,
  color: song.color || '#1A0A2E',
  liked: song.liked || false,
  album_id: song.album_id || '',
  artist_id: song.artist_id || '',
});

const AlbumScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'Album'>>();
  const { albumId, title: routeTitle, image: routeImage } = route.params;

  const { playTrack, currentTrack, isPlaying, savedCollections, toggleSaveCollection } = usePlayer();

  const [album, setAlbum] = useState<{ id: string; title: string; image: string; year: string; songs: ApiSong[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setAlbum(null);
    setError('');
    const isPlaylist = route.params.type === 'playlist';
    const isUserPlaylist = route.params.type === 'user-playlist';
    
    if (isUserPlaylist) {
      setAlbum({ 
        id: albumId, 
        title: routeTitle || 'My Playlist', 
        image: routeImage || '', 
        year: 'User Playlist', 
        songs: route.params.songs || [] 
      });
      setLoading(false);
    } else if (isPlaylist) {
      fetchPlaylist(albumId)
        .then(res => setAlbum({ ...res, year: '', songs: res.songs }))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      fetchAlbum(albumId)
        .then(setAlbum)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [albumId, route.params.type, route.params.songs]);

  const handlePlayAll = async () => {
    if (!album?.songs?.length) return;
    const queue = album.songs.map((s, i) => buildTrack(s, album.image, i));
    await playTrack(queue[0], queue);
  };

  const handlePlaySong = async (song: ApiSong, idx: number) => {
    if (!album) return;
    const queue = album.songs.map((s, i) => buildTrack(s, album.image, i));
    await playTrack(buildTrack(song, album.image, idx), queue);
  };

  const cover = album?.image || routeImage || '';
  const albumTitle = album?.title || routeTitle || 'Album';
  const isSaved = savedCollections.some(c => c.id === albumId);

  return (
    <View style={styles.container}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.bgImage} contentFit="cover" blurRadius={30} />
      ) : null}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', COLORS.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Album art */}
          <View style={styles.artContainer}>
            <Image source={{ uri: cover }} style={styles.art} contentFit="cover" />
          </View>

          {/* Album info */}
          <View style={styles.infoSection}>
            <Text style={styles.albumTitle}>{albumTitle}</Text>
            {album?.year && <Text style={styles.albumMeta}>{album.year} · {album.songs?.length ?? 0} songs</Text>}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
              <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
                <LinearGradient colors={[COLORS.accent, '#FF6B35']} style={styles.playAllGrad}>
                  <Play size={18} color="#fff" />
                  <Text style={styles.playAllText}>Play All</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                 style={{ marginLeft: 16, marginTop: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }} 
                 onPress={() => toggleSaveCollection({
                    id: albumId,
                    type: route.params.type === 'album' ? 'album' : 'playlist',
                    title: albumTitle,
                    subtitle: album?.year || `${album?.songs?.length || 0} songs`,
                    image: cover
                 })}
              >
                  <Bookmark size={20} color={isSaved ? COLORS.accent : '#fff'} fill={isSaved ? COLORS.accent : 'transparent'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Track list */}
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 32 }} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.trackList}>
              {(album?.songs ?? []).map((song, idx) => {
                const isActive = currentTrack?.id === song.id;
                return (
                  <View key={song.id}>
                    <TouchableOpacity
                      style={styles.trackRow}
                      onPress={() => handlePlaySong(song, idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.trackNum, isActive && { color: COLORS.accent }]}>
                        {isActive && isPlaying ? (
                          <Volume2 size={14} color={COLORS.accent} />
                        ) : (
                          `${idx + 1}`
                        )}
                      </Text>
                      <View style={styles.trackInfo}>
                        <Text style={[styles.trackTitle, isActive && { color: COLORS.accent }]} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>{(song as any).artist || (song as any).artistName}</Text>
                      </View>
                      <TouchableOpacity style={styles.moreBtn}>
                        <MoreHorizontal size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  backBtn: {
    marginLeft: 16,
    marginBottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  art: {
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  albumTitle: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 24,
  },
  albumMeta: {
    color: COLORS.textSecondary,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    marginTop: 4,
  },
  playAllBtn: { marginTop: 16, alignSelf: 'flex-start' },
  playAllGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 11,
    gap: 8,
  },
  playAllText: {
    color: '#fff',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
  },
  trackList: { paddingHorizontal: 16 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  trackNum: {
    color: COLORS.textMuted,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    width: 32,
    textAlign: 'center',
  },
  trackInfo: { flex: 1, marginLeft: 8 },
  trackTitle: {
    color: '#fff',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
  },
  trackArtist: {
    color: COLORS.textSecondary,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    marginTop: 2,
  },
  moreBtn: { padding: 8 },
  errorText: {
    color: COLORS.textMuted,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default AlbumScreen;
