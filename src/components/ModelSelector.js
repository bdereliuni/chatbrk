import React, { useState, useEffect } from 'react';
import '../styles.css';

const ModelSelector = ({ selectedModel, onModelSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const models = [
    { id: 'claude3-sonnet', name: 'Claude 3.7 Sonnet', description: 'En gelişmiş ve dengeli model (varsayılan)' },
    { id: 'claude3-sonnet-thinking', name: 'Claude 3.7 Sonnet Thinking', description: 'Düşünme sürecini gösterir' },
    { id: 'o3-mini-high', name: 'O3 Mini High', description: 'Hızlı yanıtlar için optimize edilmiş' },
    { id: 'o1', name: 'O1', description: 'En güçlü çok modlu model' }
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

  const getSelectedModelName = () => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model.name : 'Model Seçin';
  };

  return (
    <div className="model-selector-container">
      <div className="model-selector">
        <button 
          className="model-selector-button" 
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="model-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16C15.866 16 19 12.866 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 12.866 8.13401 16 12 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="selected-model-name">{getSelectedModelName()}</span>
          <span className="dropdown-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
        
        {isOpen && (
          <div className="model-dropdown-menu" role="listbox">
            {models.map((model) => (
              <div 
                key={model.id} 
                className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
                onClick={() => handleModelSelect(model.id)}
                role="option"
                aria-selected={selectedModel === model.id}
              >
                <div className="model-option-content">
                  <div className="model-option-name">{model.name}</div>
                  <div className="model-option-description">{model.description}</div>
                </div>
                {selectedModel === model.id && (
                  <span className="selected-checkmark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector;