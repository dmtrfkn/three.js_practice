/** Общая панель многошагового ремонта. Модель хранит только данные и решения игрока. */
export interface AdvancedView {
  type: string;
  title: string;
  instruction: string;
  detail: string;
  actions: string[];
  done: boolean;
  errors: number;
  message?: string;
}

export interface ActionBox { x: number; y: number; w: number; h: number }

export function actionBoxes(view: AdvancedView, w: number, h: number): ActionBox[] {
  const columns = view.actions.length <= 3 ? 1 : 2;
  const rows = Math.ceil(view.actions.length / columns);
  const gap = 10, x = 44, y = h * 0.49, bottom = h - 48;
  const width = (w - 2 * x - gap * (columns - 1)) / columns;
  const height = (bottom - y - gap * (rows - 1)) / rows;
  return view.actions.map((_, i) => ({ x: x + (i % columns) * (width + gap), y: y + Math.floor(i / columns) * (height + gap), w: width, h: height }));
}

function lines(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > width) { result.push(line); line = word; } else line = next;
    }
    result.push(line);
  }
  return result;
}

export function drawAdvanced(ctx: CanvasRenderingContext2D, view: AdvancedView, w: number, h: number): void {
  const font = '"Pixelify Sans", sans-serif';
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#262d30'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ece9d9'; ctx.fillRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = '#223a36'; ctx.fillRect(18, 18, w - 36, 70);
  ctx.textAlign = 'left'; ctx.fillStyle = '#f7e8ab'; ctx.font = `700 ${w < h ? 25 : 27}px ${font}`;
  ctx.fillText(view.title, 32, 52, w - 64);
  ctx.fillStyle = '#d9e3cf'; ctx.font = `20px ${font}`;
  ctx.fillText(view.instruction, 32, 76, w - 64);

  const contentX = 34, contentW = w - 68;
  ctx.fillStyle = '#d7d5c3'; ctx.fillRect(25, 100, w - 50, h * 0.34);
  ctx.fillStyle = '#273632';
  let size = 22, wrapped: string[] = [];
  for (; size >= 15; size--) {
    ctx.font = `${size}px ${font}`;
    wrapped = lines(ctx, view.detail, contentW - 20);
    if (wrapped.length * (size + 4) <= h * 0.34 - 30) break;
  }
  const lineHeight = Math.max(19, size + 4);
  wrapped.forEach((line, i) => ctx.fillText(line, contentX + 2, 130 + i * lineHeight));
  if (view.message) {
    ctx.fillStyle = '#315e4f'; ctx.font = `700 19px ${font}`;
    ctx.fillText(view.message, contentX + 2, h * 0.455, contentW - 20);
  }
  const boxes = actionBoxes(view, w, h);
  ctx.textAlign = 'center'; ctx.font = `700 ${w < h ? 22 : 21}px ${font}`;
  boxes.forEach((box, i) => {
    ctx.fillStyle = '#172e2a'; ctx.fillRect(box.x + 3, box.y + 4, box.w, box.h);
    ctx.fillStyle = '#416d5b'; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = '#83a892'; ctx.fillRect(box.x, box.y, box.w, 4);
    ctx.fillStyle = '#fff6d7';
    const wrapped = lines(ctx, view.actions[i], box.w - 20).slice(0, 2);
    const lineHeight = 24, first = box.y + box.h / 2 - (wrapped.length - 1) * lineHeight / 2 + 7;
    wrapped.forEach((line, j) => ctx.fillText(line, box.x + box.w / 2, first + j * lineHeight, box.w - 18));
  });
  ctx.textAlign = 'left';
}
