#!/usr/bin/env python3
"""任せて在宅 — テンプレートPDF一括生成"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import os

pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
FONT = 'HeiseiKakuGo-W5'
WIDTH, HEIGHT = A4
OUT_DIR = os.path.dirname(__file__)

BLUE = (0.15, 0.35, 0.65)
GRAY = (0.4, 0.4, 0.4)
LIGHT_GRAY = (0.85, 0.85, 0.85)


def header(c, y, title, subtitle=''):
    c.setFont(FONT, 14)
    c.setFillColorRGB(*BLUE)
    c.drawString(20*mm, y, title)
    if subtitle:
        c.setFont(FONT, 8)
        c.setFillColorRGB(*GRAY)
        c.drawString(20*mm, y - 14, subtitle)
        y -= 14
    c.setStrokeColorRGB(*BLUE)
    c.setLineWidth(1.5)
    c.line(20*mm, y - 6, WIDTH - 20*mm, y - 6)
    c.setFillColorRGB(0, 0, 0)
    c.setStrokeColorRGB(0, 0, 0)
    c.setLineWidth(0.5)
    return y - 22


def section(c, y, title):
    c.setFont(FONT, 10)
    c.setFillColorRGB(*BLUE)
    c.drawString(20*mm, y, f'■ {title}')
    c.setFillColorRGB(0, 0, 0)
    c.line(20*mm, y - 3, WIDTH - 20*mm, y - 3)
    return y - 16


def text(c, y, t, size=9, indent=22):
    c.setFont(FONT, size)
    c.drawString(indent*mm, y, t)
    return y - (size + 4)


def field(c, y, label, width=120, indent=22):
    c.setFont(FONT, 9)
    c.drawString(indent*mm, y, label)
    lw = len(label) * 3.5 + indent + 2
    c.line(lw*mm, y - 2, (indent + width)*mm, y - 2)
    return y - 16


def checkbox(c, y, label, indent=22):
    c.rect(indent*mm, y - 1, 3*mm, 3*mm)
    c.setFont(FONT, 9)
    c.drawString((indent + 5)*mm, y, label)
    return y - 14


def table_row(c, y, cells, col_widths, indent=20):
    """簡易テーブル行"""
    x = indent * mm
    for i, (cell, w) in enumerate(zip(cells, col_widths)):
        c.setFont(FONT, 8)
        c.drawString(x + 2*mm, y, cell)
        c.rect(x, y - 4, w*mm, 16)
        x += w * mm
    return y - 16


def table_header(c, y, cells, col_widths, indent=20):
    x = indent * mm
    for cell, w in zip(cells, col_widths):
        c.setFillColorRGB(0.9, 0.93, 0.97)
        c.rect(x, y - 4, w*mm, 16, fill=1)
        c.setFillColorRGB(0, 0, 0)
        c.setFont(FONT, 8)
        c.drawString(x + 2*mm, y, cell)
        c.rect(x, y - 4, w*mm, 16)
        x += w * mm
    return y - 16


# ============================
# 1. 役割分担表テンプレート
# ============================
def gen_role_template():
    path = os.path.join(OUT_DIR, 'role-assignment-template.pdf')
    c = canvas.Canvas(path, pagesize=A4)
    y = HEIGHT - 20*mm

    y = header(c, y, '役割分担表', '在宅導入 — 役割・責任者・代替担当の整理')
    y -= 4

    y = field(c, y, '薬局名:')
    y = field(c, y, '作成日:        年    月    日')
    y -= 8

    y = section(c, y, '主要役割')
    cols = ['役割', '担当者名', '連絡先', '不在時の代替者']
    widths = [35, 40, 45, 45]
    y = table_header(c, y, cols, widths)
    roles = [
        '在宅責任者',
        '管理薬剤師',
        '主担当薬剤師',
        '副担当薬剤師',
        '事務担当',
        '夜間対応者',
        '教育担当',
    ]
    for role in roles:
        y = table_row(c, y, [role, '', '', ''], widths)
    y -= 8

    y = section(c, y, '意思決定フロー')
    y = text(c, y, '判断に迷った場合の相談先を明確にしてください。')
    y -= 4
    items = [
        ('患者受入の可否判断', ''),
        ('緊急時の対応判断', ''),
        ('医師への連絡判断', ''),
        ('家族への説明判断', ''),
        ('シフト変更の判断', ''),
    ]
    cols2 = ['判断内容', '最終判断者']
    widths2 = [85, 80]
    y = table_header(c, y, cols2, widths2)
    for item, val in items:
        y = table_row(c, y, [item, val], widths2)
    y -= 8

    y = section(c, y, '確認欄')
    y = text(c, y, '□ 全スタッフに共有済み    □ 代替者に確認済み    □ 掲示済み')
    y -= 8
    y = field(c, y, '責任者確認サイン:')

    c.setFont(FONT, 7)
    c.setFillColorRGB(*GRAY)
    c.drawCentredString(WIDTH/2, 20*mm, '任せて在宅 — 役割分担表テンプレート')
    c.save()
    print(f'生成: {path}')


# ============================
# 2. 受入条件表テンプレート
# ============================
def gen_acceptance_template():
    path = os.path.join(OUT_DIR, 'acceptance-criteria-template.pdf')
    c = canvas.Canvas(path, pagesize=A4)
    y = HEIGHT - 20*mm

    y = header(c, y, '受入条件表', '在宅導入 — 患者受入判断の基準整理')
    y -= 4

    y = field(c, y, '薬局名:')
    y = field(c, y, '作成日:        年    月    日')
    y -= 8

    categories = [
        ('施設系患者', [
            '対応可能な施設タイプ',
            '受入上限人数',
            '必要な設備・備品',
            '受入可否の判断者',
            '断る場合の基準',
        ]),
        ('個人宅患者', [
            '対応可能なエリア',
            '訪問可能な時間帯',
            '必要な設備・備品',
            '受入可否の判断者',
            '断る場合の基準',
        ]),
        ('緊急時対応', [
            '夜間対応の可否',
            '緊急連絡先',
            '対応可能な範囲',
            '判断者・相談先',
            '対応できない場合の代替',
        ]),
    ]

    for cat_name, items in categories:
        y = section(c, y, cat_name)
        cols = ['項目', '内容・基準', '備考']
        widths = [45, 70, 50]
        y = table_header(c, y, cols, widths)
        for item in items:
            y = table_row(c, y, [item, '', ''], widths)
        y -= 6

    y = section(c, y, '共通注意事項')
    y = text(c, y, '□ 体制が整わない状態では受入しない')
    y = text(c, y, '□ 受入後のフォロー体制を確認済み')
    y = text(c, y, '□ 断った場合の紹介先を確認済み')
    y -= 8
    y = field(c, y, '責任者確認サイン:')

    c.setFont(FONT, 7)
    c.setFillColorRGB(*GRAY)
    c.drawCentredString(WIDTH/2, 20*mm, '任せて在宅 — 受入条件表テンプレート')
    c.save()
    print(f'生成: {path}')


# ============================
# 3. 初回受入フロー
# ============================
def gen_flow_template():
    path = os.path.join(OUT_DIR, 'first-acceptance-flow.pdf')
    c = canvas.Canvas(path, pagesize=A4)
    y = HEIGHT - 20*mm

    y = header(c, y, '初回患者受入フロー', '在宅導入 — 問い合わせから初回訪問後の共有まで')
    y -= 4

    y = field(c, y, '薬局名:')
    y = field(c, y, '作成日:        年    月    日')
    y -= 8

    steps = [
        ('STEP 1', '問い合わせ受付', [
            '連絡元（医師/ケアマネ/家族/その他）:',
            '患者基本情報の確認:',
            '受入可否の一次判断者:',
            '→ 受入条件表と照合',
        ]),
        ('STEP 2', '情報収集・準備', [
            '処方内容の確認:',
            '必要な設備・備品の確認:',
            '担当薬剤師のアサイン:',
            '初回訪問日の調整:',
        ]),
        ('STEP 3', '医師・多職種連携', [
            '医師への連絡・確認事項:',
            'ケアマネとの情報共有:',
            '訪問看護との連携:',
            '必要書類の準備:',
        ]),
        ('STEP 4', '家族への説明', [
            '説明担当者:',
            '説明内容（費用・訪問頻度・緊急時）:',
            '同意の確認方法:',
            '連絡先の交換:',
        ]),
        ('STEP 5', '初回訪問', [
            '訪問担当者:',
            '持参物チェック:',
            '訪問後の記録:',
            '次回訪問予定:',
        ]),
        ('STEP 6', '訪問後の共有', [
            '報告先（医師/ケアマネ/チーム内）:',
            '報告方法:',
            '次のアクション:',
            '改善点のメモ:',
        ]),
    ]

    for step_num, step_title, items in steps:
        y = section(c, y, f'{step_num}: {step_title}')
        for item in items:
            if item.startswith('→'):
                y = text(c, y, item, size=8, indent=24)
            else:
                y = field(c, y, item, width=110, indent=24)
        y -= 4

    c.setFont(FONT, 7)
    c.setFillColorRGB(*GRAY)
    c.drawCentredString(WIDTH/2, 20*mm, '任せて在宅 — 初回患者受入フローテンプレート')
    c.save()
    print(f'生成: {path}')


# ============================
# 4. 初回受入前チェックリスト
# ============================
def gen_checklist_template():
    path = os.path.join(OUT_DIR, 'pre-acceptance-checklist.pdf')
    c = canvas.Canvas(path, pagesize=A4)
    y = HEIGHT - 20*mm

    y = header(c, y, '初回受入前チェックリスト', '在宅導入 — 受入準備の最終確認')
    y -= 4

    y = field(c, y, '薬局名:')
    y = field(c, y, '確認日:        年    月    日')
    y = field(c, y, '確認者:')
    y -= 8

    categories = {
        '経営・方針': [
            'オーナーが在宅に取り組む方針を決定・表明している',
            'スタッフに在宅の必要性が周知されている',
            '在宅の対象患者像が明確になっている',
        ],
        '体制・役割分担': [
            '役割分担表が作成されている',
            '責任者・主担当・代替担当が明確',
            '不在時の対応フローがある',
            'スタッフが在宅に前向きな姿勢を持っている',
        ],
        '教育': [
            '在宅の基本知識の教育が完了している',
            '必要な手技（クリーンベンチ等）の研修が完了している',
            '加算の算定条件を理解している',
        ],
        '受入準備': [
            '受入条件表が作成されている',
            '初回受入フローが作成されている',
            '必要な備品・設備が揃っている',
            '必要書類のテンプレートがある',
        ],
        '連携': [
            '医師との連携方法が決まっている',
            'ケアマネとの連絡方法が決まっている',
            '家族への説明方法が準備されている',
        ],
        '緊急対応': [
            '緊急時の連絡先リストがある',
            '夜間対応の方針が決まっている（対応する/しない含む）',
            '患者情報の記録方法が決まっている',
        ],
    }

    for cat_name, items in categories.items():
        y = section(c, y, cat_name)
        for item in items:
            y = checkbox(c, y, item)
        y -= 4

    y -= 8
    y = section(c, y, '総合判定')
    y = text(c, y, '□ すべて確認済み → 初回受入に進める')
    y = text(c, y, '□ 未完了項目あり → 以下に記入')
    y -= 4
    y = field(c, y, '未完了事項:', width=130)
    y = field(c, y, '対応予定日:', width=130)
    y -= 8
    y = field(c, y, '責任者サイン:')

    c.setFont(FONT, 7)
    c.setFillColorRGB(*GRAY)
    c.drawCentredString(WIDTH/2, 20*mm, '任せて在宅 — 初回受入前チェックリスト')
    c.save()
    print(f'生成: {path}')


# ============================
# 5. 必要備品一覧
# ============================
def gen_equipment_list():
    path = os.path.join(OUT_DIR, 'equipment-list.pdf')
    c = canvas.Canvas(path, pagesize=A4)
    y = HEIGHT - 20*mm

    y = header(c, y, '在宅に必要な備品一覧', '在宅導入 — 設備・備品の準備チェック')
    y -= 4

    y = field(c, y, '薬局名:')
    y = field(c, y, '確認日:        年    月    日')
    y -= 8

    categories = {
        '必須備品': [
            ('往診バッグ', '訪問時の薬剤・器具搬送用'),
            ('保冷バッグ・保冷剤', '温度管理が必要な薬剤用'),
            ('血圧計', 'バイタルサイン確認用'),
            ('体温計', '同上'),
            ('パルスオキシメーター', '同上'),
            ('消毒用アルコール', '訪問時の衛生管理'),
            ('使い捨て手袋', '同上'),
            ('お薬カレンダー/お薬ボックス', '服薬管理支援用'),
            ('残薬調整用バッグ', '残薬回収用'),
        ],
        '設備（あれば対応範囲が広がる）': [
            ('クリーンベンチ', '無菌調剤用'),
            ('シリンジポンプ', '持続注入用'),
            ('輸液ポンプ', '点滴管理用'),
            ('麻薬金庫', '麻薬管理用'),
        ],
        '書類・IT': [
            ('訪問記録用紙/タブレット', '訪問時の記録'),
            ('患者情報管理シート', '情報共有用'),
            ('FAX/メール環境', '医師・多職種連携'),
            ('写真撮影機器', '創部等の記録用'),
        ],
    }

    cols = ['品目', '用途', '有無', '備考']
    widths = [45, 50, 20, 50]

    for cat_name, items in categories.items():
        y = section(c, y, cat_name)
        y = table_header(c, y, cols, widths)
        for name, purpose in items:
            y = table_row(c, y, [name, purpose, '□', ''], widths)
        y -= 6

    c.setFont(FONT, 7)
    c.setFillColorRGB(*GRAY)
    c.drawCentredString(WIDTH/2, 20*mm, '任せて在宅 — 必要備品一覧')
    c.save()
    print(f'生成: {path}')


if __name__ == '__main__':
    gen_role_template()
    gen_acceptance_template()
    gen_flow_template()
    gen_checklist_template()
    gen_equipment_list()
    print('\n全テンプレート生成完了！')
