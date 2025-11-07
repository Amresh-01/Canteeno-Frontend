import axios from "axios";

const RECOMMENDATION_API_BASE_URL = "https://canteen-recommendation-system.onrender.com";

export const fetchRecommendations = async ({ user_id, top_n = 5, window_days = null } = {}) => {
  try {
    if (!user_id) {
      throw new Error("user_id is required");
    }

    if (top_n < 1 || top_n > 50) {
      throw new Error("top_n must be between 1 and 50");
    }

    const params = new URLSearchParams();
    params.append("top_n", top_n.toString());
    
    if (window_days !== null && window_days !== undefined) {
      if (window_days < 1) {
        throw new Error("window_days must be at least 1");
      }
      params.append("window_days", window_days.toString());
    }

    const fullUrl = `${RECOMMENDATION_API_BASE_URL}/recommend/recommend/user/${user_id}?${params.toString()}`;
    console.log('🌐 [API] Making request to:', fullUrl);
    console.log('📤 [API] Request params:', { user_id, top_n, window_days });
    
    const response = await axios.get(fullUrl);
    
    console.log('📥 [API] Response status:', response.status);
    console.log('📥 [API] Response data:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ [API] Error fetching recommendations:", error);
    console.error("❌ [API] Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url
    });
    
    let errorMessage = "Failed to fetch recommendations";
    
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      console.error(`❌ [API] HTTP Error ${status}:`, responseData);
      
      switch (status) {
        case 502:
          errorMessage = "Recommendation service is temporarily unavailable. Please try again later.";
          break;
        case 503:
          errorMessage = "Recommendation service is currently under maintenance.";
          break;
        case 500:
          errorMessage = "Internal server error. Please try again later.";
          break;
        case 404:
          errorMessage = "Recommendation endpoint not found.";
          break;
        default:
          errorMessage = responseData?.message || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      console.error("❌ [API] No response received. Network error or CORS issue.");
      errorMessage = "Unable to connect to recommendation service. Please check your internet connection.";
    } else {
      console.error("❌ [API] Request setup error:", error.message);
      errorMessage = error.message || "An unexpected error occurred.";
    }
    
    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  }
};

export const getPopularItems = async (user_id, top_n = 5, window_days = null) => {
  return await fetchRecommendations({ user_id, top_n, window_days });
};

