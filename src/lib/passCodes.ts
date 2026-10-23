import * as SecureStore from 'expo-secure-store';

/**
 * The backend keeps only a hash of each visitor code, so the plain code is
 * returned once, when the pass is created. We keep it on this device so the
 * host can re-open and re-share the pass later.
 */
const key = (passId: string) => `pass.code.${passId}`;

export const savePassCode = (passId: string, code: string) =>
  SecureStore.setItemAsync(key(passId), code).catch(() => {});

export const loadPassCode = (passId: string) => SecureStore.getItemAsync(key(passId)).catch(() => null);

export const clearPassCode = (passId: string) => SecureStore.deleteItemAsync(key(passId)).catch(() => {});
