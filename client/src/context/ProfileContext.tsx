import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import type { Profile } from '../types/profile';
import * as profilesApi from '../services/profilesApi';

const STORAGE_KEY = 'ft_active_profile_id';

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  isLoading: boolean;
  setActiveProfile: (id: string) => void;
  createProfile: (name: string) => Promise<Profile>;
  updateProfile: (id: string, data: { name?: string; isDefault?: boolean }) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickActive = useCallback((list: Profile[]) => {
    if (list.length === 0) {
      setActiveProfileState(null);
      return;
    }

    const savedId = localStorage.getItem(STORAGE_KEY);
    const saved = savedId ? list.find((p) => p.id === savedId) : undefined;
    if (saved) {
      setActiveProfileState(saved);
      return;
    }

    const defaultProfile = list.find((p) => p.isDefault);
    setActiveProfileState(defaultProfile ?? list[0]);
  }, []);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await profilesApi.fetchProfiles();
      setProfiles(data);
      pickActive(data);
    } catch {
      setProfiles([]);
      setActiveProfileState(null);
    } finally {
      setIsLoading(false);
    }
  }, [pickActive]);

  useEffect(() => {
    if (user) {
      loadProfiles();
    } else {
      setProfiles([]);
      setActiveProfileState(null);
    }
  }, [user, loadProfiles]);

  const setActiveProfile = useCallback(
    (id: string) => {
      const profile = profiles.find((p) => p.id === id);
      if (profile) {
        setActiveProfileState(profile);
        localStorage.setItem(STORAGE_KEY, id);
      }
    },
    [profiles],
  );

  const createProfileFn = useCallback(
    async (name: string) => {
      const created = await profilesApi.createProfile(name);
      await loadProfiles();
      return created;
    },
    [loadProfiles],
  );

  const updateProfileFn = useCallback(
    async (id: string, data: { name?: string; isDefault?: boolean }) => {
      const updated = await profilesApi.updateProfile(id, data);
      await loadProfiles();
      return updated;
    },
    [loadProfiles],
  );

  const deleteProfileFn = useCallback(
    async (id: string) => {
      await profilesApi.deleteProfile(id);
      if (activeProfile?.id === id) {
        localStorage.removeItem(STORAGE_KEY);
      }
      await loadProfiles();
    },
    [activeProfile, loadProfiles],
  );

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        isLoading,
        setActiveProfile,
        createProfile: createProfileFn,
        updateProfile: updateProfileFn,
        deleteProfile: deleteProfileFn,
        refreshProfiles: loadProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
}
