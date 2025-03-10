import React, { useState, useEffect } from 'react';
import '../styles.css';

const Sidebar = ({ chats, onChatSelect, onNewChat, activeChatId, isOpen, toggleSidebar }) => {
  const [selectedChat, setSelectedChat] = useState(null);

  // Aktif chat değiştiğinde seçili chat'i güncelle
  useEffect(() => {
    if (activeChatId) {
      setSelectedChat(activeChatId);
    }
  }, [activeChatId]);

  // Aktif chat değiştiğinde kaydırma çubuğunu otomatik pozisyona ayarla
  useEffect(() => {
    if (selectedChat) {
      const selectedElement = document.getElementById(`chat-${selectedChat}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedChat]);

  const handleChatClick = (chatId) => {
    setSelectedChat(chatId);
    onChatSelect(chatId);
  };

  return (
    <>
      {/* Overlay - Mobil görünümde sidebar açıkken gösterilir */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={toggleSidebar}
      ></div>
    
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Sohbetler</h2>
        </div>
        <button 
          className="new-chat-btn" 
          onClick={onNewChat}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Yeni Sohbet
        </button>
        <div className="chats-container">
          {chats && chats.length > 0 ? (
            <div className="chat-list">
              {chats.map((chat) => (
                <div 
                  key={chat.id}
                  id={`chat-${chat.id}`}
                  className={`chat-item ${chat.id === selectedChat ? 'selected' : ''}`}
                  onClick={() => handleChatClick(chat.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span title={chat.title}>{chat.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-chats">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>Henüz sohbet yok.</p>
              <p>Yeni bir sohbet başlatmak için "Yeni Sohbet" butonuna tıklayın.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;