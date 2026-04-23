import { NextRequest, NextResponse } from 'next/server';
import { submitFeedbackToSupabase, getFeedbackFromSupabase, markFeedbackRead } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { message, category } = await request.json();
    
    if (!message || message.trim().length < 3) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }

    const success = await submitFeedbackToSupabase(message.trim(), category || 'general');
    if (!success) {
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const result = await getFeedbackFromSupabase(unreadOnly);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get feedback:', error);
    return NextResponse.json({ error: 'Failed to get feedback' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, isRead } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const success = await markFeedbackRead(id, isRead);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}