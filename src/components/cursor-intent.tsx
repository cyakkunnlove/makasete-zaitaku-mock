'use client'

import { useEffect } from 'react'

const interactiveSelector = [
  'a[href]',
  'button:not(:disabled)',
  'summary',
  'select:not(:disabled)',
  'label:has(input[type="checkbox"]:not(:disabled))',
  'label:has(input[type="radio"]:not(:disabled))',
  '[role="button"]:not([aria-disabled="true"]):not([data-disabled])',
  '[role="menuitem"]:not([aria-disabled="true"]):not([data-disabled])',
  '[role="option"]:not([aria-disabled="true"]):not([data-disabled])',
  '[role="tab"]:not([aria-disabled="true"]):not([data-disabled])',
  '[data-clickable="true"]',
  '.cursor-pointer',
].join(',')

const disabledSelector = [
  'button:disabled',
  'select:disabled',
  'input:disabled',
  'textarea:disabled',
  '[aria-disabled="true"]',
  '[data-disabled]',
  '.cursor-not-allowed',
].join(',')

function closestElement(target: EventTarget | null) {
  return target instanceof Element ? target : null
}

export function CursorIntent() {
  useEffect(() => {
    const updateCursor = (event: PointerEvent) => {
      const element = closestElement(event.target)
      if (!element) {
        document.documentElement.style.cursor = ''
        document.body.style.cursor = ''
        return
      }

      if (element.closest(disabledSelector)) {
        document.documentElement.style.cursor = 'not-allowed'
        document.body.style.cursor = 'not-allowed'
        return
      }

      if (element.closest(interactiveSelector)) {
        document.documentElement.style.cursor = 'pointer'
        document.body.style.cursor = 'pointer'
        return
      }

      document.documentElement.style.cursor = ''
      document.body.style.cursor = ''
    }

    const clearCursor = () => {
      document.documentElement.style.cursor = ''
      document.body.style.cursor = ''
    }

    window.addEventListener('pointermove', updateCursor, { passive: true })
    window.addEventListener('pointerdown', updateCursor, { passive: true })
    window.addEventListener('pointerleave', clearCursor)
    window.addEventListener('blur', clearCursor)

    return () => {
      window.removeEventListener('pointermove', updateCursor)
      window.removeEventListener('pointerdown', updateCursor)
      window.removeEventListener('pointerleave', clearCursor)
      window.removeEventListener('blur', clearCursor)
      clearCursor()
    }
  }, [])

  return null
}
