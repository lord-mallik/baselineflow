import React, { useEffect, useRef } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus modal
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add escape key listener
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        
        // Restore focus
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Modern intersection observer for animations
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Check if IntersectionObserver is available (Baseline: widely-available)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('modal-animate-in');
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(modalRef.current);

      return () => observer.disconnect();
    }
  }, [isOpen]);

  // Use ResizeObserver for responsive behavior (Baseline: newly-available)
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          
          // Adjust modal behavior based on size
          if (width < 600) {
            entry.target.classList.add('modal-mobile');
          } else {
            entry.target.classList.remove('modal-mobile');
          }
        }
      });

      resizeObserver.observe(modalRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [isOpen]);

  // Web Share API integration (Baseline: limited availability)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: 'Check out this modal',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    }
  };

  // Modern async/await with fetch (Baseline: widely-available)
  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Success:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Use modern JavaScript features
  const modalData = {
    title,
    timestamp: Date.now(),
    // Optional chaining (Baseline: widely-available)
    user: getCurrentUser()?.name ?? 'Anonymous',
    // Nullish coalescing (Baseline: widely-available)  
    theme: getTheme() ?? 'default',
  };

  // Array methods (Baseline: widely-available)
  const actions = ['close', 'share', 'submit'].filter(action => 
    isActionAvailable(action)
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="modal" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="modal-content"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        <div className="modal-actions">
          <button 
            className="button button-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          
          {/* Conditional rendering with modern syntax */}
          {actions.includes('share') && (
            <button 
              className="button button-secondary"
              onClick={handleShare}
            >
              Share
            </button>
          )}
          
          <button 
            className="button button-primary"
            onClick={() => handleSubmit(modalData)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions using modern JavaScript
function getCurrentUser() {
  // Using localStorage (Baseline: widely-available)
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

function getTheme(): string | null {
  // Using Map for theme storage (Baseline: widely-available)
  const themes = new Map([
    ['light', 'Light Theme'],
    ['dark', 'Dark Theme'],
    ['auto', 'System Theme']
  ]);
  
  const savedTheme = localStorage.getItem('theme');
  return themes.has(savedTheme!) ? savedTheme : null;
}

function isActionAvailable(action: string): boolean {
  // Using Set for performance (Baseline: widely-available)
  const availableActions = new Set(['close', 'share', 'submit']);
  return availableActions.has(action);
}

export default Modal;