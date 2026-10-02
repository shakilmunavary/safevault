import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopNavBar from './TopNavBar';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function FolderDetailScreen({
  folder,
  notes,
  onBack,
  onHome,
  onOpenNote,
  onAddNote,
  onDeleteFolder,
  onRenameFolder,
  onOpenThemeModal,
  onOpenSettings,
  onLockVault,
  theme,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renameInput, setRenameInput] = useState(folder.name);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const folderNotes = notes.filter((n) => n.folderId === folder.id);
  const filteredNotes = folderNotes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q))
    );
  });

  const handleOpenRename = () => {
    if (folder.id === 'folder_welcome') {
      Alert.alert('Protected', 'The initial welcome folder cannot be renamed.');
      return;
    }
    setRenameInput(folder.name);
    setIsRenameModalVisible(true);
  };

  const handleSaveRename = () => {
    if (!renameInput.trim()) {
      Alert.alert('Invalid', 'Folder name cannot be empty.');
      return;
    }
    onRenameFolder(folder.id, renameInput.trim());
    setIsRenameModalVisible(false);
  };

  const handleDeleteFolderConfirmed = () => {
    setIsDeleteModalVisible(false);
    onDeleteFolder(folder.id);
  };

  const renderNoteItem = ({ item }) => {
    const preview = item.content
      ? item.content.split('\n')[0].substring(0, 70)
      : 'No additional text';

    const formattedDate = item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <TouchableOpacity
        style={[styles.noteCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
        onPress={() => onOpenNote(item)}
        activeOpacity={0.7}
      >
        <View style={styles.noteCardHeader}>
          <View style={styles.noteTitleRow}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.noteTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.title || 'Untitled Note'}
            </Text>
          </View>
          <Text style={[styles.noteDate, { color: theme.colors.textMuted }]}>{formattedDate}</Text>
        </View>

        <Text style={[styles.notePreview, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {preview}
        </Text>

        <View style={[styles.noteFooter, { borderTopColor: theme.colors.surfaceHighlight }]}>
          <View style={styles.noteTagsGroup}>
            <View style={[styles.encryptedTag, { backgroundColor: theme.colors.accentLight }]}>
              <MaterialCommunityIcons name="shield-lock" size={11} color={theme.colors.accent} />
              <Text style={[styles.encryptedTagText, { color: theme.colors.accent }]}>AES-256</Text>
            </View>

            {item.imageUri && (
              <View style={[styles.encryptedTag, { backgroundColor: theme.colors.primaryLight }]}>
                <MaterialCommunityIcons name="image" size={11} color={theme.colors.primary} />
                <Text style={[styles.encryptedTagText, { color: theme.colors.primary }]}>Image</Text>
              </View>
            )}
          </View>

          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Persistent Navigation Bar with Home & Back */}
      <TopNavBar
        title={folder.name}
        showBack={true}
        showHome={true}
        onBack={onBack}
        onHome={onHome || onBack}
        onOpenThemeModal={onOpenThemeModal}
        onOpenSettings={onOpenSettings}
        onLockVault={onLockVault}
        theme={theme}
      />

      {/* Folder Subheader Actions (Top Toolbar - Clean and Never Overlapped) */}
      <View style={[styles.folderSubheader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
        <View style={styles.folderTitleBox}>
          <MaterialCommunityIcons name="folder" size={22} color={folder.color || theme.colors.primary} />
          <Text style={[styles.folderTitleText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {folder.name} ({folderNotes.length})
          </Text>
        </View>

        <View style={styles.folderActionBtns}>
          {/* Top Add Note Button */}
          <TouchableOpacity
            style={[styles.addNoteTopBtn, { backgroundColor: theme.colors.primary }]}
            onPress={onAddNote}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
            <Text style={styles.addNoteTopBtnText}>+ Note</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.smallActionBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]} onPress={handleOpenRename}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.smallActionBtn, styles.deleteActionBtn, { backgroundColor: theme.colors.dangerLight }]} onPress={() => setIsDeleteModalVisible(true)}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search within Folder */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder={`Search notes in ${folder.name}...`}
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={54} color={theme.colors.surfaceBorder} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Notes in this Folder</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Tap the "+ Note" button in the top toolbar to create your first encrypted secret note.
            </Text>
          </View>
        }
      />

      {/* Rename Modal */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Rename Folder</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>Enter a new name for this folder.</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, color: theme.colors.textPrimary }]}
              value={renameInput}
              onChangeText={setRenameInput}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsRenameModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveRename}>
                <Text style={styles.modalSubmitText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={isDeleteModalVisible}
        title="Delete Folder"
        message={`Are you sure you want to delete "${folder.name}" and all ${folderNotes.length} notes inside it? This cannot be undone.`}
        onConfirm={handleDeleteFolderConfirmed}
        onCancel={() => setIsDeleteModalVisible(false)}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  folderSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  folderTitleBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  folderTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  folderActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addNoteTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addNoteTopBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  smallActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteActionBtn: {
    borderWidth: 0,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  noteCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  noteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  noteDate: {
    fontSize: 11,
  },
  notePreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  noteTagsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  encryptedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  encryptedTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  modalInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
