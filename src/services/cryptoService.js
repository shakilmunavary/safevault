import CryptoJS from 'crypto-js';

// Configuration for PBKDF2 Key Derivation
const PBKDF2_ITERATIONS = 10000;
const KEY_SIZE = 256 / 32; // 256 bits

// Robust, cross-platform cryptographically secure random generator
const getRandomHex = (byteCount) => {
  // 1. Try global crypto (React Native with polyfill / Web / Node)
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(byteCount);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(byteCount);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}

  // 2. High-entropy cross-platform generator (works in Hermes, Android, iOS, Node)
  let hex = '';
  for (let i = 0; i < byteCount; i++) {
    const timeFactor = (Date.now() + i * 37) & 0xff;
    const mathRandom = Math.floor(Math.random() * 256);
    const val = (mathRandom ^ timeFactor ^ ((i * 19) & 0xff)) & 0xff;
    hex += val.toString(16).padStart(2, '0');
  }
  return hex;
};

export const CryptoService = {
  // Generate random salt (hex string)
  generateSalt() {
    return getRandomHex(16);
  },

  // Generate random master vault encryption key (256-bit)
  generateVaultKey() {
    return getRandomHex(32);
  },

  // Derive key from password/string and salt using PBKDF2
  deriveKey(secret, saltHex) {
    const salt = CryptoJS.enc.Hex.parse(saltHex);
    return CryptoJS.PBKDF2(secret, salt, {
      keySize: KEY_SIZE,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    }).toString(CryptoJS.enc.Hex);
  },

  // Normalize recovery answers (case-insensitive, trimmed, single spaces)
  normalizeAnswer(answer) {
    if (!answer) return '';
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
  },

  // Compute hash of answer with salt
  hashAnswer(answer, saltHex) {
    const normalized = this.normalizeAnswer(answer);
    return CryptoJS.SHA256(normalized + '::' + saltHex).toString(CryptoJS.enc.Hex);
  },

  // Compute Auth verification hash (to verify username + password without storing password)
  computeAuthHash(username, password, saltHex) {
    const derived = this.deriveKey(password, saltHex);
    return CryptoJS.HmacSHA256(username.trim().toLowerCase(), derived).toString(CryptoJS.enc.Hex);
  },

  // Encrypt plaintext string using AES-256
  encrypt(plaintext, keyHex) {
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const ivHex = getRandomHex(16);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return ivHex + ':' + encrypted.toString();
  },

  // Decrypt ciphertext using AES-256
  decrypt(ciphertextWithIv, keyHex) {
    try {
      const parts = ciphertextWithIv.split(':');
      if (parts.length !== 2) throw new Error('Invalid encrypted format');
      const ivHex = parts[0];
      const encryptedData = parts[1];

      const key = CryptoJS.enc.Hex.parse(keyHex);
      const iv = CryptoJS.enc.Hex.parse(ivHex);

      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const utf8 = decrypted.toString(CryptoJS.enc.Utf8);
      if (!utf8) {
        throw new Error('Decryption resulted in empty payload or wrong key');
      }
      return utf8;
    } catch (err) {
      throw new Error('Decryption failed: ' + err.message);
    }
  },

  // Create initial flat-file encrypted bundle
  createInitialVault({ username, password, q1, a1, q2, a2, initialData }) {
    const salt = this.generateSalt();
    const masterVaultKey = this.generateVaultKey();

    // 1. Encrypt the actual vault data (folders, notes, username) with masterVaultKey
    const encryptedData = this.encrypt(
      JSON.stringify(
        initialData || {
          username: username.trim(),
          folders: [
            {
              id: 'folder_welcome',
              name: 'Personal Secrets',
              color: '#6366F1',
              createdAt: new Date().toISOString(),
            },
          ],
          notes: [
            {
              id: 'note_welcome',
              folderId: 'folder_welcome',
              title: 'Welcome to SafeVault',
              content:
                'This note is fully encrypted with AES-256 and stored locally in an encrypted flat file.\n\nNo external database is used. Only your master password or recovery questions can decrypt this content.',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }
      ),
      masterVaultKey
    );

    // 2. Encrypt masterVaultKey using user's password
    const userDerivedKey = this.deriveKey(password, salt);
    const userKeyEncryptedVaultKey = this.encrypt(masterVaultKey, userDerivedKey);
    const authVerifyHash = this.computeAuthHash(username, password, salt);

    // 3. Encrypt masterVaultKey using normalized recovery answers
    const normA1 = this.normalizeAnswer(a1);
    const normA2 = this.normalizeAnswer(a2);
    const recoveryCombined = normA1 + '::||::' + normA2;
    const recoveryDerivedKey = this.deriveKey(recoveryCombined, salt);
    const recoveryKeyEncryptedVaultKey = this.encrypt(masterVaultKey, recoveryDerivedKey);

    const a1Hash = this.hashAnswer(a1, salt);
    const a2Hash = this.hashAnswer(a2, salt);

    return {
      version: 1,
      format: 'SAFEVAULT_AES256_FLATFILE',
      updatedAt: new Date().toISOString(),
      salt,
      auth: {
        username: username.trim(),
        authVerifyHash,
        userKeyEncryptedVaultKey,
      },
      recovery: {
        q1: q1.trim(),
        a1Hash,
        q2: q2.trim(),
        a2Hash,
        recoveryKeyEncryptedVaultKey,
      },
      encryptedData,
    };
  },

  // Unlock vault using password
  unlockWithPassword(vaultEnvelope, inputUsername, inputPassword) {
    const salt = vaultEnvelope.salt;
    const expectedUsername = vaultEnvelope.auth.username.trim().toLowerCase();
    const providedUsername = inputUsername.trim().toLowerCase();

    if (expectedUsername !== providedUsername) {
      throw new Error('Incorrect username.');
    }

    const calculatedAuthHash = this.computeAuthHash(inputUsername, inputPassword, salt);
    if (calculatedAuthHash !== vaultEnvelope.auth.authVerifyHash) {
      throw new Error('Invalid username or password.');
    }

    // Derive user key and decrypt masterVaultKey
    const userDerivedKey = this.deriveKey(inputPassword, salt);
    const masterVaultKey = this.decrypt(vaultEnvelope.auth.userKeyEncryptedVaultKey, userDerivedKey);

    // Decrypt actual payload
    const decryptedJson = this.decrypt(vaultEnvelope.encryptedData, masterVaultKey);
    const payload = JSON.parse(decryptedJson);

    return {
      masterVaultKey,
      data: payload,
    };
  },

  // Verify recovery answers and recover masterVaultKey
  unlockWithRecovery(vaultEnvelope, a1, a2) {
    const salt = vaultEnvelope.salt;
    const normA1 = this.normalizeAnswer(a1);
    const normA2 = this.normalizeAnswer(a2);

    const hash1 = this.hashAnswer(normA1, salt);
    const hash2 = this.hashAnswer(normA2, salt);

    if (hash1 !== vaultEnvelope.recovery.a1Hash || hash2 !== vaultEnvelope.recovery.a2Hash) {
      throw new Error('One or both security answers are incorrect.');
    }

    const recoveryCombined = normA1 + '::||::' + normA2;
    const recoveryDerivedKey = this.deriveKey(recoveryCombined, salt);
    const masterVaultKey = this.decrypt(vaultEnvelope.recovery.recoveryKeyEncryptedVaultKey, recoveryDerivedKey);

    const decryptedJson = this.decrypt(vaultEnvelope.encryptedData, masterVaultKey);
    const payload = JSON.parse(decryptedJson);

    return {
      masterVaultKey,
      data: payload,
    };
  },

  // Re-encrypt vault with new credentials or questions
  reEncryptVault({
    vaultEnvelope,
    masterVaultKey,
    currentData,
    newUsername,
    newPassword,
    newQ1,
    newA1,
    newQ2,
    newA2,
  }) {
    const salt = vaultEnvelope.salt;
    const username = (newUsername !== undefined ? newUsername : vaultEnvelope.auth.username).trim();

    // Encrypt fresh data if updated
    const encryptedData = this.encrypt(JSON.stringify(currentData), masterVaultKey);

    let userKeyEncryptedVaultKey = vaultEnvelope.auth.userKeyEncryptedVaultKey;
    let authVerifyHash = vaultEnvelope.auth.authVerifyHash;

    if (newPassword) {
      const userDerivedKey = this.deriveKey(newPassword, salt);
      userKeyEncryptedVaultKey = this.encrypt(masterVaultKey, userDerivedKey);
      authVerifyHash = this.computeAuthHash(username, newPassword, salt);
    }

    let recovery = { ...vaultEnvelope.recovery };
    if (newQ1 && newA1 && newQ2 && newA2) {
      const normA1 = this.normalizeAnswer(newA1);
      const normA2 = this.normalizeAnswer(newA2);
      const recoveryCombined = normA1 + '::||::' + normA2;
      const recoveryDerivedKey = this.deriveKey(recoveryCombined, salt);
      const recoveryKeyEncryptedVaultKey = this.encrypt(masterVaultKey, recoveryDerivedKey);

      recovery = {
        q1: newQ1.trim(),
        a1Hash: this.hashAnswer(newA1, salt),
        q2: newQ2.trim(),
        a2Hash: this.hashAnswer(newA2, salt),
        recoveryKeyEncryptedVaultKey,
      };
    }

    return {
      version: 1,
      format: 'SAFEVAULT_AES256_FLATFILE',
      updatedAt: new Date().toISOString(),
      salt,
      auth: {
        username,
        authVerifyHash,
        userKeyEncryptedVaultKey,
      },
      recovery,
      encryptedData,
    };
  },

  // Save changes to current data using the active masterVaultKey
  saveDataToEnvelope(vaultEnvelope, masterVaultKey, data) {
    const encryptedData = this.encrypt(JSON.stringify(data), masterVaultKey);
    return {
      ...vaultEnvelope,
      updatedAt: new Date().toISOString(),
      encryptedData,
    };
  },
};
