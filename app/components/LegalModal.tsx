'use client';
import { useEffect } from 'react';
import { COMPANY, CONTACT } from '../../lib/constants';
import styles from './legal-modal.module.css';

export type LegalModalType = 'privacy' | 'cookie' | 'disclaimer';

interface LegalModalProps {
  type: LegalModalType;
  onClose: () => void;
}

const TITLES: Record<LegalModalType, string> = {
  privacy: '개인정보 처리방침',
  cookie: '쿠키 정책',
  disclaimer: '면책 조항',
};

function PrivacyContent() {
  return (
    <>
      <p className={styles.intro}>
        {COMPANY.name}(이하 "회사")은 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 소중히 보호합니다.
        본 방침은 회사가 제공하는 온라인 쇼핑몰 서비스와 관련하여 적용됩니다.
      </p>

      <h3>1. 수집하는 개인정보 항목 및 수집 방법</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>구분</th>
            <th>수집 항목</th>
            <th>수집 목적</th>
            <th>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>주문·배송 (필수)</td>
            <td>이름, 전화번호, 이메일, 주소</td>
            <td>주문 처리, 배송, 고객 문의 대응</td>
            <td>주문일로부터 5년</td>
          </tr>
          <tr>
            <td>마케팅 (선택)</td>
            <td>이름, 전화번호, 이메일</td>
            <td>SMS·이메일을 통한 신상품·이벤트·할인 정보 발송</td>
            <td>동의 철회 시까지 (최대 3년)</td>
          </tr>
        </tbody>
      </table>
      <p className={styles.note}>
        수집 방법: 주문 시 이용자가 직접 입력하는 방식으로 수집합니다.
      </p>

      <h3>2. 개인정보의 처리 목적</h3>
      <ul>
        <li>주문 접수, 결제 확인, 상품 배송 및 배송 관련 안내</li>
        <li>반품·교환·환불 처리</li>
        <li>고객 문의 및 불만 처리</li>
        <li>마케팅 수신에 동의한 고객: SMS·이메일을 통한 광고성 정보 발송 (선택)</li>
      </ul>

      <h3>3. 개인정보의 제3자 제공</h3>
      <p>
        회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
        다만, 배송 처리를 위해 택배사에 수령인의 이름·전화번호·주소를 최소한으로 제공합니다.
      </p>

      <h3>4. 개인정보의 보유 및 이용 기간</h3>
      <ul>
        <li>주문 관련 정보: 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 계약·청약철회 기록 5년 보관</li>
        <li>마케팅 수신 동의 정보: 동의 철회 시 즉시 파기 (최대 3년)</li>
      </ul>

      <h3>5. 이용자의 권리</h3>
      <p>
        이용자는 언제든지 자신의 개인정보 조회, 수정, 삭제, 처리정지를 요청할 수 있으며,
        마케팅 수신 동의는 이메일({CONTACT.email})을 통해 언제든지 철회할 수 있습니다.
        동의 거부 시에도 주문·배송 서비스 이용에는 불이익이 없습니다.
      </p>

      <h3>6. 개인정보 보호책임자</h3>
      <ul>
        <li>책임자: {COMPANY.privacyOfficer}</li>
        <li>연락처: {CONTACT.email}</li>
      </ul>

      <h3>7. 개인정보 처리방침 변경</h3>
      <p>
        본 방침은 법령·정책 변경 시 홈페이지를 통해 공지합니다.
        시행일: 2026년 3월 9일
      </p>
    </>
  );
}

function CookieContent() {
  return (
    <>
      <p className={styles.intro}>
        {COMPANY.name}는 웹사이트 운영에 필요한 최소한의 쿠키만 사용합니다.
      </p>

      <h3>1. 쿠키란?</h3>
      <p>
        쿠키는 웹사이트가 이용자의 브라우저에 저장하는 소규모 텍스트 파일로,
        사이트 이용 편의를 위해 사용됩니다.
      </p>

      <h3>2. 사용 쿠키 종류</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>종류</th>
            <th>목적</th>
            <th>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>필수 쿠키</td>
            <td>장바구니, 세션 유지 등 서비스 기본 기능 제공</td>
            <td>세션 종료 시 삭제</td>
          </tr>
        </tbody>
      </table>

      <h3>3. 쿠키 거부 방법</h3>
      <p>
        브라우저 설정에서 쿠키를 차단할 수 있으나, 장바구니 등 일부 기능이 정상 작동하지 않을 수 있습니다.
      </p>
      <ul>
        <li>Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
        <li>Safari: 설정 → Safari → 쿠키 및 웹 사이트 데이터 차단</li>
      </ul>

      <h3>4. 문의</h3>
      <p>쿠키 정책 관련 문의: {CONTACT.email}</p>
    </>
  );
}

function DisclaimerContent() {
  return (
    <>
      <p className={styles.intro}>
        {COMPANY.name} 웹사이트 이용 시 아래 사항을 확인해 주세요.
      </p>

      <h3>1. 상품 정보</h3>
      <p>
        상품 이미지, 색상, 사이즈 정보는 정확하게 제공하기 위해 노력하나, 디스플레이 환경에 따라 실제와 차이가 있을 수 있습니다.
      </p>

      <h3>2. 가격 및 재고</h3>
      <p>
        상품 가격 및 재고는 사전 고지 없이 변경될 수 있습니다.
        주문 접수 시점의 정보가 우선 적용됩니다.
      </p>

      <h3>3. 배송 지연</h3>
      <p>
        천재지변, 택배사 사정, 명절 등 불가항력적 사유로 인한 배송 지연에 대해 회사는 책임을 지지 않으며,
        해당 상황 발생 시 신속히 안내해 드립니다.
      </p>

      <h3>4. 외부 링크</h3>
      <p>
        본 사이트에서 연결된 외부 사이트(인스타그램, 스레드 등)의 내용 및 개인정보 처리에 대해 회사는 책임지지 않습니다.
      </p>

      <h3>5. 지적재산권</h3>
      <p>
        본 웹사이트의 모든 콘텐츠(사진, 텍스트, 로고 등)는 {COMPANY.name}의 소유이며,
        무단 복제·배포를 금합니다.
      </p>

      <h3>6. 준거법</h3>
      <p>본 면책 조항은 대한민국 법률에 따라 해석됩니다.</p>
    </>
  );
}

const CONTENT: Record<LegalModalType, React.ComponentType> = {
  privacy: PrivacyContent,
  cookie: CookieContent,
  disclaimer: DisclaimerContent,
};

export function LegalModal({ type, onClose }: LegalModalProps) {
  const Content = CONTENT[type];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{TITLES[type]}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className={styles.body}>
          <Content />
        </div>
      </div>
    </div>
  );
}
