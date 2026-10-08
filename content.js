// AliShield Content Script v2.0 (Deep Freeze Engine)
(function () {
  'use strict';

  // 1. injected.js 를 실제 웹페이지(MAIN 월드)에 최우선 주입
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {
    console.error('[AliShield] Injection failed', e);
  }

  // 2. CPU 점유율을 1%대로 떨어뜨리는 초경량 렌더링 CSS 주입
  const injectStyle = () => {
    if (document.getElementById('alishield-style-v2')) return;
    const style = document.createElement('style');
    style.id = 'alishield-style-v2';
    style.textContent = `
      /* 뷰포트 밖 상품 카드를 GPU/CPU 메모리에서 완전히 절전(Deep Freeze) */
      .multi--content--1zYuzOH, 
      .search-item-card-wrapper-open-search,
      [class*="search-card-item"],
      [class*="feed-item"],
      [class*="SearchCard"],
      [class*="list--content"] {
        content-visibility: auto !important;
        contain: layout style paint !important;
        contain-intrinsic-size: 300px 420px !important;
      }

      /* 스크롤 시 CPU를 태우는 모든 장식용 애니메이션과 복잡한 그림자 연산 제거 */
      [class*="search-card-item"], 
      [class*="multi--content"],
      [class*="product-card"] {
        box-shadow: none !important;
        transition: none !important;
        transform: none !important;
      }

      /* 움직이는 배너/반짝임 애니메이션 강제 중단 */
      [class*="sparkle"], [class*="shimmer"], [class*="blink"], [class*="animate"] {
        animation: none !important;
      }

      /* CPU를 혹사시키는 CSS 블러/흐림 필터 제거 */
      * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      /* 고해상도 이미지 비동기 처리 */
      img {
        content-visibility: auto;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  // 3. 동적으로 추가되는 이미지 비동기 디코딩 강제 (메인스레드 프리징 방지)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === 'IMG') {
            node.decoding = 'async';
            node.loading = 'lazy';
          } else {
            const imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
            for (let i = 0; i < imgs.length; i++) {
              imgs[i].decoding = 'async';
              imgs[i].loading = 'lazy';
            }
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.head || document.documentElement) {
    injectStyle();
  } else {
    document.addEventListener('DOMContentLoaded', injectStyle, { once: true });
  }

  // 4. Main 월드로부터 차단 이벤트 수신 및 storage 업데이트
  let pendingCount = 0;
  let saveTimer = null;

  window.addEventListener('message', (event) => {
    if (event.data && event.data.source === 'ALISHIELD_CORE') {
      pendingCount++;
      if (!saveTimer) {
        saveTimer = setTimeout(() => {
          const add = pendingCount;
          pendingCount = 0;
          saveTimer = null;
          chrome.storage.local.get(['blockedTotal'], (res) => {
            const total = (res.blockedTotal || 0) + add;
            chrome.storage.local.set({ blockedTotal: total });
          });
        }, 200);
      }
    }
  });
})();
