document.addEventListener('DOMContentLoaded', () => {
  const counterEl = document.getElementById('blockedCount');
  const reloadBtn = document.getElementById('reloadBtn');

  // 차단된 횟수 로드
  chrome.storage.local.get(['blockedTotal'], (res) => {
    counterEl.textContent = (res.blockedTotal || 0).toLocaleString();
  });

  // 실시간 변경 감지
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blockedTotal) {
      counterEl.textContent = (changes.blockedTotal.newValue || 0).toLocaleString();
    }
  });

  // 새로고침 버튼 핸들러
  reloadBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});
