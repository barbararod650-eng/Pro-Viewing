'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/app-context';
import { PROPERTY } from '@/lib/property';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, User, ArrowRight, Check } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signedUp, setSignedUp] = useState(false);
  const { user, signUp, signIn } = useApp();
  const router = useRouter();

  // Already signed in? Skip the form.
  useEffect(() => {
    if (user) router.replace('/verify');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error } = await signUp(email, password, name || email.split('@')[0]);
      if (error) {
        setLoading(false);
        setError(error);
        return;
      }

      const signInResult = await signIn(email, password);
      setLoading(false);
      if (signInResult.error) {
        setError(signInResult.error);
        return;
      }

      setSignedUp(true);
      window.setTimeout(() => router.replace('/verify'), 900);
    } else {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error);
        return;
      }
      router.push('/verify');
    }
  };

  if (signedUp) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Check className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Sign up successful!</h1>
          <p className="mt-2 text-muted-foreground">
            Your account has been created. Taking you to identity verification...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="relative flex items-center justify-center overflow-hidden bg-primary p-8 lg:w-1/2 lg:p-16">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md text-center lg:text-left"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-accent">Secure Access</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground lg:text-4xl">
            Your identity, protected.
          </h1>
          <p className="mt-4 text-primary-foreground/70">
            Fidezia ensures every visitor is verified before granting access. No key, no code — just verified, time-gated entry.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'Bank-grade identity verification',
              'Time-gated access codes',
              'No physical keys to manage',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-foreground/80">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-10 hidden rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 lg:block">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PROPERTY.imageUrl}
                alt={PROPERTY.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-primary-foreground">{PROPERTY.name}</p>
                <p className="text-xs text-primary-foreground/60">{PROPERTY.address}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-8 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-6 flex rounded-lg border border-border p-1">
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Sign In
            </button>
          </div>

          <h2 className="text-2xl font-bold text-primary">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'signup'
              ? 'Sign up to schedule and manage property viewings.'
              : 'Sign in to access your viewing dashboard.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'signup' && (
                <p className="mt-1 text-xs text-muted-foreground">At least 6 characters.</p>
              )}
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
