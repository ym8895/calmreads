'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Check, CheckCircle } from 'lucide-react';

interface UsageSummary {
  totalRequests: number;
  successCount: number;
  failedCount: number;
  totalTokens: number;
  avgTokensPerRequest: number;
}

interface ProviderStats {
  requests: number;
  tokens: number;
  success: number;
  failed: number;
}

interface UsageData {
  summary: UsageSummary;
  byProvider: Record<string, ProviderStats>;
  recent: Array<{
    provider: string;
    model: string;
    total_tokens: number;
    endpoint: string;
    response_time_ms: number;
    status: string;
    created_at: string;
  }>;
}

interface FeedbackItem {
  id: string;
  message: string;
  category: string;
  createdAt: string;
  isRead: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  groq: 'bg-purple-500',
  deepseek: 'bg-blue-500',
  mistral: 'bg-orange-500',
  gemini: 'bg-yellow-500',
};

const PROVIDER_NAMES: Record<string, string> = {
  groq: 'Groq',
  deepseek: 'Deepseek',
  mistral: 'Mistral',
  gemini: 'Gemini',
};

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/usage?password=' + encodeURIComponent(password));
    if (res.ok) {
      localStorage.setItem('admin_token', password);
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Enter password to access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p className="text-sm text-destructive">Invalid password</p>
            )}
            <Button type="submit" className="w-full">
              Access Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch(`/api/admin/usage?hours=${hours}&password=${encodeURIComponent(token)}`);
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('admin_token');
          setIsAuthenticated(false);
        }
        throw new Error('Failed to fetch');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [hours, isAuthenticated]);

  const fetchFeedback = useCallback(async () => {
    if (!isAuthenticated) return;
    setFeedbackLoading(true);
    try {
      const { fetchFeedback } = await import('@/lib/api');
      const data = await fetchFeedback(false);
      setFeedback(data.feedback);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Feedback fetch error:', err);
    } finally {
      setFeedbackLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedback();
    }
  }, [fetchFeedback, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsage();
      const interval = setInterval(fetchUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchUsage, isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      const { markFeedbackRead } = await import('@/lib/api');
      await markFeedbackRead(id, true);
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, isRead: true } : f));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const formatNumber = (n: number) => n.toLocaleString();
  const formatDate = (d: string) => new Date(d).toLocaleString();

  const successRate = data?.summary.totalRequests
    ? Math.round((data.summary.successCount / data.summary.totalRequests) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">API Usage Dashboard</h1>
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground py-1">Token:</span>
            {[1, 6, 24, 168].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3 py-1 rounded-md text-sm ${
                  hours === h
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {h === 1 ? '1h' : h === 24 ? '24h' : h === 168 ? '7d' : `${h}h`}
              </button>
            ))}
            <button
              onClick={fetchUsage}
              className="px-3 py-1 rounded-md text-sm bg-muted hover:bg-muted/80"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                setIsAuthenticated(false);
              }}
              className="px-3 py-1 rounded-md text-sm bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>
        )}

        {loading && !data && (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(data.summary.totalRequests)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{successRate}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(data.summary.totalTokens)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Tokens/Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(data.summary.avgTokensPerRequest)}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="providers">
              <TabsList>
                <TabsTrigger value="providers">By Provider</TabsTrigger>
                <TabsTrigger value="recent">Recent Requests</TabsTrigger>
                <TabsTrigger value="feedback">
                  Feedback {unreadCount > 0 && <span className="ml-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full inline-flex items-center justify-center">{unreadCount}</span>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="providers" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage by Provider</CardTitle>
                    <CardDescription>Token and request breakdown by AI provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(data.byProvider).map(([provider, stats]) => {
                        const pct = data.summary.totalRequests > 0
                          ? Math.round((stats.requests / data.summary.totalRequests) * 100)
                          : 0;
                        return (
                          <div key={provider} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${PROVIDER_COLORS[provider] || 'bg-gray-500'}`} />
                                <span className="font-medium">{PROVIDER_NAMES[provider] || provider}</span>
                                <Badge variant="outline">{stats.requests} requests</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(stats.tokens)} tokens ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${PROVIDER_COLORS[provider] || 'bg-gray-500'} rounded-full`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Success: {stats.success}</span>
                              <span>Failed: {stats.failed}</span>
                              <span>Avg: {stats.requests > 0 ? Math.round(stats.tokens / stats.requests) : 0} tokens</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recent" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Requests</CardTitle>
                    <CardDescription>Last 50 API requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Time</th>
                            <th className="text-left py-2 px-2">Provider</th>
                            <th className="text-left py-2 px-2">Endpoint</th>
                            <th className="text-right py-2 px-2">Tokens</th>
                            <th className="text-right py-2 px-2">Latency</th>
                            <th className="text-left py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recent?.map((r, i) => (
                            <tr key={i} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 text-xs">{formatDate(r.created_at)}</td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${PROVIDER_COLORS[r.provider] || 'bg-gray-500'}`} />
                                  {PROVIDER_NAMES[r.provider] || r.provider}
                                </div>
                              </td>
                              <td className="py-2 px-2">{r.endpoint}</td>
                              <td className="py-2 px-2 text-right">{formatNumber(r.total_tokens)}</td>
                              <td className="py-2 px-2 text-right">{r.response_time_ms}ms</td>
                              <td className="py-2 px-2">
                                <Badge variant={r.status === 'success' ? 'default' : 'destructive'}>
                                  {r.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {(!data.recent || data.recent.length === 0) && (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                No requests yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Feedback</CardTitle>
                    <CardDescription>Suggestions and bug reports from users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feedbackLoading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : feedback.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No feedback yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {feedback.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border ${
                              item.isRead ? 'border-border/30 bg-muted/20' : 'border-[#8FB9A8]/30 bg-[#D4E6E0]/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(item.createdAt)}
                                  </span>
                                </div>
                                <p className="text-foreground">{item.message}</p>
                              </div>
                              {!item.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsRead(item.id)}
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" /> Mark Read
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}