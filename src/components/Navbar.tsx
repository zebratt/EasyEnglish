'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface UserPayload {
  userId: number;
  email: string;
  role: string;
  nickname?: string;
}

function parseToken(token: string): UserPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload as UserPayload;
  } catch {
    return null;
  }
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const payload = parseToken(token);
      if (!payload) return;
      // Merge nickname from localStorage user object (JWT doesn't carry it)
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          payload.nickname = userData.nickname;
        } catch { /* ignore */ }
      }
      setUser(payload);
    };

    loadUser();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navLink = (path: string, label: string) => {
    const active = pathname === path;
    return (
      <Link
        href={path}
        className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors ${
          active
            ? 'bg-primary-light font-semibold text-primary'
            : 'text-muted hover:bg-secondary hover:text-foreground'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-navbar backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex cursor-pointer items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            E
          </div>
          <span className="text-lg font-bold">Easy English</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink('/', '练习')}
          {navLink('/stats', '统计')}
          {user?.role === 'ADMIN' && navLink('/admin', '管理')}

          <div className="mx-1 h-4 w-px bg-border" />

          <ThemeToggle />

          {user && (
            <>
              <Link
                href="/profile"
                className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  pathname === '/profile'
                    ? 'bg-primary-light font-semibold text-primary'
                    : 'text-muted hover:bg-secondary hover:text-foreground'
                }`}
                title="个人资料"
              >
                {user.nickname || user.email.split('@')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-error-light hover:text-error"
                title="退出登录"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
