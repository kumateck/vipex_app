import { CONSIGNMENT_PAYMENT_STATUS_LEGEND } from './payment-status';

export function PaymentStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {CONSIGNMENT_PAYMENT_STATUS_LEGEND.map((item) => (
        <div key={item.label} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
          <span className="text-muted-foreground text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
