import styles from '../admin.module.css';

interface LoginFormProps {
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({ password, onPasswordChange, onSubmit }: LoginFormProps) {
  return (
    <main className={styles.main}>
      <div className={styles.loginContainer}>
        <h1>관리자 로그인</h1>
        <form onSubmit={onSubmit} className={styles.loginForm}>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="비밀번호 입력"
            required
          />
          <button type="submit">로그인</button>
        </form>
      </div>
    </main>
  );
}
