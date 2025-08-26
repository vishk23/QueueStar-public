'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, Settings, LogOut, Music } from 'lucide-react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        window.location.href = '/login';
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation */}
      <nav className="navbar bg-base-200/80 backdrop-blur-md border-b border-base-300/50 shadow-sm">
        <div className="flex-1">
          <Link href="/dashboard" className="btn btn-ghost text-xl font-bold">
            <Music className="w-6 h-6 mr-2" />
            Queue Star
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1 gap-1">
            <li>
              <Link href="/dashboard" className="flex items-center gap-2 hover:bg-base-300/50 rounded-lg transition-colors">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/settings" className="flex items-center gap-2 hover:bg-base-300/50 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </li>
            <li>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-warning hover:bg-warning/10 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}