import { create } from "zustand";
import type { TutorMode } from "@/types/tutor";

interface TutorState {
  isOpen: boolean;
  mode: TutorMode;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setMode: (mode: TutorMode) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
  isOpen: false,
  mode: "learning",
  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setMode: (mode) => set({ mode }),
}));
