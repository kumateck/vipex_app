import { useEffect } from 'react';
import MainRoutes from './pages';
import { ThemeProvider } from './components/providers/theme';
import ClientProvider from './components/providers/client';
import { Toaster } from './components/ui/sonner';
import { installTheAduseiGlobalErrorHandlers } from './lib/TheAduseiErrorResponse';
import { DesktopDeviceGate } from './features/auth/device-registration';

export function App() {
  useEffect(() => {
    return installTheAduseiGlobalErrorHandlers();
  }, []);

  return (
    <ClientProvider>
      <ThemeProvider>
        <DesktopDeviceGate>
          <MainRoutes />
        </DesktopDeviceGate>
        <Toaster richColors closeButton />
      </ThemeProvider>
    </ClientProvider>
  );
}

export default App;
