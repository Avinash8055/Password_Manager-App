import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import PasswordManager from './components/PasswordManager';
import type { AppState, Folder, PasswordEntry } from './types';
import Splash from './components/Splash';

const initialState: AppState = {
  masterPassword: '123',
  folders: [],
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('passwordManager');
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem('passwordManager', JSON.stringify(state));
  }, [state]);

  const handleAuth = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleChangePassword = (newPassword: string) => {
    setState((prev) => ({ ...prev, masterPassword: newPassword }));
    localStorage.setItem('masterPassword', newPassword);
  };

  const handleAddFolder = (name: string) => {
    setState((prev) => ({
      ...prev,
      folders: [
        {
          id: crypto.randomUUID(),
          name,
          entries: []
        },
        ...prev.folders
      ],
    }));
  };

  const handleDeleteFolder = (id: string) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.filter((folder) => folder.id !== id),
    }));
  };

  const handleAddEntry = (
    folderId: string,
    entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            entries: [
              {
                ...entry,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              ...folder.entries
            ],
          };
        }
        return folder;
      }),
    }));
  };

  const handleUpdateEntry = (folderId: string, updatedEntry: PasswordEntry) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            entries: folder.entries.map((entry) =>
              entry.id === updatedEntry.id ? 
              { ...updatedEntry, updatedAt: new Date().toISOString() } : 
              entry
            ),
          };
        }
        return folder;
      }),
    }));
  };

  const handleDeleteEntry = (folderId: string, entryId: string) => {
    setState((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            entries: folder.entries.filter((entry) => entry.id !== entryId),
          };
        }
        return folder;
      }),
    }));
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <>
      {showSplash ? (
        <Splash onFinish={() => setShowSplash(false)} />
      ) : (
        <PasswordManager
          folders={state.folders}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onAddEntry={handleAddEntry}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;