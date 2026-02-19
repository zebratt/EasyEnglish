'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path ? 'text-primary font-semibold' : 'text-muted hover:text-foreground';

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-primary">
          Easy English
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className={`text-sm transition-colors ${isActive('/')}`}>
            练习
          </Link>
          <Link href="/stats" className={`text-sm transition-colors ${isActive('/stats')}`}>
            统计
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
