/* HM.Portfolio 오프라인 버전 서비스 워커
   - 앱 화면(같은 폴더의 HTML)은 캐시에 저장해서 인터넷이 없어도 열리게 함
   - 폰트/시세 API처럼 다른 도메인 요청은 캐시하지 않고 그대로 네트워크로 보냄
     (시세는 온라인일 때만 갱신되고, 오프라인이면 그냥 마지막 저장된 값이 보임) */
const CACHE_NAME = "hmp-offline-v1";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => Promise.all(APP_SHELL.map((u) => c.add(u).catch(() => {}))))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // 외부 리소스는 그대로 통과

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((r) => r || caches.match("./index.html"))
      )
  );
});
