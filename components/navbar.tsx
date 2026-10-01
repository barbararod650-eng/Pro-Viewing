'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Properties' },
  { href: '/list-your-property', label: 'List Yours' },
  { href: '/auth', label: 'Sign In' },
  { href: '/verify', label: 'Verify ID' },
  { href: '/payment', label: 'Checkout' },
  { href: '/dashboard', label: 'Access Portal' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-primary">KeyView</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-secondary text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Get Started</Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 justify-start"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button asChild size="sm" className="mt-2" onClick={() => setOpen(false)}>
                <Link href="/auth">Get Started</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
