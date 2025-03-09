import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import api from '../services/api';

const ChatWindow = ({ activeChatId, createChat, isNewChat, messages, updateMessages, sendMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset input when active chat changes
  useEffect(() => {
    setInput('');
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Textarea auto resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Send message function
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = await createChat();
    }

    const newMessage = {
      id: Date.now(),
      content: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update messages
    const updatedMessages = [...(messages || []), newMessage];
    updateMessages(chatId, updatedMessages);

    setInput('');
    setIsLoading(true);

    try {
      // Dashboard'dan gelen sendMessage fonksiyonunu kullan
      const response = await sendMessage(chatId, input);
      const botMessage = {
        id: Date.now() + 1,
        content: response.response || 'API yanıtı bekleniyor',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateMessages(chatId, [...updatedMessages, botMessage]);
    } catch (error) {
      console.error('API hatası:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Bir hata oluştu, lütfen tekrar deneyin.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      updateMessages(chatId, [...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitial = (sender) => {
    return sender === 'user' ? 'S' : 'B';
  };

  return (
    <div className="chat-window">
      {activeChatId && (
        <div className="chat-header">
          <div className="chat-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sohbet
          </div>
        </div>
      )}
      
      <div className="messages-container">
        {messages && messages.length > 0 ? (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                <div className="message-avatar">
                  {getInitial(msg.sender)}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.timestamp && <div className="message-time">{msg.timestamp}</div>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="loading-spinner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="welcome-message">
            <h2 className="welcome-title">Sohbete Başlayın</h2>
            <p className="welcome-subtitle">
              Yapay zeka ile sohbet etmek için aşağıdaki metin kutusuna mesajınızı yazın.
              Herhangi bir konuda soru sorabilir veya yardım isteyebilirsiniz.
            </p>
            <div className="suggestion-chips">
              <div className="suggestion-chip" onClick={() => setInput("Merhaba, nasıl yardımcı olabilirsin?")}>
                Merhaba, nasıl yardımcı olabilirsin?
              </div>
              <div className="suggestion-chip" onClick={() => setInput("Bana bir hikaye anlatır mısın?")}>
                Bana bir hikaye anlatır mısın?
              </div>
              <div className="suggestion-chip" onClick={() => setInput("Bugün hava nasıl?")}>
                Bugün hava nasıl?
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Mesajınızı yazın... (Enter tuşuna basarak gönderebilirsiniz)"
          className="message-input"
          disabled={isLoading}
          rows="1"
        />
        <button 
          onClick={handleSendMessage} 
          className="send-button"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;