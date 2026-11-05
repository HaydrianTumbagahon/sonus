import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppStore = {
  settingsOpen: boolean;
  searchOpen: boolean;
  compareList: string[];
  setSettingsOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setCompareList: (slugs: string[]) => void;
  addToCompare: (slug: string) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  toggleCompare: (slug: string) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      settingsOpen: false,
      searchOpen: false,
      compareList: [],
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setCompareList: (slugs) => set({ compareList: [...new Set(slugs)].slice(0, 6) }),
      addToCompare: (slug) =>
        set((state) =>
          state.compareList.includes(slug) || state.compareList.length >= 6
            ? state
            : { compareList: [...state.compareList, slug] },
        ),
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
            ? state
            : { compareList: [...state.compareList, slug] };
        }),
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