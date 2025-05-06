'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  useEffect(() => {
    async function handleSuccess() {
      const sessionId = searchParams.get('session_id');
      if (sessionId && userId) {
        try {
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
            const error = await response.json();
            setError(error.message || 'Failed to process payment');
            setStatus('error');
          }
        } catch (error) {
          console.error('Error processing success:', error);
          setError('Failed to process payment');
          setStatus('error');
        }
      }
    }
    handleSuccess();
  }, [searchParams, userId, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center">
        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Error</h1>
            <p className="text-gray-600">{error}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-gray-600">Your credits have been added to your account. Redirecting you now...</p>
          </>
        )}
      </div>
    </div>
  );
} 