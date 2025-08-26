'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Disable static generation
export const dynamic = 'force-dynamic';

function SignupForm() {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);

  // Validate invite code on mount
  useEffect(() => {
    if (inviteCode) {
      validateInvite(inviteCode);
    }
  }, [inviteCode]);

  const validateInvite = async (code: string) => {
    setLoadingInvite(true);
    try {
      const response = await fetch(`/api/invites/validate?code=${code}`);
      const data = await response.json();
      
      if (data.success) {
        setInviteInfo(data.invite);
      } else {
        setError(`Invite Error: ${data.error}`);
      }
    } catch (err) {
      setError('Failed to validate invite code');
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('DEBUG: Starting signup request');
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          displayName: formData.displayName, 
          password: formData.password,
          inviteCode: inviteCode 
        }),
      });
      
      console.log('DEBUG: Signup response status:', response.status);
      
      if (response.ok) {
        console.log('DEBUG: Signup successful, redirecting to dashboard');
        // Signup successful - redirect immediately
        window.location.href = '/dashboard';
        return;
      } else {
        const data = await response.json();
        console.log('DEBUG: Signup failed:', data);
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      console.error('DEBUG: Network error:', err);
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Create Account</h2>
        <p className="text-base-content/60">
          {inviteInfo ? `Join Queue Star and become friends with ${inviteInfo.creator.name}` : 'Join Queue Star and start blending playlists'}
        </p>
      </div>

      {/* Invite Information */}
      {loadingInvite && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Validating invite...</span>
          </div>
        </div>
      )}

      {inviteInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-green-800">You're invited!</p>
              <p className="text-sm text-green-700 mt-1">
                <strong>{inviteInfo.creator.name}</strong> ({inviteInfo.creator.email}) has invited you to join Queue Star.
                You'll automatically become friends when you sign up.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Input
            type="text"
            name="displayName"
            placeholder="Display Name"
            value={formData.displayName}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            minLength={8}
          />
        </div>
        
        <div>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            minLength={8}
          />
        </div>
        
        {formData.password !== formData.confirmPassword && formData.confirmPassword && (
          <div className="alert alert-warning">
            <span>Passwords do not match</span>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isSubmitting || formData.password !== formData.confirmPassword}
        >
          {isSubmitting ? (
            <><span className="loading loading-spinner loading-sm mr-2"></span>Creating account...</>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
      
      <div className="text-center mt-6">
        <p className="text-base-content/60">
          Already have an account?{' '}
          <Link href="/login" className="link link-primary">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}