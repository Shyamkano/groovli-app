import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Platform 
} from 'react-native';
import { AlertCircle, CheckCircle2, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const { width } = Dimensions.get('window');

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback(({ message, type = 'info', duration = 3000 }: ToastOptions) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setMessage(message);
    setType(type);
    setVisible(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(hideToast, duration);
  }, [fadeAnim, slideAnim, hideToast]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={22} color="#4ADE80" />;
      case 'error': return <AlertCircle size={22} color="#FB7185" />;
      default: return <BlurView intensity={20} />;
    }
  };

  const getGlowColor = () => {
    switch (type) {
      case 'success': return 'rgba(74, 222, 128, 0.25)';
      case 'error': return 'rgba(251, 113, 133, 0.25)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: getGlowColor(),
            }
          ]}
        >
          <BlurView intensity={80} tint="dark" style={styles.blurWrapper}>
            <View style={[styles.content, { borderLeftColor: type === 'success' ? '#4ADE80' : type === 'error' ? '#FB7185' : '#fff' }]}>
              <View style={styles.iconArea}>
                {getIcon()}
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {message}
              </Text>
            </View>
          </BlurView>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  blurWrapper: {
    padding: 16,
    borderRadius: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  iconArea: {
    marginRight: 14,
  },
  message: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Nunito-SemiBold',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
});
