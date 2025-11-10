import axios from "axios";

// Use proxy in development to avoid CORS issues
const CHAT_API_BASE_URL = import.meta.env.DEV 
  ? "/api/chat"  // Use Vite proxy in development
  : (import.meta.env.VITE_CHAT_BASE || "https://canteen-recommendation-system.onrender.com");  // Direct URL in production

// ---- Lightweight local fallback for development or API downtime ----
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
const useRemoteChatInDev = typeof import.meta !== 'undefined'
  ? String(import.meta.env?.VITE_USE_REMOTE_CHAT || 'false').toLowerCase() === 'true'
  : false;
const BACKEND_URL = "https://ajay-cafe-1.onrender.com";

const normalize = (s = "") =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const fetchMenuForFallback = async () => {
  try {
    const url = `${BACKEND_URL}/api/menu/getMenu`;
    const res = await axios.get(url, { withCredentials: false });
    return Array.isArray(res.data) ? res.data : res.data?.data || [];
  } catch (_e) {
    return [];
  }
};

const tryLocalChatFallback = async (userText) => {
  const text = normalize(userText);
  const menu = await fetchMenuForFallback();
  if (!menu || menu.length === 0) return null;

  // Build quick lookup by normalized name
  const byName = new Map();
  for (const item of menu) {
    const nm = normalize(item?.name || item?.item_name || "");
    if (nm) byName.set(nm, item);
  }

  // Heuristics: price queries
  if (text.includes("price") || text.includes("cost") || text.includes("rate")) {
    // find the item name by best token overlap
    let best = null;
    let bestScore = -1;
    for (const [nm, it] of byName.entries()) {
      const words = nm.split(" ");
      let score = 0;
      for (const w of words) {
        if (w && text.includes(w)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        best = it;
      }
    }
    if (best && bestScore > 0) {
      const name = best?.name || best?.item_name || "that item";
      const price = best?.price != null ? `₹${best.price}` : "currently unavailable";
      return `The price of ${name} is ${price}.`;
    }
  }

  // Recommend a few items
  if (text.includes("recommend") || text.includes("suggest") || text.includes("popular") || text.includes("best")) {
    const picks = menu.slice(0, 3).map(it => it?.name || it?.item_name).filter(Boolean);
    if (picks.length > 0) {
      return `Here are a few popular picks: ${picks.join(", ")}.`;
    }
  }

  // Generic menu response
  if (text.includes("menu") || text.includes("items") || text.includes("food")) {
    const picks = menu.slice(0, 5).map(it => it?.name || it?.item_name).filter(Boolean);
    if (picks.length > 0) {
      return `We have items like ${picks.join(", ")}. Ask me for the price of any item.`;
    }
  }

  return "I couldn't reach the chat service right now, but you can ask me about item prices or recommendations from the menu.";
};

export const sendChatMessage = async ({ new_message, history = [] } = {}) => {
  try {
    if (!new_message || new_message.trim() === "") {
      throw new Error("new_message is required");
    }
    // In development, use local fallback by default to avoid 404/CORS errors.
    // Set VITE_USE_REMOTE_CHAT=true to force real API calls during dev.
    if (isDev && !useRemoteChatInDev) {
      const synthetic = await tryLocalChatFallback(new_message);
      return {
        success: true,
        data: { reply: synthetic, source: "local-fallback" },
      };
    }

    const requestBody = {
      history: history || [],
      new_message: new_message.trim()
    };

    // Try multiple known endpoint shapes to improve robustness across environments
    const candidatePaths = import.meta.env.DEV
      ? [`${CHAT_API_BASE_URL}/chat`, `${CHAT_API_BASE_URL}`]
      : [`${CHAT_API_BASE_URL}/chat/chat`, `${CHAT_API_BASE_URL}/chat`, `${CHAT_API_BASE_URL}`];

    let lastError = null;
    for (const url of candidatePaths) {
      try {
        console.log('💬 [Chat API] Attempting request to:', url);
        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          withCredentials: false,
        });
        console.log('📥 [Chat API] Response status:', response.status);
        console.log('📥 [Chat API] Response data:', response.data);
        return {
          success: true,
          data: response.data,
        };
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        console.warn(`⚠️ [Chat API] Attempt to ${url} failed (${status || err.message}). Trying next shape...`);
        // If network error or 404/405/500, try next candidate
        continue;
      }
    }

    // If all attempts failed, throw last error to be handled below
    throw lastError || new Error('All chat API endpoint attempts failed');
  } catch (error) {
    console.error("❌ [Chat API] Error sending message:", error);
    console.error("❌ [Chat API] Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url
    });

    let errorMessage = "Failed to send message";

    // DEV/Downtime fallback: synthesize a useful answer from menu
    try {
      const synthetic = await tryLocalChatFallback(new_message);
      if (synthetic) {
        return {
          success: true,
          data: { reply: synthetic, source: "local-fallback" },
        };
      }
    } catch (_e) {
      // ignore fallback error, proceed to detailed error mapping
    }

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      console.error(`❌ [Chat API] HTTP Error ${status}:`, responseData);

      switch (status) {
        case 400:
          errorMessage = responseData?.message || "Invalid request. Please check your message.";
          break;
        case 405:
          const allowedMethods = error.response?.headers?.['allow'] || error.response?.headers?.['Allow'];
          if (allowedMethods && !allowedMethods.includes('OPTIONS')) {
            errorMessage = "CORS Error: The server doesn't allow OPTIONS requests. The backend needs to handle CORS preflight requests.";
          } else {
            errorMessage = "Method not allowed. Please check the API endpoint.";
          }
          break;
        case 422:
          const validationErrors = responseData?.detail;
          if (validationErrors && Array.isArray(validationErrors)) {
            const errorDetails = validationErrors.map(err => err.msg).join(', ');
            errorMessage = `Validation error: ${errorDetails}`;
          } else {
            errorMessage = responseData?.message || "Invalid request format. Please check your input.";
          }
          break;
        case 502:
          errorMessage = "Chat service is temporarily unavailable. Please try again later.";
          break;
        case 503:
          errorMessage = "Chat service is currently under maintenance.";
          break;
        case 500:
          errorMessage = "Internal server error. Please try again later.";
          break;
        case 404:
          errorMessage = "Chat endpoint not found.";
          break;
        default:
          errorMessage = responseData?.message || `Server error (${status}). Please try again.`;
      }
    } else if (error.request) {
      console.error("❌ [Chat API] No response received. Network error or CORS issue.");
      console.error("❌ [Chat API] Request details:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
      
      if (error.message && (
        error.message.includes('CORS') || 
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch')
      )) {
        const errorString = JSON.stringify(error);
        if (errorString.includes('preflight') || errorString.includes('Redirect is not allowed')) {
          errorMessage = "CORS Error: The server is redirecting the preflight request, which is not allowed. The backend must handle OPTIONS requests without redirecting and return proper CORS headers.";
        } else if (errorString.includes('Access-Control-Allow-Origin')) {
          errorMessage = "CORS Error: The chat service is not allowing requests from this origin. The backend needs to include 'http://localhost:5173' in Access-Control-Allow-Origin header.";
        } else {
          errorMessage = "CORS error: The chat service is not allowing requests from this origin. Please check backend CORS configuration.";
        }
      } else {
        errorMessage = "Unable to connect to chat service. This could be a network issue or CORS configuration problem. Please check your internet connection and backend CORS settings.";
      }
    } else {
      console.error("❌ [Chat API] Request setup error:", error.message);
      errorMessage = error.message || "An unexpected error occurred.";
    }

    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  }
};

export const checkChatApiStatus = async () => {
  try {
    const statusUrl = import.meta.env.DEV 
      ? `${CHAT_API_BASE_URL}/`  // Proxy path
      : `${CHAT_API_BASE_URL}/chat/`;  // Direct path
    const response = await axios.get(statusUrl, {
      headers: {
        'accept': 'application/json'
      },
      withCredentials: false,
    });

    return {
      success: true,
      data: response.data,
      available: true
    };
  } catch (error) {
    console.error("❌ [Chat API] Status check failed:", error);
    return {
      success: false,
      error: error.message || "Unable to check API status",
      available: false
    };
  }
};

export const convertToApiHistory = (messages) => {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
};

export const convertFromApiHistory = (apiHistory) => {
  return apiHistory.map(msg => ({
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: msg.parts?.[0]?.text || '',
    timestamp: new Date()
  }));
};

