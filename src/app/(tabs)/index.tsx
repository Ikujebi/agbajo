import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/lib/theme';

type Post = {
  id: string;
  author: string;
  category: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  isPinned?: boolean;
};

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'Estate Executive Committee',
    category: 'Official Notice',
    time: '2 hours ago',
    content:
      'Annual General Community Meeting holds this Saturday at the Main Hall by 10:00 AM. Routine security updates and facility maintenance fees will be discussed.',
    likes: 42,
    comments: 18,
    isPinned: true,
  },
  {
    id: '2',
    author: 'Chidi Okonkwo',
    category: 'Security Alert',
    time: '5 hours ago',
    content:
      'Gate B is currently undergoing maintenance. All residents and visitors are advised to use Gate A until 6:00 PM today.',
    likes: 19,
    comments: 4,
  },
  {
    id: '3',
    author: 'Adugbo Women Association',
    category: 'Community Event',
    time: 'Yesterday',
    content:
      'Join us for the monthly estate cleanup exercise this Saturday morning. Tools will be provided at the central park area.',
    likes: 31,
    comments: 9,
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={[styles.card, item.isPinned && styles.pinnedCard]}>
      {item.isPinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 Pinned Announcement</Text>
        </View>
      )}
      <View style={styles.postHeader}>
        <View style={styles.authorAvatar}>
          <Text style={styles.avatarText}>{item.author.charAt(0)}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.authorName}>{item.author}</Text>
          <Text style={styles.postSubmeta}>
            {item.category} · {item.time}
          </Text>
        </View>
      </View>

      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.cardDivider} />

      <View style={styles.postActions}>
        <Pressable style={styles.actionButton} hitSlop={8}>
          <Text style={styles.actionText}>👍 {item.likes}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} hitSlop={8}>
          <Text style={styles.actionText}>💬 {item.comments} Comments</Text>
        </Pressable>
        <Pressable style={styles.actionButton} hitSlop={8}>
          <Text style={styles.actionText}>🔗 Share</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={[
          styles.listContainer,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/images/logo-purple.png')}
                  style={styles.logo}
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Adugbo</Text>
                <Text style={styles.headerSubtitle}>Community Feed</Text>
              </View>
            </View>

            <View style={styles.quickStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>1,240</Text>
                <Text style={styles.statLabel}>Residents</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Active Notice</Text>
              </View>
            </View>
          </View>
        }
      />
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
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: -2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pinnedCard: {
    borderColor: '#C4A6F5',
    backgroundColor: '#FAF5FF',
  },
  pinnedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  postSubmeta: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
});