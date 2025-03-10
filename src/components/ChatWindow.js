import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ModelSelector from './ModelSelector';

const ChatWindow = ({ activeChatId, createChat, isNewChat, messages, updateMessages, sendMessage, selectedModel, onModelSelect }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset input when active chat changes
  useEffect(() => {
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [activeChatId]);

  // Auto-focus on textarea when chat changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeChatId, isNewChat]);

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

  // Preprocess the content to ensure proper markdown rendering
  const preprocessMarkdown = (content) => {
    if (!content) return '';

    // Replace escaped newlines with actual newlines
    let processedContent = content.replace(/\\n/g, '\n');
    
    // Ensure paragraph breaks have double newlines
    processedContent = processedContent.replace(/\n\n/g, '\n\n');
    
    // Fix headers to ensure they're properly spaced
    processedContent = processedContent.replace(/\n(#{1,6})\s/g, '\n\n$1 ');
    
    // Ensure lists are properly formatted
    processedContent = processedContent.replace(/\n(\d+\.|\*|\-)\s/g, '\n\n$1 ');
    
    // Ensure code blocks are properly formatted
    processedContent = processedContent.replace(/```(\w*)\n/g, '\n```$1\n');
    
    return processedContent;
  };

  // Render custom components for markdown
  const MarkdownComponents = {
    // Custom renderer for code blocks with syntax highlighting
    code(props) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        <SyntaxHighlighter
          language={match[1]}
          style={vscDarkPlus}
          PreTag="div"
          className="codeblock"
          {...rest}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="codeblock-inline" {...rest}>
          {children}
        </code>
      );
    },
    // Make all links open in a new tab
    a(props) {
      return <a target="_blank" rel="noreferrer noopener" {...props} />;
    },
    // Custom paragraph renderer to handle newlines properly
    p(props) {
      const { children } = props;
      return <p className="markdown-paragraph">{children}</p>;
    },
    // Custom heading renderers
    h1(props) {
      const { children } = props;
      return <h1 className="markdown-heading">{children}</h1>;
    },
    h2(props) {
      const { children } = props;
      return <h2 className="markdown-heading">{children}</h2>;
    },
    h3(props) {
      const { children } = props;
      return <h3 className="markdown-heading">{children}</h3>;
    }
  };

  // Function to render message content
  const renderMessageContent = (content, sender) => {
    // For user messages, render as plain text
    if (sender === 'user') {
      return <div className="message-text">{content}</div>;
    }
    
    // If content has raw line breaks, use a pre-rendered version
    if (content && content.includes('\\n')) {
      // Use dangerouslySetInnerHTML as a fallback for escaped newlines
      const htmlContent = content
        .replace(/\\n\\n/g, '<br/><br/>')
        .replace(/\\n/g, '<br/>')
        .replace(/#{3}\s+([^<]+)/g, '<h3>$1</h3>')
        .replace(/#{2}\s+([^<]+)/g, '<h2>$1</h2>')
        .replace(/#{1}\s+([^<]+)/g, '<h1>$1</h1>');
      
      return (
        <div 
          className="message-text markdown-content" 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }
    
    // For bot messages, render markdown with all the necessary plugins
    return (
      <div className="message-text markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={MarkdownComponents}
        >
          {preprocessMarkdown(content)}
        </ReactMarkdown>
      </div>
    );
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
      
      <div className="messages-container" ref={messageContainerRef}>
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
                  {renderMessageContent(msg.content, msg.sender)}
                  {msg.timestamp && <div className="message-time">{msg.timestamp}</div>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  B
                </div>
                <div className="message-content loading-content">
                  <div className="loading-spinner">
                    <div className="dot-flashing"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="welcome-message">
            <div className="welcome-title">ChatBurak'a Hoş Geldiniz!</div>
            <div className="welcome-subtitle">Size nasıl yardımcı olabilirim?</div>
            <div className="suggestion-chips">
              <button className="suggestion-chip" onClick={() => setInput("Yapay zeka hakkında bilgi verir misin?")}>
                Yapay zeka hakkında bilgi verir misin?
              </button>
              <button className="suggestion-chip" onClick={() => setInput("Bir hikaye yazar mısın?")}>
                Bir hikaye yazar mısın?
              </button>
              <button className="suggestion-chip" onClick={() => setInput("Güncel haber başlıklarını özetler misin?")}>
                Güncel haber başlıklarını özetler misin?
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="input-container">
        <div className="input-wrapper">
          <div className="input-row">
            <div className="model-selector-inline">
              <ModelSelector 
                selectedModel={selectedModel} 
                onModelSelect={onModelSelect} 
              />
            </div>
            <div className="input-message-wrapper">
              <textarea
                ref={textareaRef}
                className="message-input"
                placeholder="Mesajınızı yazın..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                aria-label="Mesaj metni giriş alanı"
              />
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                aria-label="Mesajı gönder"
                title="Mesajı gönder (veya Enter'a basın)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;