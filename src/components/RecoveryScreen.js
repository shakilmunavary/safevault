import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEMES } from '../theme';

export default function RecoveryScreen({ vaultEnvelope, onRecoverySuccess, onCancel, theme = THEMES.cyber_dark }) {
  const insets = useSafeAreaInsets();
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const q1 = vaultEnvelope?.recovery?.q1 || 'Question 1';
  const q2 = vaultEnvelope?.recovery?.q2 || 'Question 2';

  const handleVerifyAnswers = () => {
    if (!a1.trim() || !a2.trim()) {
      Alert.alert('Missing Answers', 'Please answer both security questions.');
      return;
    }

    setLoading(true);
    try {
      onRecoverySuccess.verifyAnswersOnly(a1.trim(), a2.trim());
      setIsVerified(true);
    } catch (err) {
      Alert.alert('Verification Failed', err.message || 'Incorrect security answers.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 3) {
      Alert.alert('Short Password', 'New password must be at least 3 digits / characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      onRecoverySuccess.completeReset(a1.trim(), a2.trim(), newPassword);
    } catch (err) {
      Alert.alert('Reset Failed', err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28) + 14
    : Math.max(insets.top, 38) + 8;

  const bottomPadding = Math.max(insets.bottom, 16) + 30;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top Bar */}
      <View style={[styles.topNav, { paddingTop: topPadding, backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
            onPress={onCancel}
          >
            <MaterialCommunityIcons name="home" size={17} color={theme.colors.primary} />
            <Text style={[styles.backBtnText, { color: theme.colors.primary, fontWeight: '700' }]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
            onPress={onCancel}
          >
            <MaterialCommunityIcons name="arrow-left" size={17} color={theme.colors.textPrimary} />
            <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.navTitle, { color: theme.colors.textPrimary }]}>Vault Recovery</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="shield-refresh" size={48} color={theme.colors.secondary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Password Reset</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Answer your security questions to decrypt and reset your master password.
          </Text>
        </View>

        {!isVerified ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.sectionHeader, { color: theme.colors.textPrimary }]}>Security Questions</Text>

            {/* Question 1 */}
            <Text style={[styles.questionPrompt, { color: theme.colors.textPrimary }]}>Q1: {q1}</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
              <MaterialCommunityIcons name="form-textbox" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Answer 1 (Case-Insensitive)"
                placeholderTextColor={theme.colors.textMuted}
                value={a1}
                onChangeText={setA1}
                autoCapitalize="none"
              />
            </View>

            {/* Question 2 */}
            <Text style={[styles.questionPrompt, { color: theme.colors.textPrimary, marginTop: 14 }]}>Q2: {q2}</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
              <MaterialCommunityIcons name="form-textbox" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Answer 2 (Case-Insensitive)"
                placeholderTextColor={theme.colors.textMuted}
                value={a2}
                onChangeText={setA2}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleVerifyAnswers}
              disabled={loading}
            >
              <MaterialCommunityIcons name="check-decagram" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Verifying...' : 'Verify Answers'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <View style={[styles.verifiedBanner, { backgroundColor: theme.colors.accentLight }]}>
              <MaterialCommunityIcons name="checkbox-marked-circle" size={22} color={theme.colors.accent} />
              <Text style={[styles.verifiedText, { color: theme.colors.accent }]}>Answers verified successfully!</Text>
            </View>

            <Text style={[styles.sectionHeader, { color: theme.colors.textPrimary }]}>Set New Master Password / PIN</Text>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>New Master Password / PIN</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
              <MaterialCommunityIcons name="key" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Enter new password / PIN (min 3 chars)"
                placeholderTextColor={theme.colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Confirm New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
              <MaterialCommunityIcons name="key-variant" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="Re-enter new password"
                placeholderTextColor={theme.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <MaterialCommunityIcons name="shield-check" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>
                {loading ? 'Re-encrypting Vault...' : 'Save & Unlock Vault'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  questionPrompt: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 6,
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
  eyeBtn: {
    padding: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
