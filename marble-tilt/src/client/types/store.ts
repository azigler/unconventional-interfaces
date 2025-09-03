export interface StoreProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string; // Emoji or image URL
}

export interface CartItem extends StoreProduct {
  quantity: number;
}
