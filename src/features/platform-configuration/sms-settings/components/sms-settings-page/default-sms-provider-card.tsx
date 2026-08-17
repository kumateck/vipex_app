import { MessageSquareText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CompanySmsSettings, SmsProviderBalance } from '../../types';
import { getSmsSettingsErrorMessage } from '../../utils';

export function DefaultSmsProviderCard({
  settings,
  isLoading,
  canManage,
  selectedProviderKey,
  isDirty,
  isSaving,
  onProviderChange,
  onSave,
  providerBalance,
  isLoadingProviderBalance,
  providerBalanceError,
}: {
  settings?: CompanySmsSettings;
  isLoading: boolean;
  canManage: boolean;
  selectedProviderKey: string;
  isDirty: boolean;
  isSaving: boolean;
  onProviderChange: (providerKey: string) => void;
  onSave: () => Promise<void>;
  providerBalance?: SmsProviderBalance;
  isLoadingProviderBalance?: boolean;
  providerBalanceError?: unknown;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />
          Default SMS Provider
          <Badge variant="outline">Company-wide</Badge>
        </CardTitle>
        <CardDescription>
          All application SMS actions for this company use this provider. Credentials remain in the
          server environment and are never exposed here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading SMS providers...</p>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Provider</p>
              <Select
                value={selectedProviderKey}
                onValueChange={onProviderChange}
                disabled={!canManage || isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an SMS provider" />
                </SelectTrigger>
                <SelectContent>
                  {settings?.providers.map((provider) => (
                    <SelectItem
                      key={provider.providerKey}
                      value={provider.providerKey}
                      disabled={!provider.isConfigured}
                    >
                      {provider.name}
                      {provider.configurationSource === 'environment' ? ' · environment' : ''}
                      {!provider.isConfigured ? ' · incomplete configuration' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              onClick={() => void onSave()}
              disabled={!canManage || !selectedProviderKey || !isDirty || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save provider'}
            </Button>
          </div>
        )}
        {selectedProviderKey.toLowerCase() === 'mnotify' ? (
          <div className="mt-4 rounded-lg border bg-muted/40 p-4">
            {isLoadingProviderBalance ? (
              <p className="text-sm text-muted-foreground">Checking balance...</p>
            ) : providerBalance ? (
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    SMS Balance
                  </p>
                  <p className="text-3xl leading-tight font-bold tabular-nums">
                    {providerBalance.balance.toLocaleString()}
                  </p>
                </div>
                {providerBalance.bonus > 0 ? (
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Bonus
                    </p>
                    <p className="text-3xl leading-tight font-bold tabular-nums">
                      {providerBalance.bonus.toLocaleString()}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : providerBalanceError ? (
              <p className="text-sm text-destructive">
                {getSmsSettingsErrorMessage(providerBalanceError, 'Could not fetch balance')}
              </p>
            ) : null}
          </div>
        ) : null}
        {!canManage ? (
          <p className="mt-3 text-xs text-muted-foreground">
            You can view this setting but need provider-management permission to change it.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
