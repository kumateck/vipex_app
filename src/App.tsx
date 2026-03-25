import '@/index.css';

import { useEffect } from 'react';
import MainRoutes from './pages';
import { ThemeProvider } from './components/providers/theme';
import ClientProvider from './components/providers/client';
import { Toaster } from './components/ui/sonner';
import { installTheAduseiGlobalErrorHandlers } from './lib/TheAduseiErrorResponse';

export function App() {
  useEffect(() => {
    return installTheAduseiGlobalErrorHandlers();
  }, []);

  return (
    <ClientProvider>
      <ThemeProvider>
        <MainRoutes />
        <Toaster richColors closeButton />
      </ThemeProvider>
    </ClientProvider>
  );
}

export default App;
