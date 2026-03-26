import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '../data/mockData';
import { fetchHome, ApiSong, ApiArtist, ApiAlbumSummary, ApiPlaylist, BASE_URL, Track } from '../services/musicApi';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const ARTIST_SIZE = 74;
const SONG_CARD_WIDTH = width * 0.33;
const SONG_CARD_HEIGHT = 122;
const FEATURED_HEIGHT = 190;

const toTrack = (s: ApiSong): Track => ({
  id: s.id,
  title: s.title,
  artistName: s.artist,
  cover: s.image,
  color: '#1d1d1d',
  liked: false,
  artist_id: s.artist_id,
  album_id: s.album_id,
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { playTrack, currentTrack, isPlaying, history, clearHistory } = usePlayer();
  const { user } = useAuth();

  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [albums, setAlbums] = useState<ApiAlbumSummary[]>([]);
  const [playlists, setPlaylists] = useState<ApiPlaylist[]>([]);
  const [charts, setCharts] = useState<ApiPlaylist[]>([]);
  const [trendingPlaylists, setTrendingPlaylists] = useState<ApiPlaylist[]>([]);
  const [mixItems, setMixItems] = useState<any[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserPlaylists = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${BASE_URL}/api/user-playlists/${user.id}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUserPlaylists(data);
      }
    } catch { }
  };

  const load = async () => {
    try {
      setError(null);
      const res = await fetchHome();

      setSongs(res.trending_songs || []);
      setArtists(res.featured_artists || []);
      setAlbums(res.new_albums || []);
      setPlaylists(res.featured_playlists || []);
      setCharts(res.top_charts || []);
      setTrendingPlaylists(res.trending_playlists || []);

      // Use server-built discover_mix (charts + trending playlists), different from new_albums
      const discoverItems = res.discover_mix || [];
      setMixItems(discoverItems.sort(() => Math.random() - 0.5));
    } catch (e: any) {
      setError(e.message || 'Failed to connect');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    loadUserPlaylists();
  }, [user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    loadUserPlaylists();
  }, [user?.id]);

  const handlePlay = async (song: ApiSong, list: ApiSong[]) => {
    const queue = list.map((item) => toTrack(item));
    await playTrack(toTrack(song), queue);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading Groovli...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <WifiOff size={52} color="#7e7e7e" />
        <Text style={styles.errorTitle}>Can’t reach music server</Text>
        <Text style={styles.errorSub}>Please check your internet connection or try again later.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>What’s the mood, {user?.name ? user.name.split(' ')[0] : 'there'}?</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Image
              source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=E8315B&color=fff&size=150` }}
              style={styles.avatar}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Moods Horizontal Row */}
        <View style={{ marginBottom: 28, marginTop: 4 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalPad}
          >
            {['Chill', 'Energetic', 'Focus', 'Romance', 'Sad', 'Party'].map((mood, idx) => (
              <TouchableOpacity
                key={mood}
                style={[styles.moodItem, { backgroundColor: ['#2e1f44', '#1f442e', '#441f2e', '#1f2e44', '#2e441f', '#441f44'][idx % 6] }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Search', { initialQuery: mood })}
              >
                <Text style={styles.moodText}>{mood}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* User Playlists */}
        {userPlaylists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Playlists</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPad}
            >
              {userPlaylists.map((pl) => (
                <TouchableOpacity
                  key={'user-pl-' + pl.id}
                  style={styles.smallAlbumCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Album', { albumId: pl.id, title: pl.name, image: pl.image, type: 'user-playlist', songs: pl.tracks || [] })}
                >
                  <View style={[styles.smallAlbumImage, !pl.image && { alignItems: 'center', justifyContent: 'center' }]}>
                    {pl.image ? (
                      <Image source={{ uri: pl.image }} style={styles.smallAlbumImage} resizeMode="cover" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 24 }}>{pl.name ? pl.name[0].toUpperCase() : 'M'}</Text>
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.smallAlbumTitle}>{pl.name}</Text>
                  <Text numberOfLines={1} style={styles.smallAlbumSubtitle}>{pl.tracks?.length || 0} songs</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Artists */}
        {artists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artists for You</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPad}
            >
              {artists.map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  style={styles.artistItem}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Artist', { artistId: artist.id, name: artist.name, image: artist.image })}
                >
                  <Image
                    source={{ uri: artist.image }}
                    style={styles.artistImage}
                    resizeMode="cover"
                  />
                  <Text numberOfLines={2} style={styles.artistName}>
                    {artist.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recently Played (Synced from History) */}
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingRight:20}}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <TouchableOpacity onPress={clearHistory}>
                 <Text style={{color: COLORS.textMuted, fontSize:12, fontFamily:'Nunito-Bold'}}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.songRowList}>
              {history.slice(0, 5).map((song, idx) => {
                const active = currentTrack?.id === song.id;
                return (
                  <TouchableOpacity
                    key={song.id + idx}
                    style={styles.songRow}
                    activeOpacity={0.7}
                    onPress={() => playTrack(song, history)}
                  >
                    <Image source={{ uri: song.cover }} style={styles.songRowThumb} />
                    <View style={styles.songRowInfo}>
                      <Text numberOfLines={1} style={[styles.songRowTitle, active && { color: COLORS.accent }]}>{song.title}</Text>
                      <Text numberOfLines={1} style={styles.songRowArtist}>{song.artistName}</Text>
                    </View>
                    <View style={styles.songRowAction}>
                      {active && isPlaying ? (
                        <Pause size={18} color={COLORS.accent} />
                      ) : (
                        <Play size={18} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* New Releases */}
        {albums[0] && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Releases</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.featuredCardFull}
              onPress={() =>
                navigation.navigate('Album', {
                  albumId: albums[0].id,
                  title: albums[0].title,
                  image: albums[0].image,
                })
              }
            >
              <Image
                source={{ uri: albums[0].image }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
                style={styles.featuredOverlay}
              />
              <View style={styles.featuredBottom}>
                <View style={styles.featuredBottomLeft}>
                  <Text numberOfLines={1} style={styles.featuredTitle}>{albums[0].title}</Text>
                  <Text numberOfLines={1} style={styles.featuredSubtitle}>
                    {albums[0].subtitle ? `by ${albums[0].subtitle}` : 'Album'}
                  </Text>
                  <Text numberOfLines={1} style={styles.featuredMeta}>
                    {[albums[0].year, albums[0].song_count ? `${albums[0].song_count} songs` : '', albums[0].duration || '']
                      .filter(Boolean).join(' • ')}
                  </Text>
                </View>
                <View style={styles.featuredPlay}>
                  <Play size={18} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}



        {/* Featured Playlists */}
        {playlists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Playlists</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPad}
            >
              {playlists.map((pl) => (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.playlistCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Album', { albumId: pl.id, title: pl.title, image: pl.image, type: 'playlist' })}
                >
                  <Image source={{ uri: pl.image }} style={styles.playlistImage} resizeMode="cover" />
                  <View style={styles.playlistOverlay}><Text numberOfLines={1} style={styles.playlistTitle}>{pl.title}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Made For You */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Made For You</Text>
            <View style={styles.songRowList}>
              {songs.slice(5, 10).map((song) => {
                const active = currentTrack?.id === song.id;
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={styles.songRow}
                    activeOpacity={0.7}
                    onPress={() => handlePlay(song, songs)}
                  >
                    <Image source={{ uri: song.image }} style={styles.songRowThumb} />
                    <View style={styles.songRowInfo}>
                      <Text numberOfLines={1} style={[styles.songRowTitle, active && { color: COLORS.accent }]}>{song.title}</Text>
                      <Text numberOfLines={1} style={styles.songRowArtist}>{song.artist}</Text>
                    </View>
                    <View style={styles.songRowAction}>
                      <Play size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        {/* Top Charts */}
        {charts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Charts</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPad}
            >
              {charts.map((pl) => (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.smallAlbumCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Album', { albumId: pl.id, title: pl.title, image: pl.image, type: 'playlist' })}
                >
                  <Image source={{ uri: pl.image }} style={styles.smallAlbumImage} resizeMode="cover" />
                  <Text numberOfLines={1} style={styles.smallAlbumTitle}>{pl.title}</Text>
                  <Text numberOfLines={1} style={styles.smallAlbumSubtitle}>Global Chart</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {/* More Albums Block */}
        {albums.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More Albums</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalPad}
            >
              {albums.slice(1).map((al) => (
                <TouchableOpacity
                  key={'al-' + al.id}
                  style={styles.smallAlbumCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Album', { albumId: al.id, title: al.title, image: al.image, type: 'album' })}
                >
                  <Image source={{ uri: al.image }} style={styles.smallAlbumImage} resizeMode="cover" />
                  <Text numberOfLines={1} style={styles.smallAlbumTitle}>{al.title}</Text>
                  <Text numberOfLines={1} style={styles.smallAlbumSubtitle}>{al.subtitle || 'Album'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {/* Discover Random */}
        {mixItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discover Random</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPad}>
              {mixItems.map((item) => (
                <TouchableOpacity
                  key={'mix-' + item.id}
                  style={styles.smallAlbumCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('Album', {
                      albumId: item.id,
                      title: (item as any).title,
                      image: item.image,
                      type: 'subtitle' in item ? 'album' : 'playlist'
                    })
                  }
                >
                  <Image source={{ uri: item.image }} style={styles.smallAlbumImage} resizeMode="cover" />
                  <Text numberOfLines={1} style={styles.smallAlbumTitle}>{(item as any).title}</Text>
                  <Text numberOfLines={1} style={styles.smallAlbumSubtitle}>{'subtitle' in item ? (item as any).subtitle : 'Random Pick'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Indian Hits */}
        {songs.length > 8 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Indian Hits</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPad}>
              {songs.slice(0, 8).reverse().map((song) => (
                <TouchableOpacity key={'hit-' + song.id} style={styles.playlistCard} onPress={() => handlePlay(song, songs)}>
                  <Image source={{ uri: song.image }} style={styles.playlistImage} resizeMode="cover" />
                  <View style={styles.playlistOverlay}><Text numberOfLines={1} style={styles.playlistTitle}>{song.title}</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Regional Hits */}
        {trendingPlaylists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Regional Hits</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalPad}>
              {trendingPlaylists.map((pl) => (
                <View key={'trending-pl-' + pl.id} style={styles.artistItem}>
                  <TouchableOpacity onPress={() => navigation.navigate('Album', { albumId: pl.id, title: pl.title, image: pl.image, type: 'playlist' })}>
                    <Image source={{ uri: pl.image }} style={styles.artistImage} resizeMode="cover" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#050505',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#050505',
  },

  centered: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    color: '#b8b8b8',
    marginTop: 14,
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },

  errorTitle: {
    color: '#fff',
    marginTop: 14,
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },

  errorSub: {
    color: '#9d9d9d',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito-SemiBold',
  },

  retryBtn: {
    marginTop: 22,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },

  retryText: {
    color: '#111',
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    fontFamily: 'Nunito-Bold',
    maxWidth: width * 0.7,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1b1b1b',
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 14,
    paddingHorizontal: 20,
    fontFamily: 'Nunito-Bold',
    letterSpacing: -0.4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingRight: 20,
  },

  seeAll: {
    color: COLORS.accent,
    fontFamily: 'Nunito-Bold',
    fontSize: 13,
  },

  horizontalPad: {
    paddingHorizontal: 20,
    gap: 16,
  },

  artistItem: {
    width: 86,
    alignItems: 'center',
  },

  artistImage: {
    width: ARTIST_SIZE,
    height: ARTIST_SIZE,
    borderRadius: ARTIST_SIZE / 2,
    backgroundColor: '#1b1b1b',
  },

  artistName: {
    marginTop: 8,
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Nunito-SemiBold',
  },

  songRowList: {
    paddingHorizontal: 20,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 8,
    borderRadius: 12,
  },
  songRowThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  songRowInfo: {
    flex: 1,
    marginLeft: 14,
  },
  songRowTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
  },
  songRowArtist: {
    color: '#9d9d9d',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Nunito-SemiBold',
  },
  songRowAction: {
    padding: 8,
  },
  songCard: {
    width: SONG_CARD_WIDTH,
    height: SONG_CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#161616',
  },

  songCardImage: {
    width: '100%',
    height: '100%',
  },

  songOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  songPlayBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  songTextWrap: {
    position: 'absolute',
    left: 10,
    right: 36,
    bottom: 10,
  },

  songTitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },

  songArtist: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
  },

  featuredCard: {
    width: width * 0.78,
    height: FEATURED_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#161616',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },

  featuredCardFull: {
    height: FEATURED_HEIGHT,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#161616',
    justifyContent: 'flex-end',
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },

  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  featuredTopIcons: {
    position: 'absolute',
    top: 12,
    right: 12,
    alignItems: 'center',
  },

  topIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredBottom: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  featuredBottomLeft: {
    flex: 1,
    paddingRight: 12,
  },

  featuredTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
  },

  featuredSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Nunito-SemiBold',
  },

  featuredMeta: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Nunito-SemiBold',
  },

  featuredPlay: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  smallAlbumCard: {
    width: 122,
  },

  smallAlbumImage: {
    width: 122,
    height: 122,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
  },

  smallAlbumTitle: {
    color: '#fff',
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },

  smallAlbumSubtitle: {
    color: '#8f8f8f',
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
  },

  playlistCard: {
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#161616',
  },

  playlistImage: {
    width: '100%',
    height: '100%',
  },

  playlistOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  playlistTitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },

  moodItem: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 0, // Handled by gap
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },

  moodText: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default HomeScreen;
