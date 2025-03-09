import React, { useState } from 'react';
import '../styles.css';

const Sidebar = ({ chats, setActiveChat, createNewChat }) => {
  const [selectedChat, setSelectedChat] = useState(null);

  const handleChatClick = (chatId) => {
    setSelectedChat(chatId);
    setActiveChat(chatId);
  };

  return (
    <div className="sidebar">
      <button className="new-chat-btn" onClick={createNewChat}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Yeni Chat Oluştur
      </button>
      
      <div className="chats-container">
        {chats.length > 0 ? (
          <ul className="chat-list">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className={`chat-item ${selectedChat === chat.id ? 'selected' : ''}`}
                onClick={() => handleChatClick(chat.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{chat.title || `Chat ${chat.id.slice(0, 8)}...`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-chats">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Henüz Chat Yok</h3>
            <p>Yeni bir sohbet başlatmak için "Yeni Chat Oluştur" butonuna tıklayın</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;