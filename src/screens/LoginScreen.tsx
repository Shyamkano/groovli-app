import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, Apple } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COLORS } from '../data/mockData';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return showToast({ message: 'Please enter email and password', type: 'error' });
    setLoading(true);
    try {
      await login(email, password);
      showToast({ message: 'Welcome back to Groovli!', type: 'success' });
    } catch (err) {
      showToast({ message: 'Login failed. Check your credentials.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.header}>
              <Text style={styles.logo}>Groovli</Text>
              <Text style={styles.welcome}>Welcome back!</Text>
              <Text style={styles.subtitle}>Let’s get you back to the groove</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="rgba(255,255,255,0.7)" />
                  ) : (
                    <Eye size={20} color="rgba(255,255,255,0.7)" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : (
                  <Text style={styles.loginBtnText}>Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn}>
                  <Chrome size={22} color="#fff" />
                  <Text style={styles.socialBtnText}>Login in with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn}>
                  <Apple size={22} color="#fff" />
                  <Text style={styles.socialBtnText}>Login in with Apple</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.footer}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.footerText}>
                Don’t have an account? <Text style={styles.signupLink}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#050505', // Theme background
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safe: { flex: 1 },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 52,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
    marginBottom: 12,
  },
  welcome: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
  },
  loginBtn: {
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 13,
  },
  socialRow: {
    gap: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 28,
    height: 54,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    marginLeft: 12,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
  },
  signupLink: {
    color: '#fff',
    fontFamily: 'Nunito-ExtraBold',
  },
});

export default LoginScreen;
