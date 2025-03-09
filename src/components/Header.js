import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import '../styles.css'; // Stil dosyasını dahil ediyoruz

const Header = ({ isLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error('Çıkış yapılırken hata oluştu:', err.message);
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <span className="logo-text">Chat<span className="logo-highlight">Burak</span></span>
      </div>
      <nav>
        <ul className="nav-list">
          <li className="nav-item">
            <span className="nav-link">Chat</span>
          </li>
          <li className="nav-item">
            <span className="nav-link">Ayarlar</span>
          </li>
          {isLoggedIn && (
            <li className="nav-item">
              <button onClick={handleLogout} className="logout-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Çıkış Yap
              </button>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;