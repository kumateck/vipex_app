import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { HELP_CATEGORIES, HELP_GUIDES } from '../../services';
import type { HelpGuide } from '../../types/help-guide.types';
import { HelpModulePages } from './help-module-pages';

type Props = {
  guide: HelpGuide | null;
  onSelectGuide: (guideId: string) => void;
};

export function HelpGuideDetail({ guide, onSelectGuide }: Props) {
  if (!guide) {
    return (
      <section className="flex min-h-64 items-center justify-center rounded-xl border bg-card p-6 text-center">
        <div>
          <Icon name="BookOpen" className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Choose a guide to begin</p>
        </div>
      </section>
    );
  }

  const category = HELP_CATEGORIES.find((item) => item.id === guide.categoryId);
  const relatedGuides = (guide.relatedGuideIds ?? [])
    .map((id) => HELP_GUIDES.find((item) => item.id === id))
    .filter((item): item is HelpGuide => Boolean(item));

  return (
    <article className="min-w-0 rounded-xl border bg-card">
      <header className="p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{category?.name ?? 'Help guide'}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Icon name="Clock3" className="h-3.5 w-3.5" /> {guide.estimatedMinutes} min read
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{guide.title}</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">{guide.summary}</p>
        {guide.pageUrl && guide.pageName ? (
          <Button asChild className="mt-5">
            <Link to={guide.pageUrl}>
              Open {guide.pageName}
              <Icon name="ArrowUpRight" className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </header>

      <Separator />

      <div className="space-y-8 p-5 md:p-7">
        <section>
          <h3 className="flex items-center gap-2 font-semibold">
            <Icon name="ClipboardCheck" className="h-5 w-5 text-primary" /> Before you start
          </h3>
          <ul className="mt-3 space-y-2">
            {guide.beforeYouStart.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed">
                <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <HelpModulePages pages={guide.modulePages ?? []} />

        <section>
          <h3 className="flex items-center gap-2 font-semibold">
            <Icon name="ListOrdered" className="h-5 w-5 text-primary" /> Follow these steps
          </h3>
          <ol className="mt-4 space-y-4">
            {guide.steps.map((step, index) => (
              <li key={`${guide.id}-${step.title}`} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  {step.note ? (
                    <div className="mt-2 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                      <Icon name="Info" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <span>{step.note}</span>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Icon name="CircleCheckBig" className="h-5 w-5 text-emerald-600" /> What should happen
          </h3>
          <p className="mt-2 text-sm leading-relaxed">{guide.expectedResult}</p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 font-semibold">
            <Icon name="CircleQuestionMark" className="h-5 w-5 text-primary" /> Common problems
          </h3>
          <div className="mt-3 space-y-2">
            {guide.commonIssues.map((issue) => (
              <details key={issue.problem} className="group rounded-lg border p-3">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {issue.problem}
                    <Icon
                      name="ChevronDown"
                      className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                    />
                  </span>
                </summary>
                <p className="mt-2 pr-6 text-sm leading-relaxed text-muted-foreground">
                  {issue.solution}
                </p>
              </details>
            ))}
          </div>
        </section>

        {relatedGuides.length ? (
          <section>
            <h3 className="font-semibold">Related guides</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {relatedGuides.map((relatedGuide) => (
                <Button
                  key={relatedGuide.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectGuide(relatedGuide.id)}
                >
                  {relatedGuide.title}
                </Button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
