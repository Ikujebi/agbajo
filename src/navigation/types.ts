import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Pass } from '../api/types';

export type RootParams = {
  Login: undefined; Register: undefined; Tabs: undefined;
  FindOrg: undefined; CreateOrg: undefined;
  Members: { orgId: string; name: string };
  Broadcast: { orgId: string; name: string };
  CreatePass: undefined; PassDetail: { pass: Pass };
  Gate: { orgId: string; name: string };
  ManageShop: { orgId: string; name: string };
  Chat: { recipientId: string; name: string; conversationId?: string };
  NewChat: undefined; Notifications: undefined;
};
export type Nav = NativeStackNavigationProp<RootParams>;
export const useNav = () => useNavigation<Nav>();
