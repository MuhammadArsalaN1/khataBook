import { USERS } from '../constants';

/**
 * Resolve a user name to email
 * - "Rehan" or "rehan" -> "rehan@itcorpinc.com"
 * - "Arsalan" or "arsalan" -> "arsalan@itcorpinc.com"
 * - Unknown names -> "others"
 */
export function resolveUserEmail(inputName: string): string {
  if (!inputName || inputName.trim().length === 0) {
    return 'others';
  }

  const normalizedInput = inputName.trim().toLowerCase();

  // Try to match against known users
  const matchedUser = USERS.find(u =>
    u.name.toLowerCase() === normalizedInput ||
    u.email.toLowerCase().startsWith(normalizedInput + '@')
  );

  return matchedUser ? matchedUser.email : 'others';
}

/**
 * Get display name from email
 * - "rehan@itcorpinc.com" -> "Rehan"
 * - "others" -> "Others"
 */
export function getDisplayName(email: string): string {
  if (email === 'others') {
    return 'Others';
  }

  const user = USERS.find(u => u.email === email);
  return user ? user.name : 'Others';
}

/**
 * Get user info (email and display name) from a name input
 */
export function resolveUserInfo(inputName: string): { email: string; displayName: string } {
  const email = resolveUserEmail(inputName);
  const displayName = getDisplayName(email);
  return { email, displayName };
}

/**
 * Get all known users (for dropdown selection)
 */
export function getKnownUsers() {
  return [
    ...USERS.map(u => ({
      email: u.email,
      displayName: u.name,
      isKnown: true,
    })),
    {
      email: 'others',
      displayName: 'Others',
      isKnown: false,
    },
  ];
}

/**
 * Validate user input - checks if name can be resolved
 */
export function isValidUserInput(inputName: string): boolean {
  return inputName && inputName.trim().length > 0;
}
