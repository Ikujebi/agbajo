import React, { useCallback } from "react";
import { FlatList, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { fmtDate } from "../../hooks";
import { useNav } from "../../navigation/types";
import { Badge, Button, Card, Empty, Muted, Screen } from "../../components/ui";
import { colors } from "../../theme";
import type { Pass } from "../../api/types";

// Status badge color mapping with fallback support
const statusColors: Record<Pass["status"], string> = {
  ACTIVE: colors.success,
  COMPLETED: colors.muted,
  EXPIRED: colors.accent ?? colors.muted, // Fallback if colors.warn isn't defined in theme
  REVOKED: colors.danger,
};

export default function VisitorsScreen() {
  const nav = useNav();
  
  const { data, refetch, isRefetching, isLoading } = useQuery<Pass[]>({
    queryKey: ["passes"],
    queryFn: async () => (await api.get("/visitors/mine")).data,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <Screen scroll={false}>
      <Button
        title="+ New visitor pass"
        onPress={() => nav.navigate("CreatePass")}
      />
      <View style={{ height: 12 }} />
      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.id}
        refreshing={isRefetching || isLoading}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !isLoading ? (
            <Empty text="No passes yet. Create one and share the code with your visitor." />
          ) : undefined
        }
        renderItem={({ item }) => {
          const badgeColor = statusColors[item.status] ?? colors.muted;

          return (
            <Card onPress={() => nav.navigate("PassDetail", { pass: item })}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    color: colors.text,
                    flex: 1,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {item.visitorName}
                </Text>
                <Badge text={item.status} color={badgeColor} />
              </View>

              <Muted>{item.purpose || "Visitor pass"}</Muted>
              <Muted style={{ marginTop: 2 }}>
                Until {fmtDate(item.validUntil)} · used {item.entriesUsed}/
                {item.maxEntries}
              </Muted>
            </Card>
          );
        }}
      />
    </Screen>
  );
}