# BERX API v1 — Security Matrix

Составлено построчным разбором реального кода в
`components/OssnApi/`, не по памяти и не по намерению. Где защиты
нет — так и написано, без смягчения.

Легенда: ✅ есть и проверено по коду · ❌ отсутствует · ➖ неприменимо

| Endpoint | Auth | Ownership | Privacy | Block | Rate limit | Input validation | IDOR risk | Verification |
|---|---|---|---|---|---|---|---|---|
| `POST /auth/register` | ➖ (public) | ➖ | ➖ | ➖ | ❌ нет лимита на регистрации | ✅ isUsername/isPassword/isEmail | Низкий | STATICALLY CHECKED |
| `POST /auth/login` | ➖ (public) | ➖ | ➖ | ➖ | ✅ 10/15мин, ключ по guid аккаунта | ✅ | ➖ | STATICALLY CHECKED |
| `POST /auth/logout` | ✅ token | ➖ | ➖ | ➖ | ❌ нет (низкий риск — только отзывает свой же токен) | ➖ | ➖ | STATICALLY CHECKED |
| `GET /me` | ✅ token | ✅ (только свои данные) | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `PATCH /me` | ✅ token | ✅ | ➖ | ➖ | ❌ | ✅ isEmail/isPassword | Нет | STATICALLY CHECKED |
| `POST /me/avatar` | ✅ token | ✅ | ➖ | ➖ | ❌ | ✅ getimagesize() + core typeAllowed() | Нет | STATICALLY CHECKED |
| `GET /feed` | ✅ token | ➖ (своя стена) | ➖ | ➖ (наследуется от GetUserPosts) | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `POST /posts` | ✅ token | ➖ | ➖ | ➖ | ❌ | ✅ text required | Нет | STATICALLY CHECKED |
| `GET /posts/{id}` | ✅ token | ➖ (чтение) | ❌ ACL приватности постов не проверяется (core-система access_id не тронута) | ✅ | ❌ | ➖ | **Средний** — приватный пост, если он не публичный, всё равно отдаётся при знании guid, если только автор не заблокировал | STATICALLY CHECKED |
| `POST /posts/{id}/like` | ✅ token | ➖ | ❌ (см. выше) | ✅ | ❌ | ➖ | Средний, тот же класс | STATICALLY CHECKED |
| `POST /posts/{id}/comments` | ✅ token | ➖ | ❌ (см. выше) | ✅ | ❌ | ✅ text required | Средний, тот же класс | STATICALLY CHECKED |
| `GET /profiles/{username}` | ✅ token | ➖ | ➖ (только публичные поля) | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /search/users` | ✅ token | ➖ | ➖ | ✅ (тот же SQL-фрагмент, что в реальном веб-поиске) | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /conversations` | ✅ token | ✅ (только свои) | ➖ | ✅ (не показывает диалог с заблокированным) | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /conversations/{id}` | ✅ token | ✅ | ➖ | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `POST /conversations/{id}/messages` | ✅ token | ➖ | ➖ | ✅ | ❌ | ✅ text required | Нет | STATICALLY CHECKED |
| `GET /dating/discover` | ✅ token | ➖ | ✅ (hide_age/hide_city/invisible_mode) | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `POST /dating/interests` | ✅ token | ➖ | ➖ | ✅ | ✅ 30/60сек | ✅ user required | Нет | STATICALLY CHECKED |
| `POST /dating/pass` | ✅ token | ➖ | ➖ | ➖ (не нужно — не interaction) | ❌ | ✅ | Нет | STATICALLY CHECKED |
| `POST /dating/undo` | ✅ token | ✅ (только свой последний pass) | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /dating/matches` | ✅ token | ✅ | ➖ | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `PATCH /dating/location` | ✅ token | ✅ | ✅ (hide_location по умолчанию 1) | ➖ | ❌ | ✅ диапазон широты/долготы | Нет | STATICALLY CHECKED |
| `PATCH /dating/privacy` | ✅ token | ✅ | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /notifications` | ✅ token | ✅ (owner_guid = token) | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /notifications/unread-count` | ✅ token | ✅ | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `POST /notifications/{id}/read` | ✅ token | ✅ **добавлено в этом раунде** — core `setViewed()` не проверял владельца вообще | ➖ | ➖ | ❌ | ➖ | **Был High, исправлен** | STATICALLY CHECKED |
| `GET /stories` | ✅ token | ➖ | ✅ | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /stories/own` | ✅ token | ✅ | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `POST /stories` | ✅ token | ➖ | ➖ | ➖ | ❌ | ✅ finfo_file() реальная сигнатура | Нет | STATICALLY CHECKED |
| `POST /stories/{id}/view` | ✅ token | ➖ (через checkStoryAccess) | ✅ | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `POST /stories/{id}/delete` | ✅ token | ✅ | ➖ | ➖ | ❌ | ➖ | Нет | STATICALLY CHECKED |
| `GET /stories/{id}/media` | ✅ token | ➖ (через checkStoryAccess) | ✅ | ✅ | ❌ | ➖ | Нет | STATICALLY CHECKED |

## Реальные незакрытые пробелы (без смягчения)

1. **`GET /posts/{id}`, лайк, комментарий — нет проверки core-ACL приватности поста.** Block проверяется (добавлено мной), но родная система приватности OSSN (access_id: публично/друзьям/только себе) — нет. Если пост не публичный, но и не от заблокированного — он всё равно отдастся при точном знании guid. **Средний реальный риск**, не исправлено, честно зафиксировано.
2. **Регистрация не ограничена по частоте.** Можно создавать аккаунты без ограничений через API.
3. **Практически ничего, кроме логина и dating/interests, не имеет rate limit.** Например, `POST /posts` можно спамить без ограничений.
4. **Race condition в rate-limit логина** — теоретически возможен между проверкой лимита и записью попытки при параллельных запросах. Низкий практический риск (это soft-лимит от подбора пароля, не защита от распределённой атаки).
5. **IP-часть таблицы rate-limit существует в схеме, но не используется** — сознательно, см. комментарий в коде: `$_SERVER['REMOTE_ADDR']` не проверен на реальном сервере (может быть IP прокси reg.ru, а не клиента).
