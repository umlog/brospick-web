/**
 * 업로드 전 이미지 압축 유틸리티
 * - 최대 1500px 리사이즈 (긴 변 기준)
 * - JPEG 품질 82%
 * - 원본이 압축 결과보다 작으면 원본 반환
 * - HEIC/HEIF는 브라우저 캔버스가 디코딩 불가능할 수 있어 원본 반환
 */
export async function compressImage(
  file: File,
  maxDimension = 1500,
  quality = 0.82
): Promise<File> {
  // HEIC는 canvas 디코딩 불안정 → 그냥 통과
  if (file.type === 'image/heic' || file.type === 'image/heif') return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxDimension / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // 압축이 오히려 더 크면 원본
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
