import * as Keychain from 'react-native-keychain';

const USERNAME = 'vipex_mobile';

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({ service: key });
    if (!result) return null;
    return result.password;
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, value, { service: key });
}

export async function deleteItemAsync(key: string): Promise<void> {
  await Keychain.resetGenericPassword({ service: key });
}
