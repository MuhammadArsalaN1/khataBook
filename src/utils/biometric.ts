// Biometric + secure credential helpers.
// All native modules are loaded LAZILY inside try/catch so that importing this
// file can never crash the app at startup (e.g. on web or if a module is
// missing in the current runtime). Every function degrades gracefully.

const CRED_KEY = 'khata_bio_creds';

export interface SavedCreds { email: string; password: string; name?: string }

function getLocalAuth(): any | null {
  try { return require('expo-local-authentication'); } catch { return null; }
}
function getSecureStore(): any | null {
  try { return require('expo-secure-store'); } catch { return null; }
}

/** True only if the device has biometric hardware AND an enrolled fingerprint/face. */
export async function isBiometricAvailable(): Promise<boolean> {
  const LA = getLocalAuth();
  if (!LA) return false;
  try {
    const hasHardware = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    return !!(hasHardware && enrolled);
  } catch {
    return false;
  }
}

/** "Face ID" / "Fingerprint" / "Biometrics" label for UI copy. */
export async function getBiometricLabel(): Promise<string> {
  const LA = getLocalAuth();
  if (!LA) return 'Biometrics';
  try {
    const types = await LA.supportedAuthenticationTypesAsync();
    if (types.includes(LA.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LA.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
    return 'Biometrics';
  } catch {
    return 'Biometrics';
  }
}

/** Show the OS biometric prompt. Returns true if the user authenticated. */
export async function promptBiometric(reason = 'Unlock Khata Book'): Promise<boolean> {
  const LA = getLocalAuth();
  if (!LA) return false;
  try {
    const res = await LA.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
    });
    return !!res.success;
  } catch {
    return false;
  }
}

export async function saveCredentials(email: string, password: string, name?: string): Promise<void> {
  const SS = getSecureStore();
  if (!SS) return;
  try { await SS.setItemAsync(CRED_KEY, JSON.stringify({ email, password, name })); } catch {}
}

export async function getCredentials(): Promise<SavedCreds | null> {
  const SS = getSecureStore();
  if (!SS) return null;
  try {
    const raw = await SS.getItemAsync(CRED_KEY);
    return raw ? (JSON.parse(raw) as SavedCreds) : null;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  const SS = getSecureStore();
  if (!SS) return;
  try { await SS.deleteItemAsync(CRED_KEY); } catch {}
}

export async function hasSavedCredentials(): Promise<boolean> {
  return !!(await getCredentials());
}
