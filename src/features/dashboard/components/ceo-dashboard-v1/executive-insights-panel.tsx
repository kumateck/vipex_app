import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import {
  useGenerateExecutiveInsightsMutation,
  useGetLatestExecutiveInsightsQuery,
} from '../../api/executive-insights.api';

type Props = {
  from: string;
  to: string;
  branchId: string | null;
};

export function ExecutiveInsightsPanel({ from, to, branchId }: Props) {
  const latest = useGetLatestExecutiveInsightsQuery({ branchId });
  const [generate, generateState] = useGenerateExecutiveInsightsMutation();

  const insight = generateState.data ?? latest.data;
  const isBusy = latest.isFetching || generateState.isLoading;

  function handleGenerate() {
    void generate({ from, to, branchId });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="Sparkles" className="h-4 w-4 text-primary" /> AI Executive Summary
        </CardTitle>
        <CardDescription>
          An AI-generated summary to review — not an authoritative report. Every figure it cites
          also appears in the cards above; spot-check before acting on it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {generateState.error || (latest.error && !insight) ? (
          <p className="text-muted-foreground">
            Executive insights aren&apos;t available right now — the figures above are still
            accurate.
          </p>
        ) : null}

        {insight?.narrative ? (
          <div className="space-y-3">
            <p className="leading-relaxed whitespace-pre-wrap">{insight.narrative}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                Generated {new Date(insight.createdAt).toLocaleString()}
              </Badge>
              {insight.provider ? <Badge variant="outline">{insight.provider}</Badge> : null}
            </div>
          </div>
        ) : !isBusy ? (
          <p className="text-muted-foreground">
            No summary generated yet for this scope. Generate one below.
          </p>
        ) : null}

        <Button onClick={handleGenerate} disabled={isBusy} size="sm">
          {isBusy ? <Spinner /> : <Icon name="RefreshCw" className="h-4 w-4" />}
          {insight?.narrative ? 'Regenerate' : 'Generate'}
        </Button>
      </CardContent>
    </Card>
  );
}
