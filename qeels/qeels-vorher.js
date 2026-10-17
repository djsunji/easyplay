/* Qeels als eigene Seite: läuft vor dem easyplay-Code (direkt nach config.js) */
window.EP_NUR_QEELS = true;
window.EP_CONFIG = window.EP_CONFIG || {};
// Geteilte Qeels führen auf die Qeels-Seite, nicht auf die easyplay-Startseite
window.EP_CONFIG.teilenUrl = "https://djsunji.github.io/easyplay/qeels/";
document.documentElement.classList.add("nurqeels");
