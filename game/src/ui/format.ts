export const rub = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(Math.round(n)).toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`;
export const num = (n: number) => Math.abs(Math.round(n)).toLocaleString('ru-RU').replace(/ /g, ' ');
export const mult = (m: number) => `×${m.toFixed(2).replace('.', ',')}`;
export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
export const plural = (n: number, one: string, few: string, many: string) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};
