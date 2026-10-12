import { AppButton, AppSelectField } from '@mobile/components/ui/mobile';

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

export function ParcelChargeAgentField({
  value,
  onChange,
  options,
  loading,
  failed,
  onRetry,
}: Props) {
  return (
    <>
      <AppSelectField
        label="Agent who charged the parcel"
        value={value}
        onValueChange={onChange}
        options={options}
        loading={loading}
        disabled={loading || failed || !options.length}
        placeholder={
          failed
            ? 'Unable to load agents'
            : options.length
              ? 'Select agent'
              : 'No active agents available'
        }
        searchPlaceholder="Search agents..."
      />
      {failed ? <AppButton title="Retry loading agents" variant="plain" onPress={onRetry} /> : null}
    </>
  );
}
