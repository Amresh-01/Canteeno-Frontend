import React, { useState, useContext, useEffect, useCallback } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import SearchBar from '../../components/SearchBar/SearchBar'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import SpecialDishofTheDay from '../../components/SpecialDishofTheDay/SpecialDishofTheDay'
import AppDownload from '../../components/AppDownload/AppDownload'
import { useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import { assets } from '../../assets/frontend_assets/assets'
import { fetchRecommendations } from '../../config/recommendationApi'

const Home = () => {
  const [category,setCategory]=useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState(null);
  const { getTotalCartItems, food_list, addToCart, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  const getUserIdFromToken = () => {
    if (!token) {
      console.log('🔍 [Token] No token found');
      return null;
    }
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('🔍 [Token] Decoded token payload:', payload);
        
        const userId = payload.userId || payload.user_id || payload.id || payload._id || null;
        console.log('🔍 [Token] Extracted user_id:', userId);
        console.log('🔍 [Token] Available fields in payload:', Object.keys(payload));
        
        return userId;
      } else {
        console.warn('⚠️ [Token] Token format invalid. Expected 3 parts, got:', parts.length);
      }
    } catch (error) {
      console.error('❌ [Token] Error decoding token:', error);
    }
    return null;
  };
  
  useEffect(() => {
    if (location.pathname === '/') {
      if (location.state?.resetCategory || location.search.includes('reset=')) {
        setCategory("All");
        setSearchQuery("");
      }
    }
  }, [location.pathname, location.state, location.search]);
  
  useEffect(() => {
    setCategory("All");
    setSearchQuery("");
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    setRecommendationError(null);
    
    const user_id = getUserIdFromToken();
    console.log('🔍 [Recommendations] Checking user_id from token:', user_id);
    console.log('🔍 [Recommendations] Token exists:', !!token);
    
    if (!user_id) {
      console.warn('⚠️ [Recommendations] No user_id found. User must be logged in.');
      setRecommendationError('Please login to view recommendations');
      setLoadingRecommendations(false);
      return;
    }
    
    console.log('🚀 [Recommendations] Fetching recommendations for user_id:', user_id);
    const apiUrl = `https://canteen-recommendation-system.onrender.com/recommend/recommend/user/${user_id}?top_n=5`;
    console.log('🌐 [Recommendations] API URL:', apiUrl);
    
    try {
      const result = await fetchRecommendations({ 
        user_id: user_id,
        top_n: 5, 
        window_days: null 
      });
      
      console.log('📦 [Recommendations] API Response:', result);
      
      if (result.success && result.data) {
        console.log('✅ [Recommendations] Success! Received', result.data.recommendations?.length || 0, 'recommendations');
        console.log('📋 [Recommendations] Data:', result.data);
        setRecommendations(result.data.recommendations || []);
        setRecommendationError(null);
      } else {
        console.error('❌ [Recommendations] API Error:', result.error);
        setRecommendationError(result.error || 'Failed to load recommendations');
        setRecommendations([]);
      }
    } catch (error) {
      console.error('💥 [Recommendations] Exception:', error);
      setRecommendationError('Unable to connect to recommendation service. Please try again later.');
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadRecommendations();
    } else {
      setRecommendationError('Please login to view recommendations');
      setLoadingRecommendations(false);
    }
  }, [token, loadRecommendations]);

  const getFoodItemDetails = (itemName) => {
    return food_list.find(
      (item) => item.name.toLowerCase() === itemName.toLowerCase()
    );
  };

  const handleAddToCart = (itemName) => {
    const foodItem = getFoodItemDetails(itemName);
    if (foodItem && foodItem._id) {
      addToCart(foodItem._id);
    }
  };
  
  return (
    <div>
      <Header/>
      <ExploreMenu category={category} setCategory={setCategory} />
      <SearchBar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        category={category}
        setCategory={setCategory}
      />
      <SpecialDishofTheDay />
      
      <div className="popular-items-section">
        <div className="popular-items-header">
          <h2>🔥 Popular Items</h2>
          <p className="popular-items-subtitle">Most ordered items recently</p>
        </div>
        {!token ? (
          <div className="recommendation-error">
            <p className="error-message">
              Please <strong>Sign In</strong> to view personalized recommendations
            </p>
            <p className="error-submessage">
              Login to see the most popular items based on your preferences
            </p>
          </div>
        ) : loadingRecommendations ? (
          <div className="loading">Loading popular items...</div>
        ) : recommendationError ? (
          <div className="recommendation-error">
            <p className="error-message">{recommendationError}</p>
            {recommendationError.includes('login') ? (
              <p className="error-submessage">
                Make sure you are logged in and try again
              </p>
            ) : (
              <button 
                className="retry-btn" 
                onClick={loadRecommendations}
              >
                Retry
              </button>
            )}
          </div>
        ) : recommendations.length > 0 ? (
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
        ) : (
          <div className="recommendation-error">
            <p className="error-message">No recommendations available at the moment</p>
            <button 
              className="retry-btn" 
              onClick={loadRecommendations}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <FoodDisplay category={category} searchQuery={searchQuery}/>
      <AppDownload/>
      
      {getTotalCartItems() > 0 && (
        <div className="floating-cart-icon" onClick={() => navigate('/cart')}>
          <img src={assets.basket_icon} alt="Cart" />
          <span className="cart-badge">{getTotalCartItems()}</span>
        </div>
      )}
    </div>
  )
}

export default Home
