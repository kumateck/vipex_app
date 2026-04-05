import { createRoot } from 'react-dom/client';
import { App } from '../../../src/App';
import { installBuildRefreshWatcher } from './install-build-refresh';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root container not found');
}

void installBuildRefreshWatcher();

createRoot(root).render(<App />);
