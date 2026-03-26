import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(-30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(20)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(taglineY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(btnY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1A1A1A', '#111111', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Swirl waves background */}
      <View style={styles.wavesContainer}>
        {[...Array(6)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.wave,
              {
                width: 340 + i * 60,
                height: 340 + i * 60,
                borderRadius: (340 + i * 60) / 2,
                borderColor: `rgba(255,255,255,${0.04 - i * 0.005})`,
                top: height * 0.12 - (340 + i * 60) / 2 + 80,
                left: width / 2 - (340 + i * 60) / 2,
              },
            ]}
          />
        ))}
      </View>

      {/* Silhouette placeholder (gradient shape) */}
      <View style={styles.silhouetteContainer}>
        <LinearGradient
          colors={['#3A3A3A', '#2A2A2A', '#1A1A1A']}
          style={styles.silhouette}
        />
        {/* Headphone accent */}
        <View style={styles.headphoneAccent} />
      </View>

      {/* Logo */}
      <View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ translateY: logoY }] },
        ]}
      >
        <Text style={styles.logo}>Groovli</Text>
      </View>

      {/* Tagline */}
      <View
        style={[
          styles.taglineContainer,
          { opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
        ]}
      >
        <Text style={styles.tagline}>
          Rhythm Unleashed,{'\n'}Sound{' '}
          <Text style={styles.taglineAccent}>Redefined</Text>
        </Text>
        <Text style={styles.subTagline}>
          Discover, create, and experience{'\n'}music like never before
        </Text>
      </View>

      {/* CTA Button */}
      <View
        style={[
          styles.btnWrapper,
          {
            opacity: btnOpacity,
            transform: [{ translateY: btnY }, { scale: pulse }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.btnText}>Let the Music Begin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 64,
  },
  wavesContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  silhouetteContainer: {
    position: 'absolute',
    top: height * 0.08,
    alignSelf: 'center',
    alignItems: 'center',
  },
  silhouette: {
    width: 220,
    height: 280,
    borderRadius: 110,
    opacity: 0.6,
  },
  headphoneAccent: {
    position: 'absolute',
    top: 20,
    width: 180,
    height: 50,
    borderRadius: 25,
    borderWidth: 6,
    borderColor: '#E8315B',
    opacity: 0.5,
  },
  logoContainer: {
    position: 'absolute',
    top: height * 0.07,
    alignSelf: 'center',
  },
  logo: {
    fontSize: 42,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 56,
    paddingHorizontal: 32,
  },
  tagline: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
  },
  taglineAccent: {
    color: '#E8315B',
  },
  subTagline: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  btnWrapper: {
    width: width - 64,
  },
  btn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
    letterSpacing: 0.2,
  },
});

export default SplashScreen;
