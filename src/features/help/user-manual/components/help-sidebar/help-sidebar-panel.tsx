import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { HELP_CATEGORIES, HELP_GUIDES } from '../../services';

const SEARCH_TEXT = new Map(
  HELP_GUIDES.map((guide) => [
    guide.id,
    [guide.title, guide.summary, ...guide.keywords].join(' ').toLocaleLowerCase(),
  ]),
);

export function HelpSidebarPanel() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const selectedGuideId = searchParams.get('guide') ?? HELP_GUIDES[0]?.id;
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const visibleCategories = HELP_CATEGORIES.map((category) => ({
    ...category,
    guides: HELP_GUIDES.filter(
      (guide) =>
        guide.categoryId === category.id &&
        (!normalizedSearch || SEARCH_TEXT.get(guide.id)?.includes(normalizedSearch)),
    ),
  })).filter((category) => category.guides.length);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-sidebar-border p-3">
        <div className="relative">
          <Icon
            name="Search"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search help..."
            className="h-9 bg-background pl-8"
            aria-label="Search the help table of contents"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3" aria-label="Help contents">
        {visibleCategories.length ? (
          visibleCategories.map((category) => (
            <section key={category.id}>
              <h3 className="mb-1.5 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon name={category.icon} className="h-3.5 w-3.5" />
                {category.name}
              </h3>
              <div className="space-y-0.5">
                {category.guides.map((guide) => (
                  <Link
                    key={guide.id}
                    to={`/help?guide=${guide.id}`}
                    className={`block rounded-md px-2 py-2 text-sm leading-snug transition-colors ${
                      selectedGuideId === guide.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    {guide.title}
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="px-3 py-8 text-center">
            <Icon name="SearchX" className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No guide found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try “parcel”, “cashier”, or “leave”.
            </p>
          </div>
        )}
      </nav>
    </div>
  );
}
