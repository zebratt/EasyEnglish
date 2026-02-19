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
  BEGINNER: { label: '初级', color: 'bg-success/10 text-success border-success/20' },
  INTERMEDIATE: { label: '中级', color: 'bg-warning/10 text-warning border-warning/20' },
  ADVANCED: { label: '高级', color: 'bg-error/10 text-error border-error/20' },
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
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-10">
            {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((level) => (
              <section key={level}>
                <div className="mb-4 flex items-center gap-2">
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
                      className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <h3 className="font-medium group-hover:text-primary">{gt.name}</h3>
                      <p className="mt-1 text-xs text-muted">{gt.nameEn}</p>
                      <p className="mt-3 text-xs text-muted">
                        {gt._count.sentences > 0
                          ? `${gt._count.sentences} 道练习题`
                          : '暂无练习题'}
                      </p>
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
