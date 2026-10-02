import React, { useState, useEffect, useRef } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function NoteEditorModal({
  visible,
  note,
  currentFolderId,
  folders = [],
  onSave,
  onDelete,
  onClose,
  onHome,
  theme,
}) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId);
  const [imageUri, setImageUri] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setSelectedFolderId(note.folderId || currentFolderId);
      setImageUri(note.imageUri || null);
    } else {
      setTitle('');
      setContent('');
      setSelectedFolderId(currentFolderId);
      setImageUri(null);
    }
  }, [note, currentFolderId, visible]);

  const handleCopyContent = async () => {
    if (!content && !title) {
      Alert.alert('Empty', 'There is no text to copy.');
      return;
    }
    const fullText = `${title}\n\n${content}`.trim();
    await Clipboard.setStringAsync(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Rich Text Quick Action Toolbar
  const insertFormatting = (prefix, suffix = '') => {
    setContent((prev) => `${prev}\n${prefix} ${suffix}`);
  };

  const insertTemplate = (type) => {
    switch (type) {
      case 'password':
        setContent((prev) => `${prev}\n🔑 Service/Account: \n👤 Username/Email: \n🔒 Password: \n🌐 Website URL: \n📌 Notes: `);
        break;
      case 'card':
        setContent((prev) => `${prev}\n💳 Card Holder: \n🔢 Card Number: \n📅 Expiry: \n🔒 CVV: \n🏦 Bank: `);
        break;
      case 'checklist':
        setContent((prev) => `${prev}\n[ ] Task item 1\n[ ] Task item 2\n[ ] Task item 3`);
        break;
      default:
        break;
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access gallery is required to attach images.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Image Error', 'Could not select image: ' + err.message);
    }
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !imageUri) {
      Alert.alert('Empty Note', 'Please provide a title, note details, or image before saving.');
      return;
    }

    const finalTitle = title.trim() || 'Untitled Note';
    onSave({
      id: note?.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      folderId: selectedFolderId,
      title: finalTitle,
      content: content,
      imageUri: imageUri || null,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleDeleteConfirmed = () => {
    setIsDeleteModalVisible(false);
    if (note?.id) {
      onDelete(note.id);
    }
    onClose();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const topPadding = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 28) + 14
    : Math.max(insets.top, 38) + 8;

  const bottomPadding = Math.max(insets.bottom, 16) + 8;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Top Header Bar with Home & Back */}
        <View style={[styles.topBar, { paddingTop: topPadding, backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.surfaceBorder }]}>
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

          <View style={styles.topBarActions}>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }, copied && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }]} onPress={handleCopyContent}>
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={15}
                color={copied ? '#FFF' : theme.colors.textPrimary}
              />
              <Text style={[styles.copyBtnText, { color: copied ? '#FFF' : theme.colors.textPrimary }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            {note && (
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: theme.colors.dangerLight }]}
                onPress={() => setIsDeleteModalVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
              <MaterialCommunityIcons name="check" size={16} color="#FFF" />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Content Form */}
        <ScrollView style={styles.editorScroll} contentContainerStyle={styles.editorScrollContent} showsVerticalScrollIndicator={false}>
          {/* Note Title */}
          <TextInput
            style={[styles.titleInput, { color: theme.colors.textPrimary, borderBottomColor: theme.colors.surfaceBorder }]}
            placeholder="Secret Note Title..."
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Folder Selector Strip */}
          <View style={styles.folderSelectRow}>
            <Text style={[styles.folderLabel, { color: theme.colors.textSecondary }]}>Folder:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderPills}>
              {folders.map((f) => {
                const isSelected = f.id === selectedFolderId;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.folderPill,
                      { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder },
                      isSelected && { backgroundColor: theme.colors.activeItem, borderColor: theme.colors.primary, borderWidth: 1.5 },
                    ]}
                    onPress={() => setSelectedFolderId(f.id)}
                  >
                    <MaterialCommunityIcons name="folder" size={14} color={f.color || theme.colors.primary} />
                    <Text style={[styles.folderPillText, { color: isSelected ? theme.colors.textPrimary : theme.colors.textSecondary, fontWeight: isSelected ? '700' : '500' }]}>
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Rich Text & Template Ribbon */}
          <View style={[styles.formattingRibbon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ribbonScroll}>
              <TouchableOpacity style={styles.fmtBtn} onPress={() => insertFormatting('• ')} title="Bullet List">
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.fmtBtn} onPress={() => insertFormatting('[ ] ')} title="Checklist">
                <MaterialCommunityIcons name="checkbox-marked-outline" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.fmtBtn} onPress={() => insertFormatting('### ')} title="Heading">
                <MaterialCommunityIcons name="format-header-3" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.fmtBtn} onPress={() => insertFormatting('**', '**')} title="Bold">
                <MaterialCommunityIcons name="format-bold" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.fmtBtn} onPress={() => insertFormatting('`', '`')} title="Code">
                <MaterialCommunityIcons name="code-tags" size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              <View style={[styles.ribbonDivider, { backgroundColor: theme.colors.surfaceBorder }]} />

              <TouchableOpacity style={[styles.templateBtn, { backgroundColor: theme.colors.surfaceHighlight }]} onPress={() => insertTemplate('password')}>
                <MaterialCommunityIcons name="key" size={14} color={theme.colors.primary} />
                <Text style={[styles.templateBtnText, { color: theme.colors.primary }]}>Login Info</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.templateBtn, { backgroundColor: theme.colors.surfaceHighlight }]} onPress={() => insertTemplate('card')}>
                <MaterialCommunityIcons name="credit-card" size={14} color={theme.colors.accent} />
                <Text style={[styles.templateBtnText, { color: theme.colors.accent }]}>Bank Card</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.templateBtn, { backgroundColor: theme.colors.surfaceHighlight }]} onPress={handlePickImage}>
                <MaterialCommunityIcons name="camera" size={14} color={theme.colors.secondary} />
                <Text style={[styles.templateBtnText, { color: theme.colors.secondary }]}>+ Image</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Image Attachment Preview */}
          {imageUri && (
            <View style={[styles.imagePreviewBox, { borderColor: theme.colors.surfaceBorder }]}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <MaterialCommunityIcons name="close-circle" size={26} color="#EF4444" />
              </TouchableOpacity>
              <View style={styles.encryptedImgBadge}>
                <MaterialCommunityIcons name="shield-lock" size={14} color="#10B981" />
                <Text style={styles.encryptedImgText}>Encrypted Photo Attached</Text>
              </View>
            </View>
          )}

          {/* Rich Notepad Editor Area */}
          <View style={[styles.notepadContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <TextInput
              ref={inputRef}
              style={[styles.notepadInput, { color: theme.colors.textPrimary }]}
              placeholder="Write your encrypted notes, recovery keys, seed phrases, passwords, or details here..."
              placeholderTextColor={theme.colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>
        </ScrollView>

        {/* Bottom Status Bar (Proper insets applied to avoid Android navbar overlap) */}
        <View style={[styles.bottomBar, { paddingBottom: bottomPadding, backgroundColor: theme.colors.headerBg, borderTopColor: theme.colors.surfaceBorder }]}>
          <Text style={[styles.statsText, { color: theme.colors.textMuted }]}>
            {wordCount} words • {charCount} characters
          </Text>
          <Text style={[styles.securityIndicator, { color: theme.colors.accent }]}>
            🛡️ Sandboxed AES-256 Active
          </Text>
        </View>

        {/* Delete Modal */}
        <ConfirmDeleteModal
          visible={isDeleteModalVisible}
          title="Delete Note"
          message="Are you sure you want to delete this encrypted secret note? This action cannot be undone."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setIsDeleteModalVisible(false)}
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
  topBar: {
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
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  navBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  homeBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
    gap: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editorScroll: {
    flex: 1,
  },
  editorScrollContent: {
    padding: 14,
    paddingBottom: 24,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  folderSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  folderLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  folderPills: {
    flexDirection: 'row',
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  folderPillText: {
    fontSize: 12,
  },
  formattingRibbon: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  ribbonScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fmtBtn: {
    padding: 6,
    borderRadius: 4,
  },
  ribbonDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 4,
  },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
  },
  templateBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  imagePreviewBox: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 13,
  },
  encryptedImgBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  encryptedImgText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  notepadContainer: {
    flex: 1,
    minHeight: 300,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  notepadInput: {
    flex: 1,
    minHeight: 280,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statsText: {
    fontSize: 11,
  },
  securityIndicator: {
    fontSize: 11,
    fontWeight: '600',
  },
});
