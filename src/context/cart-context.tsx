"use client";

import { createContext, useContext, useState, useEffect } from "react";

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

type CartContextType = {
  cart: CartItem[]
  isHydrated: boolean
  addToCart: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  increaseQty: (id: string) => void
  decreaseQty: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("cart")
    const nextCart = saved ? JSON.parse(saved) : []

    const timeoutId = window.setTimeout(() => {
      setCart(nextCart)
      setIsHydrated(true)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  // ✅ Save cart
  useEffect(() => {
    if (!isHydrated) {
      return
    }

    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart, isHydrated])

  const addToCart = (item: Omit<CartItem, "quantity">) => {

    setCart((prev) => {

      const existing = prev.find((i) => i.id === item.id)

      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }

      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  const increaseQty = (id: string) => {

    setCart((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    )
  }

  const decreaseQty = (id: string) => {

    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        isHydrated,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {

  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used inside CartProvider")
  }

  return context
}
