'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

interface GrammarType {
  id: number;
  name: string;
  nameEn: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  _count: { sentences: number };
}

const levelConfig = {
  BEGINNER: {
    label: '初级',
    color: 'bg-success-light text-success border-success/20',
    dot: 'bg-success',
    icon: (
      <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  INTERMEDIATE: {
    label: '中级',
    color: 'bg-warning-light text-warning border-warning/20',
    dot: 'bg-warning',
    icon: (
      <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
  },
  ADVANCED: {
    label: '高级',
    color: 'bg-error-light text-error border-error/20',
    dot: 'bg-error',
    icon: (
      <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
};

export default function HomePage() {
  const [grammarTypes, setGrammarTypes] = useState<GrammarType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/grammar-types')
      .then((res) => res.json())
      .then(setGrammarTypes)
      .finally(() => setLoading(false));
  }, []);

  const grouped = {
    BEGINNER: grammarTypes.filter((g) => g.level === 'BEGINNER'),
    INTERMEDIATE: grammarTypes.filter((g) => g.level === 'INTERMEDIATE'),
    ADVANCED: grammarTypes.filter((g) => g.level === 'ADVANCED'),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">选择语法类型</h1>
          <p className="mt-1 text-sm text-muted">选择一个语法类型开始翻译练习</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-24 animate-pulse rounded-full bg-secondary" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-28 animate-pulse rounded-xl bg-secondary" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((level) => (
              <section key={level}>
                <div className="mb-4 flex items-center gap-2">
                  {levelConfig[level].icon}
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${levelConfig[level].color}`}
                  >
                    {levelConfig[level].label}
                  </span>
                  <span className="text-sm text-muted">{grouped[level].length} 种语法</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[level].map((gt) => (
                    <Link
                      key={gt.id}
                      href={`/practice/${gt.id}`}
                      className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium group-hover:text-primary">{gt.name}</h3>
                          <p className="mt-1 text-xs text-muted">{gt.nameEn}</p>
                        </div>
                        <span className={`mt-0.5 h-2 w-2 rounded-full ${levelConfig[level].dot}`} />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-muted">
                          {gt._count.sentences > 0
                            ? `${gt._count.sentences} 道练习题`
                            : '暂无练习题'}
                        </p>
                        <svg
                          className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
