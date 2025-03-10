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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobil görünümde sidebar durumu

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
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }); // En son oluşturulan chatleri önce getir (id yerine created_at)

        if (chatsError) {
          console.error('Chatler yüklenemedi:', chatsError);
          return;
        }

        if (chatsData && chatsData.length > 0) {
          setChats(chatsData.map(chat => ({
            id: chat.chat_id,
            title: chat.title,
            createdAt: chat.created_at
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

    // Pencere boyutu değiştiğinde sidebar'ı kontrol et
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Yeni chat ekranını aç (boş bir ekran)
  const openNewChatScreen = () => {
    setActiveChatId(null);
    setIsNewChat(true);
    // Mobil görünümde chat'e tıklandığında sidebar'ı kapat
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Chat oluştur ve listeye ekle (ChatWindow'dan çağrılacak)
  const createChat = async () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat = { 
      id: newChatId, 
      title: `Chat ${chats.length + 1}`,
      createdAt: new Date().toISOString()
    };

    // Supabase'e chat'i kaydet
    const { error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        chat_id: newChatId,
        title: newChat.title,
        created_at: newChat.createdAt
      });

    if (error) {
      console.error('Chat kaydedilemedi:', error);
      return;
    }

    // Yeni chati dizinin başına ekle (en üstte görünsün)
    setChats((prev) => [newChat, ...prev]);
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

  // Sidebar'ı aç/kapat
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Chat seçildiğinde tetiklenen fonksiyon
  const handleSetActiveChat = (chatId) => {
    setActiveChatId(chatId);
    setIsNewChat(false);
    // Mobil görünümde chat'e tıklandığında sidebar'ı kapat
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Header isLoggedIn={!!user} toggleSidebar={toggleSidebar} />
      
      {/* Overlay - Mobil görünümde sidebar açıkken gösterilir */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      
      <div className="dashboard-content">
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <Sidebar
            chats={chats} // Chatleri olduğu gibi geçiyoruz, artık reverse() yapmaya gerek yok
            setActiveChat={handleSetActiveChat}
            createNewChat={openNewChatScreen}
            activeChatId={activeChatId} // Aktif chat ID'sini Sidebar'a iletiyoruz
          />
        </div>
        
        <div className="main-content">
          <ChatWindow
            activeChatId={activeChatId}
            createChat={createChat}
            isNewChat={isNewChat}
            messages={chatMessages[activeChatId] || []}
            updateMessages={updateMessages}
            sendMessage={handleSendMessage}
            selectedModel={selectedModel}
            onModelSelect={setSelectedModel}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;