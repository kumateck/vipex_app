import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import {
  useGenerateManagementDailyBriefMutation,
  useGetLatestManagementDailyBriefQuery,
} from '../../api/management-daily-brief.api';

export function ManagementDailyBriefPanel() {
  const latest = useGetLatestManagementDailyBriefQuery();
  const [generate, generateState] = useGenerateManagementDailyBriefMutation();

  const brief = generateState.data ?? latest.data;
  const isBusy = latest.isFetching || generateState.isLoading;

  function handleGenerate() {
    void generate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="Sparkles" className="h-4 w-4 text-primary" /> AI Management Daily Brief
        </CardTitle>
        <CardDescription>
          A synthesis of the executive, fleet, and operations AI briefs — not an authoritative
          report. Sections older than 48 hours are called out as stale in the text below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {generateState.error || (latest.error && !brief) ? (
          <p className="text-muted-foreground">
            The management daily brief isn&apos;t available right now — try the individual briefs
            below instead.
          </p>
        ) : null}

        {brief?.narrative ? (
          <div className="space-y-3">
            <p className="leading-relaxed whitespace-pre-wrap">{brief.narrative}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                Generated {new Date(brief.createdAt).toLocaleString()}
              </Badge>
              {brief.provider ? <Badge variant="outline">{brief.provider}</Badge> : null}
            </div>
          </div>
        ) : !isBusy ? (
          <p className="text-muted-foreground">
            No daily brief generated yet. Generate one below — it works best after the executive,
            fleet, and operations briefs have each been generated at least once.
          </p>
        ) : null}

        <Button onClick={handleGenerate} disabled={isBusy} size="sm">
          {isBusy ? <Spinner /> : <Icon name="RefreshCw" className="h-4 w-4" />}
          {brief?.narrative ? 'Regenerate' : 'Generate'}
        </Button>
      </CardContent>
    </Card>
  );
}
