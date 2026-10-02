import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  PanResponder,
  Platform,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import TopNavBar from './TopNavBar';
import ConfirmDeleteModal from './ConfirmDeleteModal';

const FOLDER_COLORS = [
  '#F3C544', // Windows Folder Yellow
  '#0078D4', // Fluent Blue
  '#107C41', // Forest Green
  '#8764B8', // Royal Purple
  '#D83B01', // Amber Orange
  '#E3008C', // Magenta
  '#00B7C3', // Cyan Teal
];

export default function VaultHomeScreen({
  username,
  folders = [],
  notes = [],
  selectedFolderId,
  onSelectFolderId,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenNote,
  onAddNote,
  onLockVault,
  onOpenSettings,
  onOpenThemeModal,
  onOpenBackupModal,
  theme,
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Top Workspace height (defaults to ~42% of screen height)
  const defaultTopHeight = Math.round(Math.max(200, Math.min(height * 0.42, height - 200)));
  const [topPaneHeight, setTopPaneHeight] = useState(defaultTopHeight);
  const [workspaceHeight, setWorkspaceHeight] = useState(height - 120);

  // Selected Note state - Starts as NULL on login so NO file is automatically opened!
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  // Expanded folders set in tree view (expanded by default so user sees hierarchy)
  const [expandedFolderIds, setExpandedFolderIds] = useState(() => {
    const initial = {};
    folders.forEach((f) => { initial[f.id] = true; });
    return initial;
  });

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Copy status
  const [copied, setCopied] = useState(false);

  // Create folder modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  // Rename folder modal state
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameInput, setRenameInput] = useState('');

  // Delete folder confirmation state
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  // Active folder
  const activeFolder = folders.find((f) => f.id === selectedFolderId) || folders[0] || null;

  // Active note is ONLY defined if the user explicitly clicked on a note!
  const activeNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) || null : null;

  // Pulsing animation for Alavuddin Vault Welcome graphic
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim, glowAnim]);

  // Toggle folder expansion
  const toggleFolderExpand = (fId) => {
    setExpandedFolderIds((prev) => ({
      ...prev,
      [fId]: !prev[fId],
    }));
  };

  // Draggable Top/Bottom Splitter PanResponder
  const startTopHeightRef = useRef(topPaneHeight);
  const currentTopHeightRef = useRef(topPaneHeight);
  currentTopHeightRef.current = topPaneHeight;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startTopHeightRef.current = currentTopHeightRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const maxH = Math.max(250, workspaceHeight - 120);
        const newH = Math.max(120, Math.min(maxH, startTopHeightRef.current + gestureState.dy));
        setTopPaneHeight(Math.round(newH));
      },
    })
  ).current;

  // Quick resize snap buttons
  const snapTopPane = (percentage) => {
    const targetH = Math.round(workspaceHeight * percentage);
    setTopPaneHeight(Math.max(120, Math.min(workspaceHeight - 120, targetH)));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newF = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newFolderName.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };
    onCreateFolder(newF);
    onSelectFolderId(newF.id);
    setExpandedFolderIds((prev) => ({ ...prev, [newF.id]: true }));
    setNewFolderName('');
    setSelectedColor(FOLDER_COLORS[0]);
    setIsCreateModalOpen(false);
  };

  const handleSaveRename = () => {
    if (!renameInput.trim() || !renameTarget) return;
    onRenameFolder(renameTarget.id, renameInput.trim());
    setRenameTarget(null);
    setRenameInput('');
  };

  const handleDeleteFolderConfirmed = () => {
    if (deleteFolderTarget) {
      onDeleteFolder(deleteFolderTarget.id);
      setDeleteFolderTarget(null);
      if (selectedNoteId && activeNote?.folderId === deleteFolderTarget.id) {
        setSelectedNoteId(null);
      }
    }
  };

  const handleCopyNoteContent = async () => {
    if (!activeNote) return;
    const text = `${activeNote.title || ''}\n\n${activeNote.content || ''}`.trim();
    if (text) {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filtered folders and notes based on search
  const q = searchQuery.toLowerCase();
  const filteredFolders = folders.filter((f) => {
    if (!q) return true;
    const folderMatch = f.name.toLowerCase().includes(q);
    const hasMatchingNotes = notes.some(
      (n) => n.folderId === f.id && ((n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q)))
    );
    return folderMatch || hasMatchingNotes;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Top Navigation Bar with persistent Home button */}
      <TopNavBar
        title="Alavuddin Vault"
        showHome={true}
        onHome={() => {
          setSelectedNoteId(null); // Return to Alavuddin Vault Welcome showcase!
          if (folders.length > 0) onSelectFolderId(folders[0].id);
          setSearchQuery('');
        }}
        onOpenSettings={onOpenSettings}
        onOpenThemeModal={onOpenThemeModal}
        onLockVault={onLockVault}
        theme={theme}
      />

      {/* 2. Main Workspace Split View (Top Tree + Draggable Handle + Bottom Content Reader) */}
      <View
        style={styles.workspace}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 100) setWorkspaceHeight(h);
        }}
      >
        {/* TOP PANE: Folders & Files Hierarchy */}
        <View
          style={[
            styles.topPane,
            {
              height: topPaneHeight,
              backgroundColor: theme.colors.sidebarBg,
              borderBottomColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          {/* Top Header Toolbar: Title & Action Buttons */}
          <View style={[styles.topPaneHeader, { borderBottomColor: theme.colors.surfaceBorder }]}>
            <View style={styles.vaultTitleRow}>
              <MaterialCommunityIcons name="shield-lock" size={16} color={theme.colors.primary} />
              <Text style={[styles.vaultTitleText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                Alavuddin Vault
              </Text>
            </View>

            {/* Actions: + Folder, + Note, and Share/Backup */}
            <View style={styles.topHeaderBtns}>
              <TouchableOpacity
                style={[styles.smallActionBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
                onPress={() => setIsCreateModalOpen(true)}
                title="Create Folder"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="folder-plus" size={13} color={theme.colors.folderYellow || '#F3C544'} />
                <Text style={[styles.actionBtnLabel, { color: theme.colors.textPrimary }]}>+ Folder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallActionBtnPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={() => onAddNote(activeFolder?.id)}
                title="Create Secret Note"
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus" size={13} color="#FFF" />
                <Text style={styles.actionBtnLabelPrimary}>+ Note</Text>
              </TouchableOpacity>

              {onOpenBackupModal && (
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
                  onPress={onOpenBackupModal}
                  title="Encrypted Share / Backup"
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="share-variant-outline" size={13} color={theme.colors.secondary} />
                  <Text style={[styles.actionBtnLabel, { color: theme.colors.secondary }]}>Share</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Search */}
          <View style={[styles.searchBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.inputBorder }]}>
            <MaterialCommunityIcons name="magnify" size={14} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Search folders & encrypted files..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close" size={12} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Folders & Notes Tree ScrollView */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={true}
          >
            {filteredFolders.map((folder) => {
              const isFolderSelected = activeFolder && activeFolder.id === folder.id;
              const isExpanded = !!expandedFolderIds[folder.id];
              const folderNotesList = notes.filter((n) => n.folderId === folder.id);

              return (
                <View key={folder.id} style={styles.folderNodeGroup}>
                  {/* Folder Row */}
                  <TouchableOpacity
                    style={[
                      styles.folderRow,
                      isFolderSelected && [
                        styles.folderRowActive,
                        { backgroundColor: theme.colors.activeItem, borderColor: theme.colors.primary },
                      ],
                    ]}
                    onPress={() => {
                      onSelectFolderId(folder.id);
                      toggleFolderExpand(folder.id);
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Expand/Collapse Chevron */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFolderExpand(folder.id);
                      }}
                      style={styles.chevronTouch}
                    >
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                        size={15}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Folder Icon */}
                    <MaterialCommunityIcons
                      name={isExpanded ? 'folder-open' : 'folder'}
                      size={17}
                      color={folder.color || theme.colors.folderYellow || '#F3C544'}
                    />

                    {/* Folder Name */}
                    <Text
                      style={[
                        styles.folderNameText,
                        {
                          color: isFolderSelected ? theme.colors.textPrimary : theme.colors.textSecondary,
                          fontWeight: isFolderSelected ? '700' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {folder.name}
                    </Text>

                    {/* Badge Count */}
                    <View style={[styles.countBadge, { backgroundColor: theme.colors.surfaceHighlight }]}>
                      <Text style={[styles.countBadgeText, { color: theme.colors.textMuted }]}>
                        {folderNotesList.length}
                      </Text>
                    </View>

                    {/* Folder Quick Actions */}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setRenameTarget(folder);
                        setRenameInput(folder.name);
                      }}
                      style={styles.folderActionIcon}
                      title="Rename"
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setDeleteFolderTarget(folder);
                      }}
                      style={styles.folderActionIcon}
                      title="Delete"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Nested Notes / Files under this folder */}
                  {isExpanded && (
                    <View style={styles.nestedNotesList}>
                      {folderNotesList.map((noteItem) => {
                        const isNoteActive = selectedNoteId === noteItem.id;

                        return (
                          <TouchableOpacity
                            key={noteItem.id}
                            style={[
                              styles.noteTreeRow,
                              isNoteActive && [
                                styles.noteTreeRowActive,
                                {
                                  backgroundColor: theme.colors.activeItem,
                                  borderColor: theme.colors.primary,
                                },
                              ],
                            ]}
                            onPress={() => {
                              onSelectFolderId(folder.id);
                              setSelectedNoteId(noteItem.id);
                            }}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons
                              name="file-lock-outline"
                              size={16}
                              color={isNoteActive ? theme.colors.primary : theme.colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.noteTreeTitle,
                                {
                                  color: isNoteActive ? theme.colors.textPrimary : theme.colors.textSecondary,
                                  fontWeight: isNoteActive ? '700' : '500',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {noteItem.title || 'Untitled Secret'}
                            </Text>

                            {noteItem.imageUri && (
                              <MaterialCommunityIcons name="image" size={13} color={theme.colors.secondary} />
                            )}
                          </TouchableOpacity>
                        );
                      })}

                      {folderNotesList.length === 0 && (
                        <TouchableOpacity
                          style={styles.emptyAddNoteRow}
                          onPress={() => onAddNote(folder.id)}
                        >
                          <Text style={[styles.emptyAddNoteText, { color: theme.colors.primary }]}>
                            + Add file here
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {filteredFolders.length === 0 && (
              <View style={styles.noResultsBox}>
                <Text style={[styles.noResultsText, { color: theme.colors.textMuted }]}>
                  No folders or files found
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Preset Height Snap Bar */}
          <View style={[styles.snapBar, { backgroundColor: theme.colors.headerBg, borderTopColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.snapLabel, { color: theme.colors.textMuted }]}>Split:</Text>
            <TouchableOpacity onPress={() => snapTopPane(0.30)} style={styles.snapBtn}>
              <Text style={[styles.snapBtnText, { color: theme.colors.textPrimary }]}>30%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => snapTopPane(0.45)} style={styles.snapBtn}>
              <Text style={[styles.snapBtnText, { color: theme.colors.textPrimary }]}>45%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => snapTopPane(0.60)} style={styles.snapBtn}>
              <Text style={[styles.snapBtnText, { color: theme.colors.textPrimary }]}>60%</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DRAGGABLE HORIZONTAL DIVIDER / SPLIT HANDLE */}
        <View
          {...panResponder.panHandlers}
          style={[
            styles.dragDividerHorizontal,
            { backgroundColor: theme.colors.surfaceHighlight, borderTopColor: theme.colors.surfaceBorder, borderBottomColor: theme.colors.surfaceBorder },
          ]}
        >
          <View style={[styles.dragGripHandle, { backgroundColor: theme.colors.textSecondary }]} />
        </View>

        {/* BOTTOM PANE: Document Content Viewer OR Alavuddin Vault Welcome Showcase */}
        <View style={[styles.bottomContentPane, { backgroundColor: theme.colors.surface }]}>
          {activeNote ? (
            <View style={styles.noteViewerContainer}>
              {/* Note Header Toolbar */}
              <View style={[styles.noteViewerHeader, { backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.surfaceBorder }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <MaterialCommunityIcons name="file-lock" size={18} color={theme.colors.primary} />
                    <Text style={[styles.noteTitleHeader, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {activeNote.title || 'Untitled Secret'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.folderBadge, { backgroundColor: theme.colors.surfaceHighlight }]}>
                      <MaterialCommunityIcons name="folder" size={11} color={theme.colors.folderYellow || '#F3C544'} />
                      <Text style={[styles.folderBadgeText, { color: theme.colors.textSecondary }]}>
                        {activeFolder ? activeFolder.name : 'Vault'}
                      </Text>
                    </View>

                    <View style={[styles.aesBadge, { backgroundColor: theme.colors.accentLight }]}>
                      <MaterialCommunityIcons name="shield-check" size={10} color={theme.colors.accent} />
                      <Text style={[styles.aesBadgeText, { color: theme.colors.accent }]}>AES-256 GCM</Text>
                    </View>
                  </View>
                </View>

                {/* Header Action Buttons: Copy, Edit, and Close */}
                <View style={styles.noteViewerActions}>
                  <TouchableOpacity
                    style={[styles.viewerActionBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
                    onPress={handleCopyNoteContent}
                    title="Copy Content"
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={copied ? 'check' : 'content-copy'}
                      size={15}
                      color={copied ? theme.colors.accent : theme.colors.textPrimary}
                    />
                    <Text style={[styles.viewerActionBtnText, { color: copied ? theme.colors.accent : theme.colors.textPrimary }]}>
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.viewerActionBtnPrimary, { backgroundColor: theme.colors.primary }]}
                    onPress={() => onOpenNote(activeNote)}
                    title="Edit Note"
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
                    <Text style={styles.viewerActionBtnPrimaryText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.closeViewerBtn, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
                    onPress={() => setSelectedNoteId(null)}
                    title="Close File"
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="close" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Note Content Body */}
              <ScrollView
                style={styles.noteBodyScroll}
                contentContainerStyle={[
                  styles.noteBodyContent,
                  { paddingBottom: Math.max(insets.bottom, 16) + 30 },
                ]}
                showsVerticalScrollIndicator={true}
              >
                {/* Attached Image Preview */}
                {activeNote.imageUri && (
                  <View style={[styles.imageCard, { borderColor: theme.colors.surfaceBorder }]}>
                    <Image source={{ uri: activeNote.imageUri }} style={styles.attachedImage} resizeMode="cover" />
                    <View style={styles.imageOverlayBadge}>
                      <MaterialCommunityIcons name="shield-lock" size={12} color="#10B981" />
                      <Text style={styles.imageOverlayText}>Encrypted Photo Attached</Text>
                    </View>
                  </View>
                )}

                {/* Formatted Text Content */}
                <View style={[styles.contentCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceBorder }]}>
                  <Text style={[styles.contentText, { color: theme.colors.textPrimary }]} selectable>
                    {activeNote.content || 'This secret note is currently empty.\n\nClick "Edit" above to add credentials, passwords, recovery phrases, or private details.'}
                  </Text>
                </View>
              </ScrollView>
            </View>
          ) : (
            /* 🏰 ALAVUDDIN VAULT HOME SHOWCASE (Shown when no file is selected) */
            <ScrollView
              style={styles.welcomeScroll}
              contentContainerStyle={[
                styles.welcomeContentContainer,
                { paddingBottom: Math.max(insets.bottom, 16) + 20 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Animated Glowing Logo / Aladdin Lamp Emblem */}
              <Animated.View
                style={[
                  styles.welcomeLogoWrapper,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim,
                  },
                ]}
              >
                <View style={[styles.glowingEmblemRing, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }]}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.alavuddinLogoImg}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>

              {/* Title & Slogan */}
              <View style={styles.welcomeTextGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.welcomeMainTitle, { color: theme.colors.textPrimary }]}>
                    Alavuddin Vault
                  </Text>
                </View>
                <Text style={[styles.welcomeTamilSubtitle, { color: theme.colors.folderYellow || '#F3C544' }]}>
                  காப்பறை • Zero-Knowledge Store
                </Text>
              </View>

              {/* Stats Badge Row */}
              <View style={styles.welcomeStatsRow}>
                <View style={[styles.welcomeStatCard, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}>
                  <MaterialCommunityIcons name="folder" size={16} color={theme.colors.folderYellow || '#F3C544'} />
                  <Text style={[styles.welcomeStatVal, { color: theme.colors.textPrimary }]}>{folders.length}</Text>
                  <Text style={[styles.welcomeStatLbl, { color: theme.colors.textSecondary }]}>Folders</Text>
                </View>

                <View style={[styles.welcomeStatCard, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}>
                  <MaterialCommunityIcons name="file-lock-outline" size={16} color={theme.colors.primary} />
                  <Text style={[styles.welcomeStatVal, { color: theme.colors.textPrimary }]}>{notes.length}</Text>
                  <Text style={[styles.welcomeStatLbl, { color: theme.colors.textSecondary }]}>Secrets</Text>
                </View>

                <View style={[styles.welcomeStatCard, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={theme.colors.accent} />
                  <Text style={[styles.welcomeStatVal, { color: theme.colors.textPrimary }]}>AES-256</Text>
                  <Text style={[styles.welcomeStatLbl, { color: theme.colors.textSecondary }]}>Encrypted</Text>
                </View>
              </View>

              {/* Instructions Tip Card */}
              <View style={[styles.instructionTipCard, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
                <MaterialCommunityIcons name="gesture-tap" size={18} color={theme.colors.primary} />
                <Text style={[styles.instructionTipText, { color: theme.colors.textPrimary }]}>
                  Tap any folder & file in the tree above to open and edit its encrypted contents.
                </Text>
              </View>

              {/* Quick Actions Bar */}
              <View style={styles.quickActionRow}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => onAddNote(activeFolder?.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={15} color="#FFF" />
                  <Text style={styles.quickActionBtnText}>+ New Note</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtnSecondary, { backgroundColor: theme.colors.surfaceHighlight, borderColor: theme.colors.surfaceBorder }]}
                  onPress={() => setIsCreateModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="folder-plus" size={15} color={theme.colors.folderYellow || '#F3C544'} />
                  <Text style={[styles.quickActionBtnSecondaryText, { color: theme.colors.textPrimary }]}>+ New Folder</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Create Folder Modal */}
      <Modal visible={isCreateModalOpen} transparent animationType="fade" onRequestClose={() => setIsCreateModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Create Folder</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Organize secret notes in Alavuddin Vault.
            </Text>

            <Text style={[styles.modalFieldLabel, { color: theme.colors.textSecondary }]}>Folder Name</Text>
            <TextInput
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.inputBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="e.g. Banking, Work, Passwords..."
              placeholderTextColor={theme.colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />

            <Text style={[styles.modalFieldLabel, { color: theme.colors.textSecondary }]}>Folder Color</Text>
            <View style={styles.colorRow}>
              {FOLDER_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[styles.colorDot, { backgroundColor: col }, selectedColor === col && styles.colorDotActive]}
                  onPress={() => setSelectedColor(col)}
                >
                  {selectedColor === col && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateModalOpen(false)}>
                <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]} onPress={handleCreateFolder}>
                <Text style={styles.submitBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal visible={!!renameTarget} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Rename Folder</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>Enter a new name for this folder.</Text>

            <TextInput
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.inputBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              value={renameInput}
              onChangeText={setRenameInput}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRenameTarget(null)}>
                <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSaveRename}>
                <Text style={styles.submitBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Folder Delete Modal */}
      <ConfirmDeleteModal
        visible={!!deleteFolderTarget}
        title="Delete Folder"
        message={`Are you sure you want to delete "${deleteFolderTarget?.name}" and all notes inside it? This cannot be undone.`}
        onConfirm={handleDeleteFolderConfirmed}
        onCancel={() => setDeleteFolderTarget(null)}
        theme={theme}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workspace: {
    flex: 1,
    flexDirection: 'column',
  },
  topPane: {
    width: '100%',
    borderBottomWidth: 1,
    paddingTop: 4,
  },
  topPaneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultTitleText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topHeaderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  smallActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnLabelPrimary: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 10,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 12,
  },
  folderNodeGroup: {
    marginBottom: 2,
    paddingHorizontal: 8,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  folderRowActive: {
    borderWidth: 1,
  },
  chevronTouch: {
    padding: 2,
  },
  folderNameText: {
    fontSize: 13,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 9999,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  folderActionIcon: {
    padding: 3,
    marginLeft: 2,
  },
  nestedNotesList: {
    paddingLeft: 24,
    paddingRight: 6,
    marginTop: 2,
  },
  noteTreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 5,
    gap: 6,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  noteTreeRowActive: {
    borderWidth: 1,
  },
  noteTreeTitle: {
    fontSize: 12,
    flex: 1,
  },
  emptyAddNoteRow: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  emptyAddNoteText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  noResultsBox: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 12,
  },
  snapBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
    gap: 8,
  },
  snapLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  snapBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  snapBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dragDividerHorizontal: {
    height: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    cursor: 'row-resize',
  },
  dragGripHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  bottomContentPane: {
    flex: 1,
    width: '100%',
  },
  noteViewerContainer: {
    flex: 1,
  },
  noteViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  noteTitleHeader: {
    fontSize: 15,
    fontWeight: '800',
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  folderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  aesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noteViewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  viewerActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewerActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  viewerActionBtnPrimaryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeViewerBtn: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBodyScroll: {
    flex: 1,
    padding: 12,
  },
  noteBodyContent: {
    gap: 12,
  },
  imageCard: {
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  attachedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 4,
  },
  imageOverlayText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  contentCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    minHeight: 180,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Welcome Showcase Styles
  welcomeScroll: {
    flex: 1,
  },
  welcomeContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  welcomeLogoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  glowingEmblemRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    padding: 8,
  },
  alavuddinLogoImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  welcomeTextGroup: {
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  welcomeTamilSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  welcomeStatsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  welcomeStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  welcomeStatVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  welcomeStatLbl: {
    fontSize: 10,
  },
  instructionTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
    width: '100%',
  },
  instructionTipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 7,
    gap: 5,
  },
  quickActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 7,
    borderWidth: 1,
    gap: 5,
  },
  quickActionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalTextInput: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
