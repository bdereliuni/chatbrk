import { createClient } from '@supabase/supabase-js';

// Supabase proje bilgileri
const SUPABASE_URL = 'https://isyhbedzdoxytiytbjnf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeWhiZWR6ZG94eXRpeXRiam5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1MzIzMTcsImV4cCI6MjA1NzEwODMxN30.WAdX9_BN9hkAF9JJ4yt40RvSKhGaleul0a0XlBXUt24';

// Supabase istemcisini oluştur
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Örnek fonksiyon: Kullanıcı oturumunu kontrol et
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Oturum alınamadı:', error);
    return null;
  }
  return data.session;
};

// Örnek fonksiyon: Chatleri kaydetmek için
export const saveChat = async (userId, chatId, title) => {
  const { data, error } = await supabase
    .from('chats')
    .insert([{ user_id: userId, chat_id: chatId, title }]);
  if (error) {
    console.error('Chat kaydedilemedi:', error);
    throw error;
  }
  return data;
};

export default supabase;