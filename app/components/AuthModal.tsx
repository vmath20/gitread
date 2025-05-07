import React, { useEffect, useState } from 'react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  setMode: (mode: 'signin' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode, setMode }) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // If modal is closed, don't render anything
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {mode === 'signin' 
              ? 'Welcome back! Sign in to continue generating README files.' 
              : 'Create an account to generate README files for your GitHub repositories.'}
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 pt-4">
          {mode === 'signin' ? (
            <SignInButton mode="modal">
              <button className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                Continue with Clerk
              </button>
            </SignInButton>
          ) : (
            <SignUpButton mode="modal">
              <button className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                Continue with Clerk
              </button>
            </SignUpButton>
          )}
          
          {/* Toggle between signin and signup */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
              <button 
                className="ml-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 