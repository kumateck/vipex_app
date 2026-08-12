import { useMobileUpdate } from '../hooks/use-mobile-update';

export function MobileUpdateGate() {
  useMobileUpdate();
  return null;
}
