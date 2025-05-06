'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import BackToHome from '../components/BackToHome';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  useEffect(() => {
    async function handleSuccess() {
      try {
        const sessionId = searchParams?.get('session_id');
        
        if (!sessionId) {
          console.error('No session ID found in URL');
          setError('Missing payment information');
          setStatus('error');
          return;
        }
        
        if (!userId) {
          console.error('No user ID found');
          setError('Please log in to verify your payment');
          setStatus('error');
          return;
        }
        
        // Verify the payment
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          // Immediately fetch updated credits to refresh the state
          try {
            await fetch('/api/credits');
          } catch (error) {
            console.error('Error fetching updated credits:', error);
          }
          
          setStatus('success');
          // Redirect after a short delay to show success message
          setTimeout(() => router.push('/'), 2000);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to process payment');
          setStatus('error');
        }
      } catch (error) {
        console.error('Error processing success:', error);
        setError('Failed to process payment. Please contact support.');
        setStatus('error');
      }
    }
    
    // Only run the effect once the page is fully loaded
    if (typeof window !== 'undefined') {
      handleSuccess();
    }
  }, [searchParams, userId, router]);

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
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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