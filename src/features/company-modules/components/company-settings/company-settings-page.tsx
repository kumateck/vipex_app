import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import {
  getPrintRuntime,
  getPrinterPreferenceMapping,
  listDesktopPrinters,
  setPrinterPreferenceMapping,
} from '@/features/printing';
import { useListCompanyModulesQuery, useSetCompanyModuleStateMutation } from '../../api';
import {
  getParcelAgeingPolicyFromModuleSettings,
  parcelAgeingPolicyToCedisPerDay,
} from '@/shared/shipments/parcel-ageing-policy';

function formatDateTime(value: string | null) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString();
}

export function CompanySettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { data: modules = [], isFetching, refetch } = useListCompanyModulesQuery();
  const [setCompanyModuleState, { isLoading: isSaving }] = useSetCompanyModuleStateMutation();
  const [stickerPrinter, setStickerPrinter] = useState<string>('');
  const [invoicePrinter, setInvoicePrinter] = useState<string>('');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [printerNames, setPrinterNames] = useState<string[]>([]);
  const [storageFeePerDayCedis, setStorageFeePerDayCedis] = useState('5');
  const [storageGracePeriodDays, setStorageGracePeriodDays] = useState('14');
  const [agedThresholdMonths, setAgedThresholdMonths] = useState('6');
  const [isSavingParcelPolicy, setIsSavingParcelPolicy] = useState(false);
  const isDesktopRuntime = useMemo(() => getPrintRuntime() === 'desktop', []);
  const shipmentsModule = useMemo(
    () => modules.find((module) => module.code === 'shipments') ?? null,
    [modules],
  );

  useEffect(() => {
    const saved = getPrinterPreferenceMapping();
    setStickerPrinter(saved.stickerPrinter ?? '');
    setInvoicePrinter(saved.invoicePrinter ?? '');
  }, []);

  useEffect(() => {
    if (!isDesktopRuntime) return;
    let active = true;

    const run = async () => {
      try {
        setIsLoadingPrinters(true);
        const printers = await listDesktopPrinters();
        if (!active) return;
        const names = printers
          .map((printer) => printer.name?.trim())
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => a.localeCompare(b));
        setPrinterNames(names);
      } catch {
        if (!active) return;
        toast.error('Failed to load desktop printers');
      } finally {
        if (active) setIsLoadingPrinters(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [isDesktopRuntime]);

  useEffect(() => {
    if (!shipmentsModule) return;
    const policy = getParcelAgeingPolicyFromModuleSettings(shipmentsModule.settings);
    setStorageFeePerDayCedis(String(parcelAgeingPolicyToCedisPerDay(policy)));
    setStorageGracePeriodDays(String(policy.gracePeriodDays));
    setAgedThresholdMonths(String(policy.agedThresholdMonths));
  }, [shipmentsModule]);

  async function handleToggle(moduleCode: string, isEnabled: boolean) {
    try {
      await setCompanyModuleState({ moduleCode, isEnabled }).unwrap();
      if (moduleCode === 'accounting' && user?.company) {
        updateUser({
          company: {
            ...user.company,
            useAccounting: isEnabled,
          },
        });
      }
      toast.success(`${moduleCode} ${isEnabled ? 'enabled' : 'disabled'}`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company module');
    }
  }

  function handleSavePrinterMapping() {
    setPrinterPreferenceMapping({
      stickerPrinter: stickerPrinter || undefined,
      invoicePrinter: invoicePrinter || undefined,
    });
    toast.success('Printer routing saved');
  }

  function handleClearPrinterMapping() {
    setStickerPrinter('');
    setInvoicePrinter('');
    setPrinterPreferenceMapping({});
    toast.success('Printer routing cleared');
  }

  async function handleSaveParcelAgeingPolicy() {
    if (!shipmentsModule) {
      toast.error('Shipments module was not found');
      return;
    }

    const storageFee = Number(storageFeePerDayCedis);
    const graceDays = Number(storageGracePeriodDays);
    const ageMonths = Number(agedThresholdMonths);

    if (!Number.isFinite(storageFee) || storageFee <= 0) {
      toast.error('Storage fee per day must be greater than 0');
      return;
    }
    if (!Number.isFinite(graceDays) || graceDays <= 0) {
      toast.error('Grace period days must be greater than 0');
      return;
    }
    if (!Number.isFinite(ageMonths) || ageMonths <= 0) {
      toast.error('Aging threshold months must be greater than 0');
      return;
    }

    const storageFeePerDayPsw = Math.round(storageFee * 100);
    const existingSettings =
      shipmentsModule.settings && typeof shipmentsModule.settings === 'object'
        ? (shipmentsModule.settings as Record<string, unknown>)
        : {};

    try {
      setIsSavingParcelPolicy(true);
      await setCompanyModuleState({
        moduleCode: shipmentsModule.code,
        isEnabled: shipmentsModule.isEnabled,
        settings: {
          ...existingSettings,
          parcelAgeing: {
            storageFeePerDayPsw,
            gracePeriodDays: Math.floor(graceDays),
            agedThresholdMonths: Math.floor(ageMonths),
          },
        },
      }).unwrap();
      toast.success('Parcel ageing policy updated');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save parcel ageing policy');
    } finally {
      setIsSavingParcelPolicy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Settings</h1>
          <p className="text-sm text-muted-foreground">
            Enable or disable company modules. Disabling a module removes its screens and blocks its
            backend routes without affecting unrelated workflows.
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-3.5 w-3.5" />
          Head Office Control
        </Badge>
      </div>

      <ScrollableWrapper>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Module Access
              </CardTitle>
              <CardDescription>
                Accounting uses this company-level setting. When disabled, accounting pages and
                routes are unavailable and operational parcel/payment flows continue normally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFetching ? (
                <div className="text-sm text-muted-foreground">Loading company modules...</div>
              ) : (
                modules.map((module) => {
                  const busy = isSaving;
                  return (
                    <div
                      key={module.code}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-medium">{module.name}</h2>
                          <Badge variant={module.isEnabled ? 'default' : 'secondary'}>
                            {module.isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {module.isCore ? <Badge variant="outline">Core</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {module.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last enabled: {formatDateTime(module.enabledAt)}. Last disabled:{' '}
                          {formatDateTime(module.disabledAt)}.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={module.isEnabled ? 'outline' : 'default'}
                        onClick={() => void handleToggle(module.code, !module.isEnabled)}
                        disabled={busy || !module.isActive}
                        className="min-w-36 gap-2"
                      >
                        {module.isEnabled ? (
                          <>
                            <ToggleLeft className="h-4 w-4" />
                            Disable
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4" />
                            Enable
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parcel Ageing & Storage Charges</CardTitle>
              <CardDescription>
                Company policy for uncollected parcels. Storage charges begin after the grace period
                and aged parcels are identified from the received date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="storage-fee-day">Storage Fee / Day (GHS)</Label>
                  <Input
                    id="storage-fee-day"
                    value={storageFeePerDayCedis}
                    onChange={(event) => setStorageFeePerDayCedis(event.target.value)}
                    placeholder="5"
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage-grace-days">Grace Period (Days)</Label>
                  <Input
                    id="storage-grace-days"
                    value={storageGracePeriodDays}
                    onChange={(event) => setStorageGracePeriodDays(event.target.value)}
                    placeholder="14"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aged-threshold-months">Aged Threshold (Months)</Label>
                  <Input
                    id="aged-threshold-months"
                    value={agedThresholdMonths}
                    onChange={(event) => setAgedThresholdMonths(event.target.value)}
                    placeholder="6"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => void handleSaveParcelAgeingPolicy()}
                  disabled={isSaving || isSavingParcelPolicy || !shipmentsModule}
                >
                  {isSavingParcelPolicy ? 'Saving...' : 'Save Parcel Policy'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desktop Printer Routing</CardTitle>
              <CardDescription>
                Sender payment uses these mappings for parallel print dispatch. Sticker and invoice
                are sent to different printers at the same time when running in Electron.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isDesktopRuntime ? (
                <p className="text-sm text-muted-foreground">
                  Desktop runtime not detected. Open this app in Electron to configure printer
                  routing.
                </p>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="sticker-printer">Sticker Printer</Label>
                      <Select
                        value={stickerPrinter || '__none__'}
                        onValueChange={(value) =>
                          setStickerPrinter(value === '__none__' ? '' : value)
                        }
                      >
                        <SelectTrigger id="sticker-printer" disabled={isLoadingPrinters}>
                          <SelectValue placeholder="Select sticker printer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Not configured</SelectItem>
                          {printerNames.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoice-printer">Invoice Printer (A5)</Label>
                      <Select
                        value={invoicePrinter || '__none__'}
                        onValueChange={(value) =>
                          setInvoicePrinter(value === '__none__' ? '' : value)
                        }
                      >
                        <SelectTrigger id="invoice-printer" disabled={isLoadingPrinters}>
                          <SelectValue placeholder="Select invoice printer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Not configured</SelectItem>
                          {printerNames.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleSavePrinterMapping}>
                      Save Routing
                    </Button>
                    <Button type="button" variant="outline" onClick={handleClearPrinterMapping}>
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsLoadingPrinters(true);
                        void listDesktopPrinters()
                          .then((printers) => {
                            const names = printers
                              .map((printer) => printer.name?.trim())
                              .filter((name): name is string => Boolean(name))
                              .sort((a, b) => a.localeCompare(b));
                            setPrinterNames(names);
                          })
                          .catch(() => {
                            toast.error('Failed to refresh printer list');
                          })
                          .finally(() => {
                            setIsLoadingPrinters(false);
                          });
                      }}
                      disabled={isLoadingPrinters}
                    >
                      {isLoadingPrinters ? 'Refreshing...' : 'Refresh Printers'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}
