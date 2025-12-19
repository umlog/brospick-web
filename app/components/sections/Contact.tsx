// 'use client';

// import { useState } from 'react';
// import styles from './contact.module.css';

// interface FormData {
//   name: string;
//   affiliation: string;
//   phone: string;
//   inquiryType: string;
//   message: string;
// }

// export default function Contact() {
//   const [formData, setFormData] = useState<FormData>({
//     name: '',
//     affiliation: '',
//     phone: '',
//     inquiryType: 'partnership',
//     message: '',
//   });
//   const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

//   const handleChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
//     >
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setStatus('loading');

//     try {
//       // 실제 배포 시 API 엔드포인트로 변경
//       // 현재는 콘솔 로그로 확인
//       console.log('Form submitted:', formData);

//       setTimeout(() => {
//         setStatus('success');
//         setFormData({
//           name: '',
//           affiliation: '',
//           phone: '',
//           inquiryType: 'partnership',
//           message: '',
//         });
//         setTimeout(() => setStatus('idle'), 3000);
//       }, 500);
//     } catch (error) {
//       setStatus('error');
//       console.error('Submission error:', error);
//     }
//   };

//   return (
//     <section id="contact" className={styles.contact}>
//       <div className={styles.container}>
//         <h2 className={styles.title}>함께하기</h2>
//         <p className={styles.subtitle}>
//           인터뷰, 협찬, 파트너십 문의는 아래 폼을 작성해주세요.
//         </p>

//         <form className={styles.form} onSubmit={handleSubmit}>
//           <div className={styles.formGroup}>
//             <label htmlFor="name">이름</label>
//             <input
//               type="text"
//               id="name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="성함을 입력해주세요"
//               required
//             />
//           </div>

//           <div className={styles.formGroup}>
//             <label htmlFor="affiliation">소속 (학교/팀)</label>
//             <input
//               type="text"
//               id="affiliation"
//               name="affiliation"
//               value={formData.affiliation}
//               onChange={handleChange}
//               placeholder="학교 이름 또는 팀 이름"
//               required
//             />
//           </div>

//           <div className={styles.formGroup}>
//             <label htmlFor="phone">연락처</label>
//             <input
//               type="tel"
//               id="phone"
//               name="phone"
//               value={formData.phone}
//               onChange={handleChange}
//               placeholder="010-0000-0000"
//               required
//             />
//           </div>

//           <div className={styles.formGroup}>
//             <label htmlFor="inquiryType">문의 유형</label>
//             <select
//               id="inquiryType"
//               name="inquiryType"
//               value={formData.inquiryType}
//               onChange={handleChange}
//             >
//               <option value="interview">인터뷰</option>
//               <option value="sponsorship">협찬</option>
//               <option value="partnership">파트너십</option>
//               <option value="other">기타</option>
//             </select>
//           </div>

//           <div className={styles.formGroup}>
//             <label htmlFor="message">상세 내용</label>
//             <textarea
//               id="message"
//               name="message"
//               value={formData.message}
//               onChange={handleChange}
//               placeholder="자세한 내용을 작성해주세요..."
//               rows={5}
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             className={styles.submitButton}
//             disabled={status === 'loading'}
//           >
//             {status === 'loading' ? '전송 중...' : '문의 전송'}
//           </button>

//           {status === 'success' && (
//             <p className={styles.successMessage}>
//               ✓ 기록 요청이 접수되었습니다! 곧 연락드리겠습니다.
//             </p>
//           )}
//           {status === 'error' && (
//             <p className={styles.errorMessage}>
//               문의 전송에 실패했습니다. 다시 시도해주세요.
//             </p>
//           )}
//         </form>

//         <div className={styles.alternativeContact}>
//           <h3>다른 방법으로 연락하기</h3>
//           <p>
//             📧 이메일:{' '}
//             <a href="mailto:contact@brospick.com">contact@brospick.com</a>
//           </p>
//           <p>
//             📱 인스타그램:{' '}
//             <a
//               href="https://instagram.com/brospick.official"
//               target="_blank"
//               rel="noopener noreferrer"
//             >
//               @brospick.official
//             </a>
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// }
