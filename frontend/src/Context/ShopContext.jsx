import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const BACKEND_URL = "https://e-comm-backend-viqg.onrender.com";

// Default empty cart for guests
const getDefaultCart = () => {
  const cart = {};
  return cart;
};

const ShopContextProvider = ({ children }) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Fetch all products and user cart
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all products
        const productsRes = await fetch(`${BACKEND_URL}/allproducts`);
        const productsData = await productsRes.json();
        setAll_Product(productsData);

        // Fetch user cart if logged in
        const authToken = localStorage.getItem("auth-token");
        if (authToken) {
          const cartRes = await fetch(`${BACKEND_URL}/getcart`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
          });
          const cartData = await cartRes.json();
          setCartItems(cartData.cartData || getDefaultCart());
        } else {
          // Load guest cart from localStorage
          const guestCart = JSON.parse(localStorage.getItem("guest-cart")) || getDefaultCart();
          setCartItems(guestCart);
        }
      } catch (err) {
        console.error("ShopContext Fetch Error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 Persist guest cart to localStorage
  useEffect(() => {
    if (!localStorage.getItem("auth-token")) {
      localStorage.setItem("guest-cart", JSON.stringify(cartItems));
    }
  }, [cartItems]);

  // 🔹 Add item to cart
  const addToCart = async (itemId) => {
    const id = String(itemId);

    if (!localStorage.getItem("auth-token")) {
      setCartItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/addtocart`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("auth-token"),
        },
        body: JSON.stringify({ itemId: id }),
      });
      const data = await res.json();
      if (data.success) setCartItems(data.cartData);
    } catch (err) {
      console.error("AddToCart Error:", err);
    }
  };

  // 🔹 Remove item from cart
  const removeFromCart = async (itemId) => {
    const id = String(itemId);

    if (!localStorage.getItem("auth-token")) {
      setCartItems((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/removefromcart`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("auth-token"),
        },
        body: JSON.stringify({ itemId: id }),
      });
      const data = await res.json();
      if (data.success) setCartItems(data.cartData);
    } catch (err) {
      console.error("RemoveFromCart Error:", err);
    }
  };

  // 🔹 Total cart amount
  const getTotalCartAmount = () => {
    return Object.entries(cartItems).reduce((total, [item, qty]) => {
      const itemInfo = all_product.find((p) => p.id === Number(item));
      if (itemInfo) total += Number(itemInfo.new_price) * qty;
      return total;
    }, 0);
  };

  // 🔹 Total items count
  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((total, qty) => total + qty, 0);
  };

  const contextValue = {
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
    loading,
    error,
  };

  return <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
