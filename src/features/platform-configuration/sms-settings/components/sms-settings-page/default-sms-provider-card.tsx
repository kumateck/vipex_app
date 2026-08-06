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
import type { CompanySmsSettings } from '../../types';

export function DefaultSmsProviderCard({
  settings,
  isLoading,
  canManage,
  selectedProviderKey,
  isDirty,
  isSaving,
  onProviderChange,
  onSave,
}: {
  settings?: CompanySmsSettings;
  isLoading: boolean;
  canManage: boolean;
  selectedProviderKey: string;
  isDirty: boolean;
  isSaving: boolean;
  onProviderChange: (providerKey: string) => void;
  onSave: () => Promise<void>;
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
        {!canManage ? (
          <p className="mt-3 text-xs text-muted-foreground">
            You can view this setting but need provider-management permission to change it.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
