import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEMES } from '../theme';

export default function ThemeSelectorModal({
  visible,
  currentThemeId,
  onSelectTheme,
  onClose,
  theme,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'light' | 'dark'

  if (!visible) return null;

  const themeList = Object.values(THEMES).filter((th) => {
    if (activeTab === 'light') return !th.isDark;
    if (activeTab === 'dark') return th.isDark;
    return true;
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="palette" size={24} color={theme.colors.primary} />
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Choose Theme</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Select your preferred light or dark color scheme.
          </Text>

          {/* Filter Tabs: All, Light, Dark */}
          <View style={[styles.tabBar, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'all' && [styles.tabBtnActive, { backgroundColor: theme.colors.primary }]]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'all' ? '#FFF' : theme.colors.textSecondary }]}>
                All ({Object.keys(THEMES).length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'light' && [styles.tabBtnActive, { backgroundColor: theme.colors.primary }]]}
              onPress={() => setActiveTab('light')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'light' ? '#FFF' : theme.colors.textSecondary }]}>
                ☀️ Light Themes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'dark' && [styles.tabBtnActive, { backgroundColor: theme.colors.primary }]]}
              onPress={() => setActiveTab('dark')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'dark' ? '#FFF' : theme.colors.textSecondary }]}>
                🌙 Dark Themes
              </Text>
            </TouchableOpacity>
          </View>

          {/* Theme List */}
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {themeList.map((th) => {
              const isSelected = th.id === currentThemeId;
              return (
                <TouchableOpacity
                  key={th.id}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: th.colors.background,
                      borderColor: isSelected ? theme.colors.primary : th.colors.surfaceBorder,
                    },
                    isSelected && { borderWidth: 2.5, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    onSelectTheme(th.id);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.themeInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={[styles.themeName, { color: th.colors.textPrimary }]}>{th.name}</Text>
                      <View style={[styles.badgeCategory, { backgroundColor: th.colors.primaryLight }]}>
                        <Text style={[styles.badgeCategoryText, { color: th.colors.primary }]}>{th.category}</Text>
                      </View>
                    </View>

                    {/* Visual Color Preview Swatches */}
                    <View style={styles.colorPalettePreview}>
                      <View style={[styles.colorDot, { backgroundColor: th.colors.background, borderColor: th.colors.surfaceBorder }]} />
                      <View style={[styles.colorDot, { backgroundColor: th.colors.surface, borderColor: th.colors.surfaceBorder }]} />
                      <View style={[styles.colorDot, { backgroundColor: th.colors.primary, borderColor: th.colors.surfaceBorder }]} />
                      <View style={[styles.colorDot, { backgroundColor: th.colors.accent, borderColor: th.colors.surfaceBorder }]} />
                      <View style={[styles.colorDot, { backgroundColor: th.colors.sidebarBg, borderColor: th.colors.surfaceBorder }]} />
                    </View>
                  </View>

                  {isSelected ? (
                    <MaterialCommunityIcons name="check-circle" size={26} color={theme.colors.primary} />
                  ) : (
                    <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={22} color={th.colors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeCategory: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  colorPalettePreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
});
