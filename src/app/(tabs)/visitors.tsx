
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/lib/theme';

type VisitorPass = {
  id: string;
  guestName: string;
  code: string;
  validUntil: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
};

const INITIAL_PASSES: VisitorPass[] = [
  {
    id: '1',
    guestName: 'Kemi Adebayo',
    code: 'ADG-8921',
    validUntil: 'Today, 8:00 PM',
    status: 'ACTIVE',
  },
  {
    id: '2',
    guestName: 'Jide Ogunleye (Plumber)',
    code: 'ADG-4310',
    validUntil: 'Today, 4:00 PM',
    status: 'ACTIVE',
  },
  {
    id: '3',
    guestName: 'Emeka Nwosu',
    code: 'ADG-1102',
    validUntil: 'Yesterday',
    status: 'USED',
  },
];

export default function VisitorsScreen() {
  const insets = useSafeAreaInsets();

  const [passes, setPasses] = useState<VisitorPass[]>(INITIAL_PASSES);
  const [modalVisible, setModalVisible] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [inputError, setInputError] = useState('');

  const openModal = useCallback(() => {
    setGuestNameInput('');
    setInputError('');
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setGuestNameInput('');
    setInputError('');
  }, []);

  const generatePass = useCallback(() => {
    const guestName = guestNameInput.trim();

    if (!guestName) {
      setInputError("Please enter the visitor's name.");
      return;
    }

    const randomCode = `ADG-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    const newPass: VisitorPass = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      guestName,
      code: randomCode,
      validUntil: 'Today, 11:59 PM',
      status: 'ACTIVE',
    };

    setPasses((currentPasses) => [newPass, ...currentPasses]);
    closeModal();
  }, [guestNameInput, closeModal]);

  const renderPassItem = useCallback(
    ({ item }: { item: VisitorPass }) => {
      const isActive = item.status === 'ACTIVE';

      return (
        <View style={styles.card}>
          <View style={styles.passHeader}>
            <View style={styles.nameWrap}>
              <Text style={styles.guestName}>{item.guestName}</Text>

              <Text style={styles.validText}>
                Valid until: {item.validUntil}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isActive
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          {isActive && (
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>ENTRY CODE</Text>
              <Text selectable style={styles.codeText}>
                {item.code}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={passes}
        keyExtractor={(item) => item.id}
        renderItem={renderPassItem}
        contentContainerStyle={[
          styles.listContainer,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Visitor Access</Text>

            <Text style={styles.subtitle}>
              Generate entry codes for guests, contractors, and deliveries.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={openModal}
              accessibilityRole="button"
              accessibilityLabel="Create a new visitor gate pass"
            >
              <Text style={styles.createButtonText}>
                + Create New Gate Pass
              </Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No visitor passes yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a gate pass to get started.
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeModal}
            accessibilityRole="button"
            accessibilityLabel="Close gate pass dialog"
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Generate Gate Pass</Text>

            <Text style={styles.modalSubtitle}>
              Enter the visitor's full name or service designation.
            </Text>

            <TextInput
              style={[
                styles.input,
                inputError ? styles.inputError : undefined,
              ]}
              placeholder="e.g. Samuel (Electrician)"
              placeholderTextColor={colors.muted}
              value={guestNameInput}
              onChangeText={(text) => {
                setGuestNameInput(text);

                if (inputError) {
                  setInputError('');
                }
              }}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={generatePass}
              accessibilityLabel="Visitor name"
              accessibilityHint="Enter the visitor's full name or service designation"
              maxLength={100}
            />

            {!!inputError && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inputError}
              </Text>
            )}

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.cancelBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={closeModal}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.confirmBtn,
                  pressed && styles.buttonPressed,
                ]}
                onPress={generatePass}
                accessibilityRole="button"
              >
                <Text style={styles.confirmText}>Generate Code</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 18,
  },

  createButton: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  nameWrap: {
    flex: 1,
    paddingRight: 10,
  },

  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  validText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusActive: {
    backgroundColor: '#DCFCE7',
  },

  statusInactive: {
    backgroundColor: '#F3F4F6',
  },

  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  statusTextActive: {
    color: colors.success,
  },

  statusTextInactive: {
    color: colors.muted,
  },

  codeContainer: {
    marginTop: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },

  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primary,
  },

  codeText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.primary,
    marginTop: 2,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  emptySubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },

  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },

  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 16,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },

  inputError: {
    borderColor: '#BE123C',
  },

  errorText: {
    fontSize: 12,
    color: '#BE123C',
    marginTop: 6,
  },

  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },

  modalBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelBtn: {
    backgroundColor: '#F3F4F6',
    marginRight: 5,
  },

  confirmBtn: {
    backgroundColor: colors.primary,
    marginLeft: 5,
  },

  cancelText: {
    color: colors.text,
    fontWeight: '700',
  },

  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  buttonPressed: {
    opacity: 0.8,
  },
});
