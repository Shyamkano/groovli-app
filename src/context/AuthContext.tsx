import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, name: string, password?: string) => Promise<void>;
  updateProfile: (updates: { name?: string; image?: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Update this to your live Render server
const API_URL = 'https://musicapi-s1ci.onrender.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, name: string, password?: string) => {
    try {
      // Let's ensure id is uniquely generated to avoid primary key conflicts
      const id = `${email.split('@')[0]}_${Date.now()}`;
      const newUser = { 
        id, 
        name: name || 'User', 
        email, 
        password: password || '123456',
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`
      };
      const res = await axios.post(`${API_URL}/api/users`, newUser);
      const userObj = res.data as User;
      await AsyncStorage.setItem('@user', JSON.stringify(userObj));
      setUser(userObj);
    } catch (e: any) {
      const errorMessage = e.response?.data?.error || e.message || 'Signup failed. Make sure musicApi server is running!';
      console.error('Signup Error:', errorMessage);
      alert(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      // Actually fetch existing user instead of overwriting them
      const res = await axios.post(`${API_URL}/api/login`, { email, password });
      
      const userObj = res.data as User;
      await AsyncStorage.setItem('@user', JSON.stringify(userObj));
      setUser(userObj);
    } catch (e: any) {
      const errorMessage = e.response?.data?.error || 'Login failed. User not found or incorrect password.';
      console.error('Login Error:', errorMessage);
      alert(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (updates: { name?: string; image?: string; password?: string }) => {
    if (!user) return;
    try {
      const res = await axios.patch(`${API_URL}/api/users/${user.id}`, updates);
      // Use functional update and casting to avoid spread error
      setUser(prev => {
        if (!prev) return null;
        const updated = Object.assign({}, prev, res.data as Partial<User>);
        AsyncStorage.setItem('@user', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Update failed', e);
      throw e;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
