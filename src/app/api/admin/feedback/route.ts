import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { message, category } = await request.json();
    
    if (!message || message.trim().length < 3) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        message: message.trim(),
        category: category || 'general',
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const feedback = await prisma.feedback.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.feedback.count({
      where: { isRead: false },
    });

    return NextResponse.json({ feedback, unreadCount });
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

    await prisma.feedback.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update feedback:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}