/**
 * FairLens AI — Auth Context
 * Manages user authentication state (Firebase + Guest mode).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fairlens_token'));
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('fairlens_user');
    const savedToken = localStorage.getItem('fairlens_token');

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('fairlens_user');
        localStorage.removeItem('fairlens_token');
      }
    }

    // Listen for Firebase auth changes if Firebase is configured
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email,
            isGuest: false,
          };
          setUser(userData);
          setToken(idToken);
          localStorage.setItem('fairlens_user', JSON.stringify(userData));
          localStorage.setItem('fairlens_token', idToken);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const guestLogin = useCallback(async () => {
    try {
      const { data } = await authAPI.guestLogin();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('fairlens_user', JSON.stringify(data.user));
      localStorage.setItem('fairlens_token', data.token);
      return data;
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  }, []);

  const emailLogin = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase not configured');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }, []);

  const emailSignup = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase not configured');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }, []);

  const googleLogin = useCallback(async () => {
    if (!auth || !googleProvider) throw new Error('Firebase not configured');
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (auth) await signOut(auth);
    } catch (e) {
      // Ignore signout errors
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('fairlens_user');
    localStorage.removeItem('fairlens_token');
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isGuest: user?.isGuest || false,
    guestLogin,
    emailLogin,
    emailSignup,
    googleLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
