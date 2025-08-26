'use client';

import React from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Disable static generation
export const dynamic = 'force-dynamic';

export default function LogoutPage() {
  // const { logout, loading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Simple logout - just clear cookies and redirect
      document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      router.push('/login?message=logged-out');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoggingOut) {
    return (
      <Card className="p-8 text-center">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        <p>Logging out...</p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Sign Out</h2>
        <p className="text-base-content/60">
          Are you sure you want to sign out of Blendify?
        </p>
      </div>
      
      <div className="flex space-x-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleLogout}
          className="flex-1"
          loading={isLoggingOut}
        >
          Sign Out
        </Button>
      </div>
    </Card>
  );
}