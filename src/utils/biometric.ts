import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CRED_KEY = 'khata_bio_creds';

export interface SavedCreds { email: string; password: string; name?: string }

/** True only if the device has biometric hardware AND the user has enrolled a fingerprint/face. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

/** "Face ID" / "Fingerprint" / "Biometrics" label for UI copy. */
export async function getBiometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
    return 'Biometrics';
  } catch {
    return 'Biometrics';
  }
}

/** Show the OS biometric prompt. Returns true if the user authenticated. */
export async function promptBiometric(reason = 'Unlock Khata Book'): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}

export async function saveCredentials(email: string, password: string, name?: string): Promise<void> {
  try { await SecureStore.setItemAsync(CRED_KEY, JSON.stringify({ email, password, name })); } catch {}
}

export async function getCredentials(): Promise<SavedCreds | null> {
  try {
    const raw = await SecureStore.getItemAsync(CRED_KEY);
    return raw ? (JSON.parse(raw) as SavedCreds) : null;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  try { await SecureStore.deleteItemAsync(CRED_KEY); } catch {}
}

export async function hasSavedCredentials(): Promise<boolean> {
  return !!(await getCredentials());
}
