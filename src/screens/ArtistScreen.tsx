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
import { Image } from 'expo-image';
import { ChevronLeft, Play, Volume2, Bookmark } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchArtist, ApiArtistDetail, ApiSong, Track } from '../services/musicApi';
import { usePlayer } from '../context/PlayerContext';
import { COLORS } from '../data/mockData';

const { width, height } = Dimensions.get('window');

const buildTrack = (song: ApiSong, idx: number): Track => ({
    id: song.id,
    title: song.title,
    artistName: song.artist,
    cover: song.image,
    color: '#2a1a2a',
    liked: false,
    artist_id: song.artist_id,
    album_id: song.album_id,
});

const ArtistScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { artistId, name, image } = route.params;
    const { playTrack, currentTrack, isPlaying, savedCollections, toggleSaveCollection } = usePlayer();

    const [artist, setArtist] = useState<ApiArtistDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArtist(artistId).then(res => {
            setArtist(res);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [artistId]);

    const handlePlaySong = (song: ApiSong, index: number) => {
        if (!artist) return;
        const queue = artist.top_songs.map((s, i) => buildTrack(s, i));
        playTrack(buildTrack(song, index), queue);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    const isSaved = savedCollections.some(c => c.id === artistId);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header Image */}
                <View style={styles.header}>
                    <Image source={{ uri: artist?.image || image }} style={styles.headerImage} contentFit="cover" />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', '#0A0A0A']}
                        style={StyleSheet.absoluteFill}
                    />
                    <SafeAreaView style={styles.topActions} edges={['top']}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft size={24} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
                            <View>
                                <Text style={styles.artistName}>{artist?.name || name}</Text>
                                {!!artist?.follower_count && (
                                    <Text style={styles.followers}>{artist.follower_count} Followers</Text>
                                )}
                            </View>
                            
                            <TouchableOpacity 
                               style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }} 
                               onPress={() => toggleSaveCollection({
                                  id: artistId,
                                  type: 'artist',
                                  title: artist?.name || name,
                                  subtitle: 'Artist',
                                  image: artist?.image || image
                               })}
                            >
                                <Bookmark size={20} color={isSaved ? COLORS.accent : '#fff'} fill={isSaved ? COLORS.accent : 'transparent'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Songs</Text>
                    {artist?.top_songs.map((song, i) => {
                        const isActive = currentTrack?.id === song.id;
                        return (
                            <View key={song.id}>
                                <TouchableOpacity
                                    style={styles.songRow}
                                    onPress={() => handlePlaySong(song, i)}
                                >
                                    <Text style={styles.songIdx}>{i + 1}</Text>
                                    <View style={styles.songThumbWrap}>
                                        <Image source={{ uri: song.image }} style={styles.songThumb} />
                                    </View>
                                    <View style={styles.songInfo}>
                                        <Text style={[styles.songTitle, isActive && { color: COLORS.accent }]} numberOfLines={1}>{song.title}</Text>
                                        <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                                    </View>
                                    {isActive && isPlaying ? (
                                        <Volume2 size={16} color={COLORS.accent} />
                                    ) : (
                                        <Play size={20} color={COLORS.textMuted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>

                {/* Top Albums */}
                {artist?.top_albums && artist.top_albums.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Albums</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                            {artist.top_albums.map((album) => (
                                <TouchableOpacity
                                    key={album.id}
                                    style={styles.albumCard}
                                    onPress={() => navigation.navigate('Album', { albumId: album.id, title: album.title, image: album.image })}
                                >
                                    <Image source={{ uri: album.image }} style={styles.albumImage} />
                                    <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
                                    <Text style={styles.albumYear}>{album.year || 'Album'}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Bio */}
                {artist?.bio && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.bio}>{artist.bio}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A' },
    header: { height: height * 0.45, justifyContent: 'flex-end' },
    headerImage: { ...StyleSheet.absoluteFillObject },
    topActions: { position: 'absolute', top: 0, left: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    headerInfo: { padding: 20 },
    artistName: { color: '#fff', fontSize: 42, fontFamily: 'Nunito-Bold', letterSpacing: -1 },
    followers: { color: COLORS.textSecondary, fontSize: 14, fontFamily: 'Nunito-Bold', marginTop: 4 },
    section: { marginTop: 24 },
    sectionTitle: { color: '#fff', fontSize: 20, fontFamily: 'Nunito-Bold', paddingHorizontal: 20, marginBottom: 16 },
    songRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
    songIdx: { color: COLORS.textMuted, width: 25, fontSize: 13, fontFamily: 'Nunito-Bold' },
    songThumbWrap: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden', backgroundColor: COLORS.surface },
    songThumb: { width: 48, height: 48 },
    songInfo: { flex: 1, marginLeft: 14 },
    songTitle: { color: '#fff', fontSize: 15, fontFamily: 'Nunito-Bold' },
    songArtist: { color: COLORS.textMuted, fontSize: 13, fontFamily: 'Nunito-SemiBold' },
    albumCard: { width: 140 },
    albumImage: { width: 140, height: 140, borderRadius: 12, backgroundColor: COLORS.surface },
    albumTitle: { color: '#fff', fontSize: 13, fontFamily: 'Nunito-Bold', marginTop: 8 },
    albumYear: { color: COLORS.textMuted, fontSize: 11, fontFamily: 'Nunito-SemiBold', marginTop: 2 },
    bio: { color: COLORS.textSecondary, fontSize: 14, fontFamily: 'Nunito-SemiBold', paddingHorizontal: 20, lineHeight: 22 },
});

export default ArtistScreen;
