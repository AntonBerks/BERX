import * as Keychain from 'react-native-keychain';
import type {BerxTokenStorage} from '@berx/core';

const SERVICE = 'online.berx.auth';
const ACCOUNT = 'bearer-token';

/** Production mobile token storage: iOS Keychain / Android Keystore-backed storage. */
export class BerxSecureTokenStorage implements BerxTokenStorage {
  async getToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({service: SERVICE});
    return credentials ? credentials.password : null;
  }

  async setToken(token: string | null): Promise<void> {
    if (!token) {
      await Keychain.resetGenericPassword({service: SERVICE});
      return;
    }
    await Keychain.setGenericPassword(ACCOUNT, token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
}
