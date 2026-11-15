import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiClient } from '../api/client';
import { UserProfile, CareCircle } from '../types';
import i18n from '../i18n';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  circles: CareCircle[];
  currentCircle: CareCircle | null;
  setCurrentCircle: (circle: CareCircle | null) => void;
  loading: boolean;
  seniorMode: boolean;
  toggleSeniorMode: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, seniorMode?: boolean) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [circles, setCircles] = useState<CareCircle[]>([]);
  const [currentCircle, setCurrentCircle] = useState<CareCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [seniorMode, setSeniorMode] = useState<boolean>(() => {
    return localStorage.getItem('silversync_senior_mode') === 'true';
  });

  const syncBackendSession = useCallback(
    async (firebaseUser: User, extra?: { name?: string; seniorMode?: boolean }) => {
      try {
        const response = await apiClient.post<{
          user: UserProfile;
          circles: CareCircle[];
        }>('/auth/session', {
          name: extra?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          seniorMode: extra?.seniorMode ?? seniorMode,
          language: i18n.language,
        });

        setProfile(response.user);
        setCircles(response.circles);

        if (response.circles.length > 0 && !currentCircle) {
          setCurrentCircle(response.circles[0]);
        }

        if (response.user.seniorMode !== seniorMode) {
          setSeniorMode(response.user.seniorMode);
        }
      } catch {
        // Fallback for offline or local dev without active backend session
      }
    },
    [currentCircle, seniorMode]
  );

  useEffect(() => {
    if (seniorMode) {
      document.body.classList.add('senior-mode');
      localStorage.setItem('silversync_senior_mode', 'true');
    } else {
      document.body.classList.remove('senior-mode');
      localStorage.setItem('silversync_senior_mode', 'false');
    }
  }, [seniorMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncBackendSession(currentUser);
      } else {
        setProfile(null);
        setCircles([]);
        setCurrentCircle(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncBackendSession]);

  const toggleSeniorMode = () => {
    setSeniorMode((prev) => !prev);
  };

  const setLanguage = (lang: 'en' | 'hi') => {
    i18n.changeLanguage(lang);
  };

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await syncBackendSession(cred.user);
  };

  const signup = async (email: string, pass: string, name: string, isSenior?: boolean) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await syncBackendSession(cred.user, { name, seniorMode: isSenior });
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await syncBackendSession(cred.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setCircles([]);
    setCurrentCircle(null);
  };

  const refreshSession = async () => {
    if (auth.currentUser) {
      await syncBackendSession(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        circles,
        currentCircle,
        setCurrentCircle,
        loading,
        seniorMode,
        toggleSeniorMode,
        setLanguage,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
