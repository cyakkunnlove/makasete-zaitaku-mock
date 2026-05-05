export function vibrateOnSaveSuccess() {
  if (typeof window === 'undefined') return

  window.navigator.vibrate?.([14, 28, 18])
}

export function vibrateOnButtonPress() {
  if (typeof window === 'undefined') return

  window.navigator.vibrate?.(10)
}
