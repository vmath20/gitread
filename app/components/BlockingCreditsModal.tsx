import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';

interface BlockingCreditsModalProps {
  open: boolean;
  selectedCredits: number;
  setSelectedCredits: (n: number) => void;
  handleBuyCredits: (n: number) => void;
  onClose?: () => void;
}

const BlockingCreditsModal: React.FC<BlockingCreditsModalProps> = ({ open, selectedCredits, setSelectedCredits, handleBuyCredits, onClose }) => {
  const { userId } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  const handleRefreshCredits = async () => {
    setRefreshing(true);
    setRefreshError('');
    try {
      const res = await fetch('/api/credits');
      if (!res.ok) throw new Error('Failed to fetch credits');
      const data = await res.json();
      if (typeof data.credits === 'number' && data.credits > 0) {
        window.location.reload();
      } else {
        setRefreshError('Credits have not been added yet. If you have paid, please wait a minute and try again, or contact support.');
      }
    } catch (err) {
      setRefreshError('Failed to refresh credits. Please try again or contact support.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Purchase Credits</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            &times;
          </button>
          <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium ml-8">Best Value</div>
        </div>
        <p className="text-gray-600 mb-6">You've used all your credits</p>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-gray-700 font-medium">Select credits:</div>
            <div className="text-5xl font-bold text-purple-600">{selectedCredits}</div>
          </div>
          <div className="relative pt-1">
            <input
              type="range"
              min="2"
              max="100"
              step="2"
              value={selectedCredits}
              onChange={e => setSelectedCredits(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 px-2 mt-2">
              <div>2</div>
              <div>25</div>
              <div>50</div>
              <div>100</div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-600 text-sm">Total price:</div>
                <div className="text-3xl font-bold text-purple-600">${(selectedCredits * 1.25).toFixed(2)}</div>
              </div>
              <div className="text-gray-600 text-sm">$1.25 per credit</div>
            </div>
          </div>
          <button
            onClick={() => handleBuyCredits(selectedCredits)}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span className="inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </span>
            <span>Buy {selectedCredits} Credits for ${(selectedCredits * 1.25).toFixed(2)}</span>
          </button>
          <div className="flex justify-center items-center text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 mr-1">
              <path d="M13 2L3 14h9l-1 8l10-12h-9l1-8z"></path>
            </svg>
            <span>Credits never expire and can be used anytime</span>
          </div>
          <button
            onClick={handleRefreshCredits}
            disabled={refreshing}
            className="w-full py-2 mt-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Credits'}
          </button>
          {refreshError && <div className="text-red-600 text-sm mt-2">{refreshError}</div>}
          <a
            href={`mailto:koyalhq@gmail.com?subject=GitRead%20Payment%20Issue&body=I%20paid%20for%20credits%20but%20they%20were%20not%20added%20to%20my%20account.%20My%20user%20ID%20is:%20${userId || ''}`}
            className="block mt-2 text-purple-600 hover:text-purple-700 underline text-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlockingCreditsModal; 