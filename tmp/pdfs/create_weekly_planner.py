"""PAGEPORT의 결제·다운로드 시험에 사용할 주간 업무 플래너 샘플 PDF를 만듭니다."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# 만들어진 PDF가 언제나 프로젝트의 output/pdf 폴더에 저장되도록 기준 위치를 계산합니다.
ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "pageport-weekly-work-planner-sample.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("AppleGothic", "/System/Library/Fonts/Supplemental/AppleGothic.ttf"))

INK = HexColor("#17231D")
CREAM = HexColor("#F6F1E7")
ORANGE = HexColor("#FF5C35")
GREEN = HexColor("#B8D4BC")
LINE = HexColor("#C9CEC8")
WHITE = HexColor("#FFFDF7")

width, height = A4
c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
c.setTitle("PAGEPORT 주간 업무 플래너 - 시험용 샘플")
c.setAuthor("PAGEPORT")


def header(page_label: str):
    """각 PDF 페이지 위쪽에 같은 로고와 페이지 이름을 그립니다."""
    c.setFillColor(CREAM)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(42, height - 42, "PAGEPORT")
    c.setFillColor(ORANGE)
    c.circle(133, height - 38, 2.5, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("AppleGothic", 8)
    c.drawRightString(width - 42, height - 41, page_label)
    c.setStrokeColor(INK)
    c.setLineWidth(0.7)
    c.line(42, height - 55, width - 42, height - 55)


# 첫 번째 페이지에는 주간 목표와 월요일부터 금요일까지의 일정 칸을 만듭니다.
header("WEEKLY WORK PLANNER · 01")
c.setFont("AppleGothic", 10)
c.setFillColor(HexColor("#496656"))
c.drawString(42, height - 90, "이번 주의 방향을 한 장에 정리하세요")
c.setFillColor(INK)
c.setFont("AppleGothic", 28)
c.drawString(42, height - 126, "주간 업무 플래너")

c.setFont("AppleGothic", 9)
c.drawString(42, height - 158, "기간")
c.setStrokeColor(LINE)
c.line(74, height - 160, 235, height - 160)
c.drawString(272, height - 158, "이번 주 핵심 목표")
c.line(356, height - 160, width - 42, height - 160)

c.setFillColor(GREEN)
c.roundRect(42, height - 300, 210, 112, 7, fill=1, stroke=0)
c.setFillColor(INK)
c.setFont("AppleGothic", 12)
c.drawString(58, height - 215, "가장 중요한 일 3가지")
c.setFont("AppleGothic", 9)
for index in range(3):
    y = height - 242 - index * 25
    c.circle(60, y + 3, 5, fill=0, stroke=1)
    c.line(74, y, 234, y)

c.setFillColor(WHITE)
c.setStrokeColor(LINE)
c.roundRect(270, height - 300, width - 312, 112, 7, fill=1, stroke=1)
c.setFillColor(INK)
c.setFont("AppleGothic", 12)
c.drawString(286, height - 215, "미리 막을 위험")
c.setFont("AppleGothic", 9)
for index in range(3):
    y = height - 242 - index * 25
    c.line(286, y, width - 58, y)

days = ["월", "화", "수", "목", "금"]
top = height - 335
box_width = (width - 84 - 32) / 5
for index, day in enumerate(days):
    x = 42 + index * (box_width + 8)
    c.setFillColor(ORANGE if index == 0 else WHITE)
    c.setStrokeColor(INK)
    c.roundRect(x, top - 232, box_width, 232, 6, fill=1, stroke=1)
    c.setFillColor(WHITE if index == 0 else INK)
    c.setFont("AppleGothic", 12)
    c.drawCentredString(x + box_width / 2, top - 24, day)
    c.setStrokeColor(HexColor("#D6D9D4"))
    for row in range(6):
        y = top - 55 - row * 28
        c.line(x + 10, y, x + box_width - 10, y)

c.setFillColor(INK)
c.setFont("AppleGothic", 8)
c.drawString(42, 42, "시험용 샘플 PDF · 실제 판매 상품이 아닙니다")
c.drawRightString(width - 42, 42, "1 / 2")
c.showPage()

# 두 번째 페이지에는 한 주를 정리하는 회고 질문과 메모 칸을 만듭니다.
header("WEEKLY WORK PLANNER · 02")
c.setFillColor(INK)
c.setFont("AppleGothic", 25)
c.drawString(42, height - 105, "주간 회고")
c.setFont("AppleGothic", 10)
c.setFillColor(HexColor("#59655E"))
c.drawString(42, height - 128, "한 주를 마무리하고 다음 주의 선택을 가볍게 만드세요.")

sections = [
    ("이번 주에 잘한 일", GREEN, 150),
    ("막혔던 일과 배운 점", WHITE, 150),
    ("다음 주에 이어갈 일", HexColor("#F4D460"), 150),
]
y = height - 170
for title, color, section_height in sections:
    c.setFillColor(color)
    c.setStrokeColor(INK)
    c.roundRect(42, y - section_height, width - 84, section_height, 8, fill=1, stroke=1)
    c.setFillColor(INK)
    c.setFont("AppleGothic", 13)
    c.drawString(58, y - 28, title)
    c.setStrokeColor(HexColor("#B9BFB9"))
    for row in range(4):
        line_y = y - 55 - row * 23
        c.line(58, line_y, width - 58, line_y)
    y -= section_height + 18

c.setFillColor(INK)
c.setFont("AppleGothic", 8)
c.drawString(42, 42, "전문 지식이 오가는 디지털 문서 마켓 · PAGEPORT")
c.drawRightString(width - 42, 42, "2 / 2")
c.save()

print(OUTPUT)
