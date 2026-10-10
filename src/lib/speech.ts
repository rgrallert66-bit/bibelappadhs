/**
 * Read-aloud via the Web Speech API (on-device voices, no network).
 * Hearing + reading + speaking along engages several memory channels
 * (production effect, dual coding).
 */
import type { TranslationId } from '../data/verses'

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const exact = voices.filter((v) => v.lang.toLowerCase().startsWith(lang))
  // prefer natural/enhanced voices when available
  return exact.find((v) => /premium|enhanced|natural|neural/i.test(v.name)) ?? exact[0]
}

export function speak(text: string, translation: TranslationId, onEnd?: () => void): () => void {
  if (!canSpeak()) {
    onEnd?.()
    return () => {}
  }
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/[“”„"]/g, ''))
  const lang = translation === 'elb' ? 'de' : 'en'
  u.lang = lang === 'de' ? 'de-DE' : 'en-US'
  const voice = pickVoice(lang)
  if (voice) u.voice = voice
  u.rate = 0.92
  u.pitch = 1
  u.onend = () => onEnd?.()
  u.onerror = () => onEnd?.()
  synth.speak(u)
  return () => synth.cancel()
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
