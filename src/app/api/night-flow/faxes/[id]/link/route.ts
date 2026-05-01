import { NextResponse } from 'next/server'
import { requireNightFlowActorRole } from '@/lib/night-flow-auth'
import { linkFaxToNightCase } from '@/lib/night-flow-store'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { user, errorResponse } = await requireNightFlowActorRole()
  if (errorResponse || !user) return errorResponse

  try {
    const payload = await request.json()
    const result = await linkFaxToNightCase(user, params.id, payload.requestCaseId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'fax_link_failed' }, { status: 400 })
  }
}
