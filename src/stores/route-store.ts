import { ROUTES } from '@/components/sidebar/navigation';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to find route breadcrumb from URL
function findBreadcrumbFromUrl(url: string) {
  // Normalize URL - handle "/" as "/dashboard"
  const normalizedUrl = url === '/' ? '/dashboard' : url;

  for (const section of ROUTES) {
    for (const menuItem of section.menu) {
      // Check direct menu item URL
      if (menuItem.url === normalizedUrl) {
        return {
          section: section.title,
          menuItem: menuItem.title,
          subItem: null,
          url: normalizedUrl,
        };
      }

      // Check sub-items
      if (menuItem.items) {
        for (const subItem of menuItem.items) {
          if (subItem.url === normalizedUrl) {
            return {
              section: section.title,
              menuItem: menuItem.title,
              subItem: subItem.title,
              url: normalizedUrl,
            };
          }
        }
      }
    }
  }

  return null;
}

// Zustand store for managing breadcrumb state
interface BreadcrumbState {
  section: string;
  menuItem: string;
  subItem: string | null;
  url: string;
  setBreadcrumb: (section: string, menuItem: string, subItem: string | null, url: string) => void;
  syncFromUrl: (url: string) => void;
  reset: () => void;
}
export const useBreadcrumbStore = create<BreadcrumbState>()(
  persist(
    (set) => ({
      section: '',
      menuItem: '',
      subItem: null,
      url: '',
      setBreadcrumb: (section, menuItem, subItem, url) => set({ section, menuItem, subItem, url }),
      syncFromUrl: (url) => {
        const breadcrumb = findBreadcrumbFromUrl(url);
        if (breadcrumb) {
          set(breadcrumb);
        }
      },
      reset: () => set({ section: '', menuItem: '', subItem: null, url: '' }),
    }),
    {
      name: 'vipex-route-storage',
    },
  ),
);
