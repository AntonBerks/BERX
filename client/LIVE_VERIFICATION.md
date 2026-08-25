# BERX API v1 — LIVE VERIFICATION

Ничего в этом документе не было выполнено против живого сервера.
Каждая команда — реальный `curl`, готовый к использованию. Замените
`YOUR_USERNAME`/`YOUR_PASSWORD` на свои данные. **Не публикуйте**
реальный токен — он равносилен паролю на 30 дней.

Формат каждого раздела: URL, метод, авторизация, параметры, пример,
ожидаемый статус/ответ, типичные ошибки, privacy/block-ограничения.

---

## 0. Подготовка

```bash
export BERX_TOKEN=""   # заполнится после раздела 1.3
export OTHER_GUID=""   # заполнится после раздела 2.6 (поиск)
```

---

## 1. Authentication

### 1.1 Регистрация
`POST /api/v1/auth/register` — без авторизации.
Параметры: `username, firstname, lastname, email, password` (обязательные).

```bash
curl -s -X POST https://berx.online/api/v1/auth/register \
  -d "username=testuser2&firstname=Test&lastname=User&email=test2@example.com&password=StrongPass123"
```
Ожидается: **201**, `{"status":"registered","message":"..."}`.
Аккаунт неактивен до перехода по ссылке из письма — `/auth/login` для
него вернёт `invalid_credentials`, пока не активирован.

### 1.2 Неверный пароль
```bash
curl -i -X POST https://berx.online/api/v1/auth/login \
  -d "username_or_email=YOUR_USERNAME&password=ЗАВЕДОМО_НЕВЕРНЫЙ"
```
Ожидается: **401**, `{"error":"invalid_credentials","message":"..."}`.

### 1.3 Вход (реальный)
```bash
curl -s -X POST https://berx.online/api/v1/auth/login \
  -d "username_or_email=YOUR_USERNAME&password=YOUR_PASSWORD"
```
Ожидается: **200**, `{"token":"...","user_guid":N,"expires_at":N}`.
Сохраните: `export BERX_TOKEN="..."`.

### 1.4 Rate limit
Повторите 1.2 одиннадцать раз подряд для одного логина. С 11-й попытки
ожидается тот же `invalid_credentials` (лимит скрыт намеренно — не
раскрывает факт срабатывания, см. `API_SECURITY_MATRIX.md`), но даже
**верный** пароль в этот момент будет отклонён — признак, что лимит
сработал.

### 1.5 Authorization: Bearer
```bash
curl -i https://berx.online/api/v1/me -H "Authorization: Bearer $BERX_TOKEN"
```
Ожидается: **200** с вашими данными. **Если 401** — см. 1.7.

### 1.6 Невалидный / просроченный токен
```bash
curl -i https://berx.online/api/v1/me -H "Authorization: Bearer явно_неверный_токен"
```
Ожидается: **401**, `{"error":"unauthorized",...}`.

### 1.7 X-Api-Token fallback
```bash
curl -i https://berx.online/api/v1/me -H "X-Api-Token: $BERX_TOKEN"
```
Если 1.5 вернул 401, а этот запрос — 200: сервер режет заголовок
`Authorization` (см. заметку в `installation/configs/htaccess.dist`).
Если оба варианта вернули 401 — сообщите точный код/тело, не токен.

### 1.8 Logout / отзыв токена
```bash
curl -s -X POST https://berx.online/api/v1/auth/logout -H "Authorization: Bearer $BERX_TOKEN"
curl -i https://berx.online/api/v1/me -H "Authorization: Bearer $BERX_TOKEN"
```
Второй запрос должен вернуть **401** — токен отозван немедленно.
После этого получите новый токен через 1.3 для следующих разделов.

---

## 2. Social (посты, профиль, поиск)

### 2.1 Лента
`GET /api/v1/feed?limit=20&offset=0`
```bash
curl -s "https://berx.online/api/v1/feed?limit=5&offset=0" -H "Authorization: Bearer $BERX_TOKEN"
```
Ожидается: `{"items":[...],"limit":5,"offset":0}`. Честная оговорка:
это стена пользователя (свои посты + посты друзей на своей стене), не
полная агрегированная лента всех, на кого вы подписаны.

### 2.2 Создание поста
```bash
curl -s -X POST https://berx.online/api/v1/posts \
  -H "Authorization: Bearer $BERX_TOKEN" -d "text=Тест из API"
```
Ожидается: **201**, `{"guid":N}`.

### 2.3 Просмотр поста
```bash
curl -s https://berx.online/api/v1/posts/GUID_ИЗ_2.2 -H "Authorization: Bearer $BERX_TOKEN"
```
**Известное ограничение** (см. матрицу безопасности): приватность
поста в терминах ядра OSSN (access_id) не проверяется, только
блокировка. Публичный пост — всегда 200.

### 2.4 Лайк и комментарий
```bash
curl -s -X POST https://berx.online/api/v1/posts/GUID/like -H "Authorization: Bearer $BERX_TOKEN"
curl -s -X POST https://berx.online/api/v1/posts/GUID/comments \
  -H "Authorization: Bearer $BERX_TOKEN" -d "text=Комментарий из API"
```
Оба — **200/201**, `{"status":"..."}`.

### 2.5 Профиль
```bash
curl -s https://berx.online/api/v1/profiles/YOUR_USERNAME -H "Authorization: Bearer $BERX_TOKEN"
```

### 2.6 Поиск пользователей
```bash
curl -s "https://berx.online/api/v1/search/users?q=часть_имени" -H "Authorization: Bearer $BERX_TOKEN"
```
Сохраните чей-то `guid` из ответа: `export OTHER_GUID=...`

---

## 3. Messaging

### 3.1 Отправка сообщения
```bash
curl -s -X POST "https://berx.online/api/v1/conversations/$OTHER_GUID/messages" \
  -H "Authorization: Bearer $BERX_TOKEN" -d "text=Привет из API"
```

### 3.2 Просмотр переписки и списка диалогов
```bash
curl -s "https://berx.online/api/v1/conversations/$OTHER_GUID" -H "Authorization: Bearer $BERX_TOKEN"
curl -s "https://berx.online/api/v1/conversations" -H "Authorization: Bearer $BERX_TOKEN"
```

### 3.3 Заблокированный не может писать
Заблокируйте `$OTHER_GUID` через обычный веб-интерфейс сайта, затем
повторите 3.1 от их имени (нужен их токен) — ожидается отказ (та же
"тихая" ошибка `send_failed`, без уточнения причины блокировки).

---

## 4. Dating (BERX Match)

Требует существующей анкеты (заполненной через веб `/dating/profile/edit`).

```bash
curl -s "https://berx.online/api/v1/dating/discover?limit=10&offset=0" -H "Authorization: Bearer $BERX_TOKEN"
curl -s -X POST https://berx.online/api/v1/dating/interests -H "Authorization: Bearer $BERX_TOKEN" -d "user=ЧЕЙ_ТО_GUID"
curl -s -X POST https://berx.online/api/v1/dating/pass -H "Authorization: Bearer $BERX_TOKEN" -d "user=ЧЕЙ_ТО_GUID"
curl -s -X POST https://berx.online/api/v1/dating/undo -H "Authorization: Bearer $BERX_TOKEN"
curl -s https://berx.online/api/v1/dating/matches -H "Authorization: Bearer $BERX_TOKEN"
curl -s -X PATCH https://berx.online/api/v1/dating/location -H "Authorization: Bearer $BERX_TOKEN" -d "latitude=55.75&longitude=37.61"
curl -s -X PATCH https://berx.online/api/v1/dating/privacy -H "Authorization: Bearer $BERX_TOKEN" -d "invisible_mode=1"
```
**invisible_mode проверка**: после включения профиль не должен
появляться в `discover` другого пользователя — проверьте с двух
разных токенов.
**Блокировка**: заблокированный не должен появляться ни в `discover`,
ни в `matches`.

---

## 5. Stories

```bash
# создание (нужен реальный jpg-файл)
curl -s -X POST https://berx.online/api/v1/stories \
  -H "Authorization: Bearer $BERX_TOKEN" \
  -F "story=@/путь/к/фото.jpg" -F "caption=Тест"

# список
curl -s https://berx.online/api/v1/stories -H "Authorization: Bearer $BERX_TOKEN"
curl -s https://berx.online/api/v1/stories/own -H "Authorization: Bearer $BERX_TOKEN"

# просмотр (отметка)
curl -s -X POST https://berx.online/api/v1/stories/ID/view -H "Authorization: Bearer $BERX_TOKEN"

# медиа (бинарные данные, не JSON)
curl -s https://berx.online/api/v1/stories/ID/media -H "Authorization: Bearer $BERX_TOKEN" -o story.jpg

# удаление
curl -s -X POST https://berx.online/api/v1/stories/ID/delete -H "Authorization: Bearer $BERX_TOKEN"
```
**Expiration**: через 24 часа после создания `checkStoryAccess`
должен отказать даже владельцу — `/media` вернёт 404.
**Блокировка**: история заблокированного не должна появляться в
`GET /stories`, и прямой запрос к `/stories/{id}/media` для чужой
истории заблокированного пользователя должен вернуть 404.

---

## 6. Notifications

```bash
curl -s "https://berx.online/api/v1/notifications?limit=10&offset=1" -H "Authorization: Bearer $BERX_TOKEN"
curl -s "https://berx.online/api/v1/notifications?unread=1" -H "Authorization: Bearer $BERX_TOKEN"
curl -s https://berx.online/api/v1/notifications/unread-count -H "Authorization: Bearer $BERX_TOKEN"
curl -s -X POST https://berx.online/api/v1/notifications/ID/read -H "Authorization: Bearer $BERX_TOKEN"
```
**Ownership-проверка** (реальный баг, исправленный в этой сессии):
попробуйте пометить прочитанным ID уведомления, которое **не ваше** —
ожидается **404**, не 200.

---

## 7. Media (аватар)

```bash
# успешная загрузка
curl -s -X POST https://berx.online/api/v1/me/avatar \
  -H "Authorization: Bearer $BERX_TOKEN" -F "userphoto=@/путь/к/фото.jpg"

# поддельный Content-Type (реальный .txt с именем .jpg)
echo "not an image" > fake.jpg
curl -s -X POST https://berx.online/api/v1/me/avatar \
  -H "Authorization: Bearer $BERX_TOKEN" -F "userphoto=@fake.jpg;type=image/jpeg"
```
Второй запрос **должен** вернуть `{"error":"invalid_image",...}` —
это прямая проверка добавленного в этой сессии `getimagesize()`.

```bash
# слишком большой файл (>лимита PHP upload_max_filesize)
curl -s -X POST https://berx.online/api/v1/me/avatar \
  -H "Authorization: Bearer $BERX_TOKEN" -F "userphoto=@огромный_файл.jpg"
```

---

## Что сообщить после проверки

Для каждого пункта — сработало точно как описано, или пришёл другой
код/ответ (пришлите точный текст). Это единственный способ превратить
**STATICALLY CHECKED** в **VERIFIED** — из песочницы разработки это
недостижимо, сколько бы раз код ни перечитывался.

## Безопасное обращение с токеном

Не вставляйте токен/пароль в скриншоты. Токен живёт 30 дней — при
утечке сразу `/auth/logout` этим токеном, затем новый вход.
