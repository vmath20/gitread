import React from 'react';

interface BlockingCreditsModalProps {
  open: boolean;
  selectedCredits: number;
  setSelectedCredits: (n: number) => void;
  handleBuyCredits: (n: number) => void;
}

const BlockingCreditsModal: React.FC<BlockingCreditsModalProps> = ({ open, selectedCredits, setSelectedCredits, handleBuyCredits }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Purchase Credits</h3>
          <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">Best Value</div>
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
        </div>
      </div>
    </div>
  );
};

export default BlockingCreditsModal; 