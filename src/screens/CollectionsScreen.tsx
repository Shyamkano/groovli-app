import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Heart, Clock, List, GripVertical, Share2, X, Music2, Camera, Bookmark, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../data/mockData';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const { width } = Dimensions.get('window');

// change this to your API base
const API_BASE_URL = 'https://musicapi-s1ci.onrender.com';

type PlaylistType = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  image?: string | null;
  tracks?: any[];
  createdAt?: string;
};

const CollectionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { likedTracks, history, queue, savedCollections, playTrack } = usePlayer();
  const { showToast } = useToast();
  const scrollRef = React.useRef<ScrollView>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistImage, setPlaylistImage] = useState('');
  const [userPlaylists, setUserPlaylists] = useState<PlaylistType[]>([]);
  const [creating, setCreating] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const { user } = useAuth();
  const userId = user?.id;

  const stats = [
    {
      id: '1',
      name: 'Liked Songs',
      icon: 'heart',
      count: likedTracks.length,
      gradient: ['#E8315B', '#C0284C'] as [string, string],
    },
    {
      id: '2',
      name: 'History',
      icon: 'time',
      count: history.length,
      gradient: ['#6366f1', '#4f46e5'] as [string, string],
    },
    {
      id: '3',
      name: 'Queue',
      icon: 'list',
      count: queue.length,
      gradient: ['#10b981', '#059669'] as [string, string],
    },
    {
      id: '4',
      name: 'My Collection',
      icon: 'bookmark',
      count: savedCollections.length,
      gradient: ['#f59e0b', '#d97706'] as [string, string],
    },
  ];

  const fetchUserPlaylists = async () => {
    if (!userId) return;
    try {
      setLoadingPlaylists(true);

      const response = await fetch(`${API_BASE_URL}/api/user-playlists/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch playlists');
      }

      setUserPlaylists(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast({ message: error.message || 'Could not load playlists', type: 'error' });
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserPlaylists();
    }
  }, [userId]);

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      showToast({ message: "Permission to access camera roll is required to upload a customized cover.", type: 'error' });
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const b64 = pickerResult.assets[0].base64;
      if (b64) {
        setPlaylistImage(`data:image/jpeg;base64,${b64}`);
      }
    }
  };

  const handleCreatePlaylist = async () => {
    if (!userId) {
      showToast({ message: 'You must be logged in to create a playlist.', type: 'error' });
      return;
    }

    if (!playlistName.trim()) {
      showToast({ message: 'Please enter a playlist name', type: 'error' });
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(`${API_BASE_URL}/api/user-playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: playlistName.trim(),
          description: playlistDescription.trim(),
          image: playlistImage.trim() || null,
          tracks: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create playlist');
      }

      setUserPlaylists((prev) => [data, ...prev]);
      setPlaylistName('');
      setPlaylistDescription('');
      setPlaylistImage('');
      setModalVisible(false);

      showToast({ message: 'Playlist created successfully', type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message || 'Could not create playlist', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    Alert.alert("Delete", "Are you sure you want to delete this playlist?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await fetch(`${API_BASE_URL}/api/user-playlists/${playlistId}`, { method: 'DELETE' });
            setUserPlaylists(prev => prev.filter(p => p.id !== playlistId));
            showToast({ message: 'Playlist deleted', type: 'success' });
          } catch (e) {
            console.error(e);
            showToast({ message: "Could not delete playlist", type: 'error' });
          }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Collections</Text>

          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                Share.share({
                  message: `Check out my music taste on Groovli! ${likedTracks.length} liked songs found.`,
                });
              }}
            >
              <Share2 size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
              <Plus size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          {stats.map((pl) => (
            <TouchableOpacity 
               key={pl.id} 
               style={styles.card} 
               activeOpacity={0.8}
               onPress={() => {
                 if (pl.id === '1' && likedTracks.length > 0) {
                   navigation.navigate('Album', { albumId: 'liked', title: 'Liked Songs', type: 'user-playlist', songs: likedTracks });
                 } else if (pl.id === '2' && history.length > 0) {
                   navigation.navigate('Album', { albumId: 'history', title: 'History', type: 'user-playlist', songs: history });
                 } else if (pl.id === '3') {
                   navigation.navigate('Album', { albumId: 'queue', title: 'Queue', type: 'user-playlist', songs: queue });
                 } else if (pl.id === '4') {
                   scrollRef.current?.scrollTo({ y: 500, animated: true });
                 }
               }}
            >
              <LinearGradient colors={pl.gradient} style={styles.cardGrad}>
                {pl.icon === 'heart' && <Heart size={28} color="#fff" />}
                {pl.icon === 'time' && <Clock size={28} color="#fff" />}
                {pl.icon === 'list' && <List size={28} color="#fff" />}
                {pl.icon === 'bookmark' && <Bookmark size={28} color="#fff" />}
              </LinearGradient>
              <Text style={styles.cardName}>{pl.name}</Text>
              <Text style={styles.cardCount}>{pl.count} items</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Playlists</Text>

          {loadingPlaylists ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginTop: 12 }} />
          ) : userPlaylists.length > 0 ? (
            userPlaylists.map((playlist) => {
              const playlistId = playlist.id;
              return (
              <TouchableOpacity
                key={playlist.id}
                style={styles.songRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Album', {
                  albumId: playlist.id,
                  title: playlist.name,
                  image: playlist.image,
                  type: 'user-playlist',
                  songs: playlist.tracks || [],
                })}
              >
                <View style={styles.playlistThumb}>
                  <Music2 size={22} color="#fff" />
                </View>

                <View style={styles.queueInfo}>
                  <Text style={styles.queueTitle} numberOfLines={1}>
                    {playlist.name}
                  </Text>
                  <Text style={styles.queueArtist} numberOfLines={1}>
                    {playlist.tracks?.length || 0} songs
                  </Text>
                </View>
                <TouchableOpacity style={{ padding: 12 }} onPress={() => handleDeletePlaylist(playlistId)}>
                  <Trash2 size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
          ) : (
            <Text style={styles.emptyText}>No playlists yet. Tap + to create one.</Text>
          )}
        </View>

        {likedTracks.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liked Songs</Text>
            {likedTracks.slice(0, 5).map((track) => (
              <TouchableOpacity 
                 key={`liked-${track.id}`} 
                 style={styles.songRow}
                 onPress={() => playTrack(track, likedTracks)}
                 activeOpacity={0.8}
              >
                <Image source={{ uri: track.cover }} style={styles.rowThumb} contentFit="cover" />
                <View style={styles.queueInfo}>
                  <Text style={styles.queueTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.queueArtist} numberOfLines={1}>
                    {track.artistName}
                  </Text>
                </View>
                <Heart size={18} color={COLORS.accent} fill={COLORS.accent} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {savedCollections.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Collection</Text>
            {savedCollections.map((pl) => (
              <TouchableOpacity
                key={'saved-' + pl.id}
                style={styles.songRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Album', { albumId: pl.id, title: pl.title, image: pl.image, type: pl.type })}
              >
                <Image source={{ uri: pl.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200' }} style={styles.rowThumb} contentFit="cover" />
                <View style={styles.queueInfo}>
                  <Text style={styles.queueTitle} numberOfLines={1}>{pl.title}</Text>
                  <Text style={[styles.queueArtist, { textTransform: 'capitalize', color: COLORS.textMuted }]} numberOfLines={1}>{pl.subtitle || pl.type}</Text>
                </View>
                <Bookmark size={18} color={COLORS.accent} fill={COLORS.accent} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {queue.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            {queue.slice(0, 8).map((track, idx) => (
              <View key={`queue-${track.id}-${idx}`} style={styles.queueRow}>
                <Text style={styles.queueNum}>{(idx + 1).toString().padStart(2, '0')}</Text>
                <View style={styles.queueInfo}>
                  <Text style={styles.queueTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.queueArtist} numberOfLines={1}>
                    {track.artistName}
                  </Text>
                </View>
                <GripVertical size={20} color={COLORS.textMuted} />
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Playlist</Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Playlist Name</Text>
            <TextInput
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="Late Night Vibes"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={playlistDescription}
              onChangeText={setPlaylistDescription}
              placeholder="Optional description"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
            />

            <Text style={styles.label}>Cover Image (Optional)</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.8}>
                {playlistImage ? (
                  <Image source={{ uri: playlistImage }} style={styles.imagePickerPreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                     <Camera size={24} color="rgba(255,255,255,0.4)" />
                     <Text style={styles.imagePickerText}>Upload Image</Text>
                  </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreatePlaylist}
              disabled={creating}
            >
              <Text style={styles.createBtnText}>
                {creating ? 'Creating...' : 'Create Playlist'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  headerTitle: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 26,
  },

  headerBtns: {
    flexDirection: 'row',
    gap: 12,
  },

  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },

  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardGrad: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  cardName: {
    color: '#fff',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
  },

  cardCount: {
    color: COLORS.textMuted,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    marginTop: 2,
  },

  section: {
    paddingHorizontal: 20,
  },

  sectionTitle: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 22,
    marginTop: 12,
    marginBottom: 16,
  },

  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },

  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },

  playlistThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },

  queueNum: {
    color: COLORS.textMuted,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    width: 34,
  },

  queueInfo: {
    flex: 1,
    marginLeft: 8,
  },

  queueTitle: {
    color: '#fff',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
  },

  queueArtist: {
    color: COLORS.textSecondary,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
    marginTop: 1,
  },

  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContent: {
    width: width * 0.85,
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },

  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Nunito-SemiBold',
  },

  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    color: '#fff',
    padding: 16,
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 18,
  },

  createBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
  imagePickerBtn: {
    height: 100,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: 18,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
  },
  imagePickerPreview: {
    width: '100%',
    height: '100%',
  },
});

export default CollectionsScreen;