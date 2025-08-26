'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login';
        }
      } catch (error) {
        window.location.href = '/login';
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  );
}