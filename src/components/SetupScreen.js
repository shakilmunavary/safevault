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
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEMES } from '../theme';

const DEFAULT_QUESTIONS_1 = [
  'What was the name of your first elementary school?',
  'What is your oldest cousin’s first name?',
  'What city were you born in?',
  'What was the make and model of your first car?',
];

const DEFAULT_QUESTIONS_2 = [
  'What is your favorite childhood movie?',
  'What was the name of your first pet?',
  'What is the maiden name of your grandmother?',
  'In what city did your parents meet?',
];

export default function SetupScreen({ onSetupComplete, theme = THEMES.cyber_dark }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [q1, setQ1] = useState(DEFAULT_QUESTIONS_1[0]);
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(DEFAULT_QUESTIONS_2[0]);
  const [a2, setA2] = useState('');

  const [isCustomQ1, setIsCustomQ1] = useState(false);
  const [isCustomQ2, setIsCustomQ2] = useState(false);
  const [customQ1Text, setCustomQ1Text] = useState('');
  const [customQ2Text, setCustomQ2Text] = useState('');

  const [loading, setLoading] = useState(false);

  const handleCreateVault = () => {
    if (!username.trim()) {
      Alert.alert('Missing Field', 'Please enter a username.');
      return;
    }
    if (!password || password.length < 3) {
      Alert.alert('Short Password', 'Password must be at least 3 digits / characters long.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    const finalQ1 = isCustomQ1 ? customQ1Text.trim() : q1;
    const finalQ2 = isCustomQ2 ? customQ2Text.trim() : q2;

    if (!finalQ1 || !a1.trim()) {
      Alert.alert('Missing Field', 'Please provide Question 1 and its Answer.');
      return;
    }
    if (!finalQ2 || !a2.trim()) {
      Alert.alert('Missing Field', 'Please provide Question 2 and its Answer.');
      return;
    }

    setLoading(true);
    try {
      onSetupComplete({
        username: username.trim(),
        password,
        q1: finalQ1,
        a1: a1.trim(),
        q2: finalQ2,
        a2: a2.trim(),
      });
    } catch (err) {
      Alert.alert('Setup Error', err.message || 'Could not initialize vault.');
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 12
    : Math.max(insets.top, 30) + 12;

  const bottomPadding = Math.max(insets.bottom, 16) + 30;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Alavuddin Vault</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Initial Setup: Create your master credentials & recovery questions.
          </Text>
          <View style={[styles.securityBadge, { backgroundColor: theme.colors.accentLight }]}>
            <MaterialCommunityIcons name="shield-lock" size={14} color={theme.colors.accent} />
            <Text style={[styles.securityBadgeText, { color: theme.colors.accent }]}>Zero-Knowledge AES-256 Flat-File Encryption</Text>
          </View>
        </View>

        {/* Credentials Section */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.textPrimary }]}>Master Credentials</Text>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Username</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="account" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter your username"
              placeholderTextColor={theme.colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Master Password / PIN</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="key" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter password/PIN (min 3 chars/digits)"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
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

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Confirm Master Password</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="key-variant" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Re-enter password"
              placeholderTextColor={theme.colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Recovery Questions Section */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.sectionHeader, { color: theme.colors.textPrimary }]}>Password Recovery Questions</Text>
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            💡 Answers are case-insensitive and used to decrypt your vault if you ever forget your password.
          </Text>

          {/* Question 1 */}
          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>Question 1</Text>
          <View style={styles.pickerBox}>
            {DEFAULT_QUESTIONS_1.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionBtn,
                  { backgroundColor: theme.colors.surfaceHighlight },
                  !isCustomQ1 && q1 === q && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                ]}
                onPress={() => {
                  setIsCustomQ1(false);
                  setQ1(q);
                }}
              >
                <Text style={[styles.optionText, { color: theme.colors.textSecondary }, !isCustomQ1 && q1 === q && { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.optionBtn,
                { backgroundColor: theme.colors.surfaceHighlight },
                isCustomQ1 && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
              ]}
              onPress={() => setIsCustomQ1(true)}
            >
              <Text style={[styles.optionText, { color: theme.colors.textSecondary }, isCustomQ1 && { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                ✍️ Write Custom Question
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomQ1 && (
            <TextInput
              style={[styles.input, styles.customInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.primary, color: theme.colors.textPrimary }]}
              placeholder="Type your custom question 1..."
              placeholderTextColor={theme.colors.textMuted}
              value={customQ1Text}
              onChangeText={setCustomQ1Text}
            />
          )}

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Answer 1 (Case-Insensitive)</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="form-textbox" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter answer 1"
              placeholderTextColor={theme.colors.textMuted}
              value={a1}
              onChangeText={setA1}
              autoCapitalize="none"
            />
          </View>

          {/* Question 2 */}
          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 18 }]}>Question 2</Text>
          <View style={styles.pickerBox}>
            {DEFAULT_QUESTIONS_2.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionBtn,
                  { backgroundColor: theme.colors.surfaceHighlight },
                  !isCustomQ2 && q2 === q && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
                ]}
                onPress={() => {
                  setIsCustomQ2(false);
                  setQ2(q);
                }}
              >
                <Text style={[styles.optionText, { color: theme.colors.textSecondary }, !isCustomQ2 && q2 === q && { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.optionBtn,
                { backgroundColor: theme.colors.surfaceHighlight },
                isCustomQ2 && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
              ]}
              onPress={() => setIsCustomQ2(true)}
            >
              <Text style={[styles.optionText, { color: theme.colors.textSecondary }, isCustomQ2 && { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                ✍️ Write Custom Question
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomQ2 && (
            <TextInput
              style={[styles.input, styles.customInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.primary, color: theme.colors.textPrimary }]}
              placeholder="Type your custom question 2..."
              placeholderTextColor={theme.colors.textMuted}
              value={customQ2Text}
              onChangeText={setCustomQ2Text}
            />
          )}

          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Answer 2 (Case-Insensitive)</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="form-textbox" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Enter answer 2"
              placeholderTextColor={theme.colors.textMuted}
              value={a2}
              onChangeText={setA2}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleCreateVault}
          disabled={loading}
        >
          <MaterialCommunityIcons name="lock" size={22} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>
            {loading ? 'Encrypting & Initializing...' : 'Initialize & Encrypt Vault'}
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 11, color: theme.colors.textMuted, textAlign: 'center' }}>
            © 2026 Shakil Ahamed (shakil.ahamed@gmail.com) • All Rights Reserved
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  customInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
  },
  eyeBtn: {
    padding: 6,
  },
  pickerBox: {
    gap: 6,
    marginBottom: 6,
  },
  optionBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 13,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 6,
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
});
