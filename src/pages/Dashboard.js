import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase'; // Supabase istemcisini import et
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ModelSelector from '../components/ModelSelector';
import api from '../services/api'; // API modülünü import ediyoruz
import '../styles.css';

const Dashboard = () => {
  const [chats, setChats] = useState([]); // Chat listesi
  const [activeChatId, setActiveChatId] = useState(null); // Aktif chat ID'si
  const [isNewChat, setIsNewChat] = useState(true); // Yeni chat ekranı açık mı? - Başlangıçta true olarak ayarlandı
  const [chatMessages, setChatMessages] = useState({}); // Her chat için mesajlar
  const [user, setUser] = useState(null); // Şu anki kullanıcı
  const [selectedModel, setSelectedModel] = useState('claude3-sonnet'); // Seçili model

  // Kullanıcıyı ve chat'leri yükle
  useEffect(() => {
    const fetchUserAndChats = async () => {
      // Kullanıcı oturumunu al
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);

        // Kullanıcıya ait chat'leri yükle
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', session.user.id);

        if (chatsError) {
          console.error('Chatler yüklenemedi:', chatsError);
          return;
        }

        if (chatsData && chatsData.length > 0) {
          setChats(chatsData.map(chat => ({
            id: chat.chat_id,
            title: chat.title,
          })));

          // Chat varsa, yeni chat ekranını kapat
          setIsNewChat(false);

          // Her chat için mesajları yükle
          const chatIds = chatsData.map(chat => chat.chat_id);
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .in('chat_id', chatIds);

          if (messagesError) {
            console.error('Mesajlar yüklenemedi:', messagesError);
            return;
          }

          const messagesByChat = {};
          messagesData.forEach(msg => {
            if (!messagesByChat[msg.chat_id]) {
              messagesByChat[msg.chat_id] = [];
            }
            messagesByChat[msg.chat_id].push({
              id: msg.id,
              content: msg.content,
              sender: msg.sender,
            });
          });

          setChatMessages(messagesByChat);
        }
      } else {
        // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
        window.location.href = '/login';
      }
    };

    fetchUserAndChats();
  }, []);

  // Yeni chat ekranını aç (boş bir ekran)
  const openNewChatScreen = () => {
    setActiveChatId(null);
    setIsNewChat(true);
  };

  // Chat oluştur ve listeye ekle (ChatWindow'dan çağrılacak)
  const createChat = async () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat = { id: newChatId, title: `Chat ${chats.length + 1}` };

    // Supabase'e chat'i kaydet
    const { error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        chat_id: newChatId,
        title: newChat.title,
      });

    if (error) {
      console.error('Chat kaydedilemedi:', error);
      return;
    }

    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChatId);
    setIsNewChat(false);
    return newChatId;
  };

  // Bir mesaj gönder ve cevap al
  const updateMessages = async (chatId, updatedMessages) => {
    setChatMessages(prev => ({
      ...prev,
      [chatId]: updatedMessages
    }));

    // Supabase'e mesajları kaydet
    const lastMessage = updatedMessages[updatedMessages.length - 1];
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: user.id,
        content: lastMessage.content,
        sender: lastMessage.sender,
      });

    if (error) {
      console.error('Mesaj kaydedilemedi:', error);
    }
  };

  // Mesaj gönderme için ChatWindow'a geçirilen prop
  const handleSendMessage = async (chatId, messageContent) => {
    // Bu fonksiyon ChatWindow içinde çağrılır ve mesajı gönderir
    const response = await api.sendMessage(chatId, messageContent, selectedModel);
    return response;
  };

  return (
    <div className="dashboard-page">
      <Header isLoggedIn={!!user} />
      <div className="dashboard-content">
        <Sidebar
          chats={[...chats].reverse()} // En yeni chatler başta olacak şekilde sıralama
          setActiveChat={(chatId) => {
            setActiveChatId(chatId);
            setIsNewChat(false);
          }}
          createNewChat={openNewChatScreen}
        />
        <div className="main-content">
          <ModelSelector 
            selectedModel={selectedModel} 
            onModelSelect={setSelectedModel} 
          />
          <ChatWindow
            activeChatId={activeChatId}
            createChat={createChat}
            isNewChat={isNewChat}
            messages={chatMessages[activeChatId] || []}
            updateMessages={updateMessages}
            sendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;