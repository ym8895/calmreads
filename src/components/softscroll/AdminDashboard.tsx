'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function AdminDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usage?hours=${hours}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

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
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}