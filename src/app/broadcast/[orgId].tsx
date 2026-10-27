import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, errMsg } from '@/api/client';
import { useToast } from '@/components/Toast';
import { Button, Input, Muted, Screen } from '@/components/ui';

const MIN_SUBJECT_LENGTH = 2;
const MAX_SUBJECT_LENGTH = 120;
const MIN_BODY_LENGTH = 2;
const MAX_BODY_LENGTH = 5000;

export default function BroadcastScreen() {
  const params = useLocalSearchParams<{ orgId?: string | string[] }>();
  const router = useRouter();
  const toast = useToast();

  const orgId = Array.isArray(params.orgId)
    ? params.orgId[0]
    : params.orgId;

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();

  const subjectError = useMemo(() => {
    if (!trimmedSubject) return 'Enter an email subject.';
    if (trimmedSubject.length < MIN_SUBJECT_LENGTH) {
      return 'Subject must contain at least 2 characters.';
    }
    if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
      return `Subject cannot exceed ${MAX_SUBJECT_LENGTH} characters.`;
    }
    return null;
  }, [trimmedSubject]);

  const bodyError = useMemo(() => {
    if (!trimmedBody) return 'Enter a message.';
    if (trimmedBody.length < MIN_BODY_LENGTH) {
      return 'Message must contain at least 2 characters.';
    }
    if (trimmedBody.length > MAX_BODY_LENGTH) {
      return `Message cannot exceed ${MAX_BODY_LENGTH} characters.`;
    }
    return null;
  }, [trimmedBody]);

  const canSend =
    Boolean(orgId?.trim()) &&
    !subjectError &&
    !bodyError &&
    !loading;

  const send = async () => {
    if (loading) return;

    if (!orgId?.trim()) {
      toast.show('Organization could not be identified. Please go back and try again.', 'error');
      return;
    }

    if (subjectError || bodyError) {
      toast.show(subjectError ?? bodyError ?? 'Please review your message.', 'error');
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Send organization-wide email?',
      'This email will be sent to every approved member who has an email address on file. Please review your subject and message before continuing.',
      [
        {
          text: 'Review message',
          style: 'cancel',
        },
        {
          text: 'Send email',
          onPress: () => {
            void submitBroadcast();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const submitBroadcast = async () => {
    if (loading || !orgId?.trim()) return;

    setLoading(true);

    try {
      const { data } = await api.post<{
        sent: number;
        recipients: number;
      }>(
        `/organizations/${encodeURIComponent(orgId)}/broadcast-email`,
        {
          subject: trimmedSubject,
          body: trimmedBody,
        },
      );

      const sent = Number(data?.sent);
      const recipients = Number(data?.recipients);

      if (
        !Number.isFinite(sent) ||
        !Number.isFinite(recipients) ||
        sent < 0 ||
        recipients < 0
      ) {
        toast.show(
          'The server returned an unexpected response. Check your broadcast history before retrying.',
          'error',
        );
        return;
      }

      toast.show(
        `Email sent to ${sent} of ${recipients} eligible members.`,
        'success',
      );

      router.back();
    } catch (error: unknown) {
      toast.show(errMsg(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="mail-outline"
                size={27}
                color="#5F021F"
              />
            </View>

            <Text style={styles.title}>Email broadcast</Text>

            <Text style={styles.subtitle}>
              Share important updates with your organization in one message.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="people-outline"
              size={21}
              color="#5F021F"
            />

            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Who will receive this?</Text>
              <Text style={styles.infoText}>
                Every approved member with an email address on file.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Compose your email</Text>

            <View style={styles.field}>
              <Input
                label="Subject"
                value={subject}
                onChangeText={(value: string) =>
                  setSubject(value.slice(0, MAX_SUBJECT_LENGTH))
                }
                placeholder="e.g. Important community update"
                autoCapitalize="sentences"
                returnKeyType="next"
                maxLength={MAX_SUBJECT_LENGTH}
              />

              <View style={styles.fieldMeta}>
                {subjectError ? (
                  <Text style={styles.errorText}>{subjectError}</Text>
                ) : (
                  <Muted>Keep it clear and concise.</Muted>
                )}

                <Text style={styles.counter}>
                  {subject.length}/{MAX_SUBJECT_LENGTH}
                </Text>
              </View>
            </View>

            <View style={styles.field}>
              <Input
                label="Message"
                value={body}
                onChangeText={(value: string) =>
                  setBody(value.slice(0, MAX_BODY_LENGTH))
                }
                placeholder="Write your announcement here..."
                multiline
                style={styles.messageInput}
                maxLength={MAX_BODY_LENGTH}
              />

              <View style={styles.fieldMeta}>
                {bodyError ? (
                  <Text style={styles.errorText}>{bodyError}</Text>
                ) : (
                  <Muted>Make your message helpful and easy to understand.</Muted>
                )}

                <Text style={styles.counter}>
                  {body.length}/{MAX_BODY_LENGTH}
                </Text>
              </View>
            </View>

            <View style={styles.notice}>
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color="#7A4D12"
              />

              <Text style={styles.noticeText}>
                Review your message carefully. Once sent, emails may not be
                retractable.
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                title={loading ? 'Sending email...' : 'Review and send'}
                onPress={send}
                loading={loading}
                disabled={!canSend}
              />
            </View>
          </View>

          <Text style={styles.footer}>
            Only authorized organization administrators should send broadcasts.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F8E8EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#25151A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#71666A',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 310,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8E8EC',
    borderWidth: 1,
    borderColor: '#F0D5DD',
  },
  infoContent: {
    flex: 1,
    gap: 5,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5F021F',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#634750',
  },
  formCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE7E9',
    gap: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#25151A',
  },
  field: {
    gap: 8,
  },
  fieldMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  counter: {
    fontSize: 11,
    color: '#8A7D81',
    flexShrink: 0,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#B42318',
  },
  messageInput: {
    height: 180,
    textAlignVertical: 'top',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7E8',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    color: '#78521C',
  },
  actions: {
    marginTop: 2,
  },
  footer: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: '#8A7D81',
    paddingHorizontal: 12,
  },
});
