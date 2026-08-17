import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { HelpModulePage } from '../../types/help-guide.types';

type Props = {
  pages: HelpModulePage[];
};

export function HelpModulePages({ pages }: Props) {
  if (!pages.length) return null;

  return (
    <section>
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon name="PanelsTopLeft" className="h-5 w-5 text-primary" /> Pages in this module
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Choose the page that matches the work you want to do. Pages unavailable to your role may not
        appear in your application sidebar.
      </p>
      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {pages.map((page) => (
          <Link
            key={page.url}
            to={page.url}
            className="group rounded-lg border p-3 transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{page.name}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {page.description}
                </span>
              </span>
              <Icon
                name="ArrowUpRight"
                className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"
              />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
