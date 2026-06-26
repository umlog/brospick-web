import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <span className={styles.ghost} aria-hidden="true">404</span>
      <div className={styles.content}>
        <p className={styles.code}>ERROR 404</p>
        <h1 className={styles.title}>페이지를 찾을 수 없어요</h1>
        <p className={styles.desc}>
          주소가 바뀌었거나 삭제된 페이지일 수 있어요.
          <br />
          아래에서 다시 시작해보세요.
        </p>
        <div className={styles.actions}>
          <Link href="/" className="btn btn-primary">홈으로</Link>
          <Link href="/apparel" className="btn btn-outline"><span>제품 보러가기</span></Link>
        </div>
      </div>
    </main>
  );
}
