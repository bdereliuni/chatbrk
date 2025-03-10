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

  // Yeni chat ekranını aç
  const openNewChatScreen = () => {
    setActiveChatId(null); // Aktif chat ID'sini temizle
    setIsNewChat(true); // Yeni chat ekranını aç
    
    // Eğer mesaj dizisinde yeni sohbet için bir giriş yoksa, oluştur
    if (!chatMessages['new-chat']) {
      setChatMessages(prev => ({
        ...prev,
        'new-chat': [] // Yeni chat için boş mesaj dizisi
      }));
    }
    
    // Mobil görünümde chat'e tıklandığında sidebar'ı kapat
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  // Chat oluştur ve listeye ekle (ChatWindow'dan çağrılacak)
  const createChat = async () => {
    try {
      const newChatId = `chat-${Date.now()}`;
      const newChat = { 
        id: newChatId, 
        title: `Chat ${chats.length + 1}`,
        createdAt: new Date().toISOString()
      };

      // Kullanıcı kontrolü
      if (!user || !user.id) {
        console.error('Kullanıcı oturumu bulunamadı');
        return null;
      }

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
        return null;
      }

      // Yeni chati dizinin başına ekle (en üstte görünsün)
      setChats((prev) => [newChat, ...prev]);
      
      // Aktif chatId'yi güncelle ve yeni chat modunu kapat
      setActiveChatId(newChatId);
      setIsNewChat(false);
      
      // Eğer 'new-chat' için mesajlar varsa, yeni chatId'ye taşı
      if (chatMessages['new-chat'] && chatMessages['new-chat'].length > 0) {
        setChatMessages(prev => {
          const { ['new-chat']: newChatMessages, ...rest } = prev;
          return {
            ...rest,
            [newChatId]: newChatMessages || []
          };
        });
      } else {
        // Yeni chat için boş bir mesaj dizisi oluştur
        setChatMessages(prev => ({
          ...prev,
          [newChatId]: []
        }));
      }
      
      return newChatId;
    } catch (error) {
      console.error('Chat oluşturma hatası:', error);
      return null;
    }
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
    // Eğer zaten seçili olan chatId'ye tıklandıysa, bir şey yapma
    if (chatId === activeChatId && !isNewChat) {
      return;
    }
    
    // Önceden yeni sohbet modundaysak ve mesaj varsa
    if (isNewChat && chatMessages['new-chat'] && chatMessages['new-chat'].length > 0) {
      // Önce yeni bir chat oluştur ve mesajları taşı
      createChat().then(() => {
        // Yeni chat oluşturulduktan sonra kullanıcının seçtiği chate geç
        setActiveChatId(chatId);
        setIsNewChat(false);
      });
    } else {
      // Direkt olarak seçilen chat'e geç
      setActiveChatId(chatId);
      setIsNewChat(false);
    }
    
    // Mobil görünümde chat'e tıklandığında sidebar'ı kapat
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Header toggleSidebar={toggleSidebar} selectedModel={selectedModel} onModelSelect={setSelectedModel} isLoggedIn={!!user} />
      <div className="dashboard-content">
        <Sidebar 
          chats={chats}
          activeChatId={activeChatId}
          onChatSelect={handleSetActiveChat}
          onNewChat={openNewChatScreen}
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
        <div className="main-content">
          {activeChatId || isNewChat ? (
            <ChatWindow 
              activeChatId={activeChatId}
              isNewChat={isNewChat}
              createChat={createChat}
              messages={isNewChat ? (chatMessages['new-chat'] || []) : (chatMessages[activeChatId] || [])}
              updateMessages={updateMessages}
              sendMessage={handleSendMessage}
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
            />
          ) : (
            <div className="no-chat-selected">
              <div className="welcome-content">
                <div className="neon-logo-container">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="neon-logo">
                    <g>
                      <path className="neon-path" d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="#4A6CFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>
                <h1>ChatBurak'a Hoş Geldiniz!</h1>
                <p>Yapay Zeka teknolojisinin gücüyle sohbet etmeye hemen başlayın. Sol taraftan önceki sohbetlerinizi seçebilir veya yeni bir sohbet başlatabilirsiniz.</p>
                <div className="welcome-features">
                  <div className="welcome-feature">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 17H12.01" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Akıllı Yapay Zeka Yanıtları</span>
                  </div>
                  <div className="welcome-feature">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 11V17" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 11V17" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Sohbet Geçmişini Saklayın</span>
                  </div>
                  <div className="welcome-feature">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.59 13.51L15.42 17.49" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15.41 6.51L8.59 10.49" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Birden Fazla Model Desteği</span>
                  </div>
                </div>
                <button 
                  className="new-chat-btn-center" 
                  onClick={openNewChatScreen}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Yeni Sohbet Başlat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;