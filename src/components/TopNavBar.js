import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TopNavBar({
  title,
  showBack,
  showHome = true,
  onBack,
  onHome,
  onOpenThemeModal,
  onOpenSettings,
  onLockVault,
  theme,
}) {
  const insets = useSafeAreaInsets();
  
  // Generous top padding ensuring 0 overlap with Android status bar, camera hole, and battery icons
  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28) + 14
    : Math.max(insets.top, 40) + 8;

  return (
    <View
      style={[
        styles.navContainer,
        {
          paddingTop: topPadding,
          backgroundColor: theme.colors.headerBg,
          borderBottomColor: theme.colors.surfaceBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        {/* Left Actions: Home & Back */}
        <View style={styles.leftActions}>
          {showHome && (
            <TouchableOpacity
              style={[styles.homeBtn, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}
              onPress={onHome}
              activeOpacity={0.7}
              title="Home"
            >
              <MaterialCommunityIcons name="home" size={17} color={theme.colors.primary} />
              <Text style={[styles.homeBtnLabel, { color: theme.colors.primary }]}>Home</Text>
            </TouchableOpacity>
          )}

          {showBack && onBack && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={17} color={theme.colors.textPrimary} />
              <Text style={[styles.btnLabel, { color: theme.colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          )}

          {!showBack && (
            <View style={styles.brandingRow}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.navLogo}
                resizeMode="contain"
              />
              <Text style={[styles.appTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {title || 'Alavuddin Vault'}
              </Text>
            </View>
          )}
        </View>

        {/* Right Actions: Theme Selector, Settings & Lock */}
        <View style={styles.rightActions}>
          {onOpenThemeModal && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
              onPress={onOpenThemeModal}
              activeOpacity={0.7}
              title="Change Theme"
            >
              <MaterialCommunityIcons name="palette" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          {onOpenSettings && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
              onPress={onOpenSettings}
              activeOpacity={0.7}
              title="Settings"
            >
              <MaterialCommunityIcons name="cog-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {onLockVault && (
            <TouchableOpacity
              style={[styles.iconBtn, styles.lockBtn, { backgroundColor: theme.colors.danger, borderColor: theme.colors.danger }]}
              onPress={onLockVault}
              activeOpacity={0.7}
              title="Lock Vault"
            >
              <MaterialCommunityIcons name="lock" size={15} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  navLogo: {
    width: 26,
    height: 26,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
    gap: 4,
    borderWidth: 1,
  },
  homeBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
    gap: 4,
    borderWidth: 1,
  },
  btnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  lockBtn: {
    borderWidth: 0,
  },
});
