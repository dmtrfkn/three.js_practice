"""Сравнивает исходный (Google Docs) и новый Markdown и размечает изменения:
{+новое+} — будет выделено жёлтым, {-старое-} — серым (старый текст не удаляется).
Использование: python3 -I diffmd.py original.md new.md out.md   (original может быть пустым файлом — тогда всё новое)."""
import sys, re, difflib

def norm(s: str) -> str:
    s = s.replace('\u202f', ' ').replace('\u00a0', ' ')
    s = re.sub(r'\\([-+.!#*\[\]()_])', r'\1', s)
    return s

def lines(path):
    try:
        return [l.rstrip() for l in norm(open(path, encoding='utf8').read()).split('\n')]
    except FileNotFoundError:
        return []

def mark(text, kind):
    if not text.strip():
        return text
    lead = text[:len(text) - len(text.lstrip())]
    trail = text[len(text.rstrip()):]
    core = text.strip()
    return f"{lead}{{{kind}{core}{kind}}}{trail}"

def word_diff(a: str, b: str) -> str:
    ta, tb = re.findall(r'\S+|\s+', a), re.findall(r'\S+|\s+', b)
    ops = [list(o) for o in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes()]
    # сливаем правки, разделённые короткими совпадениями (≤ 3 слов), — фраза целиком серым, затем целиком жёлтым
    merged = []
    for op in ops:
        if merged and op[0] != 'equal' and len(merged) >= 2 and merged[-1][0] == 'equal' and merged[-2][0] != 'equal':
            eq = merged[-1]
            words = sum(1 for t in ta[eq[1]:eq[2]] if t.strip())
            if words <= 3:
                prev = merged[-2]; merged.pop()
                prev[0] = 'replace'; prev[2] = op[2]; prev[4] = op[4]
                continue
        if merged and op[0] != 'equal' and merged[-1][0] != 'equal':
            merged[-1][0] = 'replace'; merged[-1][2] = op[2]; merged[-1][4] = op[4]; continue
        merged.append(op)
    out = []
    for op, i1, i2, j1, j2 in merged:
        if op == 'equal':
            out.append(''.join(ta[i1:i2]))
        else:
            if i2 > i1: out.append(mark(''.join(ta[i1:i2]), '-'))
            if j2 > j1: out.append(mark(''.join(tb[j1:j2]), '+'))
    return ''.join(out)

def is_row(l): return l.strip().startswith('|')
def cells(l): return l.strip().strip('|').split('|')

def line_pair(a: str, b: str) -> list[str]:
    if is_row(a) and is_row(b):
        ca, cb = cells(a), cells(b)
        if len(ca) == len(cb):
            return ['|' + '|'.join(word_diff(x, y) for x, y in zip(ca, cb)) + '|']
        return [row_mark(a, '-'), row_mark(b, '+')]
    if is_row(a) or is_row(b):
        return [whole(a, '-'), whole(b, '+')]
    pa = re.match(r'^(\s*(?:#{1,3}|[*-]|\d+\.|>)\s+)', a); pb = re.match(r'^(\s*(?:#{1,3}|[*-]|\d+\.|>)\s+)', b)
    if pa and pb and pa.group(1).strip() == pb.group(1).strip():
        return [pb.group(1) + word_diff(a[len(pa.group(1)):], b[len(pb.group(1)):])]
    if not pa and not pb:
        return [word_diff(a, b)]
    return [whole(a, '-'), whole(b, '+')]

def row_mark(l, kind):
    if re.fullmatch(r'\|?(\s*:?-+:?\s*\|)+\s*', l.strip()):
        return l
    return '|' + '|'.join(mark(c, kind) for c in cells(l)) + '|'

def whole(l, kind):
    if not l.strip(): return l
    if is_row(l): return row_mark(l, kind)
    m = re.match(r'^(\s*(?:#{1,3}|[*-]|\d+\.|>)\s+)', l)
    if m: return m.group(1) + mark(l[len(m.group(1)):], kind)
    return mark(l, kind)

def main():
    a, b, out = sys.argv[1], sys.argv[2], sys.argv[3]
    la, lb = lines(a), lines(b)
    res = []
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, la, lb, autojunk=False).get_opcodes():
        if op == 'equal':
            res += lb[j1:j2]
        elif op == 'delete':
            res += [whole(l, '-') for l in la[i1:i2]]
        elif op == 'insert':
            res += [whole(l, '+') for l in lb[j1:j2]]
        else:
            old, new = la[i1:i2], lb[j1:j2]
            n = min(len(old), len(new))
            for k in range(n):
                ratio = difflib.SequenceMatcher(None, old[k], new[k]).ratio()
                if ratio > 0.35: res += line_pair(old[k], new[k])
                else: res += [whole(old[k], '-'), whole(new[k], '+')]
            res += [whole(l, '-') for l in old[n:]]
            res += [whole(l, '+') for l in new[n:]]
    open(out, 'w', encoding='utf8').write('\n'.join(res))

main()
