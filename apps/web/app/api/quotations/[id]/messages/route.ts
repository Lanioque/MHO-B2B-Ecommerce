import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { SessionHelper } from '@/lib/auth-helpers';
import { handleError } from '@/lib/middleware/error-handler';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const helper = new SessionHelper(session);
    const membership = helper.getMembership();
    if (!membership) return NextResponse.json({ error: 'No organization membership found' }, { status: 403 });

    // Try to fetch threaded messages from QuotationMessage if available
    const { id } = await params;
    try {
      // @ts-ignore - QuotationMessage model may not exist in Prisma schema until migration runs
      // This is a graceful fallback - if model doesn't exist, we use quotation.notes instead
      const messages = await (prisma as any).quotationMessage.findMany({
        where: { quotationId: id },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json({ success: true, messages });
    } catch {
      // Fallback: return a single synthetic message from quotation.notes
      const q = await prisma.quotation.findUnique({ where: { id } });
      const messages = q?.notes
        ? [{ id: 'notes', quotationId: id, author: 'SYSTEM', message: q.notes, createdAt: q.updatedAt }]
        : [];
      return NextResponse.json({ success: true, messages });
    }
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const helper = new SessionHelper(session);
    const membership = helper.getMembership();
    if (!membership) return NextResponse.json({ error: 'No organization membership found' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const content = (body?.message || '').toString().trim();
    if (!content) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const author = 'CUSTOMER';
    try {
      // @ts-ignore - QuotationMessage model may not exist in Prisma schema until migration runs
      // This allows the feature to work before the migration is applied
      const message = await (prisma as any).quotationMessage.create({
        data: { quotationId: id, author, message: content },
      });
      return NextResponse.json({ success: true, message }, { status: 201 });
    } catch {
      // Fallback: append to notes
      const q = await prisma.quotation.findUnique({ where: { id } });
      const appended = `${q?.notes ? q.notes + '\n' : ''}[${author}] ${content}`;
      await prisma.quotation.update({ where: { id }, data: { notes: appended } });
      return NextResponse.json({ success: true, message: { id: 'notes', quotationId: id, author, message: content, createdAt: new Date() } }, { status: 201 });
    }
  } catch (e) {
    return handleError(e);
  }
}


