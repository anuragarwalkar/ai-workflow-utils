/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}
