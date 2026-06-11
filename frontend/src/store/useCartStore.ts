import { create } from "zustand";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  filament: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number, filament: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (newItem) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === newItem.id && item.filament === newItem.filament);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === newItem.id && item.filament === newItem.filament
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, newItem] };
    });
  },
  removeItem: (id, filament) => {
    set((state) => ({
      items: state.items.filter((item) => !(item.id === id && item.filament === filament)),
    }));
  },
  clearCart: () => set({ items: [] }),
}));
