import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://bdere-api.foreverplayerstudios.workers.dev', // Ya da deploy ettiğin URL
  headers: {
    'Content-Type': 'application/json',
    // Gerekirse diğer headers'ları ekleyebilirsin (örneğin, cookies)
  },
});

export const sendMessage = async (chatId, messageContent, modelId = 'claude3-sonnet') => {
  try {
    // chatId için varsayılan değeri kaldırıldı, böylece gerçek chat ID'leri her zaman kullanılacak
    const url = `/${chatId}/${modelId}`;
    const response = await apiClient.post(url, {
      messageContent, // API'nin beklediği format
    });
    return response.data; // API'den gelen yanıtı döndür
  } catch (error) {
    console.error('API isteği başarısız:', error);
    throw error;
  }
};

export default { sendMessage };