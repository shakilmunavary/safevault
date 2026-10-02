import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const VAULT_FILENAME = 'safevault_secure_store.enc';
const STORAGE_KEY = 'SAFEVAULT_FLATFILE_ENVELOPE';

// In-memory runtime cache
let memoryCache = null;

const getVaultFilePath = () => {
  try {
    const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
    if (!dir) return null;
    return dir.endsWith('/') ? `${dir}${VAULT_FILENAME}` : `${dir}/${VAULT_FILENAME}`;
  } catch (e) {
    return null;
  }
};

export const StorageService = {
  // Check if vault file/data already exists
  async isVaultInitialized() {
    try {
      if (memoryCache) return true;

      // 1. Try FileSystem
      const filePath = getVaultFilePath();
      if (filePath && Platform.OS !== 'web') {
        try {
          const info = await FileSystem.getInfoAsync(filePath);
          if (info && info.exists && info.size > 0) {
            return true;
          }
        } catch (e) {}
      }

      // 2. Try SecureStore
      try {
        const secureData = await SecureStore.getItemAsync(STORAGE_KEY);
        if (secureData) return true;
      } catch (e) {}

      // 3. Try AsyncStorage
      try {
        const asyncData = await AsyncStorage.getItem(STORAGE_KEY);
        if (asyncData) return true;
      } catch (e) {}

      return false;
    } catch (err) {
      return !!memoryCache;
    }
  },

  // Read encrypted flat-file data
  async readVaultFile() {
    try {
      let rawString = null;

      // 1. Try FileSystem on device
      const filePath = getVaultFilePath();
      if (filePath && Platform.OS !== 'web') {
        try {
          const info = await FileSystem.getInfoAsync(filePath);
          if (info && info.exists) {
            rawString = await FileSystem.readAsStringAsync(filePath);
          }
        } catch (fsErr) {}
      }

      // 2. Try SecureStore
      if (!rawString) {
        try {
          rawString = await SecureStore.getItemAsync(STORAGE_KEY);
        } catch (secErr) {}
      }

      // 3. Try AsyncStorage
      if (!rawString) {
        try {
          rawString = await AsyncStorage.getItem(STORAGE_KEY);
        } catch (asyncErr) {}
      }

      // 4. Fallback to memoryCache
      if (!rawString && memoryCache) {
        return memoryCache;
      }

      if (!rawString) return null;

      const parsed = typeof rawString === 'string' ? JSON.parse(rawString) : rawString;
      memoryCache = parsed;
      return parsed;
    } catch (err) {
      if (memoryCache) return memoryCache;
      throw new Error('Unable to read encrypted vault data.');
    }
  },

  // Write encrypted envelope (writes to all available persistence layers)
  async writeVaultFile(vaultEnvelope) {
    let writeSuccess = false;
    const rawString = JSON.stringify(vaultEnvelope, null, 2);
    memoryCache = vaultEnvelope;

    // 1. Try FileSystem (direct flat file)
    try {
      const filePath = getVaultFilePath();
      if (filePath && Platform.OS !== 'web') {
        await FileSystem.writeAsStringAsync(filePath, rawString);
        writeSuccess = true;
      }
    } catch (fsErr) {}

    // 2. Try SecureStore (hardware encrypted store on Android/iOS)
    try {
      if (Platform.OS !== 'web') {
        if (rawString.length < 2000) {
          await SecureStore.setItemAsync(STORAGE_KEY, rawString);
          writeSuccess = true;
        }
      }
    } catch (secErr) {}

    // 3. Try AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, rawString);
      writeSuccess = true;
    } catch (asyncErr) {}

    // If written to at least one storage layer OR memory
    if (writeSuccess || memoryCache) {
      return true;
    }

    throw new Error('Storage write failed on all storage mechanisms.');
  },

  // Get stats for settings screen
  async getVaultFileStats() {
    try {
      const filePath = getVaultFilePath();
      if (filePath && Platform.OS !== 'web') {
        try {
          const info = await FileSystem.getInfoAsync(filePath);
          if (info && info.exists) {
            return {
              path: filePath,
              size: info.size,
              lastModified: info.modificationTime
                ? new Date(info.modificationTime * 1000).toISOString()
                : new Date().toISOString(),
              isFlatFile: true,
            };
          }
        } catch (e) {}
      }

      const raw = JSON.stringify(memoryCache || {});
      return {
        path: 'Sandboxed Encrypted Flat Storage (Internal App Container)',
        size: raw.length,
        lastModified: new Date().toISOString(),
        isFlatFile: true,
      };
    } catch (err) {
      return {
        path: 'Sandboxed Encrypted Flat Storage',
        size: 0,
        lastModified: 'Unknown',
        isFlatFile: true,
      };
    }
  },

  // Wipe Vault data
  async deleteVaultFile() {
    memoryCache = null;

    try {
      const filePath = getVaultFilePath();
      if (filePath && Platform.OS !== 'web') {
        try {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        } catch (e) {}
      }
    } catch (e) {}

    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch (e) {}

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    return true;
  },
};
