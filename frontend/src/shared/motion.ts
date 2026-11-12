/** true si el usuario pidió reducir animaciones en su sistema operativo. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** true en dispositivos con mouse (los efectos de hover no aplican en pantallas táctiles). */
export function hasFinePointer(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
}
