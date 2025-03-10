import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://bdere-api.foreverplayerstudios.workers.dev', // Ya da deploy ettiğin URL
  headers: {
    'Content-Type': 'application/json',
    // Gerekirse diğer headers'ları ekleyebilirsin (örneğin, cookies)
  },
});

/**
 * Preprocesses API response to properly handle markdown formatting
 * Converts escaped newlines to actual newlines and ensures proper markdown formatting
 */
const preprocessResponse = (text) => {
  if (!text) return '';

  // Step 1: Replace literal \n with actual newlines
  let processed = text.replace(/\\n/g, '\n');
  
  // If no changes were made but text contains literal '\n', try another approach
  // This is a fallback in case the API returns already JSON.stringified content
  if (text.includes('\\n') && processed === text) {
    try {
      // Try parsing as JSON string (handles double escaping)
      const parsed = JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
      processed = parsed;
    } catch (e) {
      // If parsing fails, continue with the original text
      console.warn('Failed to parse response text:', e);
    }
  }

  return processed;
};

export const sendMessage = async (chatId, messageContent, modelId = 'claude3-sonnet') => {
  try {
    // chatId için varsayılan değeri kaldırıldı, böylece gerçek chat ID'leri her zaman kullanılacak
    const url = `/${chatId}/${modelId}`;
    const response = await apiClient.post(url, {
      messageContent, // API'nin beklediği format
    });
    
    // Process the response if it exists
    if (response.data && response.data.response) {
      response.data.response = preprocessResponse(response.data.response);
    }
    
    return response.data; // API'den gelen yanıtı döndür
  } catch (error) {
    console.error('API isteği başarısız:', error);
    throw error;
  }
};

export default { sendMessage };