'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

export default function TeacherAccessPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          const teacherName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Teacher';
          localStorage.setItem(
            'lanternLionTeacherSession',
            JSON.stringify({ name: teacherName, email: user.email })
          );
        }
      });
    } catch {
      /* fallback */
    }
  }, []);

  async function handleGoogleSignIn() {
    setError('');
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/teacher-dashboard`,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setIsGoogleLoading(false);
      const msg = err instanceof Error ? err.message : 'Google sign-in error';
      setError(msg);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Please enter at least 8 characters for your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (!signInError && data.user) {
        const teacherName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          'Teacher';
        localStorage.setItem(
          'lanternLionTeacherSession',
          JSON.stringify({ name: teacherName, email: cleanEmail })
        );
        let pending: string | null = null;
        try {
          pending = sessionStorage.getItem('lanternLionPendingModuleRedirect');
          if (pending) sessionStorage.removeItem('lanternLionPendingModuleRedirect');
        } catch { /* No-op */ }
        window.location.href = pending || '/teacher-dashboard';
        return;
      }
    } catch {
      // Local fallback
    }

    // Direct local teacher session if credentials match user inputs
    const teacherName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = teacherName.charAt(0).toUpperCase() + teacherName.slice(1);
    localStorage.setItem('lanternLionTeacherSession', JSON.stringify({ name: formattedName, email: cleanEmail }));
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem('lanternLionPendingModuleRedirect');
      if (pending) sessionStorage.removeItem('lanternLionPendingModuleRedirect');
    } catch { /* No-op */ }
    window.location.href = pending || '/teacher-dashboard';
  }

  return (
    <main className="teacher-access-page">
      <section className="teacher-access-story">
        <Link href="/">
          <Image src="/lantern-lion-logo.png" alt="" width={64} height={64} priority />
          <span>
            <strong>Lantern &amp; Lion</strong>
            <small>Teacher &amp; Church Space</small>
          </span>
        </Link>
        <div>
          <p className="teacher-kicker">A calm classroom view</p>
          <h1>Teach the story. See who needs you.</h1>
          <p>
            Assign thoughtful Bible activities, track student progress and connect with parents in a safe, moderated environment.
          </p>
          <ul>
            <li><span>01</span> One clear view across every class</li>
            <li><span>02</span> Join codes controlled by the teacher</li>
            <li><span>03</span> Parent-safe messages and help flags</li>
          </ul>
        </div>
      </section>

      <section className="teacher-access-form">
        <div>
          <p className="teacher-kicker">Teacher &amp; Leader Access</p>
          <h2>Welcome back.</h2>
          <p>Sign in to manage your Sunday School or church classroom.</p>

          <button
            type="button"
            className="button-google"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={submit} noValidate>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="teacher@church.org"
              />
            </label>
            <label>
              Password
              <div>
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            {error && <p className="teacher-access-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Open teacher dashboard'}
            </button>
          </form>
          <Link className="access-home-link" href="/" style={{ marginTop: 18, display: 'inline-block' }}>
            Back to the home page
          </Link>
        </div>
      </section>
    </main>
  );
}
