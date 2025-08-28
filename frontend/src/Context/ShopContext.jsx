import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index <= 300; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());

  // 🔹 Fetch all products + user cart (if logged in)
useEffect(() => {
  // sab products fetch
  fetch("http://localhost:4000/allproducts")
    .then((response) => response.json())
    .then((data) => setAll_Product(data));

  // user cart fetch if logged in
  if (localStorage.getItem("auth-token")) {
    fetch("http://localhost:4000/getcart", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "auth-token": localStorage.getItem("auth-token"),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched Cart:", data);
        setCartItems(data.cartData || getDefaultCart());
      })
      .catch((err) => console.error("GetCart Error:", err));
  }
}, []);


// 🔹 Add item to cart
const addToCart = (itemId) => {
  const id = String(itemId); // ✅ force string

  if (!localStorage.getItem("auth-token")) {
    setCartItems((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    return;
  }

  fetch("http://localhost:4000/addtocart", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "auth-token": localStorage.getItem("auth-token"),
    },
    body: JSON.stringify({ itemId: id }),  // ✅ backend ko bhi string bhej
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("AddToCart Response:", data);
      if (data.success) {
        setCartItems(data.cartData); // backend se sync
      }
    })
    .catch((err) => console.error("AddToCart Error:", err));
};

// 🔹 Remove item from cart
const removeFromCart = (itemId) => {
  const id = String(itemId); // ✅ force string

  if (!localStorage.getItem("auth-token")) {
    setCartItems((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0),
    }));
    return;
  }

  fetch("http://localhost:4000/removefromcart", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "auth-token": localStorage.getItem("auth-token"),
    },
    body: JSON.stringify({ itemId: id }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("RemoveFromCart Response:", data);
      if (data.success) {
        setCartItems(data.cartData);
      }
    })
    .catch((err) => console.error("RemoveFromCart Error:", err));
};


  // 🔹 Total cart amount
  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = all_product.find(
          (product) => product.id === Number(item)
        );
        if (itemInfo) {
          totalAmount += itemInfo.new_price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  // 🔹 Total items count
  const getTotalCartItems = () => {
    let totalItems = 0;
    for (const item in cartItems) {
      totalItems += cartItems[item];
    }
    return totalItems;
  };

  const contextValue = {
    getTotalCartAmount,
    getTotalCartItems,
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
