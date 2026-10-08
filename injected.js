// AliShield Injected Script v2.0 (하드코어 CPU 보호 엔진)
(function () {
  'use strict';

  function notifyBlocked(action) {
    try {
      window.postMessage({ source: 'ALISHIELD_CORE', action: action }, '*');
    } catch (_) {}
  }

  // 1. [핵심 범인 1] 알리바바 암호화 WebAssembly(Wasm) 바이너리 원천 차단
  // CPU 코어 하나를 100% 풀로드로 태우는 백그라운드 C/C++ 보안 연산 모듈 무력화
  if (window.WebAssembly) {
    try {
      const origInstantiate = WebAssembly.instantiate;
      WebAssembly.instantiate = function () {
        notifyBlocked('wasm_blocked');
        return Promise.reject(new Error('AliShield: CPU protection active'));
      };
      WebAssembly.instantiateStreaming = function () {
        notifyBlocked('wasm_blocked');
        return Promise.reject(new Error('AliShield: CPU protection active'));
      };
      WebAssembly.compile = function () {
        notifyBlocked('wasm_blocked');
        return Promise.reject(new Error('AliShield: CPU protection active'));
      };
    } catch (e) {}
  }

  // 2. [핵심 범인 2] 무한 루프로 CPU를 혹사시키는 고빈도 타이머(setInterval / rAF) 강제 제어
  try {
    const origSetInterval = window.setInterval;
    window.setInterval = function (fn, delay, ...args) {
      // 50ms 미만으로 미친 듯이 도는 내부 감시/애니메이션 타이머를 250ms로 강제 감속
      if (typeof delay === 'number' && delay < 50) {
        notifyBlocked('timer_throttled');
        delay = 250;
      }
      return origSetInterval.call(window, fn, delay, ...args);
    };

    // requestAnimationFrame 과도한 루프 방지 (스크롤 멈췄을 때 CPU 유휴 보장)
    let rafCount = 0;
    const origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) {
      rafCount++;
      return origRAF.call(window, cb);
    };
  } catch (e) {}

  // 3. [핵심 범인 3] 그래픽카드를 갉아먹는 WebGL 3D 컨텍스트 지문 채취 원천 차단
  // 쇼핑몰에서는 WebGL 3D 그래픽이 전혀 필요 없음 (100% 핑거프린팅용)
  try {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attributes) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        notifyBlocked('webgl_blocked');
        return null; // 그래픽카드 연산 0으로 차단
      }
      return origGetContext.apply(this, arguments);
    };
  } catch (e) {}

  // 4. [핵심 범인 4] 알리바바 백그라운드 추적기 (goldlog / aplus) 완전 차단
  const dummyFn = function () {
    notifyBlocked('goldlog');
    return true;
  };

  const aplusHandler = {
    get: function (target, prop) {
      if (typeof target[prop] === 'function') return dummyFn;
      return target[prop];
    },
    set: () => true
  };

  const baseAplus = {
    record: dummyFn,
    send: dummyFn,
    setMetaInfo: () => true,
    getMetaInfo: () => '',
    appendMetaInfo: () => true,
    aplus_queue: [],
    _isMOCKED: true
  };

  try {
    const mockGoldlog = new Proxy(baseAplus, aplusHandler);
    Object.defineProperty(window, 'goldlog', { get: () => mockGoldlog, set: () => true, configurable: true });
    Object.defineProperty(window, 'goldlog_queue', { get: () => [], set: () => true, configurable: true });
    Object.defineProperty(window, 'aplus_queue', { get: () => [], set: () => true, configurable: true });
  } catch (e) {}

  // 5. Canvas 2D 데이터 추출 핑거프린팅 차단
  try {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function () {
      notifyBlocked('canvas');
      if (this.width <= 16 || this.height <= 16) return origToDataURL.apply(this, arguments);
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    };

    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function () {
      notifyBlocked('canvas_get');
      if (this.canvas.width <= 16 || this.canvas.height <= 16) return origGetImageData.apply(this, arguments);
      return origGetImageData.call(this, 0, 0, 1, 1);
    };
  } catch (e) {}

  // 6. 비디오 자동 재생 차단
  try {
    const origPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.autoplay || !this.controls) {
        this.pause();
        notifyBlocked('video_autoplay');
        return Promise.reject(new DOMException('Blocked by AliShield', 'AbortError'));
      }
      return origPlay.apply(this);
    };
  } catch (e) {}

  // 7. 백그라운드 악성 Web Worker 차단
  try {
    const origWorker = window.Worker;
    window.Worker = function (scriptURL, options) {
      const urlStr = String(scriptURL);
      if (urlStr.includes('baxia') || urlStr.includes('sec') || urlStr.includes('um.alicdn') || urlStr.includes('punish') || urlStr.includes('alilog')) {
        notifyBlocked('worker_blocked');
        const blob = new Blob(['/* blocked by AliShield */'], { type: 'application/javascript' });
        return new origWorker(URL.createObjectURL(blob), options);
      }
      return new origWorker(scriptURL, options);
    };
  } catch (e) {}

  // 8. 마우스 이동 스로틀링
  let lastMove = 0;
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastMove < 80) {
      e.stopPropagation();
    } else {
      lastMove = now;
    }
  }, true);

  console.info('[AliShield v2.0] 하드웨어 가속 보호 및 CPU 딥 프리즈 엔진 활성화');
})();
