import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  Search, X, PlusCircle, Pause, Clock, PlayCircle,
  PauseCircle, Volume2, User, Library, Disc, ChevronRight,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../data/mockData';
import {
  searchSongs, searchAlbums, searchArtists, searchPlaylists,
  ApiSong, ApiPlaylist, ApiArtist, ApiAlbumSummary, fetchHome, Track
} from '../services/musicApi';
import { usePlayer } from '../context/PlayerContext';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2; // 2 columns with gaps

const DOMAIN_COLORS = ['#3D1515', '#1A0A2E', '#1A2A1A', '#2A1A3A', '#1A1A3A'];

const buildTrack = (song: ApiSong, idx: number): Track => ({
  id: song.id,
  title: song.title,
  artistName: song.artist,
  cover: song.image,
  color: DOMAIN_COLORS[idx % DOMAIN_COLORS.length],
  liked: false,
  artist_id: song.artist_id,
  album_id: song.album_id,
});

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { playTrack, currentTrack, isPlaying, addToQueue } = usePlayer();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiSong[]>([]);
  const [artistResults, setArtistResults] = useState<ApiArtist[]>([]);
  const [playlistResults, setPlaylistResults] = useState<ApiPlaylist[]>([]);
  const [albumResults, setAlbumResults] = useState<ApiAlbumSummary[]>([]);

  const [history, setHistory] = useState<string[]>([]);
  const [featuredSongs, setFeaturedSongs] = useState<ApiSong[]>([]);
  const [featuredPlaysets, setFeaturedPlaylists] = useState<ApiPlaylist[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [searchTab, setSearchTab] = useState<'songs' | 'artists' | 'playlists' | 'albums'>('songs');
  const [liveSuggestions, setLiveSuggestions] = useState<ApiSong[]>([]);
  const [mixItems, setMixItems] = useState<any[]>([]);

  const route = useRoute<any>();

  useEffect(() => {
    fetchHome().then(res => {
      setFeaturedSongs(res.trending_songs || []);
      setFeaturedPlaylists(res.featured_playlists || []);
      const discoverItems = res.discover_mix || [];
      setMixItems(discoverItems.sort(() => Math.random() - 0.5));
      setInitialLoading(false);
    }).catch(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (route.params?.initialQuery) {
       setQuery(route.params.initialQuery);
       handleSearch(route.params.initialQuery);
    }
  }, [route.params?.initialQuery]);

  useEffect(() => {
    if (query.length < 2 || searched) {
      setLiveSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      searchSongs(query).then(res => setLiveSuggestions(res.slice(0, 6))).catch(() => { });
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searched]);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    Keyboard.dismiss();

    setHistory(prev => {
      const updated = [q, ...prev.filter(h => h !== q)].slice(0, 5);
      return updated;
    });

    try {
      const [songs, artists, playlists, albums] = await Promise.all([
        searchSongs(q),
        searchArtists(q),
        searchPlaylists(q),
        searchAlbums(q),
      ]);
      setResults(songs);
      setArtistResults(artists);
      setPlaylistResults(playlists);
      setAlbumResults(albums);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTrendPress = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  const handleAddToQueue = (song: ApiSong, idx: number) => {
    addToQueue(buildTrack(song, idx));
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item, index }: { item: ApiSong; index: number }) => {
    const isActive = currentTrack?.id === item.id;
    
    const handlePlayFromResult = async () => {
      const track = buildTrack(item, index);
      // Only play this one song and let discovery handle the rest, 
      // preventing the search-result-only queue.
      await playTrack(track, []); 
    };

    return (
      <TouchableOpacity
        style={styles.songRow}
        onPress={handlePlayFromResult}
        activeOpacity={0.75}
      >
        <Image source={{ uri: item.image }} style={styles.songThumb} contentFit="cover" />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isActive && { color: COLORS.accent }]} numberOfLines={1}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
          </View>
        </View>
        <View style={styles.songActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleAddToQueue(item, index)}
          >
            <PlusCircle size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
          {isActive && isPlaying ? (
            <PauseCircle size={28} color={COLORS.accent} />
          ) : (
            <PlayCircle size={28} color={COLORS.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  }, [currentTrack, isPlaying, results]);

  const renderArtistItem = useCallback(({ item }: { item: ApiArtist }) => (
    <TouchableOpacity
      style={styles.artistRow}
      onPress={() => navigation.navigate('Artist', { artistId: item.id, name: item.name, image: item.image })}
    >
      <Image source={{ uri: item.image }} style={styles.artistThumb} contentFit="cover" />
      <Text style={styles.artistName} numberOfLines={1}>{item.name}</Text>
      <ChevronRight size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  ), []);

  const renderPlaylistItem = useCallback(({ item }: { item: ApiPlaylist | ApiAlbumSummary }) => (
    <TouchableOpacity
      style={styles.playlistRow}
      onPress={() => navigation.navigate('Album', {
        albumId: item.id,
        title: item.title,
        image: item.image,
        type: 'subtitle' in item && (item as ApiAlbumSummary).year ? 'album' : 'playlist',
      })}
    >
      <Image source={{ uri: item.image }} style={styles.playlistThumb} contentFit="cover" />
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.playlistSubtitle} numberOfLines={1}>
          {'subtitle' in item ? item.subtitle : 'Playlist'}
        </Text>
      </View>
      <ChevronRight size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  ), []);

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            placeholder="Songs, artists, albums..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Tabs (when searched) */}
        {searched && (
          <View style={styles.tabs}>
            {(['songs', 'artists', 'albums', 'playlists'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, searchTab === tab && styles.tabActive]}
                onPress={() => setSearchTab(tab)}
              >
                <Text style={[styles.tabText, searchTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Live Suggestions Overlay */}
        {!searched && query.trim() !== '' && (
          <View style={styles.suggestionsContainer}>
            {liveSuggestions.length > 0 ? (
              liveSuggestions.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.suggestionRow}
                  onPress={() => { setSearchTab('songs'); handleTrendPress(s.title); }}
                >
                  <Search size={16} color={COLORS.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionRowText} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.suggestionRowArtist} numberOfLines={1}>{s.artist}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              featuredSongs
                .filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 3)
                .map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.suggestionRow}
                    onPress={() => { setSearchTab('songs'); handleTrendPress(s.title); }}
                  >
                    <Volume2 size={16} color={COLORS.textMuted} />
                    <Text style={styles.suggestionRowText}>{s.title}</Text>
                  </TouchableOpacity>
                ))
            )}
          </View>
        )}

        {/* ── Content Area ── */}
        {loading || initialLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : !searched ? (
          // ── IDLE STATE: Genre Boxes + History ──────────────────────────────
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Recent Searches */}
            {history.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={() => setHistory([])}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.historyList}>
                  {history.map((h, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.historyItem}
                      onPress={() => { setQuery(h); handleSearch(h); }}
                    >
                      <Clock size={16} color={COLORS.textMuted} />
                      <Text style={styles.historyText}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Trending for You */}
            {featuredSongs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trending for You</Text>
                <View style={styles.suggestionGrid}>
                  {featuredSongs.slice(0, 6).map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      style={styles.suggestionItem}
                      onPress={() => { setQuery(song.title); handleSearch(song.title); }}
                    >
                      <Image source={{ uri: song.image }} style={styles.suggestionThumb} />
                      <Text numberOfLines={1} style={styles.suggestionText}>{song.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 130 }} />
          </ScrollView>

        ) : (
          // ── RESULTS STATE ──────────────────────────────────────────────────
          <View style={{ flex: 1 }}>
            {searchTab === 'songs' && !loading && (
              results.length > 0 ? (
                <FlatList
                  data={results}
                  keyExtractor={(item) => item.id}
                  renderItem={renderItem}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={<View style={{ height: 130 }} />}
                />
              ) : (
                <View style={styles.centered}>
                  <Search size={48} color={COLORS.border} />
                  <Text style={styles.emptyText}>No songs for "{query}"</Text>
                </View>
              )
            )}

            {searchTab === 'artists' && !loading && (
              artistResults.length > 0 ? (
                <FlatList
                  data={artistResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderArtistItem}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={<View style={{ height: 130 }} />}
                />
              ) : (
                <View style={styles.centered}>
                  <User size={48} color={COLORS.border} />
                  <Text style={styles.emptyText}>No artists for "{query}"</Text>
                </View>
              )
            )}

            {searchTab === 'playlists' && !loading && (
              playlistResults.length > 0 ? (
                <FlatList
                  data={playlistResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPlaylistItem}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={<View style={{ height: 130 }} />}
                />
              ) : (
                <View style={styles.centered}>
                  <Library size={48} color={COLORS.border} />
                  <Text style={styles.emptyText}>No playlists for "{query}"</Text>
                </View>
              )
            )}

            {searchTab === 'albums' && !loading && (
              albumResults.length > 0 ? (
                <FlatList
                  data={albumResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPlaylistItem}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  ListFooterComponent={<View style={{ height: 130 }} />}
                />
              ) : (
                <View style={styles.centered}>
                  <Disc size={48} color={COLORS.border} />
                  <Text style={styles.emptyText}>No albums for "{query}"</Text>
                </View>
              )
            )}

            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.accent} />
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 30, letterSpacing: -0.5 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E1E1E', borderRadius: 14,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, height: 48,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontFamily: 'Nunito-SemiBold', fontSize: 15 },

  tabs: {
    flexDirection: 'row', paddingHorizontal: 16,
    marginBottom: 10, gap: 8,
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#1E1E1E',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tabText: { color: COLORS.textMuted, fontFamily: 'Nunito-Bold', fontSize: 13 },
  tabTextActive: { color: '#fff' },

  suggestionsContainer: {
    position: 'absolute', top: 130, left: 20, right: 20,
    backgroundColor: '#1E1E1E', borderRadius: 12, zIndex: 10,
    paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  suggestionRowText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 14, flex: 1 },
  suggestionRowArtist: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 12 },

  scrollContent: { paddingTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 20 },
  clearText: { color: COLORS.accent, fontFamily: 'Nunito-Bold', fontSize: 13 },

  historyList: { paddingHorizontal: 20, gap: 0 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyText: { color: COLORS.textSecondary, fontFamily: 'Nunito-SemiBold', fontSize: 13 },

  // ── Genre Grid ──────────────────────────────────────────────────────────────
  genreGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12,
  },
  genreCard: {
    width: CARD_W, height: 90,
    borderRadius: 16, overflow: 'hidden',
    justifyContent: 'flex-end', padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  genreEmoji: { fontSize: 28, position: 'absolute', top: 10, right: 14 },
  genreLabel: {
    color: '#fff', fontFamily: 'Nunito-Bold',
    fontSize: 16, letterSpacing: -0.3,
  },

  // ── Trending Grid ───────────────────────────────────────────────────────────
  suggestionGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10,
  },
  suggestionItem: {
    width: CARD_W, height: 56,
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#1E1E1E', flexDirection: 'row', alignItems: 'center',
  },
  suggestionThumb: { width: 56, height: 56, borderRadius: 10 },
  suggestionText: {
    flex: 1, color: '#fff', fontFamily: 'Nunito-Bold',
    fontSize: 12, paddingHorizontal: 10,
  },

  // ── Results List ────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 16, paddingTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold',
    fontSize: 15, marginTop: 16, textAlign: 'center',
  },

  songRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  songThumb: { width: 50, height: 50, borderRadius: 10, backgroundColor: COLORS.surface },
  songInfo: { flex: 1, marginLeft: 14 },
  songTitle: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },
  songArtist: { color: COLORS.textSecondary, fontFamily: 'Nunito-SemiBold', fontSize: 13 },
  songActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { padding: 4 },

  artistRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  artistThumb: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.surface,
  },
  artistName: { flex: 1, color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15, marginLeft: 14 },

  playlistRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  playlistThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: COLORS.surface },
  playlistInfo: { flex: 1, marginLeft: 14 },
  playlistTitle: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },
  playlistSubtitle: { color: COLORS.textMuted, fontFamily: 'Nunito-SemiBold', fontSize: 13, marginTop: 2 },
});

export default SearchScreen;
