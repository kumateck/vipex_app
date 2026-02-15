import '@/index.css';

import MainRoutes from './pages';
import { ThemeProvider } from './components/providers/theme';
import ClientProvider from './components/providers/client';

export function App() {
  return (
    <ClientProvider>
      <ThemeProvider defaultTheme="system" storageKey="vipex-ui-theme">
        <MainRoutes />
      </ThemeProvider>
    </ClientProvider>
  );
}

export default App;
