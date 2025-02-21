'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { updateUserCredits } from '../utils/supabase';
import { useAuth } from '@clerk/nextjs';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userId } = useAuth();
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function handleSuccess() {
      const sessionId = searchParams.get('session_id');
      if (sessionId && userId) {
        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (response.ok) {
            const { credits } = await response.json();
            await updateUserCredits(userId, credits);
            // Redirect after a short delay to show success message
            setTimeout(() => router.push('/'), 2000);
          } else {
            const error = await response.json();
            setError(error.message || 'Failed to process payment');
          }
        } catch (error) {
          console.error('Error processing success:', error);
          setError('Failed to process payment');
        }
      }
    }
    handleSuccess();
  }, [searchParams, userId, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Error</h1>
            <p className="text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-gray-600">Please wait while we update your credits...</p>
          </>
        )}
      </div>
    </div>
  );
} 