// Определение сенсорного устройства для подсказок управления.
export const TOUCH = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
export const t = (mouse: string, touch: string) => (TOUCH ? touch : mouse);
