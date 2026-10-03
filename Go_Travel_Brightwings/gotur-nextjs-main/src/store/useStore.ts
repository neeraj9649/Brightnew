// src/store/useStore.ts
import { create } from "zustand";

interface StoreState {
  searchPopupStatus: boolean;
  mobileDrawerStatus: boolean;
  mobileDrawerTwoStatus: boolean;
  sideBarDrawerStatus: boolean;
  changeSearchPopupStatus: () => void;
  changeMobileDrawerStatus: () => void;
  changeMobileDrawerTwoStatus: () => void;
  changeSideBarDrawerStatus: () => void;
  setMobileDrawerTwoStatus: (status: boolean) => void;
  setMobileDrawerStatus: (status: boolean) => void;
  setSideBarDrawerStatus: (status: boolean) => void;
}

const useStore = create<StoreState>((set) => ({
  searchPopupStatus: false,
  mobileDrawerStatus: false,
  mobileDrawerTwoStatus: false,
  sideBarDrawerStatus: false,
  changeSearchPopupStatus: () =>
    set((state) => ({ searchPopupStatus: !state.searchPopupStatus })),
  // changeMobileDrawerStatus: () =>
  //   set((state) => ({ mobileDrawerStatus: !state.mobileDrawerStatus })),
  changeMobileDrawerStatus: () =>
    set((state) => {
      const newStatus = !state.mobileDrawerStatus;
      console.log("mobileDrawerStatus changed to:", newStatus);
      return { mobileDrawerStatus: newStatus };
    }),
  changeMobileDrawerTwoStatus: () =>
    set((state) => {
      const newStatus = !state.mobileDrawerTwoStatus;
      console.log("mobileDrawerStatus changed to:", newStatus);
      return { mobileDrawerTwoStatus: newStatus };
    }),
  changeSideBarDrawerStatus: () =>
    set((state) => ({ sideBarDrawerStatus: !state.sideBarDrawerStatus })),
  setMobileDrawerTwoStatus: (status: boolean) =>
    set(() => ({ mobileDrawerTwoStatus: status })),
  setMobileDrawerStatus: (status: boolean) =>
    set(() => ({ mobileDrawerStatus: status })),
  setSideBarDrawerStatus: (status: boolean) =>
    set(() => ({ mobileDrawerStatus: status })),
}));

export default useStore;
