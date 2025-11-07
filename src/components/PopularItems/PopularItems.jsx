import React, { useState, useEffect, useContext } from "react";
import "./PopularItems.css";
import { StoreContext } from "../../context/StoreContext";
import { fetchRecommendations } from "../../config/recommendationApi";

const PopularItems = ({ top_n = 5, window_days = null }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { food_list, addToCart } = useContext(StoreContext);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchRecommendations({ top_n, window_days });
        
        if (result.success && result.data) {
          setRecommendations(result.data.recommendations || []);
        } else {
          setError(result.error || "Failed to load recommendations");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [top_n, window_days]);

  const getFoodItemDetails = (itemName) => {
    return food_list.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase()
    );
  };

  const handleAddToCart = (itemName) => {
    const foodItem = getFoodItemDetails(itemName);
    if (foodItem && foodItem._id) {
      addToCart(foodItem._id);
    } else {
      console.warn(`Food item "${itemName}" not found in food list`);
    }
  };

  if (loading) {
    return (
      <div className="popular-items-section">
        <h2>Popular Items</h2>
        <div className="loading">Loading popular items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="popular-items-section">
        <h2>Popular Items</h2>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="popular-items-section">
      <div className="popular-items-header">
        <h2>🔥 Popular Items</h2>
        <p className="popular-items-subtitle">
          Most ordered items {window_days ? `in the last ${window_days} days` : "recently"}
        </p>
      </div>
      <div className="popular-items-list">
        {recommendations.map((item, index) => {
          const foodItem = getFoodItemDetails(item.item_name);
          return (
            <div key={index} className="popular-item-card">
              <div className="popular-item-info">
                <div className="popular-item-rank">#{index + 1}</div>
                <div className="popular-item-details">
                  <h3 className="popular-item-name">{item.item_name}</h3>
                  <p className="popular-item-orders">
                    {item.order_count} {item.order_count === 1 ? "order" : "orders"}
                  </p>
                  {foodItem && (
                    <p className="popular-item-price">₹{foodItem.price}</p>
                  )}
                </div>
              </div>
              {foodItem && foodItem._id && (
                <button
                  className="popular-item-add-btn"
                  onClick={() => handleAddToCart(item.item_name)}
                >
                  Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PopularItems;

