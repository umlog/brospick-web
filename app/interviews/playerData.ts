import { Player } from './types';

export const playersData: Record<string, Player> = {
  'kim-geono': {
    id: 'kim-geono',
    basicInfo: {
      name: '김건오',
      nameEn: 'Kim Gun-Oh',
      team: 'Manningham FC (호주)',
      position: ['MF', 'RW', 'LB'],
      height: 176,
      weight: 70,
      birthDate: '2024.12.03',
      nationality: '대한민국',
    },
    career: [
      { period: '2017-2019', team: '중앙대학교사범대부속중학교' },
      { period: '2020-2022', team: '인천고등학교' },
      { period: '2023-2024', team: '청주대학교' },
      { period: '2024', team: 'TNT FC' },
      { period: '2024-2025', team: 'PFL | Maharlika FC' },
      { period: '2025', team: 'NPL | Launceston City' },
    ],
    strengths: [
      {
        name: '드리블',
        nameEn: 'Dribble',
        description: '뛰어난 돌파력',
      },
      {
        name: '크로스',
        nameEn: 'Cross Pass',
        description: '정확한 크로스 능력',
      },
      {
        name: '영리함',
        nameEn: 'Cleverness',
        description: '지능적인 플레이 메이킹',
      },
      {
        name: '헌신적',
        nameEn: 'Devotional',
        description: '팀을 위한 희생정신',
      },
      {
        name: '골 결정력',
        nameEn: 'Goal Determination',
        description: '높은 득점력',
      },
      {
        name: '프리킥',
        nameEn: 'Free Kick',
        description: '세트피스 능력',
      },
    ],
    stats: {
      'Cross': 95,
      'Dribbling': 95,
      'Free Kick': 85,
      'Cleverness': 85,
      'Goal Determination': 75,
      'Hard Work': 70,
    },
    interview: '[팀추구단] 청주대에서 후보 선수로 별다른 활약이 없던 평범한 선수였습니다. 국내외 해외 프로 진출을 꿈꾸며 독립구단에서 훈련과 활동을 병행하였지만 기존 한국 시스템에서는 프로나 해외 진출이 쉽지 않았습니다. 기회는 부족하고 과도한 비용 구조에서 어려움을 겪던 **브로스픽**을 통해 호주 멜버른으로 진출하게 되었습니다. 많은 선수들이 해외 무대에 도전할 수 있기를 바랍니다.',
    profileImage: '/interviews/asset/guno (1).jpeg',
  },
  'choi-eunwoo': {
    id: 'choi-eunwoo',
    basicInfo: {
      name: '최은우',
      nameEn: 'Choi Eun-Woo',
      team: 'Tigers FC (호주 NPL Capital)',
      position: ['LW', 'AMF'],
      height: 172,
      weight: 67,
      birthDate: '2023.01.23',
      nationality: '대한민국',
    },
    career: [
      { period: '2014-2015', team: '수원삼성블루윙즈 U-12' },
      { period: '2016-2018', team: '중앙대학교사범대부속중학교' },
      { period: '2019-2021', team: '인천고등학교' },
      { period: '2022-2023', team: '조선대학교' },
      { period: '2024', team: '퓨처시티즌스' },
      { period: '2025', team: 'HR FC' },
    ],
    strengths: [
      {
        name: '스피드',
        nameEn: 'Speed',
        description: '빠른 속도',
      },
      {
        name: '드리블',
        nameEn: 'Dribbling Ability',
        description: '뛰어난 개인기',
      },
      {
        name: '하드워크',
        nameEn: 'Hard Work',
        description: '꾸준한 노력',
      },
      {
        name: '역발 활용',
        nameEn: 'Right foot at left Striker',
        description: '역발 활용 능력',
      },
      {
        name: '강한 압박',
        nameEn: 'Strong Pressing',
        description: '전방 압박',
      },
      {
        name: '정밀함',
        nameEn: 'Precision',
        description: '정확성',
      },
      {
        name: '아이솔레이션',
        nameEn: 'Isolation',
        description: '1:1 돌파 능력',
      },
    ],
    stats: {
      'Speed': 95,
      'Dribbling': 95,
      'Hard Work': 85,
      'Pressing': 80,
      'Precision': 75,
      'Isolation': 85,
    },
    interview: '안녕하세요, 호주 축구 선수 최은우입니다. 국내에서 조선대 퓨처시티즌스에서 선수 생활을 이어갔지만 그 이상의 상위리그 진출에 어려움을 겪고 있었습니다. 독립 구단에서도 해외 진출을 위해 노력하였지만, 한국에서의 좋은 기회와 필수적인 구단들의 테스트 시에는 한계가 있다고 판단하였습니다. 혼자 에이전시 없이 해외 진출을 위해 많은 비용을 내야 해서 무리가 있었지만 팀 브로스픽을 통해서 저 장점과 하이라이트 영상 등의 어려움 등 더 높은 무대인 호주 NPL Tigers FC에 이상적인 조건으로 입단할 수 있었습니다. 저처럼 어려움을 겪는 선수가 있다면 브로스픽을 통해서 새로운 기회를 잡아 보셨으면 좋겠습니다! 감사합니다.',
    profileImage: '/interviews/asset/eunu (1).jpeg',
  },
};

export const brospickValues = [
  {
    title: '합리적인 비용 구조',
    titleEn: 'Reasonable Cost',
    description: '기존 에이전시의 과도한 비용 부담 해소',
    icon: '💰',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: '선수 중심 접근',
    titleEn: 'Player-Centric',
    description: '선수의 장점과 하이라이트 영상을 활용한 맞춤형 해외 진출 지원',
    icon: '⚽',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: '실질적인 기회 창출',
    titleEn: 'Real Opportunities',
    description: '한국 시스템의 한계를 극복하고 호주 NPL 등 해외 리그로의 실제 진출 성공',
    icon: '🌏',
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: '투명한 프로세스',
    titleEn: 'Transparent Process',
    description: '형식적인 테스트가 아닌 실질적인 기회 제공',
    icon: '✨',
    color: 'from-orange-500 to-red-500',
  },
];
