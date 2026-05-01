// =============================================================================
// 전자책 설정 — 제목, 가격, 목차 등 모든 콘텐츠를 이 파일 하나에서 관리합니다.
// Source: BROSPICK — The Overseas Football Playbook (First Edition 2026)
// =============================================================================

export const EBOOK = {
  // ── 기본 정보 ──────────────────────────────────────────────────────────────
  title: 'The Overseas Football Playbook',
  subtitle:
    '해외 축구 진출을 꿈꾸는 선수들을 위한 단 하나의 실전 가이드.\n자기 평가부터 계약까지, 브로스픽이 직접 경험한 모든 것을 담았습니다.',
  originalPrice: 159000,  // 정가 (3차)
  phase1Price: 89000,     // 1차 얼리버드 가격
  phase2Price: 119000,    // 2차 가격
  price: 89000,           // 현재 실제 판매가 (결제 시 사용)
  year: '2026',
  edition: 'First Edition',

  // ── SEO ────────────────────────────────────────────────────────────────────
  seoTitle: 'The Overseas Football Playbook | 브로스픽 BROSPICK',
  seoDescription:
    '해외 축구 진출을 위한 완전한 실전 가이드. 자기 평가, 선수 패키지, 구단 컨택, 트라이얼, 계약까지 — 브로스픽이 직접 경험한 모든 과정을 담았습니다.',

  // ── 헤더 eyebrow 텍스트 ───────────────────────────────────────────────────
  eyebrow: 'BROSPICK E-BOOK · 2026',

  // ── Benefits 섹션 ──────────────────────────────────────────────────────────
  benefitsHeading: '이 책이 필요한 이유',
  benefits: [
    {
      title: '완전한 실전 로드맵',
      desc: '자기 평가부터 오퍼·계약까지, 해외 진출의 전 과정을 단계별로 정리했습니다. 막막함 없이 바로 시작할 수 있습니다.',
    },
    {
      title: '실제 경험자의 케이스',
      desc: 'Australia NPL, Philippines 등에서 뛴 선수들의 리얼 필드 노트와 성공·실패 사례를 그대로 담았습니다.',
    },
    {
      title: '14일 즉시 실행 플랜',
      desc: '읽고 끝나는 책이 아닙니다. 오늘부터 14일 안에 실행할 수 있는 단계별 액션 플랜과 체크리스트를 제공합니다.',
    },
  ],

  // ── 목차 ───────────────────────────────────────────────────────────────────
  tocHeading: '목차',
  toc: [
    {
      chapter: 'PART 00',
      title: 'START HERE — 시작하기',
      desc: '이 책의 활용법, 해외 진출의 현실, 그리고 당신이 지금 어디에 있는지 확인합니다.',
    },
    {
      chapter: 'PART 01',
      title: 'THE MAP — 해외 진출 로드맵',
      desc: '7단계 전체 프로세스 개요. 세미프로 루트, 리그 선택, 현실적인 타임라인을 제시합니다.',
    },
    {
      chapter: 'PART 02',
      title: 'SELF-ASSESSMENT & EVIDENCE',
      desc: '나는 어느 레벨인가? 하이라이트 영상 제작, Transfermarkt 프로필 세팅까지.',
    },
    {
      chapter: 'PART 03',
      title: 'PLAYER PACKAGE — 선수 패키지',
      desc: '5~10초 안에 눈길을 끄는 1-page 프로필, 하이라이트 영상, SNS 채널 구성법.',
    },
    {
      chapter: 'PART 04',
      title: 'FINDING OPPORTUNITIES & CONTACT',
      desc: '구단 리서치 방법, DM 전략, 이메일 템플릿, 그리고 팔로업 타임라인.',
    },
    {
      chapter: 'PART 05',
      title: 'TRIAL & EXECUTION — 트라이얼 실전',
      desc: '트라이얼 준비, 현지 도착 후 24시간 행동 가이드, 멘탈 관리까지.',
    },
    {
      chapter: 'PART 06',
      title: 'OFFERS, CONTRACTS & RISK',
      desc: '오퍼를 받으면 꼭 확인해야 할 7가지 체크리스트. 계약서 독소조항과 리스크 관리.',
    },
    {
      chapter: 'PART 07',
      title: 'CASES & 14-DAY PLAN',
      desc: '실제 선수들의 성공·실패 사례 분석. 지금 당장 시작하는 14일 실행 플랜.',
    },
    {
      chapter: 'PART 08',
      title: 'REAL FIELD NOTES & NEXT MOVE',
      desc: 'Australia NPL, Philippines, 유럽 루트 — 포지션별·리그별 실전 노트 모음.',
    },
    {
      chapter: 'APPENDIX',
      title: 'CHECKLISTS & Q&A',
      desc: '독자들이 가장 많이 묻는 질문 7가지 + 단계별 체크리스트 전체 수록.',
    },
  ],

  // ── 저자 정보 (About 섹션 추가 시 사용) ───────────────────────────────────
  authors: [
    { name: 'Hong Juyeong', role: 'Main Author' },
    { name: 'Kim Geon-oh', role: 'Main Author', career: 'Manningham FC (Australia) · MF/RW/LB · Australia NPL, Philippines', tag: 'AU NPL / PH' },
    { name: 'Jung Jiyeong', role: 'Editor' },
  ],
  fieldContributors: [
    { name: 'Choi Eun-woo', club: 'Tigers FC', league: 'Australia NPL Capital', tag: 'AU NPL' },
    { name: 'Kim Jun-yong', club: 'Sydney Olympic FC', league: 'Australia NPL NSW', tag: 'AU NPL' },
    { name: 'Lee Eun-pyo', club: 'Canberra White Eagles', league: 'Australia NPL', tag: 'AU NPL' },
  ],
} as const;
