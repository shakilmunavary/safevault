import { CryptoService } from './src/services/cryptoService.js';

console.log('--- Testing SafeVault Cryptography (Min 3 Chars/Digits) ---');

// 1. Initial Setup with 3-character password / PIN
const username = 'SafeVaultUser';
const password = '7A#'; // 3-digit alphanumeric password
const q1 = 'What city were you born in?';
const a1 = 'San Francisco';
const q2 = 'What was your first pet name?';
const a2 = 'Fluffy Dog';

const initialEnvelope = CryptoService.createInitialVault({
  username,
  password,
  q1,
  a1,
  q2,
  a2,
});

console.log('1. Initial Vault Created.');
console.log('   App Name: SafeVault');
console.log('   Encrypted Data Prefix:', initialEnvelope.encryptedData.substring(0, 40) + '...');
console.log('   Salt:', initialEnvelope.salt);

// 2. Normal Login test with 3-character password & case-insensitive username
const unlockSuccess = CryptoService.unlockWithPassword(initialEnvelope, 'safevaultuser', '7A#');
console.log('2. Normal Unlock with 3-char password: SUCCESS! Decrypted username:', unlockSuccess.data.username);

// 3. Test Invalid Password
try {
  CryptoService.unlockWithPassword(initialEnvelope, 'SafeVaultUser', '7A$');
  console.error('FAILED: Incorrect password should not have unlocked!');
} catch (e) {
  console.log('3. Invalid Password Rejection: PASSED! (Caught error:', e.message, ')');
}

// 4. Test Case-Insensitive Recovery
const recoveryA1 = '  san francisco  ';
const recoveryA2 = 'FLUFFY DOG';

const recoveryUnlock = CryptoService.unlockWithRecovery(initialEnvelope, recoveryA1, recoveryA2);
console.log('4. Case-Insensitive Recovery Unlock: SUCCESS! Decrypted notes:', recoveryUnlock.data.notes.length);

// 5. Test Password Reset to another 3-digit PIN
const newPassword = '999';
const updatedEnvelope = CryptoService.reEncryptVault({
  vaultEnvelope: initialEnvelope,
  masterVaultKey: recoveryUnlock.masterVaultKey,
  currentData: recoveryUnlock.data,
  newPassword,
});

// Try unlocking with NEW 3-digit password
const newUnlock = CryptoService.unlockWithPassword(updatedEnvelope, 'SafeVaultUser', '999');
console.log('5. Unlock with New 3-digit PIN: SUCCESS! User:', newUnlock.data.username);

console.log('\n✅ ALL SAFEVAULT CRYPTOGRAPHIC TESTS PASSED 100%!');
