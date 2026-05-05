export function vibrateOnSaveSuccess() {
  if (typeof window === 'undefined') return

  window.navigator.vibrate?.(18)
}
