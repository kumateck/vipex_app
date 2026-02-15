import { store } from '@/store';
import { Provider } from 'react-redux';
interface ClientProviderProps {
  children?: React.ReactNode;
}
const ClientProvider = ({ children }: ClientProviderProps) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ClientProvider;
