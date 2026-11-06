import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppStore = {
  settingsOpen: boolean;
  searchOpen: boolean;
  compareList: string[];
  compareFullToast: boolean;
  setSettingsOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCompareList: (slugs: string[]) => void;
  addToCompare: (slug: string) => void;
  setCompareSlot: (index: number, slug: string) => void;
  clearCompareSlot: (index: number) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  toggleCompare: (slug: string) => void;
  dismissCompareFullToast: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settingsOpen: false,
      searchOpen: false,
      compareList: [],
      compareFullToast: false,
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setCompareList: (slugs) => set({ compareList: [...new Set(slugs)].slice(0, 6), compareFullToast: false }),
      addToCompare: (slug) =>
        set((state) =>
          state.compareList.includes(slug) || state.compareList.length >= 6
            ? state.compareList.includes(slug) ? state : { ...state, compareFullToast: true }
            : { compareList: [...state.compareList, slug], compareFullToast: false },
        ),
      setCompareSlot: (index, slug) =>
        set((state) => {
          const sanitizedIndex = Math.max(0, Math.min(index, 5));
          const next = state.compareList.filter((item) => item !== slug);
          if (next[sanitizedIndex]) next[sanitizedIndex] = slug;
          else next.push(slug);
          return { compareList: [...new Set(next)].slice(0, 6), compareFullToast: false };
        }),
      clearCompareSlot: (index) =>
        set((state) => ({
          compareList: state.compareList.filter((_, itemIndex) => itemIndex !== index),
          compareFullToast: false,
        })),
      removeFromCompare: (slug) =>
        set((state) => ({
          compareList: state.compareList.filter((item) => item !== slug),
        })),
      clearCompare: () => set({ compareList: [] }),
      toggleCompare: (slug) =>
        set((state) => {
          if (state.compareList.includes(slug)) {
            return { compareList: state.compareList.filter((item) => item !== slug) };
          }

          return state.compareList.length >= 6
            ? { ...state, compareFullToast: true }
            : { compareList: [...state.compareList, slug], compareFullToast: false };
        }),
      dismissCompareFullToast: () => set({ compareFullToast: false }),
    }),
    {
      name: "sonus-compare-list",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ compareList: state.compareList }),
      merge: (persistedState, currentState) => {
        const savedList = (persistedState as { compareList?: unknown } | undefined)
          ?.compareList;
        const compareList = Array.isArray(savedList)
          ? savedList.filter((slug): slug is string => typeof slug === "string").slice(0, 6)
          : currentState.compareList;

        return { ...currentState, compareList };
      },
    },
  ),
);