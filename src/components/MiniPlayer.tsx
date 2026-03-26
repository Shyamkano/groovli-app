import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Play, Pause, Heart, SkipForward } from 'lucide-react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../context/PlayerContext';
import { COLORS } from '../data/mockData';

const MiniPlayer: React.FC = () => {
  const { currentTrack, isPlaying, isLoading, togglePlay, handleNext, showMiniPlayer, toggleLike } = usePlayer();
  const navigation = useNavigation<any>();

  if (!currentTrack || !showMiniPlayer) return null;

  return (
    <View>
      <Pressable
        style={styles.container}
        onPress={() => navigation.navigate('Player')}
      >
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[currentTrack.color + 'DD', '#151515EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={{ uri: currentTrack.cover }}
          style={styles.cover}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artistName}
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              toggleLike(currentTrack.id);
            }}
          >
            <Heart
              size={20}
              color={currentTrack.liked ? COLORS.accent : '#fff'}
              fill={currentTrack.liked ? COLORS.accent : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={async (e) => {
              e.stopPropagation?.();
              await togglePlay();
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isPlaying ? (
              <Pause size={22} color="#fff" />
            ) : (
              <Play size={22} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={async (e) => {
              e.stopPropagation?.();
              await handleNext();
            }}
          >
            <SkipForward size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 6,
    overflow: 'hidden',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cover: {
    width: 42,
    height: 42,
    borderRadius: 10,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  artist: {
    color: COLORS.textSecondary,
    fontFamily: 'Nunito-Bold',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
  },
});

export default MiniPlayer;
