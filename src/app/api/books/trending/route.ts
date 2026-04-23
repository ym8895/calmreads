import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { bookId, bookTitle, userId } = await request.json();
    
    if (!bookId || !bookTitle) {
      return NextResponse.json({ error: 'bookId and bookTitle required' }, { status: 400 });
    }

    const bookView = await prisma.bookView.create({
      data: {
        bookId,
        bookTitle,
        userId: userId || null,
      },
    });

    return NextResponse.json({ success: true, id: bookView.id });
  } catch (error) {
    console.error('Failed to track view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const hours = parseInt(searchParams.get('hours') || '24');

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const trendingBooks = await prisma.bookView.groupBy({
      by: ['bookId', 'bookTitle'],
      where: {
        viewedAt: {
          gte: since,
        },
      },
      _count: {
        bookId: true,
      },
      orderBy: {
        _count: {
          bookId: 'desc',
        },
      },
      take: limit,
    });

    return NextResponse.json({ 
      trending: trendingBooks.map(b => ({
        bookId: b.bookId,
        bookTitle: b.bookTitle,
        views: b._count.bookId,
      }))
    });
  } catch (error) {
    console.error('Failed to get trending:', error);
    return NextResponse.json({ error: 'Failed to get trending' }, { status: 500 });
  }
}