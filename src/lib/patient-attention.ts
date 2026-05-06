import type { AttentionFlag, PatientRecord } from '@/lib/mock-data'

const NO_KNOWN_ALLERGY_VALUES = new Set([
  'なし',
  '無し',
  '特になし',
  '特に無し',
  '該当なし',
  'なし(確認済み)',
  '無し(確認済み)',
  '未設定',
])

export function hasKnownAllergies(allergies: string | null | undefined) {
  const normalized = (allergies ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/[。．.]+$/g, '')
    .replace(/\s+/g, '')

  if (!normalized) return false
  return !NO_KNOWN_ALLERGY_VALUES.has(normalized)
}

export function getPatientAttentionFlags(patient: PatientRecord): AttentionFlag[] {
  const flags: AttentionFlag[] = []
  const notes = patient.visitNotes ?? ''
  const manualTags = patient.manualTags ?? []
  const derivedFlags = patient.derivedFlags ?? []

  const push = (key: string, label: string, tone: AttentionFlag['tone']) => {
    if (!flags.find((flag) => flag.key === key)) {
      flags.push({ key, label, tone })
    }
  }

  manualTags.forEach((tag) => {
    if (tag === '家族連絡用') push('manual_family_contact', tag, 'info')
    if (tag === '配薬場所指定') push('manual_delivery_spot', tag, 'info')
    if (tag === '夜間注意') push('manual_night_caution', tag, 'warning')
    if (tag === '医療機器あり') push('manual_equipment', tag, 'info')
    if (tag === '転倒注意') push('manual_fall_risk', tag, 'warning')
    if (tag === 'ペット注意') push('manual_pet', tag, 'warning')
    if (tag === '駐車注意') push('manual_parking', tag, 'info')
    if (tag === 'キーボックスあり') push('manual_keybox', tag, 'warning')
  })

  derivedFlags.forEach((flag) => push(`derived-${flag}`, flag, 'info'))

  if (notes.includes('暗証番号') || notes.includes('キーボックス') || notes.includes('オートロック')) {
    push('security_code', '暗証番号あり', 'warning')
  }
  if (notes.includes('家族') || notes.includes('同席')) {
    push('family_contact', '家族連絡要', 'info')
  }
  if (notes.includes('認知症') || notes.includes('せん妄') || notes.includes('徘徊')) {
    push('cognitive', '認知症対応注意', 'danger')
  }
  if (hasKnownAllergies(patient.allergies)) {
    push('allergy', 'アレルギーあり', 'danger')
  }
  if (notes.includes('医療機器') || notes.includes('酸素') || notes.includes('血糖測定器')) {
    push('equipment', '医療機器あり', 'info')
  }
  if (notes.includes('配薬場所')) {
    push('delivery_spot', '配薬場所指定', 'info')
  }
  if (notes.includes('夜間') || notes.includes('チャイム') || notes.includes('ドアノック')) {
    push('night_caution', '夜間注意', 'warning')
  }
  if (notes.includes('ペット') || notes.includes('犬') || notes.includes('猫')) {
    push('pet', 'ペット注意', 'warning')
  }
  if (notes.includes('駐車') || notes.includes('来客用P')) {
    push('parking', '駐車情報あり', 'info')
  }

  return flags
}

export function getPatientAttentionFlagClass(tone: AttentionFlag['tone']) {
  if (tone === 'danger') return 'border-rose-500/40 bg-rose-500/20 text-rose-300'
  if (tone === 'warning') return 'border-amber-500/40 bg-amber-500/20 text-amber-300'
  return 'border-sky-500/40 bg-sky-500/20 text-sky-300'
}
