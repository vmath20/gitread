'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, SignInButton } from '@clerk/nextjs';
import BackToHome from '../components/BackToHome';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [credits, setCredits] = useState<number | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Helper to fetch credits
  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      if (!res.ok) throw new Error('Failed to fetch credits');
      const data = await res.json();
      setCredits(data.credits);
      return data.credits;
    } catch (err) {
      setCredits(null);
      return null;
    }
  };

  // Try to verify payment and refresh credits
  const verifyAndRefresh = async () => {
    setRetrying(true);
    setError('');
    try {
      const sessionId = searchParams?.get('session_id');
      if (!sessionId) {
        setError('Missing payment information');
        setStatus('error');
        setRetrying(false);
        return;
      }
      if (!userId) {
        // Don't set error, just wait for sign-in
        setRetrying(false);
        return;
      }
      // Verify the payment
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process payment');
        setStatus('error');
        setRetrying(false);
        return;
      }
      // Now fetch credits and only redirect if credits increased
      let tries = 0;
      let newCredits = null;
      while (tries < 5) {
        newCredits = await fetchCredits();
        if (typeof newCredits === 'number' && newCredits > 0) break;
        await new Promise(r => setTimeout(r, 1000));
        tries++;
      }
      if (typeof newCredits === 'number' && newCredits > 0) {
        setStatus('success');
        setRetrying(false);
        setTimeout(() => router.push('/'), 2000);
      } else {
        setError('Payment processed, but credits have not been added yet. Please try refreshing credits or contact support.');
        setStatus('error');
        setRetrying(false);
      }
    } catch (err) {
      setError('Failed to process payment. Please try again or contact support.');
      setStatus('error');
      setRetrying(false);
    }
  };

  // Only run payment verification if userId is available
  useEffect(() => {
    if (typeof window !== 'undefined' && userId && status === 'loading') {
      verifyAndRefresh();
    }
    // eslint-disable-next-line
  }, [searchParams, userId, router, status]);

  // If not signed in, always show sign-in prompt (never show Payment Error for 401)
  if (!userId && status !== 'success') {
    return (
      <div className="min-h-screen bg-[#FBF9F5] dark:bg-gray-900 flex items-center justify-center">
        <BackToHome />
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-purple-600">Sign In Required</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Please sign in to complete your payment and receive your credits.</p>
          <SignInButton mode="modal">
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-4">
              Sign In to Complete Payment
            </button>
          </SignInButton>
          <button 
            onClick={() => router.push('/')} 
            className="mt-6 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-gray-900 flex items-center justify-center">
      <BackToHome />
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Processing Payment</h1>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">Please wait while we verify your payment...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Error</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button 
              onClick={verifyAndRefresh}
              disabled={retrying}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mb-4"
            >
              {retrying ? 'Retrying...' : 'Refresh Credits & Retry'}
            </button>
            <a
              href={`mailto:koyalhq@gmail.com?subject=GitRead%20Payment%20Issue&body=I%20paid%20for%20credits%20but%20they%20were%20not%20added%20to%20my%20account.%20My%20user%20ID%20is:%20${userId || ''}%20and%20my%20session%20ID%20is:%20${searchParams?.get('session_id') || ''}`}
              className="block mt-2 text-purple-600 hover:text-purple-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Support
            </a>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Home
            </button>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-purple-600">Payment Successful!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-2">Your credits have been added to your account.</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting you now...</p>
          </>
        )}
      </div>
    </div>
  );
} 