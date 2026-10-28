import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import  { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, errMsg } from '@/api/client';
import { useToast } from '@/components/Toast';
import { colors, radius } from '@/lib/theme';

type ScanResult = {
  status: 'APPROVED' | 'DENIED';
  guestName?: string;
  vehicleNumber?: string;
  hostName?: string;
  message: string;
};

export default function GateScannerScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const lockRef = useRef(false);

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (lockRef.current || !scanning || verifying) return;

      lockRef.current = true;
      setVerifying(true);

      try {
        const response = await api.post(`/gate/${orgId}/verify`, {
          code: data,
        });

        const resData = response.data;
        setScanResult({
          status: 'APPROVED',
          guestName: resData?.guestName ?? 'Verified Visitor',
          vehicleNumber: resData?.vehicleNumber,
          hostName: resData?.hostName ?? 'Resident Host',
          message: 'Access granted by security policy.',
        });
        toast.show('Pass Verified!', 'success');
      } catch (error) {
        setScanResult({
          status: 'DENIED',
          message: errMsg(error) || 'Invalid or expired entry code.',
        });
        toast.show('Access Denied', 'error');
      } finally {
        setVerifying(false);
        setScanning(false);
      }
    },
    [orgId, scanning, verifying, toast]
  );

  const resetScan = () => {
    lockRef.current = false;
    setScanResult(null);
    setScanning(true);
  };

  if (!permission) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 24 }]}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionSubtitle}>
          Security gate scanning requires camera permissions to read visitor QR codes.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {scanning ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={verifying ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'code128', 'code39'],
            }}
          >
            {/* Viewfinder Overlay */}
            <View style={styles.overlayContainer}>
              <View style={styles.finderFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.instructionText}>
                Align visitor QR code inside frame
              </Text>
            </View>
          </CameraView>

          {verifying && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Verifying Pass...</Text>
            </View>
          )}
        </View>
      ) : (
        /* Scan Result View */
        <View
          style={[
            styles.resultContainer,
            {
              paddingTop: Math.max(insets.top, 20) + 20,
              paddingBottom: Math.max(insets.bottom, 20) + 20,
            },
          ]}
        >
          {scanResult && (
            <View style={styles.resultCard}>
              <View
                style={[
                  styles.statusBadge,
                  scanResult.status === 'APPROVED'
                    ? styles.badgeApproved
                    : styles.badgeDenied,
                ]}
              >
                <Text style={styles.statusBadgeIcon}>
                  {scanResult.status === 'APPROVED' ? '✓' : '✕'}
                </Text>
              </View>

              <Text style={styles.resultTitle}>
                {scanResult.status === 'APPROVED' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
              </Text>
              <Text style={styles.resultMessage}>{scanResult.message}</Text>

              {scanResult.status === 'APPROVED' && (
                <View style={styles.metaBox}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Visitor</Text>
                    <Text style={styles.metaValue}>{scanResult.guestName}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Host Resident</Text>
                    <Text style={styles.metaValue}>{scanResult.hostName}</Text>
                  </View>
                  {!!scanResult.vehicleNumber && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Vehicle Plate</Text>
                        <Text style={styles.metaValue}>{scanResult.vehicleNumber}</Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              <View style={styles.actionGroup}>
                <Pressable style={styles.primaryButton} onPress={resetScan}>
                  <Text style={styles.primaryButtonText}>Scan Next Pass</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
                  <Text style={styles.secondaryButtonText}>Exit Scanner</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  finderFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  statusBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  badgeDenied: {
    backgroundColor: '#FFE4E6',
  },
  statusBadgeIcon: {
    fontSize: 32,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  resultMessage: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  metaBox: {
    width: '100%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  actionGroup: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});