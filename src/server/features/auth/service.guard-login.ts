import { BadRequest } from '../../utils/http-error';

// Call this from your login flow after loading the user record
export function assertPasswordIsSet(user: { passwordHash: string | null | undefined }) {
  if (!user.passwordHash) {
    throw BadRequest('Account not ready. Please set your password from the invitation email.');
  }
}
