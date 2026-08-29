import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

type StaleBuildRecoveryViewProps = {
  onReload: () => void;
};

export function StaleBuildRecoveryView({ onReload }: StaleBuildRecoveryViewProps) {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center space-y-4 text-center">
          <Spinner className="size-8 text-primary" aria-label="Updating application" />
          <CardTitle className="text-2xl">Updating application</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          A newer version is available. We are refreshing this page to load the latest files.
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onReload}>Reload now</Button>
        </CardFooter>
      </Card>
    </main>
  );
}
