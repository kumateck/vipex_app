import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDesktopPrinterRouting } from '../../hooks/use-desktop-printer-routing';

export function DesktopPrinterRoutingPage() {
  const {
    a4Printer,
    clearPrinterMapping,
    invoicePrinter,
    isDesktopRuntime,
    isLoadingPrinters,
    printerNames,
    refreshPrinters,
    savePrinterMapping,
    setA4Printer,
    setInvoicePrinter,
    setStickerPrinter,
    stickerPrinter,
  } = useDesktopPrinterRouting();

  return (
    <div className="space-y-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Printer Routing</h1>
        <p className="text-sm text-muted-foreground">
          Route parcel stickers, A5 documents, and A4 reports to the correct desktop printers.
        </p>
      </div>

      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Desktop Printer Routing</CardTitle>
            <CardDescription>
              Desktop print jobs are routed by paper format. Sender payment can dispatch sticker and
              invoice jobs in parallel, while reports use the configured A4 printer.
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="sticker-printer">Sticker Printer</Label>
                    <PrinterSelect
                      id="sticker-printer"
                      value={stickerPrinter}
                      placeholder="Select sticker printer"
                      printerNames={printerNames}
                      isLoading={isLoadingPrinters}
                      onChange={setStickerPrinter}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice-printer">Invoice Printer (A5)</Label>
                    <PrinterSelect
                      id="invoice-printer"
                      value={invoicePrinter}
                      placeholder="Select invoice printer"
                      printerNames={printerNames}
                      isLoading={isLoadingPrinters}
                      onChange={setInvoicePrinter}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a4-printer">Report Printer (A4)</Label>
                    <PrinterSelect
                      id="a4-printer"
                      value={a4Printer}
                      placeholder="Select A4 printer"
                      printerNames={printerNames}
                      isLoading={isLoadingPrinters}
                      onChange={setA4Printer}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={savePrinterMapping}>
                    Save Routing
                  </Button>
                  <Button type="button" variant="outline" onClick={clearPrinterMapping}>
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refreshPrinters()}
                    disabled={isLoadingPrinters}
                  >
                    {isLoadingPrinters ? 'Refreshing...' : 'Refresh Printers'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </ScrollableWrapper>
    </div>
  );
}

function PrinterSelect({
  id,
  isLoading,
  onChange,
  placeholder,
  printerNames,
  value,
}: {
  id: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  printerNames: string[];
  value: string;
}) {
  return (
    <Select
      value={value || '__none__'}
      onValueChange={(next) => onChange(next === '__none__' ? '' : next)}
    >
      <SelectTrigger id={id} disabled={isLoading}>
        <SelectValue placeholder={placeholder} />
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
  );
}
