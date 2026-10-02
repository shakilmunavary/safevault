import React, { useState, useEffect } from 'react';
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
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { StorageService } from '../services/storageService';
import { THEMES } from '../theme';

export default function SettingsModal({
  visible,
  currentUsername,
  vaultEnvelope,
  currentThemeId,
  onChangeTheme,
  onChangeUsername,
  onChangePassword,
  onUpdateRecovery,
  onWipeVault,
  onOpenBackupModal,
  onClose,
  onHome,
  theme,
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'themes' | 'backup' | 'recovery' | 'fileinfo'

  // Username change state
  const [newUsername, setNewUsername] = useState(currentUsername);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Recovery questions change state
  const [newQ1, setNewQ1] = useState(vaultEnvelope?.recovery?.q1 || '');
  const [newA1, setNewA1] = useState('');
  const [newQ2, setNewQ2] = useState(vaultEnvelope?.recovery?.q2 || '');
  const [newA2, setNewA2] = useState('');

  // Flat file stats
  const [fileStats, setFileStats] = useState(null);

  // Wipe confirmation modal
  const [isWipeModalVisible, setIsWipeModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setNewUsername(currentUsername);
      setNewQ1(vaultEnvelope?.recovery?.q1 || '');
      setNewQ2(vaultEnvelope?.recovery?.q2 || '');
      loadStats();
    }
  }, [visible, currentUsername, vaultEnvelope]);

  const loadStats = async () => {
    const stats = await StorageService.getVaultFileStats();
    setFileStats(stats);
  };

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28) + 14
    : Math.max(insets.top, 38) + 8;

  const handleSaveUsername = () => {
    if (!newUsername.trim()) {
      Alert.alert('Invalid', 'Username cannot be empty.');
      return;
    }
    onChangeUsername(newUsername.trim());
    Alert.alert('Success', 'Username updated successfully.');
  };

  const handleSavePassword = () => {
    if (!newPassword || newPassword.length < 3) {
      Alert.alert('Short Password', 'New password must be at least 3 digits / characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    try {
      onChangePassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Success', 'Master Password has been changed and vault re-encrypted.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not change password.');
    }
  };

  const handleSaveRecovery = () => {
    if (!newQ1.trim() || !newA1.trim() || !newQ2.trim() || !newA2.trim()) {
      Alert.alert('Incomplete', 'Please provide both questions and their answers.');
      return;
    }

    try {
      onUpdateRecovery(newQ1.trim(), newA1.trim(), newQ2.trim(), newA2.trim());
      setNewA1('');
      setNewA2('');
      Alert.alert('Success', 'Recovery questions and answers updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update recovery.');
    }
  };

  const handleWipeConfirmed = () => {
    setIsWipeModalVisible(false);
    onWipeVault();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top Header with Home & Back */}
        <View style={[styles.header, { paddingTop: topPadding, backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.surfaceBorder }]}>
          <View style={styles.leftNavGroup}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]} onPress={onClose} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.textPrimary} />
              <Text style={[styles.navBtnLabel, { color: theme.colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.homeBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
              onPress={() => {
                onClose();
                if (onHome) onHome();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="home" size={16} color={theme.colors.primary} />
              <Text style={[styles.homeBtnLabel, { color: theme.colors.primary }]}>Home</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Settings</Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'account' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('account')}
          >
            <MaterialCommunityIcons
              name="account-cog-outline"
              size={18}
              color={activeTab === 'account' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'account' ? theme.colors.primary : theme.colors.textSecondary }]}>Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'themes' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('themes')}
          >
            <MaterialCommunityIcons
              name="palette-outline"
              size={18}
              color={activeTab === 'themes' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'themes' ? theme.colors.primary : theme.colors.textSecondary }]}>Themes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'backup' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('backup')}
          >
            <MaterialCommunityIcons
              name="shield-sync-outline"
              size={18}
              color={activeTab === 'backup' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'backup' ? theme.colors.primary : theme.colors.textSecondary }]}>Share/Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'recovery' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('recovery')}
          >
            <MaterialCommunityIcons
              name="shield-refresh-outline"
              size={18}
              color={activeTab === 'recovery' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'recovery' ? theme.colors.primary : theme.colors.textSecondary }]}>Recovery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'fileinfo' && { borderBottomColor: theme.colors.primary }]}
            onPress={() => setActiveTab('fileinfo')}
          >
            <MaterialCommunityIcons
              name="file-lock-outline"
              size={18}
              color={activeTab === 'fileinfo' ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text style={[styles.tabText, { color: activeTab === 'fileinfo' ? theme.colors.primary : theme.colors.textSecondary }]}>Flat-File</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'account' && (
            <View>
              {/* Change Username */}
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Change Username</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>Update your primary login identifier.</Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Username</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <MaterialCommunityIcons name="account" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveUsername}>
                  <Text style={styles.actionBtnText}>Update Username</Text>
                </TouchableOpacity>
              </View>

              {/* Change Password */}
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Change Master Password</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  This will re-derive encryption keys and re-encrypt the flat file.
                </Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>New Master Password / PIN</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <MaterialCommunityIcons name="key" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="New password / PIN (min 3 chars/digits)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPasswords}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Confirm New Master Password</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <MaterialCommunityIcons name="key-variant" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.colors.textMuted}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!showPasswords}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSavePassword}>
                  <Text style={styles.actionBtnText}>Re-encrypt Vault with New Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'themes' && (
            <View>
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Theme Customization</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  Choose your preferred look and feel for Alavuddin Vault.
                </Text>

                {Object.values(THEMES).map((th) => {
                  const isSelected = th.id === currentThemeId;
                  return (
                    <TouchableOpacity
                      key={th.id}
                      style={[
                        styles.themeOptionRow,
                        { backgroundColor: th.colors.surfaceHighlight, borderColor: isSelected ? th.colors.primary : th.colors.surfaceBorder },
                        isSelected && { borderWidth: 2, backgroundColor: th.colors.activeItem },
                      ]}
                      onPress={() => onChangeTheme(th.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.themeOptionName, { color: th.colors.textPrimary }]}>{th.name}</Text>
                        <View style={styles.colorPalettePreview}>
                          <View style={[styles.colorDot, { backgroundColor: th.colors.background }]} />
                          <View style={[styles.colorDot, { backgroundColor: th.colors.surface }]} />
                          <View style={[styles.colorDot, { backgroundColor: th.colors.primary }]} />
                          <View style={[styles.colorDot, { backgroundColor: th.colors.accent }]} />
                        </View>
                      </View>

                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={24} color={th.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {activeTab === 'recovery' && (
            <View>
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Update Security Questions</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  Answers are case-insensitive and used for zero-knowledge vault recovery.
                </Text>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Question 1</Text>
                <TextInput
                  style={[styles.fullInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.textPrimary }]}
                  value={newQ1}
                  onChangeText={setNewQ1}
                  placeholder="Question 1"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Answer 1 (Case-Insensitive)</Text>
                <TextInput
                  style={[styles.fullInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.textPrimary }]}
                  value={newA1}
                  onChangeText={setNewA1}
                  placeholder="Type new answer 1"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 14 }]}>Question 2</Text>
                <TextInput
                  style={[styles.fullInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.textPrimary }]}
                  value={newQ2}
                  onChangeText={setNewQ2}
                  placeholder="Question 2"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Answer 2 (Case-Insensitive)</Text>
                <TextInput
                  style={[styles.fullInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.textPrimary }]}
                  value={newA2}
                  onChangeText={setNewA2}
                  placeholder="Type new answer 2"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                />

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveRecovery}>
                  <Text style={styles.actionBtnText}>Save Recovery Questions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'fileinfo' && (
            <View>
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Encrypted Flat-File Storage</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  Verified: No external database. Data is written directly as an AES-256 encrypted payload file.
                </Text>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.surfaceHighlight }]}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>App Name:</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>Alavuddin Vault</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.surfaceHighlight }]}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Encryption Algorithm:</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>AES-256-CBC + PBKDF2</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.surfaceHighlight }]}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>PBKDF2 Iterations:</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>10,000 Rounds (SHA-256)</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.surfaceHighlight }]}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>File Format:</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>Direct Flat-File JSON Envelope</Text>
                </View>

                <View style={[styles.infoRow, { borderBottomColor: theme.colors.surfaceHighlight }]}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>File Size on Disk:</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                    {fileStats ? `${fileStats.size} bytes` : 'Calculating...'}
                  </Text>
                </View>
              </View>

              {/* Danger Zone */}
              <View style={[styles.card, { borderColor: theme.colors.danger, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.danger }]}>Danger Zone</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  Permanently delete the local encrypted file and reset the entire app to initial state.
                </Text>

                <TouchableOpacity style={[styles.dangerBtn, { backgroundColor: theme.colors.danger }]} onPress={() => setIsWipeModalVisible(true)}>
          {activeTab === 'backup' && (
            <View>
              <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Encrypted Backup & Family Sharing</Text>
                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                  Export your entire encrypted vault to share with your wife or transfer to another device. Exported files are fully encrypted with AES-256 using a custom sharing password.
                </Text>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.primary, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                  onPress={onOpenBackupModal}
                >
                  <MaterialCommunityIcons name="shield-sync" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>Open Encrypted Backup & Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Copyright Statement */}
          <View style={{ alignItems: 'center', marginTop: 24, paddingVertical: 10 }}>
            <Text style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: 'center' }}>
              © 2026 Shakil Ahamed (shakil.ahamed@gmail.com) • All Rights Reserved
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Universal Wipe Confirmation Modal */}
        <ConfirmDeleteModal
          visible={isWipeModalVisible}
          title="⚠️ Wipe All Vault Data"
          message="Are you completely sure? This will permanently delete the encrypted vault flat file and all notes. This cannot be undone."
          onConfirm={handleWipeConfirmed}
          onCancel={() => setIsWipeModalVisible(false)}
          theme={theme}
        />
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 44,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  leftNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  navBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  homeBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
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
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  fullInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  dangerBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  themeOptionName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  colorPalettePreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
