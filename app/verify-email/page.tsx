'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('No verification token provided');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setSuccess(true);
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          const data = await response.json();
          setError(data.message || 'Verification failed');
        }
      } catch (err) {
        setError('An error occurred during verification');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center">
          {verifying ? (
            <>
              <div className="animate-spin inline-block mb-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. Redirecting to dashboard...
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Go to Dashboard
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to Login
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
