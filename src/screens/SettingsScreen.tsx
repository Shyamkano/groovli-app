import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Lock, Camera, Check, Bell, Shield, Info, ChevronRight, LogOut } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COLORS } from '../data/mockData';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(user?.image || '');
  const [notifs, setNotifs] = useState(true);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return showToast({ message: 'Allow access to your photo library to upload an avatar.', type: 'error' });
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast({ message: 'Name cannot be empty', type: 'error' });
    setLoading(true);
    try {
      const updates: any = { name, image: imageUri };
      if (password.trim()) updates.password = password;
      await updateProfile(updates);
      showToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (e) {
      showToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const avatarUri = imageUri || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=E8315B&color=fff&size=150`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator color={COLORS.accent} size="small" /> : <Check color={COLORS.accent} size={24} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <View style={styles.avatarOverlay}>
              <Camera color="#fff" size={20} />

            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.inputWrap}>
            <User color="rgba(255,255,255,0.4)" size={18} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Display Name"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>
          <View style={styles.inputWrap}>
            <Lock color="rgba(255,255,255,0.4)" size={18} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="New Password (leave blank to keep)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Bell color="rgba(255,255,255,0.6)" size={18} />
              <Text style={styles.rowText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: COLORS.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Shield color="rgba(255,255,255,0.6)" size={18} />
              <Text style={styles.rowText}>Privacy Policy</Text>
            </View>
            <ChevronRight color="rgba(255,255,255,0.3)" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Info color="rgba(255,255,255,0.6)" size={18} />
              <Text style={styles.rowText}>App Version</Text>
            </View>
            <Text style={styles.rowMeta}>1.0.0</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut color="#FF4B4B" size={18} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 40 },
  title: { fontSize: 18, fontFamily: 'Nunito-Bold', color: '#fff' },
  saveBtn: { width: 40, alignItems: 'flex-end' },
  scrollContent: { paddingBottom: 50 },

  profileSection: { alignItems: 'center', paddingVertical: 28 },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  avatar: { width: '100%', height: '100%' },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  userName: { color: '#fff', fontSize: 20, fontFamily: 'Nunito-Bold', marginBottom: 2 },
  emailText: { color: COLORS.textMuted, fontSize: 13, fontFamily: 'Nunito-Regular' },

  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    fontFamily: 'Nunito-Bold',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontFamily: 'Nunito-SemiBold', fontSize: 15 },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { color: '#fff', fontSize: 15, fontFamily: 'Nunito-SemiBold' },
  rowMeta: { color: COLORS.textMuted, fontSize: 13, fontFamily: 'Nunito-Regular' },

  logoutBtn: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255,0,0,0.05)',
  },
  logoutText: { color: '#FF4B4B', fontFamily: 'Nunito-Bold', fontSize: 16 },
});

export default SettingsScreen;
