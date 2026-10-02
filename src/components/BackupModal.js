import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { CryptoService } from '../services/cryptoService';

export default function BackupModal({
  visible,
  vaultData,
  onImportComplete,
  onClose,
  onHome,
  theme,
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'

  // --- Export State ---
  const [exportPassword, setExportPassword] = useState('');
  const [confirmExportPassword, setConfirmExportPassword] = useState('');
  const [exportNote, setExportNote] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [generatedEncryptedText, setGeneratedEncryptedText] = useState('');
  const [exportCopied, setExportCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // --- Import State ---
  const [importInputText, setImportInputText] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [isImporting, setIsImporting] = useState(false);
  const [pickedFileName, setPickedFileName] = useState('');

  if (!visible) return null;

  const totalFolders = vaultData?.folders?.length || 0;
  const totalNotes = vaultData?.notes?.length || 0;
  const totalImages = vaultData?.notes?.filter((n) => !!n.imageUri)?.length || 0;

  // 1. Handle Encrypted Export Generation
  const handleGenerateExport = () => {
    if (!exportPassword || exportPassword.length < 3) {
      Alert.alert('Short Password', 'Please enter an export password of at least 3 characters.');
      return;
    }
    if (exportPassword !== confirmExportPassword) {
      Alert.alert('Mismatch', 'Export passwords do not match.');
      return;
    }

    setIsExporting(true);
    try {
      const encryptedPackage = CryptoService.exportVaultEncrypted(
        vaultData,
        exportPassword,
        exportNote
      );
      setGeneratedEncryptedText(encryptedPackage);
    } catch (err) {
      Alert.alert('Export Failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Share / Download Encrypted File
  const handleShareFile = async () => {
    if (!generatedEncryptedText) return;

    try {
      const fileName = `AlavuddinVault_Backup_${new Date().toISOString().slice(0, 10)}.alavuddin`;

      if (Platform.OS === 'web') {
        // Web direct browser file download
        const blob = new Blob([generatedEncryptedText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Native mobile file system write & share
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, generatedEncryptedText);

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/octet-stream',
            dialogTitle: 'Share Encrypted Vault Backup',
            UTI: 'public.data',
          });
        } else {
          Alert.alert('Sharing Unavailable', 'Saved to cache directory: ' + fileUri);
        }
      }
    } catch (err) {
      Alert.alert('Sharing Error', err.message);
    }
  };

  // 3. Copy Encrypted Export Code
  const handleCopyExportText = async () => {
    if (!generatedEncryptedText) return;
    await Clipboard.setStringAsync(generatedEncryptedText);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  // 4. Pick File for Import
  const handlePickImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setPickedFileName(file.name);

        let content = '';
        if (Platform.OS === 'web' && file.file) {
          content = await file.file.text();
        } else if (file.uri) {
          content = await FileSystem.readAsStringAsync(file.uri);
        }

        if (content) {
          setImportInputText(content);
        }
      }
    } catch (err) {
      Alert.alert('File Picker Error', err.message);
    }
  };

  // 5. Decrypt and Import Vault
  const handleExecuteImport = () => {
    if (!importInputText.trim()) {
      Alert.alert('Missing Data', 'Please select a backup file or paste encrypted backup code.');
      return;
    }
    if (!importPassword) {
      Alert.alert('Missing Password', 'Please enter the decryption password for this backup.');
      return;
    }

    setIsImporting(true);
    try {
      const decryptedData = CryptoService.importVaultEncrypted(
        importInputText.trim(),
        importPassword
      );

      const incomingFolders = decryptedData.folders || [];
      const incomingNotes = decryptedData.notes || [];

      let mergedFolders = [];
      let mergedNotes = [];

      if (importMode === 'replace') {
        mergedFolders = incomingFolders;
        mergedNotes = incomingNotes;
      } else {
        // Merge mode: Add unique folders and notes
        const existingFolderIds = new Set(vaultData.folders.map((f) => f.id));
        const existingNoteIds = new Set(vaultData.notes.map((n) => n.id));

        mergedFolders = [...vaultData.folders];
        incomingFolders.forEach((f) => {
          if (!existingFolderIds.has(f.id)) {
            mergedFolders.push(f);
          }
        });

        mergedNotes = [...vaultData.notes];
        incomingNotes.forEach((n) => {
          if (!existingNoteIds.has(n.id)) {
            mergedNotes.push(n);
          } else {
            // If ID matches, append as duplicate copy
            mergedNotes.push({
              ...n,
              id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              title: `${n.title} (Imported)`,
            });
          }
        });
      }

      onImportComplete({
        username: vaultData.username,
        folders: mergedFolders,
        notes: mergedNotes,
      });

      Alert.alert(
        'Import Successful!',
        `Successfully decrypted and loaded ${incomingFolders.length} folders and ${incomingNotes.length} secret notes.`
      );
      onClose();
    } catch (err) {
      Alert.alert('Import Failed', err.message || 'Incorrect password or corrupted backup.');
    } finally {
      setIsImporting(false);
    }
  };

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, 28) + 14
    : Math.max(insets.top, 38) + 8;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: topPadding, backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.surfaceBorder }]}>
          <View style={styles.leftNavGroup}>
            <TouchableOpacity
              style={[styles.homeBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
              onPress={() => {
                onClose();
                if (onHome) onHome();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="home" size={17} color={theme.colors.primary} />
              <Text style={[styles.homeBtnLabel, { color: theme.colors.primary }]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={17} color={theme.colors.textPrimary} />
              <Text style={[styles.backBtnLabel, { color: theme.colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Encrypted Backup & Share
          </Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher: Export vs Import */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'export' && [styles.tabBtnActive, { borderBottomColor: theme.colors.primary }],
            ]}
            onPress={() => setActiveTab('export')}
          >
            <MaterialCommunityIcons
              name="export-variant"
              size={18}
              color={activeTab === 'export' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'export' ? theme.colors.primary : theme.colors.textSecondary }]}>
              📤 Export & Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'import' && [styles.tabBtnActive, { borderBottomColor: theme.colors.primary }],
            ]}
            onPress={() => setActiveTab('import')}
          >
            <MaterialCommunityIcons
              name="import"
              size={18}
              color={activeTab === 'import' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'import' ? theme.colors.primary : theme.colors.textSecondary }]}>
              📥 Import Vault
            </Text>
          </TouchableOpacity>
        </View>

        {/* Body Content */}
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 40, padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <View>
              {/* Vault Summary Card */}
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Vault Summary</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  All folders, notes, credential details, and images will be fully encrypted with AES-256 before sharing.
                </Text>

                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceHighlight }]}>
                    <MaterialCommunityIcons name="folder" size={20} color={theme.colors.folderYellow || '#F3C544'} />
                    <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{totalFolders}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Folders</Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceHighlight }]}>
                    <MaterialCommunityIcons name="file-document-lock" size={20} color={theme.colors.primary} />
                    <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{totalNotes}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Notes</Text>
                  </View>

                  <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceHighlight }]}>
                    <MaterialCommunityIcons name="image" size={20} color={theme.colors.secondary} />
                    <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{totalImages}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Photos</Text>
                  </View>
                </View>
              </View>

              {/* Set Export Password Card */}
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Set Sharing Password</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  💡 Set a password specifically for sharing this backup (e.g. share this password with your wife). Only someone with this password can decrypt the file.
                </Text>

                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Export Password (min 3 chars)</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <MaterialCommunityIcons name="key" size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    placeholder="Enter sharing/backup password"
                    placeholderTextColor={theme.colors.textMuted}
                    value={exportPassword}
                    onChangeText={setExportPassword}
                    secureTextEntry={!showExportPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowExportPassword(!showExportPassword)}>
                    <MaterialCommunityIcons
                      name={showExportPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Confirm Export Password</Text>
                <View style={[styles.inputRow, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <MaterialCommunityIcons name="key-variant" size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.colors.textMuted}
                    value={confirmExportPassword}
                    onChangeText={setConfirmExportPassword}
                    secureTextEntry={!showExportPassword}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleGenerateExport}
                  disabled={isExporting}
                >
                  <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#FFF" />
                  <Text style={styles.primaryActionBtnText}>
                    {isExporting ? 'Encrypting...' : '🔒 Generate Encrypted Export'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Generated Encrypted Package & Share Controls */}
              {generatedEncryptedText ? (
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary, borderWidth: 1.5 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <MaterialCommunityIcons name="check-decagram" size={20} color={theme.colors.accent} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                      Encrypted Package Ready!
                    </Text>
                  </View>

                  <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                    Your vault is encrypted with AES-256. You can now share the `.alavuddin` file or copy the encrypted code to WhatsApp/Email.
                  </Text>

                  {/* Action Buttons: Share File & Copy Code */}
                  <View style={styles.exportActionButtons}>
                    <TouchableOpacity
                      style={[styles.shareBtn, { backgroundColor: theme.colors.primary }]}
                      onPress={handleShareFile}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="share-variant" size={18} color="#FFF" />
                      <Text style={styles.shareBtnText}>📁 Share / Save File</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.copyCodeBtn,
                        { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder },
                        exportCopied && { backgroundColor: theme.colors.accentLight, borderColor: theme.colors.accent },
                      ]}
                      onPress={handleCopyExportText}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={exportCopied ? 'check' : 'content-copy'}
                        size={18}
                        color={exportCopied ? theme.colors.accent : theme.colors.textPrimary}
                      />
                      <Text style={[styles.copyCodeBtnText, { color: exportCopied ? theme.colors.accent : theme.colors.textPrimary }]}>
                        {exportCopied ? 'Copied Code!' : '📋 Copy Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <View>
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Import Encrypted Vault</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  Import and decrypt an `.alavuddin` / `.enc` backup file or paste encrypted code shared by another device or user.
                </Text>

                {/* Option A: Select File */}
                <TouchableOpacity
                  style={[styles.filePickBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
                  onPress={handlePickImportFile}
                >
                  <MaterialCommunityIcons name="file-upload-outline" size={24} color={theme.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.filePickTitle, { color: theme.colors.textPrimary }]}>
                      {pickedFileName ? `Selected: ${pickedFileName}` : 'Select Backup File (.alavuddin / .enc)'}
                    </Text>
                    <Text style={[styles.filePickSubtitle, { color: theme.colors.textSecondary }]}>
                      Click to browse your device files
                    </Text>
                  </View>
                </TouchableOpacity>

                <Text style={[styles.orDivider, { color: theme.colors.textMuted }]}>— OR PASTE ENCRYPTED TEXT —</Text>

                {/* Option B: Paste Encrypted Text */}
                <View style={[styles.textAreaContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <TextInput
                    style={[styles.textAreaInput, { color: theme.colors.textPrimary }]}
                    placeholder="Paste the full encrypted backup text / code here..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={importInputText}
                    onChangeText={setImportInputText}
                    multiline
                    textAlignVertical="top"
                  />
                  {importInputText ? (
                    <TouchableOpacity onPress={() => setImportInputText('')} style={styles.clearTextBtn}>
                      <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Decryption Password */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                  Decryption Password
                </Text>
                <View style={[styles.inputRow, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <MaterialCommunityIcons name="key" size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    placeholder="Enter the password used when exporting"
                    placeholderTextColor={theme.colors.textMuted}
                    value={importPassword}
                    onChangeText={setImportPassword}
                    secureTextEntry={!showImportPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowImportPassword(!showImportPassword)}>
                    <MaterialCommunityIcons
                      name={showImportPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Import Mode: Merge vs Replace */}
                <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                  Import Mode
                </Text>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder },
                      importMode === 'merge' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                    ]}
                    onPress={() => setImportMode('merge')}
                  >
                    <MaterialCommunityIcons
                      name="set-merge"
                      size={18}
                      color={importMode === 'merge' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeTitle, { color: importMode === 'merge' ? theme.colors.primary : theme.colors.textPrimary }]}>
                        Merge Vault
                      </Text>
                      <Text style={[styles.modeDesc, { color: theme.colors.textSecondary }]}>
                        Keep current notes and append incoming ones
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeOption,
                      { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder },
                      importMode === 'replace' && { borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerLight },
                    ]}
                    onPress={() => setImportMode('replace')}
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal-bold"
                      size={18}
                      color={importMode === 'replace' ? theme.colors.danger : theme.colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeTitle, { color: importMode === 'replace' ? theme.colors.danger : theme.colors.textPrimary }]}>
                        Replace Vault
                      </Text>
                      <Text style={[styles.modeDesc, { color: theme.colors.textSecondary }]}>
                        Overwrite with incoming vault
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Import Button */}
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.colors.accent, marginTop: 16 }]}
                  onPress={handleExecuteImport}
                  disabled={isImporting}
                >
                  <MaterialCommunityIcons name="lock-open-variant" size={18} color="#FFF" />
                  <Text style={styles.primaryActionBtnText}>
                    {isImporting ? 'Decrypting & Loading...' : '📥 Decrypt & Import to Vault'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  leftNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  homeBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  backBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exportActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  copyCodeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  copyCodeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filePickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  filePickTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  filePickSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  orDivider: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 12,
  },
  textAreaContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    minHeight: 100,
    marginBottom: 8,
    position: 'relative',
  },
  textAreaInput: {
    fontSize: 12,
    lineHeight: 18,
    minHeight: 80,
  },
  clearTextBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modeRow: {
    gap: 8,
    marginTop: 4,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  modeDesc: {
    fontSize: 11,
    marginTop: 1,
  },
});
