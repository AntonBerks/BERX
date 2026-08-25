"""
Реальный тест ЛОГИКИ МАРШРУТИЗАЦИИ conversations.php.
Это НЕ runtime-тест PHP. Это порт того же алгоритма ветвления на Python,
чтобы проверить именно ту логику, где я дважды ошибся (unread-count).
Ограничение честное: проверяется порядок ветвления, а не выполнение PHP.
"""
def php_intval(s):
    # PHP intval(): ведущие цифры или 0
    out = ""
    for ch in str(s).strip():
        if ch.isdigit() or (ch == '-' and not out):
            out += ch
        else:
            break
    try:
        return int(out)
    except ValueError:
        return 0

def route(segments, method):
    seg0 = segments[0] if len(segments) > 0 else None
    # ВЕТКА 1: сырая строка проверяется ДО intval — это и есть моё исправление
    if seg0 == 'unread-count' and method == 'GET':
        return 'unread_count'
    other = php_intval(seg0) if seg0 is not None else 0
    sub = segments[1] if len(segments) > 1 else ''
    if other == 0 and method == 'GET':
        return 'list'
    if other > 0 and sub == '' and method == 'GET':
        return 'history'
    if other > 0 and sub == 'messages' and method == 'POST':
        return 'send'
    if other > 0 and sub == 'read' and method == 'POST':
        return 'mark_read'
    if other > 0 and sub == 'messages' and len(segments) > 2 and segments[2] and method == 'DELETE':
        return 'delete_message'
    if other > 0 and sub == 'typing':
        return 'typing_get' if method == 'GET' else 'typing_set'
    return '404'

cases = [
    ([], 'GET', 'list'),
    (['unread-count'], 'GET', 'unread_count'),
    (['42'], 'GET', 'history'),
    (['42','messages'], 'POST', 'send'),
    (['42','read'], 'POST', 'mark_read'),
    (['42','messages','7'], 'DELETE', 'delete_message'),
    (['42','typing'], 'GET', 'typing_get'),
    (['42','typing'], 'POST', 'typing_set'),
    (['unread-count'], 'POST', '404'),
    (['42','messages'], 'DELETE', '404'),
]
fails = 0
for segs, m, expect in cases:
    got = route(segs, m)
    ok = got == expect
    if not ok: fails += 1
    print(f"{'PASS' if ok else 'FAIL'}  {m:6} /{'/'.join(segs):24} -> {got:15} (ожидалось {expect})")

print()
print("=== регрессия на баг, который я ловил дважды ===")
buggy = php_intval('unread-count')
print(f"php_intval('unread-count') = {buggy}  <- именно поэтому ветка сталкивалась со 'list'")
print(f"итог: {'ВСЕ ПРОЙДЕНЫ' if fails==0 else str(fails)+' ПРОВАЛОВ'}")
