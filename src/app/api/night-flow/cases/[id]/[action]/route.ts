import { NextResponse } from 'next/server'
import { requireNightFlowActorRole } from '@/lib/night-flow-auth'
import { updateNightCaseAction } from '@/lib/night-flow-store'

const allowedActions = new Set(['start', 'complete', 'confirm', 'connect_billing'])

export async function POST(request: Request, { params }: { params: { id: string; action: string } }) {
  const { user, errorResponse } = await requireNightFlowActorRole()
  if (errorResponse || !user) return errorResponse

  try {
    if (!allowedActions.has(params.action)) {
      return NextResponse.json({ error: 'action_not_allowed' }, { status: 400 })
    }
    const payload = await request.json().catch(() => ({}))
    const requestCase = await updateNightCaseAction(user, params.id, params.action, payload)
    return NextResponse.json({ requestCase })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'night_case_update_failed' }, { status: 400 })
  }
}
