import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, Library, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../data/mockData';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';

const Tab = createBottomTabNavigator();

const AnimatedTabIcon: React.FC<{
  isFocused: boolean;
  IconComponent: React.FC<any>;
  name: string;
}> = ({ isFocused, IconComponent }) => {
  return (
    <View style={[
      styles.tabBtn,
      isFocused && styles.tabBtnActive,
      isFocused && { transform: [{ scale: 1.1 }, { translateY: -2 }] }
    ]}>
      <IconComponent
        size={22}
        color={isFocused ? COLORS.accent : 'rgba(255,255,255,0.45)'}
        strokeWidth={isFocused ? 2.5 : 2}
      />
    </View>
  );
};

const TabBarWithMiniPlayer: React.FC<{ state: any; descriptors: any; navigation: any }> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { showMiniPlayer } = usePlayer();

  const icons: Record<string, React.FC<any>> = {
    Home: Home,
    Search: Search,
    Collections: Library,
    Settings: Settings,
  };

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      {showMiniPlayer && <MiniPlayer />}
      <View style={styles.tabBarContainer}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.glassOverlay} />
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const IconComponent = icons[route.name] ?? Library;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable key={route.key} style={styles.tabItem} onPress={onPress}>
                <AnimatedTabIcon isFocused={isFocused} IconComponent={IconComponent} name={route.name} />
                <View style={styles.tabLabel}>
                  {isFocused && (
                    <View style={styles.activeDot} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBarWithMiniPlayer {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingHorizontal: 16,
  },
  tabBarContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 34, 34, 0.55)',
  },
  tabBar: {
    flexDirection: 'row',
    height: 65,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(232,49,91,0.12)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabLabel: {
    marginTop: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default MainTabs;
