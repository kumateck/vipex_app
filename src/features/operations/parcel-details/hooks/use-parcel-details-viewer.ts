import { create } from 'zustand';

type ParcelDetailsViewerState = {
  parcelId: string | null;
  open: (parcelId: string) => void;
  close: () => void;
};

/** Opens the app-wide parcel details dialog from any page without prop drilling. */
export const useParcelDetailsViewer = create<ParcelDetailsViewerState>((set) => ({
  parcelId: null,
  open: (parcelId) => set({ parcelId }),
  close: () => set({ parcelId: null }),
}));
