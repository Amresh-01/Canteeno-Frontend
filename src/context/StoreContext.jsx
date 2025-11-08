import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { food_list as localFoodList } from '../assets/frontend_assets/assets';
import { fetchRecommendations } from '../config/recommendationApi';
import { sendChatMessage, checkChatApiStatus } from '../config/chatApi';
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const url = "https://ajay-cafe-1.onrender.com";
  const [foodList, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const [userType, setUserType] = useState("user"); // "user" or "admin"

  // --- API Fetching ---

  // This is your correct function from the VAIBHAVSHUKLA branch
  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${url}/api/foods/allFoods`);
      if (response.data.success) {
        setFoodList(response.data.data);
      } else {
        console.error("Error fetching food list:", response.data.message);
        toast.error("Error fetching food list.");
      }
    } catch (error) {
      console.error("An error occurred while fetching the food list:", error);
      toast.error("Network error while fetching food.");
    }
  };

  // This is the cart loading function from the main branch
  const loadCardData = async (token) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        { headers: { token } }
      );
      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.error("Failed to load cart data", error);
      setCartItems({}); // Default to empty cart on error
    }
  };

  // --- Main data loading on component mount (Combined) ---

  useEffect(() => {
    async function loadData() {
      // We need to fetch the food list regardless of login
      await fetchFoodList(); // <-- This is now correctly called

      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        const savedUserType = localStorage.getItem("userType") || "user";
        setUserType(savedUserType);
        // Load user's cart only if they are logged in
        await loadCardData(storedToken);
      }
    }
    loadData();
  }, []);

  // --- Cart Helper Functions (from 'main', they are more robust) ---

  const getCartQuantity = (itemId) => {
    if (!cartItems[itemId]) return 0;
    // Supports both old format (number) and new format ({quantity: ...})
    if (typeof cartItems[itemId] === "number") {
      return cartItems[itemId];
    }
    return cartItems[itemId].quantity || 0;
  };

  const getCartNotes = (itemId) => {
    if (!cartItems[itemId]) return "";
    // Supports both old format (number) and new format ({quantity: ...})
    if (typeof cartItems[itemId] === "number") {
      return ""; // Old format had no notes
    }
    return cartItems[itemId].notes || "";
  };

  const updateCartNotes = (itemId, notes) => {
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (typeof currentItem === "number") {
        // Convert old format to new format
        return { ...prev, [itemId]: { quantity: currentItem, notes: notes } };
      }
      // Update notes for new format
      return { ...prev, [itemId]: { ...currentItem, notes: notes } };
    });
    // Note: You may want to add a backend API call here to sync notes
  };

  // --- Cart Management Functions (from 'main', with API sync) ---

  // This is the correct 'async' version from 'main'
  const addToCart = async (itemId, notes) => {
    // Robust local state update from 'main'
    setCartItems((prev) => {
      const currentItem = prev[itemId];

      if (!currentItem) {
        // Not in cart, add new
        return { ...prev, [itemId]: { quantity: 1, notes: notes || "" } };
      } else if (typeof currentItem === "number") {
        // Convert old format
        return {
          ...prev,
          [itemId]: { quantity: currentItem + 1, notes: notes || "" },
        };
      } else {
        // Already in new format, increment quantity
        const existingNotes = currentItem.notes || "";
        return {
          ...prev,
          [itemId]: {
            quantity: currentItem.quantity + 1,
            notes: notes !== undefined ? notes : existingNotes,
          },
        };
      }
    });

    // API sync from 'main'
    if (token) {
      try {
        const response = await axios.post(
          url + "/api/cart/add",
          { itemId },
          { headers: { token } }
        );
        if (response.data.success) {
          toast.success("Item Added to Cart");
        } else {
          toast.error(response.data.message || "Something went wrong");
        }
      } catch (error) {
        toast.error("Failed to update cart");
      }
    }
  };

  // This is the correct 'async' version from 'main'
  const removeFromCart = async (itemId) => { // <-- Added 'async'
    // Robust local state update from 'main'
    setCartItems((prev) => {
      const currentItem = prev[itemId];
      if (!currentItem) return prev;
      
      if (typeof currentItem === 'number') {
        const newQuantity = currentItem - 1;
        if (newQuantity <= 0) {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [itemId]: newQuantity };
      } else {
        const newQuantity = currentItem.quantity - 1;
        if (newQuantity <= 0) {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [itemId]: { ...currentItem, quantity: newQuantity } };
      }
    });

    // API sync from 'main'
    if (token) {
      try {
        const response = await axios.post(
          url + "/api/cart/remove",
          { itemId },
          { headers: { token } }
        );
        if (response.data.success) {
          toast.success("Item Removed from Cart");
        } else {
          toast.error(response.data.message || "Something went wrong");
        }
      } catch (error) {
        toast.error("Failed to update cart");
      }
    }
  };

  // --- Cart Total Functions (From 'VAIBHAVSHUKLA', but fixed) ---

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const itemId in cartItems) {
      if (cartItems.hasOwnProperty(itemId)) {
        const itemInfo = foodList.find((product) => product._id === itemId);
        if (itemInfo) {
          // FIXED: Use the helper function to get quantity
          totalAmount += itemInfo.price * getCartQuantity(itemId);
        }
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItems = 0;
    for (const itemId in cartItems) {
      if (cartItems.hasOwnProperty(itemId)) {
        // FIXED: Use the helper function to get quantity
        totalItems += getCartQuantity(itemId);
      }
    }
    return totalItems;
  };

  const contextValue = {
    url,
    food_list: foodList,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getCartQuantity,
    getCartNotes,
    updateCartNotes,
    token,
    setToken,
    userType,
    setUserType,
    fetchRecommendations,
    sendChatMessage,
    checkChatApiStatus,
    getTotalCartAmount,
    getTotalCartItems,
    loadCardData,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
