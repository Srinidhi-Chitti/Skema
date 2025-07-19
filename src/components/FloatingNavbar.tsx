import React, { useState } from 'react';
import './FloatingNavbar.css';

interface NavItem {
  icon: string;
  text: string;
  link: string;
}

const FloatingNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  const navItems: NavItem[] = [
    { icon: '📄', text: 'Docs', link: '#docs' },
    { icon: '🕹️', text: 'Playground', link: '#playground' },
    { icon: '🐙', text: 'GitHub', link: 'https://github.com' }
  ];

  return (
    <div className={`floating-navbar ${isOpen ? 'open' : ''}`}>
      <button 
        className="nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? '✕' : '☰'}
      </button>
      
      <div className="nav-items">
        {navItems.map((item, index) => (
          <a 
            key={index} 
            href={item.link} 
            className="nav-item"
            target={item.link.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
          >
            <span className="icon">{item.icon}</span>
            <span className="text">{item.text}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default FloatingNavbar;