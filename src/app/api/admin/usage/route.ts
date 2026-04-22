import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const password = searchParams.get('password');
  const hours = parseInt(searchParams.get('hours') || '24');
  const provider = searchParams.get('provider');

  if (ADMIN_PASSWORD && password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('api_usage')
    .select('*')
    .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalTokens = data?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) || 0;
  const totalRequests = data?.length || 0;
  const successCount = data?.filter(r => r.status === 'success').length || 0;
  const failedCount = data?.filter(r => r.status !== 'success').length || 0;

  const byProvider = data?.reduce((acc, r) => {
    if (!acc[r.provider]) acc[r.provider] = { requests: 0, tokens: 0, success: 0, failed: 0 };
    acc[r.provider].requests++;
    acc[r.provider].tokens += r.total_tokens || 0;
    if (r.status === 'success') acc[r.provider].success++;
    else acc[r.provider].failed++;
    return acc;
  }, {} as Record<string, { requests: number; tokens: number; success: number; failed: number }>);

  return NextResponse.json({
    summary: {
      totalRequests,
      successCount,
      failedCount,
      totalTokens,
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    },
    byProvider,
    recent: data?.slice(0, 50),
  });
}