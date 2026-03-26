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
import { Mail, Lock, Eye, EyeOff, User, Chrome, Apple } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { COLORS } from '../data/mockData';

const { width } = Dimensions.get('window');

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !name) {
      return showToast({ message: 'Please fill in all fields', type: 'error' });
    }
    setLoading(true);
    try {
      await signup(email, name, password);
      showToast({ message: 'Account created! Welcome to Groovli.', type: 'success' });
    } catch (err) {
      showToast({ message: 'Sign up failed. Please try again.', type: 'error' });
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
              <Text style={styles.motto}>feel the rhythm, live the beat!</Text>
              <Text style={styles.welcome}>Sign up for free</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <User size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>

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
                style={styles.signupBtn}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.accent} />
                ) : (
                  <Text style={styles.signupBtnText}>Create Account</Text>
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
                  <Text style={styles.socialBtnText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn}>
                  <Apple size={22} color="#fff" />
                  <Text style={styles.socialBtnText}>Continue with Apple</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerWrap}>
              <Text style={styles.termsText}>
                By signing up, you agree to our <Text style={styles.strongText}>Terms & Conditions</Text>.
              </Text>

              <TouchableOpacity
                style={styles.footer}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.footerText}>
                  Already have an account? <Text style={styles.loginLink}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#050505',
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
    marginBottom: 40,
  },
  logo: {
    fontSize: 52,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  motto: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
    marginBottom: 24,
  },
  welcome: {
    fontSize: 22,
    fontFamily: 'Nunito-Bold',
    color: '#fff',
    marginBottom: 8,
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
  signupBtn: {
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
  signupBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 28,
    height: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 14,
    marginLeft: 12,
  },
  footerWrap: {
    marginTop: 32,
    alignItems: 'center',
  },
  footer: {
    marginTop: 8,
  },
  termsText: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  strongText: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Nunito-Bold',
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Nunito-SemiBold',
    fontSize: 14,
  },
  loginLink: {
    color: '#fff',
    fontFamily: 'Nunito-ExtraBold',
  },
});

export default SignupScreen;
