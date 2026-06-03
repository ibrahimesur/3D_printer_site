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
  removeItem: (id: number) => void;
  clearCart: () => void;
  get totalItems(): number;
  get totalPrice(): number;
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
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
  clearCart: () => set({ items: [] }),
  get totalItems() {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  get totalPrice() {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));
