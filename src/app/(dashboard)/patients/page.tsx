'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

interface PatientRecord {
  id: string
  name: string
  dob: string
  address: string
  pharmacy: string
  riskScore: number
  emergencyContact: {
    name: string
    relation: string
    phone: string
  }
  doctor: {
    name: string
    clinic: string
    phone: string
  }
  medicalHistory: string
  allergies: string
  currentMeds: string
  visitNotes: string
}

const patientData: PatientRecord[] = [
  {
    id: 'PT-001',
    name: '田中 優子',
    dob: '1948-06-12',
    address: '東京都世田谷区上馬2-14-6',
    pharmacy: '城南みらい薬局',
    riskScore: 8,
    emergencyContact: {
      name: '田中 恒一',
      relation: '長男',
      phone: '090-1234-5678',
    },
    doctor: {
      name: '鈴木 恒一',
      clinic: '世田谷在宅クリニック',
      phone: '03-3412-1101',
    },
    medicalHistory: '慢性心不全、2型糖尿病、肺炎既往',
    allergies: 'ペニシリン系抗菌薬',
    currentMeds: 'フロセミド、メトホルミン、アムロジピン',
    visitNotes: '玄関暗証番号 4721。小型犬あり、訪問前連絡必須。',
  },
  {
    id: 'PT-002',
    name: '小川 正子',
    dob: '1942-11-02',
    address: '神奈川県横浜市港北区篠原西町18-4',
    pharmacy: '港北さくら薬局',
    riskScore: 6,
    emergencyContact: {
      name: '小川 真理',
      relation: '長女',
      phone: '080-4455-2233',
    },
    doctor: {
      name: '山口 恒一',
      clinic: '港北ホームケア診療所',
      phone: '045-509-8181',
    },
    medicalHistory: '関節リウマチ、慢性腎不全',
    allergies: 'なし',
    currentMeds: 'プレドニゾロン、アセトアミノフェン',
    visitNotes: 'エレベーターなし3階。転倒歴あり。',
  },
  {
    id: 'PT-003',
    name: '橋本 和子',
    dob: '1939-08-21',
    address: '東京都豊島区南池袋3-9-12',
    pharmacy: '池袋みどり薬局',
    riskScore: 4,
    emergencyContact: {
      name: '橋本 恒一',
      relation: '夫',
      phone: '090-9870-1221',
    },
    doctor: {
      name: '中村 恒一',
      clinic: '豊島在宅内科',
      phone: '03-5985-0303',
    },
    medicalHistory: '慢性心不全、貧血',
    allergies: 'NSAIDs',
    currentMeds: 'カルベジロール、鉄剤、利尿薬',
    visitNotes: '夜間はドアチェーン使用。インターホン後に氏名を名乗る。',
  },
  {
    id: 'PT-004',
    name: '清水 恒一',
    dob: '1951-01-15',
    address: '東京都中野区白鷺1-25-8',
    pharmacy: '中野しらさぎ薬局',
    riskScore: 9,
    emergencyContact: {
      name: '清水 麻衣',
      relation: '次女',
      phone: '080-7770-3388',
    },
    doctor: {
      name: '高橋 恒一',
      clinic: '中野訪問診療センター',
      phone: '03-5327-2210',
    },
    medicalHistory: 'レビー小体型認知症、高血圧',
    allergies: 'ラテックス',
    currentMeds: 'ドネペジル、クエチアピン、アムロジピン',
    visitNotes: '夕方以降せん妄増悪。家族同席時に説明を優先。',
  },
  {
    id: 'PT-005',
    name: '井上 恒一',
    dob: '1946-03-29',
    address: '東京都江東区住吉2-6-11',
    pharmacy: '江東あおぞら薬局',
    riskScore: 7,
    emergencyContact: {
      name: '井上 美香',
      relation: '妻',
      phone: '090-6654-2200',
    },
    doctor: {
      name: '吉田 恒一',
      clinic: '江東すみれクリニック',
      phone: '03-5600-4781',
    },
    medicalHistory: '糖尿病、末梢神経障害',
    allergies: 'なし',
    currentMeds: 'インスリングラルギン、ボグリボース',
    visitNotes: '血糖測定器は寝室棚。低血糖症状時は家族へ即連絡。',
  },
  {
    id: 'PT-006',
    name: '渡辺 美和',
    dob: '1957-12-07',
    address: '東京都新宿区西新宿4-32-2',
    pharmacy: '西新宿いろは薬局',
    riskScore: 3,
    emergencyContact: {
      name: '渡辺 恒一',
      relation: '弟',
      phone: '070-4451-7661',
    },
    doctor: {
      name: '松本 恒一',
      clinic: '新宿在宅総合診療所',
      phone: '03-6279-4902',
    },
    medicalHistory: '乳がん術後、慢性疼痛',
    allergies: '造影剤',
    currentMeds: 'トラマドール、プレガバリン',
    visitNotes: '夜間は携帯優先。インターホンに気づきにくい。',
  },
  {
    id: 'PT-007',
    name: '山本 直子',
    dob: '1944-09-18',
    address: '東京都世田谷区北沢5-10-3',
    pharmacy: '世田谷つばさ薬局',
    riskScore: 5,
    emergencyContact: {
      name: '山本 恒一',
      relation: '長男',
      phone: '090-2201-8890',
    },
    doctor: {
      name: '小林 恒一',
      clinic: '下北沢メディカルホーム',
      phone: '03-5453-6008',
    },
    medicalHistory: '慢性閉塞性肺疾患、骨粗しょう症',
    allergies: 'なし',
    currentMeds: 'チオトロピウム、ビタミンD製剤',
    visitNotes: '酸素濃縮器あり。停電時対応フローを家族と共有済み。',
  },
  {
    id: 'PT-008',
    name: '森田 恒一',
    dob: '1950-04-03',
    address: '東京都武蔵野市吉祥寺本町1-22-9',
    pharmacy: '吉祥寺つばめ薬局',
    riskScore: 2,
    emergencyContact: {
      name: '森田 由紀',
      relation: '妻',
      phone: '080-3098-9011',
    },
    doctor: {
      name: '藤井 恒一',
      clinic: '吉祥寺在宅クリニック',
      phone: '0422-27-0073',
    },
    medicalHistory: '高血圧、脂質異常症',
    allergies: 'なし',
    currentMeds: 'ロサルタン、ロスバスタチン',
    visitNotes: '鍵はキーボックス管理。番号は担当者限定共有。',
  },
]

function getRiskClass(score: number) {
  if (score <= 3) return 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
  if (score <= 6) return 'border-amber-500/40 bg-amber-500/20 text-amber-300'
  return 'border-rose-500/40 bg-rose-500/20 text-rose-300'
}

export default function PatientsPage() {
  useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return patientData

    return patientData.filter((patient) => patient.name.toLowerCase().includes(query))
  }, [searchQuery])

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">患者情報</h1>
          <p className="text-xs text-gray-400">在宅患者の基本情報・注意事項を確認</p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="患者名で検索"
            className="border-[#2a3553] bg-[#1a2035] pl-9"
          />
        </div>
      </div>

      {filteredPatients.length === 0 && (
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardContent className="p-6 text-center text-sm text-gray-400">
            該当する患者が見つかりません。
          </CardContent>
        </Card>
      )}

      {filteredPatients.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="cursor-pointer border-[#2a3553] bg-[#1a2035] transition hover:border-indigo-500/60"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-white">{patient.name}</p>
                      <p className="text-xs text-gray-400">生年月日: {patient.dob}</p>
                    </div>
                    <Badge variant="outline" className={cn('border text-xs', getRiskClass(patient.riskScore))}>
                      リスク {patient.riskScore}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-gray-300">{patient.address}</p>
                  <p className="mt-1 text-xs text-indigo-300">{patient.pharmacy}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">患者一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                    <TableHead className="text-gray-400">氏名</TableHead>
                    <TableHead className="text-gray-400">生年月日</TableHead>
                    <TableHead className="text-gray-400">住所</TableHead>
                    <TableHead className="text-gray-400">薬局</TableHead>
                    <TableHead className="text-right text-gray-400">リスク</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="cursor-pointer border-[#2a3553] hover:bg-[#11182c]"
                    >
                      <TableCell className="font-medium text-white">{patient.name}</TableCell>
                      <TableCell className="text-gray-300">{patient.dob}</TableCell>
                      <TableCell className="text-gray-300">{patient.address}</TableCell>
                      <TableCell className="text-indigo-300">{patient.pharmacy}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn('border text-xs', getRiskClass(patient.riskScore))}
                        >
                          {patient.riskScore}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={Boolean(selectedPatient)} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-3xl">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedPatient.name}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  生年月日: {selectedPatient.dob} ・ 担当薬局: {selectedPatient.pharmacy}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                  <p className="text-xs text-gray-400">住所</p>
                  <p className="mt-1 text-sm text-gray-100">{selectedPatient.address}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                    <p className="text-xs text-gray-400">緊急連絡先</p>
                    <p className="mt-1 text-sm text-white">{selectedPatient.emergencyContact.name}</p>
                    <p className="text-xs text-gray-300">続柄: {selectedPatient.emergencyContact.relation}</p>
                    <p className="text-xs text-indigo-300">{selectedPatient.emergencyContact.phone}</p>
                  </div>

                  <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                    <p className="text-xs text-gray-400">主治医情報</p>
                    <p className="mt-1 text-sm text-white">{selectedPatient.doctor.name}</p>
                    <p className="text-xs text-gray-300">{selectedPatient.doctor.clinic}</p>
                    <p className="text-xs text-indigo-300">{selectedPatient.doctor.phone}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                  <p className="text-xs text-gray-400">既往歴</p>
                  <p className="mt-1 text-sm text-gray-100">{selectedPatient.medicalHistory}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                    <p className="text-xs text-gray-400">アレルギー</p>
                    <p className="mt-1 text-sm text-gray-100">{selectedPatient.allergies}</p>
                  </div>

                  <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                    <p className="text-xs text-gray-400">現在薬</p>
                    <p className="mt-1 text-sm text-gray-100">{selectedPatient.currentMeds}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                  <p className="text-xs text-gray-400">訪問メモ</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-100">{selectedPatient.visitNotes}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
