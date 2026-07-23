"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Tv, Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        // We'll show success even if the email wasn't found to prevent email enumeration, 
        // which is a security best practice.
        setIsSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center px-6">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6">
            <Tv className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-4">Check Your Email</h1>
          <p className="text-muted-foreground mb-8">
            If an account exists for <span className="font-bold text-foreground">{email}</span>, we&apos;ve sent a password reset link.
          </p>
          <Link href="/login" className="w-full bg-accent text-accent-foreground font-bold rounded-xl py-3 flex items-center justify-center hover:bg-accent/90 transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6">
      
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className="w-full flex justify-start mb-4">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
          <Tv className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Reset Password</h1>
        <p className="text-muted-foreground text-center mb-8">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="w-full space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-accent text-accent-foreground font-bold rounded-xl py-3 mt-4 flex items-center justify-center disabled:opacity-50 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
