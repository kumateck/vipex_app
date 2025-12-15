import '@/index.css';

import MainRoutes from './pages';
import { ThemeProvider } from './components/providers/theme';

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vipex-ui-theme">
      <MainRoutes />
    </ThemeProvider>
  );
}

export default App;
