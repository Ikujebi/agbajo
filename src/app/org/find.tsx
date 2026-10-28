import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api, errMsg } from "@/api/client";
import type { OrgType } from "@/api/types";
import { useToast } from "@/components/Toast";
import { qk, useMemberships, useOrgSearch } from "@/hooks/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { titleCase } from "@/lib/format";
import { colors, radius } from "@/lib/theme";

const TYPES: OrgType[] = ["ESTATE", "CHURCH", "MOSQUE", "COMMUNITY_GROUP"];

export default function FindOrgScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<OrgType>("ESTATE");
  const [q, setQ] = useState("");
  const [unit, setUnit] = useState("");

  const dq = useDebounce(q.trim());

  const mineQuery = useMemberships();
  const mine = mineQuery.data ?? [];

  const { data, isLoading, isError, error, refetch, isFetching } = useOrgSearch(
    type,
    dq,
  );

  const organizations = data ?? [];

  const filteredOrganizations = useMemo(() => organizations, [organizations]);

  const join = useMutation({
    mutationFn: async (orgId: string) => {
      await api.post(`/organizations/${orgId}/join`, {
        unit: type === "ESTATE" ? unit.trim() || undefined : undefined,
      });

      return orgId;
    },

    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: qk.mine,
      });

      toast.show("Request sent. An admin will review it.", "success");
    },

    onError: (error: unknown) => {
      toast.show(errMsg(error), "error");
    },
  });

  const statusOf = (id: string) =>
    mine.find((membership) => membership.organizationId === id)?.status;

  const isJoining = (id: string) => join.isPending && join.variables === id;

  const renderOrganization = ({
    item,
  }: {
    item: (typeof filteredOrganizations)[number];
  }) => {
    const status = statusOf(item.id);
    const joining = isJoining(item.id);
    const alreadyHasMembership = Boolean(status);
    const joinDisabled = join.isPending || alreadyHasMembership;

    const address = [item.address, item.city, item.state]
      .filter(Boolean)
      .join(", ");

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.orgName} numberOfLines={2}>
                {item.name}
              </Text>

              {item.isVerified && (
                <View
                  style={styles.verifiedBadge}
                  accessibilityLabel="Verified community"
                  accessibilityRole="image"
                >
                  <Text style={styles.verifiedBadgeText}>✓</Text>
                </View>
              )}
            </View>

            {!!address && (
              <Text style={styles.addressText} numberOfLines={2}>
                {"📍 "}
                {address}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {titleCase(item.type ?? type)}
            </Text>
          </View>

          {status ? (
            <View
              style={[
                styles.statusBadge,
                ["ACTIVE", "APPROVED"].includes(String(status).toUpperCase())
                  ? styles.statusBadgeActive
                  : ["REJECTED", "CANCELLED"].includes(
                        String(status).toUpperCase(),
                      )
                    ? styles.statusBadgeRejected
                    : styles.statusBadgePending,
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {titleCase(String(status).replace(/_/g, " "))}
              </Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.joinBtn,
                pressed && !joinDisabled && styles.btnPressed,
                joinDisabled && styles.joinBtnDisabled,
              ]}
              onPress={() => join.mutate(item.id)}
              disabled={joinDisabled}
              accessibilityRole="button"
              accessibilityLabel={`Request to join ${item.name}`}
              accessibilityState={{
                disabled: joinDisabled,
                busy: joining,
              }}
            >
              {joining ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.joinBtnText}>Request to Join</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredOrganizations}
        keyExtractor={(item) => item.id}
        renderItem={renderOrganization}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.eyebrow}>
              <View style={styles.eyebrowDot} />
              <Text style={styles.eyebrowText}>FIND YOUR PEOPLE</Text>
            </View>

            <Text style={styles.title}>Find Your Community</Text>

            <Text style={styles.subtitle}>
              Find your estate, worship place, or group and request membership.
            </Text>

            <Text style={styles.sectionLabel}>COMMUNITY TYPE</Text>

            <View style={styles.chipRow}>
              {TYPES.map((itemType) => {
                const selected = type === itemType;

                return (
                  <Pressable
                    key={itemType}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipSelected,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => setType(itemType)}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected,
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {titleCase(itemType.replace(/_/g, " "))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>SEARCH COMMUNITIES</Text>

            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>⌕</Text>

              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${titleCase(type.replace(/_/g, " "))} by name...`}
                placeholderTextColor={colors.muted}
                value={q}
                onChangeText={setQ}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search communities"
              />

              {q.length > 0 && (
                <Pressable
                  onPress={() => setQ("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Text style={styles.clearText}>✕</Text>
                </Pressable>
              )}
            </View>

            {type === "ESTATE" && (
              <View style={styles.unitBox}>
                <Text style={styles.unitIcon}>⌂</Text>

                <TextInput
                  style={styles.searchInput}
                  placeholder="House / flat (e.g. Block B, Flat 4)"
                  placeholderTextColor={colors.muted}
                  value={unit}
                  onChangeText={setUnit}
                  autoCapitalize="words"
                  maxLength={100}
                  accessibilityLabel="House or flat number"
                />
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.createBanner,
                pressed && styles.bannerPressed,
              ]}
              onPress={() => router.push("/org/create")}
              accessibilityRole="button"
              accessibilityLabel="Register a new community"
            >
              <View style={styles.bannerIcon}>
                <Text style={styles.bannerIconText}>＋</Text>
              </View>

              <View style={styles.bannerTextCol}>
                <Text style={styles.createBannerTitle}>
                  Can't find your community?
                </Text>

                <Text style={styles.createBannerLink}>
                  Register a new community
                </Text>
              </View>

              <Text style={styles.bannerArrow}>›</Text>
            </Pressable>

            <View style={styles.resultsRow}>
              <Text style={styles.resultsText}>
                {dq ? "Search results" : "Available communities"}
              </Text>

              {isFetching && !isLoading && (
                <ActivityIndicator color={colors.primary} size="small" />
              )}
            </View>

            {isError && (
              <View style={styles.errorBox}>
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>
                    Couldn't load communities
                  </Text>

                  <Text style={styles.errorText}>{errMsg(error)}</Text>
                </View>

                <Pressable
                  style={styles.retryBtn}
                  onPress={() => refetch()}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading communities"
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator color={colors.primary} size="large" />

              <Text style={styles.stateTitle}>Finding communities</Text>

              <Text style={styles.stateText}>Please wait while we search.</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateTitle}>Communities unavailable</Text>

              <Text style={styles.stateText}>
                Retry the search when your connection is available.
              </Text>
            </View>
          ) : (
            <View style={styles.stateContainer}>
              <View style={styles.emptyIconBox}>
                <Text style={styles.emptyIcon}>⌕</Text>
              </View>

              <Text style={styles.stateTitle}>No communities found</Text>

              <Text style={styles.stateText}>
                No matching {type.toLowerCase().replace(/_/g, " ")} found. Try a
                different search or register a new community.
              </Text>

              {!!q && (
                <Pressable
                  style={styles.clearSearchBtn}
                  onPress={() => setQ("")}
                  accessibilityRole="button"
                >
                  <Text style={styles.clearSearchText}>Clear search</Text>
                </Pressable>
              )}
            </View>
          )
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
    paddingBottom: 24,
  },

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },

  eyebrowText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.primary,
  },

  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.6,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: 5,
    marginBottom: 22,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 9,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },

  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  chipPressed: {
    opacity: 0.75,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },

  chipTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },

  inputBox: {
    minHeight: 52,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  unitBox: {
    minHeight: 52,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  inputIcon: {
    fontSize: 25,
    lineHeight: 30,
    color: colors.primary,
    marginRight: 10,
  },

  unitIcon: {
    fontSize: 25,
    color: colors.primary,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },

  clearText: {
    color: colors.muted,
    fontSize: 15,
    paddingLeft: 8,
  },

  createBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    padding: 15,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E2D0FC",
    marginTop: 4,
    marginBottom: 20,
  },

  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  bannerIconText: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: "500",
  },

  bannerTextCol: {
    flex: 1,
  },

  createBannerTitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
    fontWeight: "700",
  },

  createBannerLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "800",
    marginTop: 3,
  },

  bannerArrow: {
    fontSize: 27,
    color: colors.primary,
    marginLeft: 8,
  },

  bannerPressed: {
    opacity: 0.8,
  },

  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  resultsText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },

  errorBox: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FECDD3",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  errorContent: {
    flex: 1,
    marginRight: 10,
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.danger,
    marginBottom: 3,
  },

  errorText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.danger,
  },

  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.danger,
    borderRadius: radius.sm,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  separator: {
    height: 12,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.primary,
  },

  infoCol: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  orgName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    color: colors.text,
  },

  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  verifiedBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  addressText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 4,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  typeBadge: {
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: 8,
    marginBottom: 4,
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },

  statusBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginBottom: 4,
  },

  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
  },

  statusBadgeRejected: {
    backgroundColor: "#FFE4E6",
  },

  statusBadgePending: {
    backgroundColor: colors.primarySoft,
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },

  joinBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  joinBtnDisabled: {
    opacity: 0.6,
  },

  btnPressed: {
    opacity: 0.8,
  },

  joinBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 36,
  },

  stateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: 10,
  },

  stateText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 290,
    marginTop: 6,
  },

  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 34,
    color: colors.primary,
  },

  clearSearchBtn: {
    marginTop: 16,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  clearSearchText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
});
