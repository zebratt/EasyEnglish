'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

interface UserProfile {
  id: number;
  email: string;
  nickname: string | null;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setNickname(data.nickname || '');
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
        return;
      }

      setProfile((prev) => (prev ? { ...prev, ...data } : prev));
      localStorage.setItem('user', JSON.stringify(data));
      setMessage({ type: 'success', text: '保存成功' });
      window.dispatchEvent(new Event('user-updated'));
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-12">
          <div className="space-y-4">
            <div className="h-8 w-40 animate-pulse rounded bg-secondary" />
            <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const hasChanges = nickname !== (profile.nickname || '');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold">个人资料</h1>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Avatar placeholder */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
              {(profile.nickname || profile.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{profile.nickname || profile.email.split('@')[0]}</p>
              <p className="text-sm text-muted">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="mb-1.5 block text-sm font-medium">
                昵称
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-primary focus:bg-background"
                placeholder="设置一个昵称"
              />
              <p className="mt-1 text-xs text-muted">{nickname.length}/20</p>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">邮箱</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm text-muted"
              />
            </div>

            {/* Join date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">注册时间</label>
              <p className="text-sm text-muted">
                {new Date(profile.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-success-light text-success'
                    : 'bg-error-light text-error'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full cursor-pointer rounded-xl bg-primary py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all hover:bg-primary-hover hover:shadow-md hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
