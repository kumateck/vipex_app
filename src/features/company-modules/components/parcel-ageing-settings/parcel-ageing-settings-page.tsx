import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { useParcelAgeingSettings } from '../../hooks/use-parcel-ageing-settings';

export function ParcelAgeingSettingsPage() {
  const {
    agedThresholdMonths,
    isFetching,
    isSaving,
    saveParcelAgeingPolicy,
    setAgedThresholdMonths,
    setStorageFeePerDayCedis,
    setStorageGracePeriodDays,
    shipmentsModule,
    storageFeePerDayCedis,
    storageGracePeriodDays,
  } = useParcelAgeingSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parcel Ageing</h1>
        <p className="text-sm text-muted-foreground">
          Configure storage charges and the ageing threshold for uncollected parcels.
        </p>
      </div>

      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Parcel Ageing & Storage Charges</CardTitle>
            <CardDescription>
              Storage charges begin after the grace period and aged parcels are identified from the
              received date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFetching ? (
              <div className="text-sm text-muted-foreground">Loading parcel policy...</div>
            ) : (
              <>
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
                <Button
                  type="button"
                  onClick={() => void saveParcelAgeingPolicy()}
                  disabled={isSaving || !shipmentsModule}
                >
                  {isSaving ? 'Saving...' : 'Save Parcel Policy'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}
