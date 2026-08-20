export type Product = {
  slug: string;
  category: string;
  title: string;
  seller: string;
  description: string;
  price: string;
  rating: string;
  reviews: string;
  accent: string;
  mark: string;
  pages: number;
  fileSize: string;
  summary: string;
  includes: string[];
};

export const products: Product[] = [
  {
    slug: "weekly-work-planner",
    category: "업무·생산성",
    title: "한 장으로 끝내는 주간 업무 플래너",
    seller: "정리의기술",
    description: "우선순위, 일정, 회고를 한눈에 정리하는 실전 템플릿",
    price: "4,900원",
    rating: "4.9",
    reviews: "128",
    accent: "mint",
    mark: "WEEK",
    pages: 18,
    fileSize: "4.2MB",
    summary:
      "일이 많을수록 계획은 단순해야 합니다. 한 주의 핵심 목표를 정하고, 해야 할 일과 회고를 한 흐름으로 이어주는 실전형 플래너입니다.",
    includes: ["주간 핵심 목표", "요일별 할 일", "중요도·진행상태 표시", "금요일 회고 질문"],
  },
  {
    slug: "30-day-english-journal",
    category: "공부·교육",
    title: "30일 영어 공부 기록장",
    seller: "오늘의공부",
    description: "매일의 학습량과 표현을 차곡차곡 쌓는 습관 노트",
    price: "6,900원",
    rating: "4.8",
    reviews: "92",
    accent: "yellow",
    mark: "30 DAYS",
    pages: 42,
    fileSize: "6.8MB",
    summary: "하루 10분 영어 습관을 만들 수 있도록 학습량, 새 표현, 복습 내용을 가볍게 기록하는 30일 노트입니다.",
    includes: ["30일 학습 기록", "오늘의 표현", "주간 복습표", "완주 체크리스트"],
  },
  {
    slug: "first-investment-note",
    category: "돈관리",
    title: "월급쟁이 첫 재테크 노트",
    seller: "머니소소",
    description: "통장 쪼개기부터 월간 자산 점검까지 쉬운 돈 관리",
    price: "9,900원",
    rating: "4.9",
    reviews: "214",
    accent: "blue",
    mark: "MONEY",
    pages: 36,
    fileSize: "5.4MB",
    summary: "복잡한 투자용어보다 지금 가진 돈의 흐름을 먼저 이해하도록 돕는 초보자용 월간 재정 기록장입니다.",
    includes: ["월간 자산표", "고정비 점검", "저축 목표", "월말 결산"],
  },
  {
    slug: "child-growth-book",
    category: "생활",
    title: "우리 아이 성장 기록북",
    seller: "다정한기록",
    description: "처음 웃은 날부터 소중한 순간을 남기는 성장 일기",
    price: "8,500원",
    rating: "5.0",
    reviews: "76",
    accent: "pink",
    mark: "GROW",
    pages: 48,
    fileSize: "9.1MB",
    summary: "아이의 작은 변화와 가족의 기억을 사진, 짧은 글과 함께 오래 남길 수 있는 성장 기록북입니다.",
    includes: ["월령별 기록", "처음의 순간", "사진 메모", "가족 편지"],
  },
  {
    slug: "sns-brand-planner",
    category: "디자인",
    title: "1인 브랜드 SNS 콘텐츠 기획서",
    seller: "스튜디오모브",
    description: "브랜드 톤부터 4주 콘텐츠 일정까지 한 번에 설계",
    price: "12,000원",
    rating: "4.7",
    reviews: "63",
    accent: "purple",
    mark: "BRAND",
    pages: 32,
    fileSize: "7.2MB",
    summary: "무엇을 올릴지 매번 고민하는 1인 브랜드를 위한 실전 콘텐츠 전략과 4주 실행 계획입니다.",
    includes: ["브랜드 핵심 문장", "콘텐츠 기둥", "4주 발행표", "성과 회고"],
  },
  {
    slug: "seoul-walk-map",
    category: "취미",
    title: "서울 동네 산책 기록 지도",
    seller: "걷는마음",
    description: "주말 산책 코스와 발견한 장소를 기록하는 감성 지도",
    price: "5,900원",
    rating: "4.9",
    reviews: "41",
    accent: "orange",
    mark: "WALK",
    pages: 24,
    fileSize: "8.5MB",
    summary: "익숙한 동네를 여행하듯 걸으며 경로, 장소, 생각을 기록할 수 있는 가벼운 산책 노트입니다.",
    includes: ["산책 경로", "장소 기록", "사진 메모", "다음 산책 계획"],
  },
  {
    slug: "freelancer-contract-checklist",
    category: "업무·생산성",
    title: "프리랜서 견적·계약 체크리스트",
    seller: "혼자서도일",
    description: "의뢰 접수부터 납품까지 놓치기 쉬운 항목을 점검",
    price: "7,500원",
    rating: "4.8",
    reviews: "109",
    accent: "lime",
    mark: "WORK",
    pages: 22,
    fileSize: "3.9MB",
    summary: "프리랜서가 프로젝트 시작 전후에 확인해야 할 일정, 범위, 비용, 수정 조건을 빠짐없이 점검합니다.",
    includes: ["의뢰 확인표", "견적 점검", "계약 전 질문", "납품 체크"],
  },
  {
    slug: "reading-question-cards",
    category: "공부·교육",
    title: "초등 문해력 질문 카드 100",
    seller: "책읽는부모",
    description: "읽고 생각하고 말하는 힘을 키우는 대화 질문 모음",
    price: "10,900원",
    rating: "5.0",
    reviews: "187",
    accent: "coral",
    mark: "100 Q",
    pages: 56,
    fileSize: "11.3MB",
    summary: "정답을 맞히는 독서보다 아이가 자기 생각을 말하도록 돕는 질문 100개를 주제별로 담았습니다.",
    includes: ["내용 이해 질문", "감정 질문", "상상 질문", "생각 확장 질문"],
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
