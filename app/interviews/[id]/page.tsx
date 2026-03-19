import Link from 'next/link';
import Image from 'next/image';
import VideoEmbed from '../../components/embeds/VideoEmbed';
import styles from './interview-detail.module.css';


// 실제로는 데이터베이스나 API에서 가져올 데이터
const interviews: Record<string, {
  id: number;
  playerName: string;
  team: string;
  position: string;
  status: string;
  date: string;
  image: string;
  content: string;
  highlights: string[];
  videoUrl?: string;
}> = {
  '1': {
    id: 1,
    playerName: '김건오',
    team: 'Manningham FC (호주)',
    position: 'MF, RW, LB',
    status: '해외 진출',
    date: '2026.01.12',
    image: '/players/guno/guno-profile.jpg',
    videoUrl: 'https://www.instagram.com/reel/DTH6tYJgSv7/embed',
    content: `# 무명에서 호주 리그까지, 김건오의 도전

## 누구인가

| 항목 | 정보 |
|------|------|
| 이름 | 김건오 (Kim Gun-Oh) |
| 포지션 | MF, RW, LB |
| 신장/체중 | 176cm / 70kg |
| 생년월일 | 2004년 3월 12일 |
| 국적 | 대한민국 |
| 현소속 | Manningham FC (호주) |

> "기회는 부족하고 과도한 비용 구조에서 어려움을 겪던 한국 축구 시스템을 벗어나, 해외 무대에 도전할 수 있었습니다."

## 시작은 평범했다

청주대학교에서 뛰던 평범한 후보 선수. 화려한 득점 기록도, 언론의 주목도 없었다. 하지만 김건오에게는 특별한 강점이 있었다.

![img]/players/guno/action-1.jpg

주요 강점:
- 드리블: 뛰어난 돌파력
- 크로스: 정확한 크로스 능력
- 영리함: 지능적인 플레이 메이킹
- 헌신적: 팀을 위한 희생정신
- 골 결정력: 높은 득점력
- 프리킥: 세트피스 능력

묵묵히 자신의 플레이를 완성해갔다.

## 국내 커리어와 도전

| 기간 | 소속팀 |
|------|--------|
| 2017 - 2019 | 중앙대학교사범대부속중학교 |
| 2020 - 2022 | 인창고등학교 |
| 2023 - 2024 | 청주대학교 |
| First half of 2024 | TNT FC |
| Second half of 2024 | PFL Maharlika FC 
| 2025 - Now | NPL l Launceston city 

국내외 해외 프로 진출을 꿈꾸며 독립구단에서 훈련과 활동을 병행했으나, 기존 한국 시스템에서는 프로나 해외 진출이 쉽지 않았습니다.

![img]/players/guno/action-2.jpg

브로스픽과의 협업으로 자신의 플레이를 영상으로 정리했다. 단순한 하이라이트가 아닌, 자신의 강점을 보여주는 콘텐츠였다.

## 호주로 향하는 결단

해외 구단들이 관심을 보이기 시작했다. 기회는 부족하고 과도한 비용 구조에서 어려움을 겪던 상황을 벗어나, 호주로의 해외 진출이 성사되었습니다.

2025년, 김건오는 호주 NPL의 Launceston City를 거쳐 현재 Manningham FC에서 새로운 도전을 이어가고 있습니다.

![img]/players/guno/action-3.jpg

## 메시지

> "많은 선수들이 해외 무대에 도전할 수 있기를 바랍니다."

한국의 기존 시스템만으로는 기회를 얻기 어려웠던 선수도, 적절한 플랫폼과 지원을 통해 해외 무대에서 자신의 능력을 펼칠 수 있다는 것을 보여주는 사례입니다.

김건오의 도전은 계속된다. 더 높은 무대를 향해, 그의 축구 인생은 이제부터 시작이다.`,
    highlights: [
      '청주대학교에서 후보 선수로 시작',
      '독립구단 거쳐 해외 진출 준비',
      '브로스픽과의 협업으로 호주 진출',
      '현재 Manningham FC에서 활약 중',
    ],
  },
  '2': {
    id: 2,
    playerName: '최은우',
    team: 'Tigers FC (호주 NPL Capital)',
    position: 'LW, AMF',
    status: '프로 입단',
    date: '2024.02.20',
    image: '/players/eunu/profile.jpeg',
    videoUrl: 'https://www.instagram.com/reel/DTPe-6RgdD0/?igsh=MWtidHpiYjlhZW01bQ==',
    content: `# 묵묵함 속에서 피어난 기회, 최은우의 이야기

## 누구인가

| 항목 | 정보 |
|------|------|
| 이름 | 최은우 (Choi Eun-Woo) |
| 포지션 | LW, AMF |
| 신장/체중 | 172cm / 67kg |
| 생년월일 | 2003년 1월 23일 |
| 국적 | 대한민국 |
| 현소속 | Tigers FC (호주 NPL Capital) |

> "한국에서의 좋은 기회와 필수적인 구단들의 테스트 시에는 한계가 있다고 판단하였습니다. 브로스픽을 통해서 더 높은 무대인 호주 NPL에 이상적인 조건으로 입단할 수 있었습니다."

## 시작은 평범했다

조선대학교와 평택 시티즌에서 선수 생활을 이어갔지만, 그 이상의 상위리그 진출에 어려움을 겪고 있었습니다. 수원삼성블루윙즈 U-12 출신으로 시작한 축구 인생, 하지만 프로 무대까지 가는 길은 순탄치 않았습니다.

![img]/players/eunu/action-1.jpeg

주요 강점:
- 스피드: 빠른 속도
- 드리블: 뛰어난 개인기
- 하드워크: 꾸준한 노력
- 아이솔레이션: 1:1 돌파 능력
- 역발 활용: 역발 활용 능력
- 강한 압박: 전방 압박
- 정밀함: 정확성

묵묵히 자신의 플레이를 완성해갔다.

## 국내 커리어와 도전

| 기간 | 소속팀 |
|------|--------|
| 2014-2015 | 수원삼성블루윙즈 U-12 |
| 2016-2018 | 중앙대학교사범대부속중학교 |
| 2019-2021 | 인창고등학교 |
| 2022-2023 | 조선대학교 |
| 2024 | 평택 시티즌 |
| 2025 | HR FC |

독립 구단에서도 해외 진출을 위해 노력하였지만, 한국에서의 좋은 기회와 필수적인 구단들의 테스트 시에는 한계가 있다고 판단하였습니다. 혼자 에이전시 없이 해외 진출을 위해 많은 비용을 내야 해서 무리가 있었습니다.

![img]/players/eunu/action-2.jpeg

브로스픽과의 협업으로 자신의 플레이를 영상으로 정리했다. 단순한 하이라이트가 아닌, 자신의 강점을 보여주는 콘텐츠였다.

## 호주로 향하는 결단

해외 구단들이 관심을 보이기 시작했다. 기회는 부족하고 과도한 비용 구조에서 어려움을 겪던 상황을 벗어나, 호주로의 해외 진출이 성사되었습니다.

2025년, 최은우는 
호주 NPL Capital의 Tigers FC에 이상적인 조건으로 입단하게 되었습니다.

![img]/players/eunu/action-3.jpeg

## 메시지

> "저처럼 어려움을 겪는 선수가 있다면 브로스픽을 통해서 새로운 기회를 잡아 보셨으면 좋겠습니다!"

한국의 기존 시스템만으로는 기회를 얻기 어려웠던 선수도, 적절한 플랫폼과 지원을 통해 해외 무대에서 자신의 능력을 펼칠 수 있다는 것을 보여주는 사례입니다.

최은우의 도전은 계속된다. 더 높은 무대를 향해, 그의 축구 인생은 이제부터 시작이다.`,
    highlights: [
      '수원삼성 유스 출신',
      '조선대-평택 시티즌 거쳐',
      '브로스픽을 통한 호주 진출',
      '현재 Tigers FC에서 활약 중',
    ],
  },

  '5': {
    id: 5,
    playerName: '유은철',
    team: '동국대학교',
    position: 'LW, RB',
    status: '대학 활동',
    date: '2025.03.19',
    image: '/players/yooeuncheol/profile.jpeg',
    content: `# 16년 축구 인생이 만들어낸 무기, 유은철의 이야기

## 누구인가

| 항목 | 정보 |
|------|------|
| 이름 | 유은철 (Yoo Eun-Cheol) |
| 포지션 | LW, RB |
| 신장/체중 | 172cm / 65kg |
| 생년월일 | 2004년 7월 9일 |
| 국적 | 대한민국 |
| 현소속 | 동국대학교 |

> "16년 축구 인생으로 다져진 단단한 멘탈과 흔들리지 않는 마인드셋은 경기 흐름을 주도하는 가장 강력한 무기입니다."

## 7살부터 시작된 엘리트 코스

7살에 축구를 시작한 유은철은 청주 청남초등학교부터 천안축구센터 U15, 경기FC광명시민 U18까지 초·중·고 내내 전국대회 입상이라는 성과를 거두며 엘리트 코스를 밟아왔습니다.

화려한 성과를 바탕으로 동국대학교에 진학하며 대학 무대에서도 자신의 가치를 증명하고 있습니다.

![img]/players/yooeuncheol/yooeuncheol (1).jpeg

주요 강점:
- 순간스피드: 폭발적인 순간 가속력
- 드리블: 저돌적인 돌파 능력
- 슈팅: 수비 타이밍을 뺏는 반박자 빠른 슈팅
- 마무리: 결정적인 순간의 득점 능력
- 활동량: 측면을 쉼 없이 커버하는 체력

## 커리어

| 기간 | 소속팀 |
|------|--------|
| 초등 | 청주 청남초등학교 |
| 중학교 | 천안축구센터 U15 |
| 고등학교 | 경기FC광명시민 U18 |
| 현재 | 동국대학교 |

## 양쪽을 모두 소화하는 선수

유은철의 가장 큰 특징은 측면 공격수(LW)와 측면 수비수(RB) 두 포지션을 모두 소화한다는 점입니다. 공격과 수비의 경계를 넘나드는 이 유연성은 16년간 다양한 역할을 경험하며 만들어진 결과입니다.

![img]/players/yooeuncheol/yooeuncheol (2).jpeg

2026년 전국대회에서는 팀을 4강으로 이끄는 활약을 펼쳤습니다. 폭발적인 순간 스피드와 반박자 빠른 슈팅으로 상대 수비를 위협하며 팀의 핵심 자원임을 증명했습니다.

![img]/players/yooeuncheol/yooeuncheol (3).jpeg

## 메시지

> "흔들리지 않는 마인드셋으로 계속 나아가겠습니다."

초등학교부터 대학까지 한 길을 걸어온 16년의 축구 인생. 단단하게 다져진 멘탈과 두 포지션을 아우르는 기술로, 유은철의 다음 무대는 더 높은 곳을 향한다.`,
    highlights: [
      '7살부터 시작한 16년 엘리트 축구 코스',
      '초·중·고 전국대회 입상 경력',
      '2026년 전국대회 팀 4강 진출 기여',
      'LW·RB 양 포지션 소화 가능',
    ],
  },

  '4': {
    id: 4,
    playerName: '이은표',
    team: 'Canberra White Eagles (호주 NPL)',
    position: 'LW, RW, ST',
    status: '해외 진출',
    date: '2025.03.19',
    image: '/players/eunpyo/profile.jpeg',
    content: `# 10년 사이드백에서 공격수로, 이은표의 전환

## 누구인가

| 항목 | 정보 |
|------|------|
| 이름 | 이은표 (Lee Eun-Pyo) |
| 포지션 | LW, RW, ST |
| 신장/체중 | 175cm / 66kg |
| 생년월일 | 2003년 6월 29일 |
| 국적 | 대한민국 |
| 현소속 | Canberra White Eagles (호주 NPL) |

> "어떤 상황에서도 팀에 도움이 되는 선수가 되기 위해 계속 발전하고 있습니다."

## 10년을 버텨온 시간

송탄주니어 FC에서 시작해 평택블루윙즈 U-15, 천안제일고, KHT일동고를 거치며 약 10년을 사이드백으로 뛰었습니다.

눈에 띄는 스타 플레이어는 아니었지만, 팀을 위해 헌신하고 맡은 역할을 책임감 있게 수행해왔습니다. 기본기와 성실함을 바탕으로 꾸준히 성장하는 것, 그것이 이은표의 축구였습니다.

![img]/players/eunpyo/eunpyo (1).jpeg

## 대학에서 찾아온 전환점

2022년 선문대학교에 진학하며 좋은 감독님을 만났습니다. 그 만남이 이은표의 축구 인생을 바꿨습니다.

감독님의 판단으로 사이드백에서 공격수로 포지션을 전향하게 되었습니다. 10년간 수비적 감각을 쌓아온 선수가 공격수로서 생각하고 움직여야 하는 변화였습니다. 새로운 포지션에 적응하는 과정에서 어려움도 있었지만, 꾸준한 노력으로 공격수로서의 움직임과 역할을 하나씩 익혀나갔습니다.

주요 강점:
- 활동량: 뛰어난 활동량과 왕성한 체력
- 침투: 빠른 침투 움직임
- 득점력: 마무리 득점 능력
- 전방압박: 수비 시 강한 전방압박 능력
- 마무리: 드리블과 슈팅 마무리 능력

![img]/players/eunpyo/eunpyo (2).jpeg

## 진주시민축구단에서의 도전

| 기간 | 소속팀 |
|------|--------|
| 초등 | 송탄주니어 FC |
| 2017-2018 | 평택블루윙즈 U-15 |
| 2019 | 천안제일고 |
| 2020-2021 | KHT일동고 |
| 2022-2024 | 선문대학교 |
| 2025 | 진주시민축구단 |
| 2025 | Canberra White Eagles (호주 NPL) |

대학을 마치고 2025년 진주시민축구단에서 활동하며 경험을 쌓은 이은표는, 브로스픽을 통해 호주 NPL의 Canberra White Eagles에 진출하게 되었습니다. 현재는 득점뿐만 아니라 전방 압박, 활동량, 연계 플레이 등 팀 전술에 기여하는 부분을 강점으로 삼고 있습니다. 10년간 수비에서 쌓은 전술 이해도와 헌신이 공격수로서도 빛을 발하고 있습니다.

![img]/players/eunpyo/eunpyo (3).jpeg

## 메시지

> "어떤 상황에서도 팀에 도움이 되는 선수가 되기 위해 계속 발전하고 있습니다."

10년의 사이드백 경력을 발판 삼아 공격수로 새로운 출발선에 선 이은표. 그의 도전은 이제 시작이다.`,
    highlights: [
      '초·중·고 약 10년 사이드백으로 활약',
      '선문대학교에서 공격수로 포지션 전향',
      '뛰어난 활동량과 전방압박이 강점',
      '브로스픽을 통해 호주 NPL Canberra White Eagles 진출',
    ],
  },

  '3': {
    id: 3,
    playerName: '김준용',
    team: 'Sydney Olympic FC (호주 NPL NSW)',
    position: 'CM, DMF, AMF',
    status: '프로 입단',
    date: '2025.03.01',
    image: '/players/junyong/profile.png',
    videoUrl: 'https://www.instagram.com/p/DUPxRriCRSK/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==',
    content: `# 묵묵한 시간 끝에 열린 해외 무대, 김준용의 선택

## 누구인가

| 항목 | 정보 |
|------|------|
| 이름 | 김준용 (Kim Jun-Yong) |
| 포지션 | CM, DMF, AMF |
| 신장/체중 | 180cm / 74kg |
| 생년월일 | 2004년 7월 2일 |
| 국적 | 대한민국 |
| 현소속 | Sydney Olympic FC (호주 NPL NSW) |

> "국내에서 계속 도전했지만, 현실적으로 상위리그 진출은 너무 어려웠습니다. 브로스픽을 통해 해외라는 새로운 길을 선택할 수 있었습니다."

## 포기하지 않은 시간들

고등학교 졸업 후 대학무대에서 꾸준히 경기를 치렀던 김준용은  
현실적인 한계를 절실히 느꼈습니다.  
이후 TNT FC에서 약 2년에 걸쳐 운동과 아르바이트를 병행하며  
스스로를 단련하는 시간을 보냈습니다.

하지만 상위리그 벽은 높았고, 해외 진출은 막연했습니다.  
그럼에도 그는 포기하지 않았습니다.

![img]/players/junyong/action-1.png

주요 강점:
- 킥: 중·장거리 킥 정확도
- 패스: 빌드업 중심의 안정적 전개
- 슈팅: 2선 침투 후 마무리 능력
- 수비: 중원 압박, 볼 회수 능력
- 밸런스: 공격과 수비의 조율, 경기 읽는 능력

중앙에서 균형을 잡는 미드필더로,  
게임 템포를 조절하며 팀의 흐름을 만들어가는 선수입니다.

![img]/players/junyong/action-2.jpeg

## 브로스픽과의 만남

브로스픽을 통해 그는 해외 리그 구조와 실제 진출 사례를 처음으로 접했습니다.  
단순한 하이라이트가 아닌, 자신의 스타일과 강점을 드러내는 콘텐츠를 제작했고  
그 결과, 호주 NPL NSW의 Sydney Olympic FC에서 관심을 받았습니다.

> "단순히 영상 플랫폼이 아니라, 시야를 넓혀준 계기였습니다."

## 호주로 향한 결단

군 복무까지 고민하던 시기, 그는 결국 새로운 선택을 했습니다.  
2025년, 호주 NPL NSW의 전통 강호 **Sydney Olympic FC**에  
이상적인 조건으로 입단하며 프로 무대에 도전장을 내밀었습니다.

![img]/players/junyong/action-3.jpeg

## 메시지

> "국내에서 저와 같은 고민을 하고 있는 선수가 있다면, 브로스픽을 통해 더 넓은 정보와 기회를 접해보셨으면 좋겠습니다."

한국의 구조 안에서는 기회를 잡기 어려웠던 선수도
올바른 지원과 플랫폼을 만나면 자신의 가치를 증명할 수 있습니다.  
김준용의 도전은 지금도 계속되고 있습니다.  
그의 축구 인생은 이제 더 넓은 세계로 향합니다.`,
    highlights: [
      '수원삼성 유스 출신',
      'TNT FC 활동 후 호주 진출',
      '브로스픽을 통한 Sydney Olympic FC 입단',
      '현재 NPL NSW 무대에서 활약 중',
    ],
  },

};


export default function InterviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const interview = interviews[params.id];


  if (!interview) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <h1>인터뷰를 찾을 수 없습니다</h1>
          <Link href="/interviews" className={styles.backLink}>
            ← 인터뷰 목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }


  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/interviews" className={styles.backLink}>
          ← 인터뷰 목록으로 돌아가기
        </Link>


        <article className={styles.article}>
          <div className={styles.header}>
            <div className={styles.imageContainer}>
              {interview.image.startsWith('/') ? (
                <Image
                  src={interview.image}
                  alt={interview.playerName}
                  width={225}
                  height={300}
                  className={styles.profileImage}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className={styles.image}>{interview.image}</div>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h1>{interview.playerName}</h1>
              <div className={styles.meta}>
                <span>{interview.team}</span>
                <span>·</span>
                <span>{interview.position}</span>
                <span>·</span>
                <span className={styles.status}>{interview.status}</span>
              </div>
              <p className={styles.date}>{interview.date}</p>
            </div>
          </div>


          <div className={styles.highlights}>
            <h3>주요 성과</h3>
            <ul>
              {interview.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>


          {interview.videoUrl && (
            <div className={styles.videoSection}>
              <h3>플레이 영상</h3>
              <VideoEmbed url={interview.videoUrl} autoPlay={false} />
            </div>
          )}


          <div className={styles.content}>
            {interview.content.split('\n\n').map((paragraph, index) => {
              // 이미지 처리
              if (paragraph.startsWith('![img]')) {
                const imagePath = paragraph.replace('![img]', '');
                return (
                  <div key={index} className={styles.articleImage}>
                    <Image
                      src={imagePath}
                      alt="Player action"
                      width={800}
                      height={600}
                      className={styles.image}
                      style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                    />
                  </div>
                );
              }
              // 마크다운 스타일 헤딩 처리
              if (paragraph.startsWith('# ')) {
                return <h1 key={index}>{paragraph.replace('# ', '')}</h1>;
              }
              if (paragraph.startsWith('## ')) {
                return <h2 key={index}>{paragraph.replace('## ', '')}</h2>;
              }
              // 인용구 처리 (마크다운 스타일)
              if (paragraph.startsWith('> ')) {
                return <blockquote key={index}>{paragraph.replace('> ', '')}</blockquote>;
              }
              // 인용구 처리 (따옴표 스타일)
              if (paragraph.startsWith('"') && paragraph.endsWith('"')) {
                return <blockquote key={index}>{paragraph}</blockquote>;
              }
              // 테이블 처리
              if (paragraph.includes('|')) {
                const lines = paragraph.split('\n');
                const isTable = lines.length >= 3 && lines[1].includes('-');
                if (isTable) {
                  const rows = lines.map(line => line.split('|').map(cell => cell.trim()).filter(Boolean));
                  return (
                    <table key={index} className={styles.table}>
                      <thead>
                        <tr>
                          {rows[0]?.map((cell, i) => <th key={i}>{cell}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(2).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => <td key={j}>{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                }
              }
              // 리스트 처리 (제목과 함께 있을 수 있음)
              if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
                const lines = paragraph.split('\n');
                const listStartIndex = lines.findIndex(line => line.startsWith('- '));

                if (listStartIndex !== -1) {
                  const beforeList = lines.slice(0, listStartIndex).join('\n');
                  const listItems = lines.slice(listStartIndex).filter(line => line.startsWith('- '));

                  return (
                    <div key={index}>
                      {beforeList && <p><strong>{beforeList}</strong></p>}
                      <ul className={styles.list}>
                        {listItems.map((item, i) => (
                          <li key={i}>{item.replace('- ', '')}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              }
              // 일반 단락
              return <p key={index}>{paragraph}</p>;
            })}
          </div>
        </article>
      </div>
    </main>
  );
}
