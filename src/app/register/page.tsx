"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Tv, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Google automatically verifies email, so we just drop them into the app
      router.push('/profile');
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Please log in instead.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center px-6">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
            <Tv className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-4">Check Your Email</h1>
          <p className="text-muted-foreground mb-8">
            We sent a verification link to <span className="font-bold text-foreground">{email}</span>. 
            Please verify your email address before logging in.
          </p>
          <Link href="/login" className="w-full bg-accent text-accent-foreground font-bold rounded-xl py-3 flex items-center justify-center shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/20">
          <Tv className="w-8 h-8 text-accent-foreground" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-8">Create Account</h1>
        
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="w-full space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-bold rounded-xl py-3 mt-4 flex items-center justify-center hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs font-bold text-muted-foreground uppercase">or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-card border border-border text-foreground font-bold rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.81 15.69 17.6V20.36H19.26C21.35 18.44 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.26 20.36L15.69 17.6C14.71 18.25 13.46 18.66 12 18.66C9.17001 18.66 6.77001 16.75 5.86001 14.18H2.17001V17.04C3.99001 20.64 7.69001 23 12 23Z" fill="#34A853"/>
            <path d="M5.86001 14.18C5.63001 13.51 5.5 12.78 5.5 12.02C5.5 11.26 5.63001 10.53 5.86001 9.86001V7.00001H2.17001C1.41001 8.52001 1 10.22 1 12.02C1 13.82 1.41001 15.52 2.17001 17.04L5.86001 14.18Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.07 5.94 16.21 7.03L19.34 3.9C17.45 2.14 14.97 1 12 1C7.69 1 3.99 3.36 2.17 6.96L5.86 9.82C6.77 7.25 9.17 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-muted-foreground mt-8 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-accent font-bold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
