import { createRoot } from 'react-dom/client';
import { App } from '../../../src/App';
import './index.css';
import { DesktopShellBadge } from '@ui/DesktopShellBadge';
import { getRuntimePlatformLabel } from '@lib/runtime';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root container not found');
}

createRoot(root).render(
  <>
    <DesktopShellBadge platform={getRuntimePlatformLabel()} />
    <App />
  </>,
);
