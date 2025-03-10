import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
    
    // Eğer aktif bir chat yoksa veya isNewChat true ise yeni chat oluştur
    if (!chatId || isNewChat) {
      try {
        chatId = await createChat();
        // createChat fonksiyonu yeni oluşturulan chat ID'sini döndürmelidir
        if (!chatId) {
          console.error('Yeni sohbet oluşturulamadı!');
          return;
        }
      } catch (error) {
        console.error('Yeni sohbet oluşturma hatası:', error);
        return;
      }
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

    // Referans işaretlerini ve diğer formatları düzelt
    let processedContent = content;
    
    // Karakter kodlama sorunlarını düzelt
    processedContent = processedContent.replace(/\uFFFD/g, '');
    
    // 1. Köşeli parantez referanslarını düzelt (【1-1】【1-2】 → [1] [2])
    processedContent = processedContent.replace(/【(\d+)-(\d+)】/g, '<sup class="reference-tag">[$1]</sup>');
    
    // 2. Diğer olası referans formatlarını da düzelt (örn: [1-1][1-2])
    processedContent = processedContent.replace(/\[(\d+)-(\d+)\]/g, '<sup class="reference-tag">[$1]</sup>');
    
    // 3. Yıldız işaretlerini düzelt (örn: *önemli*)
    processedContent = processedContent.replace(/\*([^*\n]+)\*/g, '**$1**');
    
    // 4. Kaçış karakterlerini düzelt
    processedContent = processedContent.replace(/\\n/g, '\n');
    processedContent = processedContent.replace(/\\"/g, '"');
    processedContent = processedContent.replace(/\\'/g, "'");
    
    // Unicode karakter sorunlarını düzelt
    processedContent = processedContent.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
    
    // 5. Liste sonrası gelen paragrafları düzelt
    // Liste maddesi olmayan bir satırın liste maddesinin içinde görünmesini engeller
    processedContent = processedContent.replace(/^([\s]*[-*+][\s]+.*)\n([^\s-*+].+)/gm, '$1\n$2');
    processedContent = processedContent.replace(/^([\s]*\d+\.[\s]+.*)\n([^\s\d].+)/gm, '$1\n$2');
    
    // 6. Başlıkların etrafındaki boşlukları azalt
    processedContent = processedContent.replace(/\n{2,}(#{1,6})\s/g, '\n$1 ');
    
    // 7. Liste öğelerini düzelt - madde işaretinin yazı ile aynı satırda olmasını sağla
    // Yanlış formattaki liste öğelerini düzelt (satır sonunda tire veya yıldız olan)
    processedContent = processedContent.replace(/(\n[*\-]\s*)\n+/g, '$1');
    // Numaralı listeleri düzelt (1. gibi)
    processedContent = processedContent.replace(/(\n\d+\.\s*)\n+/g, '$1');
    // Liste öğeleri için doğru boşluk bırak
    processedContent = processedContent.replace(/\n(\d+\.|\*|\-)\s*/g, '\n$1 ');
    
    // 8. Paragraf aralarını düzelt - aşırı boşlukları azalt
    processedContent = processedContent.replace(/\n{2,}/g, '\n');
    
    // 9. Kod bloklarını düzelt
    processedContent = processedContent.replace(/```(\w*)\n/g, '```$1\n');
    
    // 10. Özel karakterleri düzelt
    processedContent = processedContent.replace(/&lt;/g, '<');
    processedContent = processedContent.replace(/&gt;/g, '>');
    processedContent = processedContent.replace(/&amp;/g, '&');
    
    // 11. Boş satırları temizle
    processedContent = processedContent.replace(/^\s+|\s+$/g, '');
    
    // 12. Kalan bozuk karakterleri temizle
    processedContent = processedContent.replace(/[\uFFFD\uFFFE\uFFFF]/g, '');
    
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
          showLineNumbers={true}
          wrapLines={true}
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
    
    // Process the content before rendering
    const processedContent = preprocessMarkdown(content);
    
    // For bot messages, render markdown with all the necessary plugins
    return (
      <div className="message-text markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            ...MarkdownComponents,
            // Özel liste öğesi işleyicisi - minimal boşluk
            li: ({ node, children, ...props }) => (
              <li className="markdown-list-item" {...props}>
                {children}
              </li>
            ),
            ul: ({ node, children, ...props }) => (
              <ul className="markdown-list" {...props}>
                {children}
              </ul>
            ),
            ol: ({ node, children, ...props }) => (
              <ol className="markdown-list" {...props}>
                {children}
              </ol>
            ),
            // Özel başlık işleyicileri - minimal boşluk
            h1: ({ node, children, ...props }) => (
              <h1 className="markdown-heading" style={{margin: '0.5rem 0 0.2rem'}} {...props}>
                {children}
              </h1>
            ),
            h2: ({ node, children, ...props }) => (
              <h2 className="markdown-heading" style={{margin: '0.4rem 0 0.2rem'}} {...props}>
                {children}
              </h2>
            ),
            h3: ({ node, children, ...props }) => (
              <h3 className="markdown-heading" style={{margin: '0.3rem 0 0.1rem'}} {...props}>
                {children}
              </h3>
            ),
            // Özel paragraf işleyicisi - minimal boşluk
            p: ({ node, children, ...props }) => (
              <p className="markdown-paragraph" style={{margin: '0.2rem 0'}} {...props}>
                {children}
              </p>
            ),
            // Özel tablo işleyicisi - minimal boşluk
            table: ({ node, ...props }) => (
              <div className="table-container" style={{margin: '0.3rem 0'}}>
                <table className="markdown-table" {...props} />
              </div>
            ),
            // Özel alıntı işleyicisi - minimal boşluk
            blockquote: ({ node, ...props }) => (
              <blockquote className="markdown-blockquote" style={{margin: '0.3rem 0'}} {...props} />
            ),
          }}
        >
          {processedContent}
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
            {isNewChat ? 'Yeni Sohbet' : 'Sohbet'}
          </div>
        </div>
      )}
      
      <div className="messages-container" ref={messageContainerRef}>
        {(messages && messages.length > 0) || isNewChat ? (
          <>
            {messages && messages.map((msg) => (
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
                  <div className="pure-neon-loading">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" className="pure-neon-path" stroke="#4A6CFF" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="pure-loading-text">Cevap bekleniyor...</span>
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