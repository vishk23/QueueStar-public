import React, { useEffect } from 'react';
import {
  ModalProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
  ModalTitleProps,
} from './Modal.types';

const Modal: React.FC<ModalProps> & {
  Header: React.FC<ModalHeaderProps>;
  Body: React.FC<ModalBodyProps>;
  Footer: React.FC<ModalFooterProps>;
  Title: React.FC<ModalTitleProps>;
} = ({ isOpen, onClose, children, size = 'md', className = '' }) => {
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className={`modal modal-open ${className}`}>
      <div className={`modal-box ${sizeClasses[size]}`}>
        <form method="dialog">
          <button 
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
        </form>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`py-4 ${className}`}>
      {children}
    </div>
  );
};

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`modal-action ${className}`}>
      {children}
    </div>
  );
};

const ModalTitle: React.FC<ModalTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`font-bold text-lg ${className}`}>
      {children}
    </h3>
  );
};

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Title = ModalTitle;

export { Modal };