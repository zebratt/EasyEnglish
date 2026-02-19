'use client';

import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';

interface GrammarType {
  id: number;
  name: string;
  nameEn: string;
  level: string;
}

interface Sentence {
  id: number;
  chinese: string;
  grammarTypeId: number;
  grammarType: GrammarType;
  createdAt: string;
}

interface PaginatedResponse {
  sentences: Sentence[];
  total: number;
  page: number;
  pageSize: number;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const levelLabel: Record<string, string> = {
  BEGINNER: '初级',
  INTERMEDIATE: '中级',
  ADVANCED: '高级',
};

const levelColor: Record<string, string> = {
  BEGINNER: 'bg-success-light text-success',
  INTERMEDIATE: 'bg-warning-light text-warning',
  ADVANCED: 'bg-error-light text-error',
};

export default function AdminPage() {
  const [grammarTypes, setGrammarTypes] = useState<GrammarType[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterGrammarTypeId, setFilterGrammarTypeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editChinese, setEditChinese] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newChinese, setNewChinese] = useState('');
  const [newGrammarTypeId, setNewGrammarTypeId] = useState('');

  const [showGenerate, setShowGenerate] = useState(false);
  const [genGrammarTypeId, setGenGrammarTypeId] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedSentences, setGeneratedSentences] = useState<string[]>([]);
  const [selectedGenerated, setSelectedGenerated] = useState<Set<number>>(new Set());

  const pageSize = 20;

  const fetchSentences = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filterGrammarTypeId) params.set('grammarTypeId', filterGrammarTypeId);

    const res = await fetch(`/api/admin/sentences?${params}`, { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    const data: PaginatedResponse = await res.json();
    setSentences(data.sentences);
    setTotal(data.total);
    setLoading(false);
  }, [page, filterGrammarTypeId]);

  useEffect(() => {
    fetch('/api/grammar-types').then((r) => r.json()).then(setGrammarTypes);
  }, []);

  useEffect(() => {
    fetchSentences();
  }, [fetchSentences]);

  async function handleDelete(id: number) {
    if (!confirm('确定删除这条句子？关联的练习记录也会被删除。')) return;
    await fetch(`/api/admin/sentences/${id}`, { method: 'DELETE', headers: authHeaders() });
    fetchSentences();
  }

  function startEdit(s: Sentence) {
    setEditingId(s.id);
    setEditChinese(s.chinese);
  }

  async function handleUpdate() {
    if (!editingId) return;
    await fetch(`/api/admin/sentences/${editingId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ chinese: editChinese }),
    });
    setEditingId(null);
    fetchSentences();
  }

  async function handleCreate() {
    if (!newChinese.trim() || !newGrammarTypeId) return;
    await fetch('/api/admin/sentences', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ grammarTypeId: Number(newGrammarTypeId), chinese: newChinese.trim() }),
    });
    setNewChinese('');
    setShowCreate(false);
    fetchSentences();
  }

  async function handleGenerate() {
    if (!genGrammarTypeId) return;
    setGenerating(true);
    setGeneratedSentences([]);
    const gt = grammarTypes.find((g) => g.id === Number(genGrammarTypeId));
    if (!gt) return;

    const res = await fetch('/api/admin/generate', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ grammarType: gt.name, level: gt.level, count: genCount }),
    });
    const data = await res.json();
    if (data.sentences) {
      setGeneratedSentences(data.sentences);
      setSelectedGenerated(new Set(data.sentences.map((_: string, i: number) => i)));
    }
    setGenerating(false);
  }

  async function handleConfirmGenerated() {
    if (!genGrammarTypeId || selectedGenerated.size === 0) return;
    const items = generatedSentences
      .filter((_, i) => selectedGenerated.has(i))
      .map((chinese) => ({ grammarTypeId: Number(genGrammarTypeId), chinese }));

    await fetch('/api/admin/sentences', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(items),
    });
    setGeneratedSentences([]);
    setSelectedGenerated(new Set());
    setShowGenerate(false);
    fetchSentences();
  }

  function toggleGenerated(index: number) {
    setSelectedGenerated((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const totalPages = Math.ceil(total / pageSize);

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-light">
            <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-error">无权限访问管理后台</p>
          <p className="mt-1 text-sm text-muted">请使用管理员账号登录</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">句子管理</h1>
            <p className="mt-1 text-sm text-muted">共 {total} 条句子</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowGenerate(true); setShowCreate(false); }}
              className="cursor-pointer rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                AI 生成
              </span>
            </button>
            <button
              onClick={() => { setShowCreate(true); setShowGenerate(false); }}
              className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                新增句子
              </span>
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <select
            value={filterGrammarTypeId}
            onChange={(e) => { setFilterGrammarTypeId(e.target.value); setPage(1); }}
            className="cursor-pointer rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">全部语法类型</option>
            {grammarTypes.map((gt) => (
              <option key={gt.id} value={gt.id}>
                {levelLabel[gt.level]} - {gt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Create Panel */}
        {showCreate && (
          <div className="mb-4 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-semibold">新增句子</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={newGrammarTypeId}
                onChange={(e) => setNewGrammarTypeId(e.target.value)}
                className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">选择语法类型</option>
                {grammarTypes.map((gt) => (
                  <option key={gt.id} value={gt.id}>
                    {levelLabel[gt.level]} - {gt.name}
                  </option>
                ))}
              </select>
              <input
                value={newChinese}
                onChange={(e) => setNewChinese(e.target.value)}
                placeholder="输入中文句子"
                className="flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
                  添加
                </button>
                <button onClick={() => setShowCreate(false)} className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Panel */}
        {showGenerate && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent-light p-5">
            <h3 className="mb-3 font-semibold">AI 辅助生成句子</h3>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">语法类型</label>
                <select
                  value={genGrammarTypeId}
                  onChange={(e) => setGenGrammarTypeId(e.target.value)}
                  className="cursor-pointer rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">选择语法类型</option>
                  {grammarTypes.map((gt) => (
                    <option key={gt.id} value={gt.id}>
                      {levelLabel[gt.level]} - {gt.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">数量</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-20 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating || !genGrammarTypeId}
                className="cursor-pointer rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    生成中...
                  </span>
                ) : '生成'}
              </button>
              <button onClick={() => { setShowGenerate(false); setGeneratedSentences([]); }} className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">
                取消
              </button>
            </div>

            {generatedSentences.length > 0 && (
              <div>
                <p className="mb-2 text-sm text-muted">勾选要入库的句子：</p>
                <div className="space-y-2">
                  {generatedSentences.map((s, i) => (
                    <label key={i} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-card-hover">
                      <input
                        type="checkbox"
                        checked={selectedGenerated.has(i)}
                        onChange={() => toggleGenerated(i)}
                        className="mt-0.5 cursor-pointer accent-accent"
                      />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleConfirmGenerated}
                  disabled={selectedGenerated.size === 0}
                  className="mt-3 cursor-pointer rounded-xl bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  确认入库（{selectedGenerated.size} 条）
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sentence Table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">中文句子</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">语法类型</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted">难度</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted">操作</th>
                </tr>
              </thead>
              <tbody>
                {sentences.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 transition-colors hover:bg-card-hover">
                    <td className="px-4 py-3 text-muted">{s.id}</td>
                    <td className="max-w-md px-4 py-3">
                      {editingId === s.id ? (
                        <div className="flex gap-2">
                          <input
                            value={editChinese}
                            onChange={(e) => setEditChinese(e.target.value)}
                            className="flex-1 rounded-lg border border-primary bg-background px-2 py-1 text-sm outline-none"
                          />
                          <button onClick={handleUpdate} className="cursor-pointer rounded-lg bg-primary px-3 py-1 text-xs text-white hover:bg-primary-hover">保存</button>
                          <button onClick={() => setEditingId(null)} className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs hover:bg-secondary">取消</button>
                        </div>
                      ) : (
                        s.chinese
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{s.grammarType.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColor[s.grammarType.level]}`}>
                        {levelLabel[s.grammarType.level]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId !== s.id && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => startEdit(s)}
                            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-primary"
                            title="编辑"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-error-light hover:text-error"
                            title="删除"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {sentences.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">暂无句子数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="cursor-pointer rounded-xl border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>
            <span className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="cursor-pointer rounded-xl border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
