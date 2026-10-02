import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEMES } from '../theme';

export default function LoginScreen({ onLogin, onForgotPassword, savedUsername, theme = THEMES.cyber_dark }) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState(savedUsername || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      Alert.alert('Missing Username', 'Please enter your username.');
      return;
    }
    if (!password) {
      Alert.alert('Missing Password', 'Please enter your master password.');
      return;
    }

    setLoading(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      Alert.alert('Access Denied', err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24) + 16
    : Math.max(insets.top, 30) + 16;

  const bottomPadding = Math.max(insets.bottom, 16) + 24;

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
        {/* Branding & Logo */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Alavuddin Vault</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Encrypted Flat-File Secret Storage</Text>
          <View style={[styles.securityBadge, { backgroundColor: theme.colors.accentLight }]}>
            <MaterialCommunityIcons name="shield-lock" size={13} color={theme.colors.accent} />
            <Text style={[styles.securityBadgeText, { color: theme.colors.accent }]}>AES-256 + PBKDF2 Encrypted</Text>
          </View>
        </View>

        {/* Input Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Username</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="account" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Username"
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
              placeholder="Enter master password (min 3 chars)"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onSubmitEditing={handleUnlock}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleUnlock}
            disabled={loading}
          >
            <MaterialCommunityIcons name="lock-open-variant" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.loginBtnText}>
              {loading ? 'Decrypting Vault...' : 'Unlock Vault'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} onPress={onForgotPassword}>
            <MaterialCommunityIcons name="help-circle-outline" size={16} color={theme.colors.secondary} />
            <Text style={[styles.forgotText, { color: theme.colors.secondary }]}>Forgot Password? (Recover via Questions)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <MaterialCommunityIcons name="database-off" size={14} color={theme.colors.textMuted} />
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>100% Offline • No External DB • Direct Flat-File</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  forgotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
  },
});
