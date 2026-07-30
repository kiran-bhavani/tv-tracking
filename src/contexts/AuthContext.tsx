"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';

export interface OnboardingProfileData {
  displayName: string;
  dob: string;
  photoURL: string;
  languages: string[];
  genres: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  onboardingComplete: boolean;
  completeOnboarding: (profileData?: OnboardingProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  onboardingComplete: false,
  completeOnboarding: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (newUser) => {
      const isInitialOrChange = currentUidRef.current !== newUser?.uid;
      
      if (isInitialOrChange) {
        setLoading(true);
      }
      
      currentUidRef.current = newUser?.uid || null;
      setUser(newUser);
      
      if (newUser && isInitialOrChange) {
        const userRef = doc(db, 'users', newUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setOnboardingComplete(data.onboardingComplete || false);
            useStore.getState().setStoreData(data.watchlist || {}, data.watchedEpisodes || {}, data.customLists || [], data.movieReviews || {});
          } else {
            // New user, push local data to cloud
            setOnboardingComplete(false);
            const state = useStore.getState();
            await setDoc(userRef, {
              watchlist: state.watchlist,
              watchedEpisodes: state.watchedEpisodes,
              customLists: state.customLists,
              movieReviews: state.movieReviews,
              onboardingComplete: false
            });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
      
      if (isInitialOrChange) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync mutations back to Firestore (debounced 1s to avoid rapid writes)
  useEffect(() => {
    if (!user) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubStore = useStore.subscribe((state, prevState) => {
      // Skip if nothing relevant changed
      if (
        state.watchlist === prevState.watchlist &&
        state.watchedEpisodes === prevState.watchedEpisodes &&
        state.customLists === prevState.customLists &&
        state.movieReviews === prevState.movieReviews
      ) return;

      // Cancel the previous pending write and reschedule
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const latestState = useStore.getState();
        const userRef = doc(db, 'users', user.uid);
        setDoc(userRef, {
          watchlist: latestState.watchlist,
          watchedEpisodes: latestState.watchedEpisodes,
          customLists: latestState.customLists,
          movieReviews: latestState.movieReviews,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || ''
        }, { merge: true }).catch(err => console.error("Error syncing to Firestore:", err));
      }, 1000); // 1 second debounce
    });

    return () => {
      unsubStore();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [user]);

  const completeOnboarding = async (profileData?: OnboardingProfileData) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Update Auth Profile for displayName and photoURL if provided
      if (profileData) {
        await updateProfile(user, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });
        
        // Save everything else to Firestore
        await setDoc(userRef, { 
          onboardingComplete: true,
          dob: profileData.dob,
          languages: profileData.languages,
          likedGenres: profileData.genres,
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        }, { merge: true });
      } else {
        await setDoc(userRef, { onboardingComplete: true }, { merge: true });
      }
      
      setOnboardingComplete(true);
    } catch (err: any) {
      console.error("Failed to complete onboarding:", err);
      throw err; // throw so the UI can reset the loading spinner
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, onboardingComplete, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}
