import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  AppState,
  Alert,
  LogBox,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CryptoService } from './src/services/cryptoService';
import { StorageService } from './src/services/storageService';
import SetupScreen from './src/components/SetupScreen';
import LoginScreen from './src/components/LoginScreen';
import RecoveryScreen from './src/components/RecoveryScreen';
import VaultHomeScreen from './src/components/VaultHomeScreen';
import NoteEditorModal from './src/components/NoteEditorModal';
import SettingsModal from './src/components/SettingsModal';
import ThemeSelectorModal from './src/components/ThemeSelectorModal';
import BackupModal from './src/components/BackupModal';
import { THEMES } from './src/theme';

// Silence developer LogBox warnings on mobile
LogBox.ignoreAllLogs(true);

const THEME_STORAGE_KEY = 'ALAVUDDIN_VAULT_THEME_ID';

export default function App() {
  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState('windows_11');
  const activeTheme = THEMES[currentThemeId] || THEMES.windows_11 || THEMES.clean_light;

  // Screen state: 'loading' | 'setup' | 'login' | 'recovery' | 'unlocked'
  const [appState, setAppState] = useState('loading');
  const [vaultEnvelope, setVaultEnvelope] = useState(null);
  const [masterVaultKey, setMasterVaultKey] = useState(null);
  const [vaultData, setVaultData] = useState({ username: '', folders: [], notes: [] });

  // Navigation / Modal States
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [isBackupModalVisible, setIsBackupModalVisible] = useState(false);

  // Inactivity / AppState background lock
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    loadSavedTheme();
    checkInitialization();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // Auto lock vault when app is minimized for security
        handleLockVault();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadSavedTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES[saved]) {
        setCurrentThemeId(saved);
      }
    } catch (e) {}
  };

  const handleThemeChange = async (themeId) => {
    setCurrentThemeId(themeId);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (e) {}
  };

  // Check if encrypted flat file exists on device
  const checkInitialization = async () => {
    try {
      const isInit = await StorageService.isVaultInitialized();
      if (!isInit) {
        setAppState('setup');
      } else {
        const envelope = await StorageService.readVaultFile();
        if (envelope && envelope.auth) {
          setVaultEnvelope(envelope);
          setAppState('login');
        } else {
          setAppState('setup');
        }
      }
    } catch (err) {
      setAppState('setup');
    }
  };

  // 1. Initial Setup Handler
  const handleSetupComplete = async ({ username, password, q1, a1, q2, a2 }) => {
    try {
      const envelope = CryptoService.createInitialVault({
        username,
        password,
        q1,
        a1,
        q2,
        a2,
      });

      // Save encrypted flat file
      await StorageService.writeVaultFile(envelope);
      setVaultEnvelope(envelope);

      // Log in immediately
      const unlockResult = CryptoService.unlockWithPassword(envelope, username, password);
      setMasterVaultKey(unlockResult.masterVaultKey);
      setVaultData(unlockResult.data);
      if (unlockResult.data.folders && unlockResult.data.folders.length > 0) {
        setSelectedFolder(unlockResult.data.folders[0]);
      }
      setAppState('unlocked');
    } catch (err) {
      Alert.alert('Initialization Failed', err.message);
    }
  };

  // 2. Normal Login Handler
  const handleLogin = async (username, password) => {
    try {
      const envelope = await StorageService.readVaultFile();
      if (!envelope) throw new Error('Vault file not found.');

      const unlockResult = CryptoService.unlockWithPassword(envelope, username, password);
      setVaultEnvelope(envelope);
      setMasterVaultKey(unlockResult.masterVaultKey);
      setVaultData(unlockResult.data);
      if (unlockResult.data.folders && unlockResult.data.folders.length > 0) {
        setSelectedFolder(unlockResult.data.folders[0]);
      }
      setAppState('unlocked');
    } catch (err) {
      throw err;
    }
  };

  // 3. Recovery Handlers
  const handleVerifyRecoveryAnswers = (a1, a2) => {
    return CryptoService.unlockWithRecovery(vaultEnvelope, a1, a2);
  };

  const handleCompletePasswordReset = async (a1, a2, newPassword) => {
    try {
      const unlockResult = CryptoService.unlockWithRecovery(vaultEnvelope, a1, a2);
      const key = unlockResult.masterVaultKey;
      const data = unlockResult.data;

      // Re-encrypt envelope with new password
      const updatedEnvelope = CryptoService.reEncryptVault({
        vaultEnvelope,
        masterVaultKey: key,
        currentData: data,
        newPassword,
      });

      await StorageService.writeVaultFile(updatedEnvelope);
      setVaultEnvelope(updatedEnvelope);
      setMasterVaultKey(key);
      setVaultData(data);
      if (data.folders && data.folders.length > 0) {
        setSelectedFolder(data.folders[0]);
      }
      setAppState('unlocked');
      Alert.alert('Password Recovered', 'Your master password has been successfully reset and vault unlocked.');
    } catch (err) {
      throw err;
    }
  };

  // 4. Data persistence helper (auto-encrypts to flat file)
  const persistVaultData = async (newData) => {
    try {
      setVaultData(newData);
      if (vaultEnvelope && masterVaultKey) {
        const updatedEnvelope = CryptoService.saveDataToEnvelope(
          vaultEnvelope,
          masterVaultKey,
          newData
        );
        await StorageService.writeVaultFile(updatedEnvelope);
        setVaultEnvelope(updatedEnvelope);
      }
    } catch (err) {
      Alert.alert('Save Error', 'Failed to save encrypted data: ' + err.message);
    }
  };

  // Folder actions
  const handleCreateFolder = (newFolder) => {
    const updatedFolders = [...vaultData.folders, newFolder];
    persistVaultData({ ...vaultData, folders: updatedFolders });
    setSelectedFolder(newFolder);
  };

  const handleRenameFolder = (folderId, newName) => {
    const updatedFolders = vaultData.folders.map((f) =>
      f.id === folderId ? { ...f, name: newName } : f
    );
    persistVaultData({ ...vaultData, folders: updatedFolders });
    if (selectedFolder && selectedFolder.id === folderId) {
      setSelectedFolder({ ...selectedFolder, name: newName });
    }
  };

  const handleDeleteFolder = (folderId) => {
    const updatedFolders = vaultData.folders.filter((f) => f.id !== folderId);
    const updatedNotes = vaultData.notes.filter((n) => n.folderId !== folderId);
    persistVaultData({ ...vaultData, folders: updatedFolders, notes: updatedNotes });
    setSelectedFolder(updatedFolders[0] || null);
  };

  // Note actions
  const handleSaveNote = (savedNote) => {
    const exists = vaultData.notes.some((n) => n.id === savedNote.id);
    let updatedNotes;
    if (exists) {
      updatedNotes = vaultData.notes.map((n) => (n.id === savedNote.id ? savedNote : n));
    } else {
      updatedNotes = [savedNote, ...vaultData.notes];
    }
    persistVaultData({ ...vaultData, notes: updatedNotes });
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = vaultData.notes.filter((n) => n.id !== noteId);
    persistVaultData({ ...vaultData, notes: updatedNotes });
  };

  // Settings Actions
  const handleChangeUsername = async (newUsername) => {
    const updatedData = { ...vaultData, username: newUsername };
    const updatedEnvelope = CryptoService.reEncryptVault({
      vaultEnvelope,
      masterVaultKey,
      currentData: updatedData,
      newUsername,
    });
    await StorageService.writeVaultFile(updatedEnvelope);
    setVaultEnvelope(updatedEnvelope);
    setVaultData(updatedData);
  };

  const handleChangePassword = async (newPassword) => {
    const updatedEnvelope = CryptoService.reEncryptVault({
      vaultEnvelope,
      masterVaultKey,
      currentData: vaultData,
      newPassword,
    });
    await StorageService.writeVaultFile(updatedEnvelope);
    setVaultEnvelope(updatedEnvelope);
  };

  const handleUpdateRecovery = async (newQ1, newA1, newQ2, newA2) => {
    const updatedEnvelope = CryptoService.reEncryptVault({
      vaultEnvelope,
      masterVaultKey,
      currentData: vaultData,
      newQ1,
      newA1,
      newQ2,
      newA2,
    });
    await StorageService.writeVaultFile(updatedEnvelope);
    setVaultEnvelope(updatedEnvelope);
  };

  const handleWipeVault = async () => {
    await StorageService.deleteVaultFile();
    setVaultEnvelope(null);
    setMasterVaultKey(null);
    setVaultData({ username: '', folders: [], notes: [] });
    setSelectedFolder(null);
    setIsSettingsModalVisible(false);
    setAppState('setup');
    Alert.alert('Vault Wiped', 'All encrypted files have been permanently erased.');
  };

  // Lock Vault
  const handleLockVault = () => {
    setMasterVaultKey(null);
    setVaultData({ username: '', folders: [], notes: [] });
    setSelectedFolder(null);
    setIsNoteModalVisible(false);
    setIsSettingsModalVisible(false);
    setAppState('login');
  };

  // Loading Screen
  if (appState === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingContainer, { backgroundColor: activeTheme.colors.background }]}>
          <ActivityIndicator size="large" color={activeTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: activeTheme.colors.textSecondary }]}>Initializing Alavuddin Vault Secure Storage...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
        <StatusBar style={activeTheme.isDark ? 'light' : 'dark'} />

        {/* 1. First Time Setup */}
        {appState === 'setup' && (
          <SetupScreen onSetupComplete={handleSetupComplete} theme={activeTheme} />
        )}

        {/* 2. Login Screen */}
        {appState === 'login' && (
          <LoginScreen
            savedUsername={vaultEnvelope?.auth?.username || ''}
            onLogin={handleLogin}
            onForgotPassword={() => setAppState('recovery')}
            theme={activeTheme}
          />
        )}

        {/* 3. Password Recovery Screen */}
        {appState === 'recovery' && (
          <RecoveryScreen
            vaultEnvelope={vaultEnvelope}
            onRecoverySuccess={{
              verifyAnswersOnly: handleVerifyRecoveryAnswers,
              completeReset: handleCompletePasswordReset,
            }}
            onCancel={() => setAppState('login')}
            theme={activeTheme}
          />
        )}

        {/* 4. Main Unlocked Vault View */}
        {appState === 'unlocked' && (
          <>
            <VaultHomeScreen
              username={vaultData.username || vaultEnvelope?.auth?.username || 'User'}
              folders={vaultData.folders}
              notes={vaultData.notes}
              selectedFolderId={selectedFolder?.id || vaultData.folders[0]?.id}
              onSelectFolderId={(fId) => {
                const f = vaultData.folders.find((x) => x.id === fId);
                if (f) setSelectedFolder(f);
              }}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onOpenNote={(note) => {
                setEditingNote(note);
                setIsNoteModalVisible(true);
              }}
              onAddNote={(targetFolderId) => {
                const fId = targetFolderId || selectedFolder?.id || vaultData.folders[0]?.id || '';
                setEditingNote({ folderId: fId });
                setIsNoteModalVisible(true);
              }}
              onLockVault={handleLockVault}
              onOpenSettings={() => setIsSettingsModalVisible(true)}
              onOpenThemeModal={() => setIsThemeModalVisible(true)}
              onOpenBackupModal={() => setIsBackupModalVisible(true)}
              theme={activeTheme}
            />

            {/* Note Editor Modal (Rich Text & Image Support) */}
            <NoteEditorModal
              visible={isNoteModalVisible}
              note={editingNote}
              currentFolderId={selectedFolder ? selectedFolder.id : (vaultData.folders[0]?.id || '')}
              folders={vaultData.folders}
              onSave={handleSaveNote}
              onDelete={handleDeleteNote}
              onClose={() => {
                setIsNoteModalVisible(false);
                setEditingNote(null);
              }}
              onHome={() => {
                setIsNoteModalVisible(false);
                setEditingNote(null);
              }}
              theme={activeTheme}
            />

            {/* Settings Modal */}
            <SettingsModal
              visible={isSettingsModalVisible}
              currentUsername={vaultData.username || vaultEnvelope?.auth?.username || ''}
              vaultEnvelope={vaultEnvelope}
              currentThemeId={currentThemeId}
              onChangeTheme={handleThemeChange}
              onChangeUsername={handleChangeUsername}
              onChangePassword={handleChangePassword}
              onUpdateRecovery={handleUpdateRecovery}
              onWipeVault={handleWipeVault}
              onOpenBackupModal={() => {
                setIsSettingsModalVisible(false);
                setIsBackupModalVisible(true);
              }}
              onClose={() => setIsSettingsModalVisible(false)}
              onHome={() => {
                setIsSettingsModalVisible(false);
              }}
              theme={activeTheme}
            />

            {/* Theme Selector Modal */}
            <ThemeSelectorModal
              visible={isThemeModalVisible}
              currentThemeId={currentThemeId}
              onSelectTheme={handleThemeChange}
              onClose={() => setIsThemeModalVisible(false)}
              theme={activeTheme}
            />

            {/* Encrypted Backup & Share Modal (Export to Wife / Import) */}
            <BackupModal
              visible={isBackupModalVisible}
              vaultData={vaultData}
              onImportComplete={(importedVaultData) => {
                persistVaultData(importedVaultData);
                if (importedVaultData.folders && importedVaultData.folders.length > 0) {
                  setSelectedFolder(importedVaultData.folders[0]);
                }
              }}
              onClose={() => setIsBackupModalVisible(false)}
              onHome={() => setIsBackupModalVisible(false)}
              theme={activeTheme}
            />
          </>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },
});
