import { useCreditSettlement } from '../../hooks';
import type { SettlementProps } from '../../types';
import { CustomerDebtSettlementView } from './customer-debt-settlement-view';

export function CustomerDebtSettlement(props: SettlementProps) {
  const model = useCreditSettlement(props);
  return <CustomerDebtSettlementView model={model} />;
}
