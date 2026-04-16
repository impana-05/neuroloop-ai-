import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch or create profile
        const userDoc = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(userDoc);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            
            // Listen for real-time updates to profile (XP, level, etc.)
            onSnapshot(userDoc, (doc) => {
              if (doc.exists()) {
                setProfile(doc.data() as UserProfile);
              }
            }, (error) => {
              // Only log if it's not a transient auth error
              if (auth.currentUser) {
                handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
              }
            });
          } else {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              xp: 0,
              level: 1,
              stats: {
                totalQuizzes: 0,
                correctAnswers: 0,
                timeSpent: 0
              },
              createdAt: Date.now()
            };
            await setDoc(userDoc, newProfile);
            setProfile(newProfile);
          }
        } catch (error: any) {
          // If it's a permission error during the initial check, it might be because the doc doesn't exist yet
          // but our rules are strict. However, 'get' should be allowed for authenticated users now.
          if (error.code === 'permission-denied') {
             console.warn("Permission denied fetching profile, attempting to create...");
             // Logic to handle creation if get fails could go here, but 'get' is now allowed in rules.
          }
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      }
 else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);

    try {
      const provider = new GoogleAuthProvider();
      // Use signInWithPopup but handle common iframe/popup errors
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This happens if the user clicks sign-in again before the first one finishes
        // or if the popup is closed manually. We can ignore it or show a subtle message.
      } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        setAuthError("A technical error occurred with the sign-in popup. Please try refreshing the page or opening the app in a new tab.");
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setAuthError(`This domain (${currentDomain}) is not authorized for Firebase Authentication. Please add it to the "Authorized domains" list in your Firebase Console (Authentication > Settings > Authorized domains).`);
      } else {
        setAuthError(error.message || "An unexpected error occurred during sign-in.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSigningIn, authError, signIn, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
