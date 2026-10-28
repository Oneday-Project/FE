// 마이페이지 프로필 이미지 — 브라우저(localStorage)에 사용자별로 저장
//
// 백엔드에 프로필 이미지 컬럼·업로드 API 가 아직 없어서 프론트에만 둔다.
// → 같은 브라우저에서는 새로고침·페이지 이동 후에도 유지되지만, 다른 기기에서는 보이지 않는다.
// 원본을 그대로 넣으면 localStorage 용량(약 5MB)을 금방 넘기므로 정사각형으로 잘라 작게 줄여 저장한다.

const SIZE = 256          // 저장 크기(px). 화면에는 76px 로 나오지만 고해상도 화면을 위해 여유 있게
const QUALITY = 0.85

const keyOf = (userId: number) => `profileImage:${userId}`

export function loadProfileImage(userId: number): string | null {
  try {
    return localStorage.getItem(keyOf(userId))
  } catch {
    return null
  }
}

/* 저장에 실패해도(용량 초과·시크릿 모드 등) 화면에는 보여줄 수 있게 false 만 돌려준다 */
export function saveProfileImage(userId: number, dataUrl: string): boolean {
  try {
    localStorage.setItem(keyOf(userId), dataUrl)
    return true
  } catch {
    return false
  }
}

export function removeProfileImage(userId: number): void {
  try {
    localStorage.removeItem(keyOf(userId))
  } catch {
    // 저장소 접근이 막혀 있으면 지울 것도 없다
  }
}

/* 선택한 이미지를 가운데 기준 정사각형으로 잘라 SIZE×SIZE JPEG data URL 로 만든다 */
export function resizeProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth - side) / 2
      const sy = (img.naturalHeight - side) / 2

      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas unavailable'))
        return
      }
      // 투명 PNG 를 JPEG 로 바꾸면 배경이 검게 나와서 흰색을 먼저 깐다
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, SIZE, SIZE)
      ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)

      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 읽을 수 없습니다.'))
    }
    img.src = url
  })
}
