import React, { useState, useEffect } from 'react';
import '../styles.css';

const ModelSelector = ({ selectedModel, onModelSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the view is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const models = [
    { 
      id: 'claude3-sonnet', 
      name: 'Claude 3.7 Sonnet', 
      description: 'En gelişmiş ve dengeli model (varsayılan)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16C9.8 16 8 14.2 8 12C8 9.8 9.8 8 12 8" />
          <path d="M12 8C14.2 8 16 9.8 16 12C16 14.2 14.2 16 12 16" />
          <line x1="12" y1="16" x2="12" y2="18" />
          <line x1="12" y1="6" x2="12" y2="8" />
        </svg>
      )
    },
    { 
      id: 'claude3-sonnet-thinking', 
      name: 'Claude 3.7 Sonnet Thinking', 
      description: 'Düşünme sürecini gösterir',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="16.01" />
          <path d="M12 13C11.9556 13 11.9125 12.9901 11.875 12.9721C11.8375 12.954 11.8068 12.9283 11.7854 12.8972C11.764 12.8662 11.7527 12.8309 11.7527 12.7948C11.7527 12.7587 11.764 12.7234 11.7854 12.6924C11.0815 11.582 10.8587 10.0622 11.9083 9.07447C12.958 8.08674 14.4765 8.9622 14.85 10.2398C15.2235 11.5174 14.3667 12.9215 12.215 12.9924C12.1587 13.0257 12.0754 13 12 13Z" />
        </svg>
      )
    },
    { 
      id: 'o3-mini-high', 
      name: 'O3 Mini High', 
      description: 'Hızlı yanıtlar için optimize edilmiş',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      )
    },
    { 
      id: 'o1', 
      name: 'O1', 
      description: 'En güçlü çok modlu model',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  ];

  // Default olarak ilk modeli seç
  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      onModelSelect(models[0].id);
    }
  }, [selectedModel, onModelSelect]);

  const handleModelSelect = (modelId) => {
    onModelSelect(modelId);
    setIsOpen(false);
  };

  const getSelectedModel = () => {
    return models.find(m => m.id === selectedModel) || models[0];
  };

  // Kısa model adı için
  const getShortModelName = () => {
    const model = getSelectedModel();
    // İlk kelimeyi ve numarayı al (örn: "Claude 3.7")
    const parts = model.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return parts[0];
  };

  // Dropdown'ı kapatmak için dışarı tıklama olayını dinle
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.model-selector-inline-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedModelObj = getSelectedModel();

  return (
    <div className="model-selector-inline-container">
      <button 
        className="model-selector-inline-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Model seçin"
      >
        <span className="model-icon">
          {isMobile ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          ) : (
            selectedModelObj.icon
          )}
        </span>
        <span className="selected-model-name-short">{getShortModelName()}</span>
        <span className="dropdown-arrow">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>
      
      {isOpen && (
        <div className="model-dropdown-menu-inline" role="listbox">
          {models.map((model) => (
            <div 
              key={model.id} 
              className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
              onClick={() => handleModelSelect(model.id)}
              role="option"
              aria-selected={selectedModel === model.id}
            >
              <div className="model-option-icon">
                {model.icon}
              </div>
              <div className="model-option-content">
                <div className="model-option-name">{model.name}</div>
                <div className="model-option-description">{model.description}</div>
              </div>
              {selectedModel === model.id && (
                <span className="selected-checkmark">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;