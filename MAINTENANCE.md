# UNSE 사이트 관리 가이드

이 사이트는 현재 정적 HTML 사이트입니다. 서버나 빌드 도구 없이 브라우저에서 바로 열 수 있도록 구성되어 있습니다.

## 주요 파일 구조

```text
THE UNSE/
├─ index.html                           # 배포용 메인 페이지 HTML 구조
├─ css/
│  └─ style.css                         # 전체 디자인, 레이아웃, 반응형 스타일
├─ js/
│  ├─ i18n.js                         # I18N 초기화 파일
│  ├─ i18n/
│  │  ├─ en.js                         # 영어 텍스트와 운세 데이터
│  │  ├─ ko.js                         # 한국어 텍스트와 운세 데이터
│  │  └─ ja.js                         # 일본어 텍스트와 운세 데이터
│  └─ app.js                           # 버튼, 계산, 카드 뽑기, 사주 표시 등 동작 로직
├─ img/
│  ├─ tarot-00.webp ~ tarot-21.webp     # 타로 카드 앞면 이미지
│  └─ tarot-back.webp                   # 타로 카드 뒷면 이미지
├─ about.html                           # 소개 페이지
├─ privacy-policy.html                  # 개인정보처리방침
├─ terms-disclaimer.html                # 이용약관 및 면책 안내
├─ robots.txt                           # 검색엔진 크롤링 허용 및 sitemap 위치 안내
├─ sitemap.xml                          # 검색엔진 제출용 사이트맵
├─ unse-korean-fortune-v3_1.html        # 작업 이력용 메인 페이지 사본
└─ unse-korean-fortune-v3_1.before-split.html # 구조 분리 전 백업본
```

## 가장 자주 수정할 파일

### 1. 운세 문구 수정
언어별 파일을 수정합니다.

- 영어: js/i18n/en.js`r
- 한국어: js/i18n/ko.js`r
- 일본어: js/i18n/ja.js`r

한국어만 수정할 때는 js/i18n/ko.js만 수정하면 됩니다.

주요 위치:
- 토정비결: 	j`r
- 사주팔자: saju`r
- 타로: 	arot`r
- 별자리: zodiac`r

주의: js/i18n.js는 초기화 파일이므로 운세 문구를 수정하는 곳이 아닙니다.

### 2. 사주 텍스트 수정
`js/i18n/ko.js` 안의 `saju` 영역을 수정합니다.

주요 배열:
- `dmTxt`: 일간 - 나는 누구인가
- `yearTxt`: 년주 - 인생의 뿌리
- `monthTxt`: 월주 - 사회와 일의 운
- `dayTxt`: 일주 - 하루의 운세
- `sajuTxt`: 사주 - 평생의 운세

주의:
- `dmTxt`, `yearTxt`, `monthTxt`, `dayTxt`는 10개 항목이어야 합니다.
- `sajuTxt`는 12개 항목이어야 합니다.
- 따옴표 안에 `'`를 넣으면 JS가 깨질 수 있으니, 문장 안에서는 가능하면 `’` 또는 큰따옴표 구조를 사용합니다.

### 3. 타로 텍스트 수정
`js/i18n/ko.js` 안의 `tarot` 영역을 수정합니다.

주요 배열:
- `names`: 카드 이름
- `mean`: 신비로운 원문
- `tldr`: 한 줄 요약
- `tags`: 해시태그
- `action`: 카드 해석 페이지의 행동 가이드

주의:
- 메이저 아르카나는 22장이므로 각 배열은 22개 항목을 유지해야 합니다.
- 이미지 파일명은 `img/tarot-00.webp`부터 `img/tarot-21.webp`까지입니다.

### 4. 디자인 수정
`css/style.css`를 수정합니다.

주요 영역:
- 헤더/메뉴: `header`, `.nav-links`, `.langs`
- 운세 카드: `.card`, `.cards`
- 사주 결과: `.pillars`, `.pillar`, `.saju-read`
- 타로 카드: `.tcard`, `.tfront`, `.tback`, `.card-meaning`
- 별자리: `.zgrid`, `.zbtn`, `.zresult`

### 5. 버튼 동작 또는 계산 방식 수정
`js/app.js`를 수정합니다.

주요 함수:
- `renderTJ()`: 토정비결 결과
- `renderSaju()`: 사주팔자 결과
- `dealTarot()`: 타로 카드 뽑기
- `renderZodiac()`: 별자리 결과
- `applyLang()`: 언어 변경

## 수정할 때 중요한 규칙

1. HTML id는 절대 중복시키지 않습니다.
   예: `sj-day`는 날짜 선택용, `sj-day-read`는 일주 결과용입니다.

2. 텍스트 배열 개수를 유지합니다.
   배열 항목 수가 부족하면 특정 카드나 사주 결과가 비어 보일 수 있습니다.

3. 한국어를 먼저 완성한 뒤 EN/JA를 맞추는 방식이 안전합니다.

4. 큰 수정 전에는 현재 파일을 복사해서 백업합니다.

5. 수정 후 브라우저에서 `Ctrl + F5`로 강력 새로고침합니다.

## 현재 구조의 장점

- HTML이 가벼워져서 구조 확인이 쉬워졌습니다.
- 긴 운세 문구는 `js/i18n.js`에서만 관리하면 됩니다.
- 디자인은 `css/style.css`만 보면 됩니다.
- 버튼과 계산 로직은 `js/app.js`에 모였습니다.
- 나중에 EN/JA 운세 문구를 확장하기 쉬운 구조입니다.

## 다음 단계로 더 개선할 수 있는 것

현재는 언어별 파일까지 분리된 상태입니다. 다음 단계에서 더 세밀하게 나누고 싶다면 운세 종류별로도 분리할 수 있습니다.`r`n`r`n예시:`r`n`r`n```text`r`ndata/ko/tojeong.js`r`ndata/ko/saju.js`r`ndata/ko/tarot.js`r`ndata/ko/zodiac.js`r`n```



## SEO / 배포 메모
- 기본 도메인: https://sajuorbit.com/
- OG 이미지: assets/og-image.png
- favicon/manifest: assets/favicon-*.png, manifest.json
- GA4 코드는 각 HTML head의 `Google Analytics 4 tracking code goes here` 주석 위치에 삽입합니다.
- tarot/saju/tojeong/zodiac은 현재 메인 페이지 기능으로 제공됩니다. 독립 SEO 콘텐츠 페이지가 필요해질 때 별도 본문을 충분히 작성한 뒤 추가하는 것을 권장합니다.
