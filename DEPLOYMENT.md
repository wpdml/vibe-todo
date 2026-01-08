# 배포 가이드

현재 앱은 배포 시 **아무 문제 없이 작동**합니다! ✅

## 🎯 배포 준비 상태

- ✅ ES6 모듈 사용 (모든 현대 브라우저 지원)
- ✅ Firebase SDK CDN 로드 (별도 빌드 불필요)
- ✅ 순수 HTML/CSS/JS (바로 배포 가능)

## 🚀 배포 방법

### 방법 1: Firebase Hosting (권장)

Firebase 프로젝트와 연동되어 있으므로 Firebase Hosting이 가장 간단합니다.

#### 1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

#### 2. Firebase 로그인
```bash
firebase login
```

#### 3. 프로젝트 초기화 (이미 있으면 건너뛰기)
```bash
firebase init hosting
```

#### 4. 배포
```bash
firebase deploy --only hosting
```

배포 후 URL: `https://noona-todo-backend-86db8.web.app`

### 방법 2: GitHub Pages

1. GitHub 저장소에 코드 업로드
2. Settings → Pages → Source: `main` 브랜치 `/` 폴더 선택
3. 자동으로 배포됨

URL: `https://[사용자명].github.io/[저장소명]`

### 방법 3: Netlify

1. [Netlify](https://www.netlify.com) 가입
2. "Add new site" → "Deploy manually" 또는 GitHub 연결
3. 파일 드래그 앤 드롭 또는 Git 저장소 연결
4. 자동 배포 완료

### 방법 4: Vercel

1. [Vercel](https://vercel.com) 가입
2. "New Project" → Git 저장소 연결 또는 파일 업로드
3. 자동 배포 완료

### 방법 5: 일반 웹 호스팅

어떤 웹 호스팅 서비스든 사용 가능합니다:
- 호스팅 업체에 `index.html`, `style.css`, `script.js` 업로드
- 끝!

## ⚠️ 배포 전 확인사항

### 1. Firebase 보안 규칙 설정 (중요!)

Firebase 콘솔에서 Realtime Database 보안 규칙을 설정하세요:

**개발 환경 (테스트용):**
```json
{
  "rules": {
    "todos": {
      ".read": true,
      ".write": true
    }
  }
}
```

**프로덕션 환경 (권장):**
```json
{
  "rules": {
    "todos": {
      ".read": true,
      ".write": true,
      "$todoId": {
        ".validate": "newData.hasChildren(['text', 'completed', 'createdAt'])",
        "text": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500"
        },
        "completed": {
          ".validate": "newData.isBoolean()"
        },
        "createdAt": {
          ".validate": "newData.isNumber()"
        },
        "$other": {
          ".validate": false
        }
      }
    }
  }
}
```

### 2. API 키 보안

현재 코드에 Firebase API 키가 포함되어 있습니다. 이는 **정상**이며:
- ✅ 클라이언트 측 앱에서는 API 키를 숨길 수 없습니다
- ✅ Firebase 보안 규칙으로 데이터베이스 보호
- ✅ API 키는 도메인 제한으로 추가 보호 가능

**추가 보안 (선택사항):**
- Firebase 콘솔 → Authentication → 설정 → 승인된 도메인 추가

### 3. CORS 설정

배포된 사이트에서는 CORS 문제가 발생하지 않습니다:
- ✅ HTTP/HTTPS 프로토콜 사용
- ✅ ES6 모듈 정상 작동

### 4. 콘솔 로그 (선택사항)

프로덕션에서 디버그 로그를 숨기려면:

```javascript
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (isDevelopment) {
    console.log("디버그 메시지");
}
```

## 📋 체크리스트

배포 전 확인:

- [ ] Firebase Realtime Database 생성 및 보안 규칙 설정
- [ ] 브라우저에서 로컬 테스트 완료
- [ ] 할일 추가/수정/삭제 기능 정상 작동 확인
- [ ] 모바일 반응형 디자인 확인 (선택사항)
- [ ] 콘솔 에러 확인 (F12 개발자 도구)

## 🔒 보안 권장사항

1. **보안 규칙 필수**: 위의 프로덕션 보안 규칙 사용
2. **도메인 제한**: Firebase 콘솔에서 승인된 도메인 설정
3. **인증 추가** (향후): 사용자별 할일 관리 필요 시 Firebase Authentication 추가

## 🎉 배포 완료 후

배포가 완료되면:
1. 배포된 URL에서 앱 작동 확인
2. 다른 기기에서도 접속 테스트
3. Firebase 콘솔에서 데이터 저장 확인

**문제 발생 시:**
- 브라우저 콘솔(F12)에서 에러 확인
- Firebase 콘솔에서 보안 규칙 확인
- 네트워크 탭에서 요청 상태 확인
