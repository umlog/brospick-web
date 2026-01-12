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
- 스피드: 빠른 속도 (능력치 95점)
- 드리블: 뛰어난 개인기 (능력치 95점)
- 하드워크: 꾸준한 노력 (능력치 85점)
- 아이솔레이션: 1:1 돌파 능력 (능력치 85점)
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
