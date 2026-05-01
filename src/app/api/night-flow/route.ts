import { NextResponse } from 'next/server'
import { requireNightFlowActorRole } from '@/lib/night-flow-auth'
import { createNightCase, listNightFlowData } from '@/lib/night-flow-store'

export async function GET() {
  const { user, errorResponse } = await requireNightFlowActorRole()
  if (errorResponse || !user) return errorResponse

  try {
    return NextResponse.json(await listNightFlowData(user))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'night_flow_fetch_failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user, errorResponse } = await requireNightFlowActorRole()
  if (errorResponse || !user) return errorResponse

  try {
    const payload = await request.json()
    const requestCase = await createNightCase(user, payload)
    return NextResponse.json({ requestCase }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'night_case_create_failed' }, { status: 400 })
  }
}
