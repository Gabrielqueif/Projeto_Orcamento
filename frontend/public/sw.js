// Service worker mínimo do GPObras.
// Existe só para o navegador tratar o site como app instalável (o Chrome do Android exige um
// handler de fetch). Não faz cache nem intercepta nada: as páginas dependem de login e de
// dados online, então todas as requisições seguem direto para a rede.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
