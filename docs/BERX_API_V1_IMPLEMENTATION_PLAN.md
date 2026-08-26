# BERX `/api/v1` — план реализации

**Статус: ПЛАН. Ничего из перечисленного здесь не реализовано.** Составлен
2026-08-26 после подтверждённой VDS-инвентаризации (VDS = baseline
`4416df2`, расширенного `/api/v1` там нет, MariaDB пустая, деплой не
делается). Основан на прямой инспекции существующего кода, а не на
предположениях — каждое утверждение ниже проверено чтением реального
файла в этой сессии.

## 0. Источники

- `client/packages/api/src/client.ts` (1543 строки) + `types.ts` (802
  строки) — **это и есть спецификация**: ~140 методов, каждый уже
  указывает точный путь, HTTP-метод, тело запроса и (в комментариях)
  какой PHP-файл и какую реальную функцию/класс он должен вызывать.
  План ниже почти everywhere просто извлекает то, что уже написано там.
- `docs/BERX_NEXT_ARCHITECTURE/docs/api/API_ARCHITECTURE.md` — базовые
  архитектурные правила.
- `backend/.../API_SECURITY_MATRIX.md`, `API_PAGINATION.md` — построчный
  аудит поведения каждого эндпоинта из прошлой (утраченной) реализации:
  что реально было защищено, что нет, где пагинация настоящая, где нет.
  Это не "теория" — при реализации нужно закрыть перечисленные там же
  дыры (например: `POST /posts` не был rate-limited; `GetUnvalidatedUSERS`
  видит SQL-инъекцию в core и её решили не трогать и не оборачивать
  `search` в API).
- Прямая инспекция `backend/opensource-socialnetwork-master/`: какие
  классы, компоненты, таблицы и миграции реально существуют сейчас.

## 1. Важное расхождение контракта — решить ДО старта реализации

`API_ARCHITECTURE.md` описывает конверт `{ok, data, meta}` /
`{ok:false, error:{code,message,field_errors}, meta}`. Но реальный,
уже написанный клиент (`packages/core/src/index.ts`) ждёт **плоский**
ответ:

```ts
export interface BerxApiErrorBody { error: string; message?: string; }
// success: return json as T — без обёртки {ok,data}
// error:   throw new BerxApiError(res.status, json) — json = {error, message}
```

и все ~140 методов `client.ts` парсят успешный ответ как сам ресурс
(`BerxUser`, `{places: BerxPlace[]}`, `{status: string}`), не как
`response.data`. Это совпадает с реальным, уже упомянутым в прошлых
комментариях паттерном `ossn_api_json($data, $status)`, отдающим `$data`
как есть.

**Решение этого плана: следовать реальному, уже закодированному клиенту
(90+ экранов на нём построены), а не аспирационному конверту из
`API_ARCHITECTURE.md`.** То есть REST-файлы возвращают плоский JSON,
успех/неудача — по HTTP-статусу + `{error, message}` при ошибке. Это
единственное решение, которое не требует переписывать mobile-клиент.
Если впоследствии кто-то всё же хочет перейти на `{ok,data,meta}` —
это отдельная, осознанная миграция клиента, не часть этого плана.

## 2. Что уже реально есть — не пересоздавать, а подключать

### 2.1 Backend-классы, уже в git, с реальными методами (проверено `grep`)

| Класс | Файл | Ключевые методы |
|---|---|---|
| `OssnGeo` | `classes/OssnGeo.php` | `setLocation`, `deleteLocation`, `getLocation`, `near($lat,$lng,$radius_km,$object_type,$limit)`, `allOfType` |
| `OssnPlaceHours` | `classes/OssnPlaceHours.php` | `forPlace`, `replaceSchedule`, `isOpenAt` |
| `OssnBusiness` | `classes/OssnBusiness.php` | claims (`submitClaim/pendingClaims/myClaims/reviewClaim`), review replies (`upsertReply/deleteReply/canReply`), team (`addTeamMember/removeTeamMember/team/canManage/teamRole`), subscription (`getSubscription/ensureTrialStarted/hasActiveAccess`) |
| `OssnBusinessMoments` | `classes/OssnBusinessMoments.php` | `create`, `get`, `activeForPlace(s)`, `removeMoment` |
| `OssnMediaAssets` | `classes/OssnMediaAssets.php` | `create`, `get`, `canAccess`, `attach`, `detach`, `removeAsset`, `listByOwner`, `listByContext`, `listByMediaType`, `listByOwnerAndMediaType` |
| `OssnNearbyImpressions` | `classes/OssnNearbyImpressions.php` | `record`, `countFor`, `summaryFor` |
| `OssnSignals` | `classes/OssnSignals.php` | `record`, `forObject`, `engagementScore`, `forActor`, `distinctActors` (Event Layer — уже реализован) |
| `OssnCreator` | `classes/OssnCreator.php` | `getProfile/isCreator/enable/disable/update`, `recordView/viewCount/audienceSummary`, `recentPosts/recentAlbums/recentEvents/recentExperiences` |
| `OssnCollections` | `classes/OssnCollections.php` | полный CRUD + items |
| `OssnCircles` | `classes/OssnCircles.php` | полный CRUD + members + `canViewPost` |
| `OssnTrips` | `classes/OssnTrips.php` | полный CRUD + stops + participants |
| `OssnExperiences` | `classes/OssnExperiences.php` | полный CRUD + invite/respond/participants |

### 2.2 Core OSSN-классы (не BERX, но нужны для API) — тоже реальны и на месте

`OssnComments` (`PostComment/GetComments/deleteComment/countComments`),
`OssnMessages` (`send/getWith/recentChat/markViewed/countUNREAD/searchMessages`),
`OssnMessageTyping` (отдельный компонент, уже есть),
`OssnNotifications` (`get/setViewed/clearAll/deleteNotification/searchNotifications`),
`OssnBlock` (`addBlock/removeBlock/isBlocked/UserBlockCheck/getBlocking`),
`OssnAlbums` (`CreateAlbum/GetAlbums/GetAlbum`),
`OssnPoke` (`addPoke`),
`OssnWall` (`Post/GetUserPosts/GetPost/deletePost`),
`OssnLikes` (`Like/UnLike/isLiked/CountLikes/GetLikes`),
`OssnUser` (`isFriend/getFriends/searchUsers/getUnvalidatedUSERS/ValidateRegistration`),
`OssnGroup` (`createGroup/getUserGroups/isModerator` — extends `OssnObject`, `type='user'`, `subtype='ossngroup'`),
`ossn_add_friend()`/`ossn_remove_friend()` (`libraries/ossn.lib.users.php`).

### 2.3 БД-схема — уже смигрирована и закоммичена (`upgrade/upgrades/` никогда не был в `.gitignore`)

| Таблица | Миграция | Для чего |
|---|---|---|
| `ossn_api_tokens` | `1785168400.php` | Bearer-токены (`token_hash`, `device_label`, `time_expires`, `revoked`) — **эта миграция уже регистрирует `'OssnApi'` в `ossn_components`** |
| `ossn_api_login_attempts` | `1785168500.php` | rate-limit логина |
| `ossn_reports` | `1785168200.php` | очередь жалоб — **тоже уже регистрирует `'OssnReport'` в `ossn_components`** |
| `ossn_dating_profiles/interests/passes/photo_access/photos` | базовый `installation/sql/opensource-socialnetwork.sql` | вся схема Dating/Match уже есть |
| `ossn_stories`, `ossn_stories_views` | `1785167900.php` | Stories |
| `ossn_points_balance`, `ossn_points_log` | `1785168600.php` | Points (без streak-колонок — см. §3) |
| `ossn_geo_index` | `1785168800.php` | гео-индекс Places+Events (`object_type`) |
| `ossn_collections(+items)`, `ossn_circles(+members)`, `ossn_trips(+stops+participants)`, `ossn_experiences(+participants)`, `ossn_creator_profiles(+views)`, `ossn_media_assets`, `ossn_place_claims`, `ossn_place_review_replies`, `ossn_business_team`, `ossn_business_subscriptions`, `ossn_business_moments`, `ossn_nearby_impressions`, `ossn_place_hours`, `ossn_signals` | `1785168900`…`1785170200.php` | всё перечисленное в §2.1 |

Вывод: **для большинства доменов новых миграций не нужно вообще** — только
для двух вещей (см. §3).

### 2.4 Транспорт/роутинг — уже подготовлен

- `installation/configs/htaccess.dist` уже содержит блок «BERX API v1» —
  правило `RewriteRule ^([A-Za-z0-9\_\-\.]+)/(.*)$ index.php?h=$1&p=$2`
  (даёт `h=api&p=v1/places/123`) и явный проброс `Authorization` для
  mod_fcgid. Файл уже помечает себя как "unverified on live server" —
  проверить на VDS при деплое, это не блокирует план.
- Реальный, уже работающий прецедент page-handler'а в этом же кодбейзе:
  `themes/berx/ossn_theme.php` → `ossn_register_page('media', 'ossn_berx_media_page_handler')`,
  `function ossn_berx_media_page_handler($pages) { $action = $pages[0]; $asset_guid = intval($pages[1]); ... }`.
  Диспетчер `/api` должен быть построен по тому же паттерну:
  `ossn_register_page('api', 'ossn_api_dispatch')`, куда `$pages = ['v1','places','123']`.
- `configurations/classes.php` — это **явный allow-list, не автозагрузка**
  (сам файл документирует это в комментарии). Каждый новый класс
  (`OssnApiToken`, `OssnPlaces`, `OssnEvents`, `OssnDating`, `OssnPoints`,
  `OssnReport`, `OssnStories`) обязан получить одну строку здесь, иначе
  файл в `classes/` никогда не подключится.

## 3. Что реально отсутствует — придётся строить с нуля

1. **`components/OssnApi/` целиком** — сам компонент, `ossn_com.php`
   (диспетчер + регистрация `('ossn','init')`), `classes/OssnApiToken.php`,
   все `v1/*.php` REST-файлы.
2. **`OssnPlaces`, `OssnEvents`, `OssnDating`, `OssnPoints`, `OssnReport`,
   `OssnStories`** — классов нет нигде (ни в git, ни на VDS).
3. **Одна новая таблица**: `ossn_place_reviews` (текст+рейтинг самого
   отзыва). Сейчас есть только `ossn_place_review_replies` (ответ
   владельца на отзыв) — самого отзыва хранить негде.
4. **Streak-колонки** на `ossn_points_balance` (`current_streak`,
   `longest_streak`, `last_active_date`) — в текущей миграции их нет;
   нужен один `ALTER TABLE` поверх существующей таблицы, если streak
   check-in входит в первую волну (см. §7, можно отложить).
5. Places/Events как **сущности не нуждаются в отдельной базовой
   таблице** — тот же `OssnObject`/`ossn_entities` паттерн, что уже
   использует `OssnGroup` (`type='user'`, `subtype='ossnplace'` /
   `'ossnevent'`, `$this->addObject()`, метаданные через `$this->data->x`).
   Это согласуется с тем, что `ossn_geo_index.object_type` уже
   рассчитан на `place|event`, ссылаясь на guid обычной сущности.

## 4. Сквозные архитектурные правила для реализации (не по одному разу на файл)

- **Bearer-аутентификация не трогает `$_SESSION`.** Диспетчер НЕ вызывает
  `ossn_login()`/не populate `$_SESSION['OSSN_USER']`. Любой оборачиваемый
  core-метод, который внутри себя дергает `ossn_loggedin_user()` /
  `ossn_isLoggedin()` (типичный core-паттерн), либо (а) принимает
  guid/user-объект явным параметром — предпочтительно, либо (б) требует
  временного session-bridge непосредственно перед вызовом
  (`$_SESSION['OSSN_USER'] = ossn_user_by_guid($api_user_guid)`) — как
  уже сделано для `OssnPhotos::AddPhoto()` в прошлой (утраченной, но
  задокументированной в `BERX_CHANGELOG.md`) реализации `albums.php`.
  Это нужно перепроверять для КАЖДОГО оборачиваемого метода, не
  предполагать по аналогии — `OssnPoke::addPoke()` тоже требовал
  явной защиты именно по этой причине.
- **Response helper**: одна функция `ossn_api_json($data, $status = 200)`
  в общем bootstrap-файле диспетчера — `header('Content-Type: application/json')`,
  `http_response_code($status)`, `echo json_encode($data)`, `exit`.
  Ошибки — `ossn_api_error($code, $message, $status)` → тело
  `{error: $code, message: $message}`, совпадающее с `BerxApiErrorBody`.
- **Диспетчер грузит ровно один `v1/{resource}.php` за запрос** (уже
  задокументированное в `BERX_PROGRESS.md` ограничение) — файлы не
  импортируют функции друг у друга; общие вещи (JSON-маппер для Place,
  например) живут в самом ресурсном файле или в helper-файле, который
  явно `require`-ится, а не полагаются на "файл places.php уже загружен".
- **Токен**: `token_hash` = `hash('sha256', $rawToken)`, сырой токен
  возвращается клиенту один раз при login/register-confirm, хранится
  клиентом (`BerxTokenStorage`), сервер хранит только хэш. `time_expires`
  проверяется на каждый запрос; `revoked` тоже.
- **Rate limit логина**: пишет в уже существующую
  `ossn_api_login_attempts` (`identifier`, `ip`, `time_created`) —
  10 попыток / 15 минут по ключу guid/identifier, как задокументировано
  в `API_SECURITY_MATRIX.md`.
- **Приватность/блок перед чтением**: каждый read-эндпоинт, отдающий
  чужой контент, обязан проверить `OssnBlock::isBlocked()` — это было
  системным пробелом в прошлой реализации (`API_SECURITY_MATRIX.md`,
  пункт про `GET /posts/{id}`) и должно быть закрыто с нуля, а не
  повторено.

## 5. Endpoint-группы → файлы → зависимости

| # | Группа (client.ts) | REST-файл | Backend-зависимость | Новый класс? | Новая таблица? |
|---|---|---|---|---|---|
| 1 | Auth (`register/login/logout`) | `v1/auth.php` | `OssnUser` (core), `ossn_api_tokens`, `ossn_api_login_attempts` | **`OssnApiToken`** | нет (есть) |
| 2 | Me / Sessions / Delete account | `v1/me.php` | `OssnUser`, `OssnApiToken::listSessions/revokeSessionById`, `OssnFile` (avatar) | использует `OssnApiToken` | нет |
| 3 | Feed | `v1/feed.php` | `OssnWall::GetUserPosts`, `OssnCircles::canViewPost` | нет | нет |
| 4 | Posts/comments/likes/delete | `v1/posts.php` | `OssnWall`, `OssnComments`, `OssnLikes`, `OssnMediaAssets` (attach), `OssnCircles::canViewPost` | нет | нет |
| 5 | Collections | `v1/collections.php` | `OssnCollections` (полностью готов) | нет | нет |
| 6 | Circles | `v1/circles.php` | `OssnCircles` (готов) | нет | нет |
| 7 | Trips | `v1/trips.php` | `OssnTrips` (готов), Places/Events для `itemExists()` | нет | нет |
| 8 | Experiences | `v1/experiences.php` | `OssnExperiences` (готов), Places/Events | нет | нет |
| 9 | Creator | `v1/creator.php` | `OssnCreator` (готов) | нет | нет |
| 10 | Media Assets | `v1/media.php` | `OssnMediaAssets` (готов), `OssnFile`; read-route `/media/get/{guid}` **уже реализован** в `themes/berx/ossn_theme.php` | нет | нет |
| 11 | Video / Tracks | `v1/videos.php`, `v1/tracks.php` | `OssnWall` + `OssnMediaAssets::listByMediaType/listByOwnerAndMediaType` (готовы) | нет | нет |
| 12 | Business (claims/team/subscription/hours) | `v1/business.php` | `OssnBusiness`, `OssnPlaceHours` (готовы) | нет | нет |
| 13 | Memories | `v1/memories.php` | чистая агрегация над `OssnWall`/`OssnAlbums` | нет (или тонкий helper) | нет |
| 14 | Profiles | `v1/profiles.php` | `OssnUser`, `OssnUser::isFriend`, `OssnCreator::isCreator` | нет | нет |
| 15 | Search (users/places/events/communities) | `v1/search.php` | `OssnUser::searchUsers`, **Places/Events должны существовать**, `OssnGroup` | нет | нет |
| 16 | Conversations/Messages/Typing | `v1/conversations.php` | `OssnMessages`, `OssnMessageTyping` (готовы) | нет | нет |
| 17 | Dating/Match | `v1/dating.php` | схема готова (§2.3), логики нет | **`OssnDating`** | нет |
| 18 | Notifications | `v1/notifications.php` | `OssnNotifications` (готов) | нет | нет |
| 19 | Stories | `v1/stories.php` | схема готова, логики нет | **`OssnStories`** | нет |
| 20 | Communities | `v1/communities.php` | `OssnGroup`, `isModerator()` (готовы) | нет | нет |
| 21 | Points / Streak / Spend | `v1/points.php` | схема готова (без streak) | **`OssnPoints`** | streak-колонки (ALTER) |
| 22 | Nearby / Moments / Impressions | `v1/nearby.php`, `v1/moments.php`, `v1/impressions.php` | `OssnGeo`, `OssnBusinessMoments`, `OssnNearbyImpressions` (готовы); nearby зависит от **готового `OssnEvents`** | нет | нет |
| 23 | Wrapped | `v1/wrapped.php` | чистая агрегация над Points/Signals/NearbyImpressions | нет | нет |
| 24 | Friends | `v1/friends.php`, `v1/friend.php` | `OssnUser::getFriends`, `ossn_add_friend/ossn_remove_friend` (готовы) | нет | нет |
| 25 | Albums | `v1/albums.php` | `OssnAlbums`, `OssnPhotos::AddPhoto` (session-bridge!) | нет | нет |
| 26 | Block | `v1/block.php` | `OssnBlock` (готов, включая `getBlocking()`) | нет | нет |
| 27 | Report | `v1/report.php` | схема готова | **`OssnReport`** | нет |
| 28 | Admin (unvalidated) | `v1/admin.php` | `OssnUser::getUnvalidatedUSERS/ValidateRegistration` (готовы, **без search** — см. известную SQLi в core) | нет | нет |
| 29 | Poke | `v1/poke.php` | `OssnPoke`, `OssnBlock::isBlocked` (готовы) | нет | нет |
| 30 | Places (+business/*, +save, +cover) | `v1/places.php` | `OssnObject`-паттерн, `OssnGeo`, `OssnPlaceHours`, `OssnBusiness`, `OssnMediaAssets`/`OssnFile` | **`OssnPlaces`** | **`ossn_place_reviews`** |
| 31 | Events (+RSVP, +invite, +cover) | `v1/events.php` | `OssnObject`-паттерн, `OssnGeo`, relation-based RSVP (`berx:event:going`) | **`OssnEvents`** | нет (RSVP через relations, без новой таблицы) |
| 32 | Comments (Places/Events) | `v1/comments.php` | `OssnComments` (готов) — **зависит от готовых Places/Events** | нет | нет |
| 33 | Group moderators | внутри `v1/communities.php` | `OssnGroup::isModerator` (готов) | нет | нет |
| — | Bootstrap/dispatcher | `ossn_com.php` + общий `v1/_bootstrap.php` | весь диспетчинг, `ossn_api_json/ossn_api_error`, bearer-парсинг | — | — |

## 6. Полный список БД-таблиц

**Уже существуют (переиспользовать как есть):** `ossn_api_tokens`,
`ossn_api_login_attempts`, `ossn_reports`, `ossn_dating_profiles`,
`ossn_dating_interests`, `ossn_dating_passes`, `ossn_dating_photo_access`,
`ossn_dating_photos`, `ossn_stories`, `ossn_stories_views`,
`ossn_points_balance`, `ossn_points_log`, `ossn_geo_index`,
`ossn_collections`, `ossn_collection_items`, `ossn_circles`,
`ossn_circle_members`, `ossn_trips`, `ossn_trip_stops`,
`ossn_trip_participants`, `ossn_experiences`, `ossn_experience_participants`,
`ossn_creator_profiles`, `ossn_creator_profile_views`, `ossn_media_assets`,
`ossn_place_claims`, `ossn_place_review_replies`, `ossn_business_team`,
`ossn_business_subscriptions`, `ossn_business_moments`,
`ossn_nearby_impressions`, `ossn_place_hours`, `ossn_signals`.

**Новые, нужно создать:**
1. `ossn_place_reviews` (id, place_guid, author_guid, rating, review text,
   time_created — уникальность одна на пользователя на место, как
   документировано в `client.ts`'s комментарии "one review per user per place").
2. `ALTER TABLE ossn_points_balance ADD current_streak, longest_streak,
   last_active_date` (если streak входит в первую волну).

Places/Events сами по себе — **без новой таблицы** (см. §3, пункт 5).

## 7. Граф зависимостей и порядок волн

```
Wave 0 — фундамент (всё остальное на этом стоит)
  OssnApiToken + ossn_com.php-диспетчер + auth.php + me.php
       │
       ├──> Wave 1 — независимые домены с готовой логикой (можно параллельно)
       │      feed.php, posts.php, comments-on-posts, notifications.php,
       │      conversations.php, friends.php, friend.php, albums.php,
       │      block.php, poke.php, profiles.php(users only),
       │      collections.php, circles.php, media.php, videos.php,
       │      tracks.php, creator.php
       │
       ├──> Wave 2 — новые доменные классы (логики нет, схема есть)
       │      OssnDating → dating.php
       │      OssnStories → stories.php
       │      OssnPoints  → points.php
       │      OssnReport  → report.php
       │      communities.php (OssnGroup уже есть, только REST-обёртка)
       │
       └──> Wave 3 — Places/Events (новые entity-классы, самое рискованное место)
              OssnPlaces → places.php (+ business/* branches, ossn_place_reviews)
              OssnEvents → events.php
                   │
                   └──> Wave 4 — то, что ЗАВИСИТ от Places/Events
                          comments.php (object comments on places/events)
                          trips.php / experiences.php (itemExists() против Places/Events)
                          search.php (places/events scopes)
                          nearby.php, moments.php, impressions.php
                          business.php (business/* уже частично в places.php,
                              но team/subscription/hours независимы от Places
                              как сущности — можно двигать раньше, если нужно)
                          wrapped.php (агрегирует всё, включая места/события)
```

## 8. Предлагаемая последовательность реализации (по шагам, каждый — отдельный проверяемый vertical slice)

1. **Bootstrap**: `components/OssnApi/ossn_com.php`, `classes/OssnApiToken.php`,
   регистрация в `configurations/classes.php`, общий `ossn_api_json/ossn_api_error`,
   bearer-парсинг с `X-Api-Token` fallback.
2. **auth.php + me.php** — без этого ничего остального не протестировать
   (регистрация, логин, `/me`, sessions, delete account).
3. **Домены с полностью готовой логикой, без новых классов** (можно
   пачками): posts/feed/comments-on-posts → collections → circles →
   media/videos/tracks → creator → notifications → conversations/typing →
   friends/friend → albums → block → poke → profiles(users) →
   business(team/subscription/hours, независимо от Places-как-сущности).
4. **Новые лёгкие доменные классы поверх готовой схемы**: `OssnPoints`
   (+ опционально streak-миграция) → `OssnReport` → `OssnDating` →
   `OssnStories` → `communities.php` REST-обёртка над `OssnGroup`.
5. **`OssnPlaces`** (самое крупное новое: entity+geo+hours+business+reviews+cover)
   → `places.php`.
6. **`OssnEvents`** (entity+geo+RSVP+invite+cover) → `events.php`.
7. **Всё, что зависит от Places/Events**: `comments.php` (object-comments),
   `search.php` (places/events/communities scopes), `nearby.php`,
   `moments.php`, `impressions.php`, `trips.php`/`experiences.php`'s
   `itemExists()` проверка против реальных Places/Events.
8. **`admin.php`** (unvalidated users — без search, намеренно).
9. **`wrapped.php`, `memories.php`** — чистая агрегация, последними, когда
   есть что агрегировать.
10. На каждом шаге: `php -l` на новые файлы, статический review на
    session-bridge и block-check, обновление `client/packages/api/src/client.ts`
    НЕ требуется (контракт уже написан) — только сверка "что REST-файл
    реально принимает/отдаёт" 1:1 с уже существующим методом клиента.

## 9. Открытые вопросы к пользователю до старта реализации

1. **Конверт ответа** (§1) — подтвердить: следуем реальному плоскому
   контракту `client.ts`, игнорируем `{ok,data,meta}` из
   `API_ARCHITECTURE.md` как устаревший черновик?
2. **Streak-колонки** (§3.4) — включать в первую волну Points, или
   отложить до отдельного запроса?
3. **`ossn_place_reviews`** — единственная реально новая таблица во всём
   плане; название/поля предложены в §6, но финальную схему стоит
   утвердить перед миграцией.
4. Начинать реализацию с Wave 0 (auth/me) сразу после утверждения этого
   плана, или сначала — отдельное подтверждение по каждому Wave?

## 10. Статус реализации

**Статус-легенда:** `CLOUD-STATIC-VERIFIED` = проверено в этом cloud-окружении
статически (php -l, чтение реального кода зависимостей, ручная трассировка
роутинга, сверка полей с `client.ts`/`types.ts`) — **БЕЗ реальной БД,
без реального HTTP-запроса, без реального веб-сервера**, потому что
в этом cloud-контейнере нет MySQL/MariaDB-сервера (проверено:
`mysql`/`mysqld`/`mariadb` — нет ни одного бинарника, только PHP-драйверы).
`RUNTIME-VERIFIED` = подтверждено реальным запросом к реально поднятому
OSSN + MySQL (на VDS) — **не проставлено ни для чего в этом документе**,
это отдельный, более сильный статус, который может дать только VDS.

### Wave 0 — Bootstrap + Auth: CLOUD-STATIC-VERIFIED, NOT RUNTIME-VERIFIED

| Файл | Статус |
|---|---|
| `classes/OssnApiToken.php` (новый) | CLOUD-STATIC-VERIFIED |
| `configurations/classes.php` (изменён — добавлена регистрация `ApiToken`) | CLOUD-STATIC-VERIFIED |
| `components/OssnApi/ossn_com.php` (новый — диспетчер) | CLOUD-STATIC-VERIFIED |
| `components/OssnApi/v1/auth.php` (новый — register/login/logout) | CLOUD-STATIC-VERIFIED |
| `components/OssnApi/v1/me.php` (новый — me/avatar/sessions/delete) | CLOUD-STATIC-VERIFIED |

Что реально сделано для верификации:
- `php -l` по всем изменённым/новым файлам — 0 ошибок; полный повторный
  прогон по всему backend-дереву (1156 файлов) — 0 ошибок, регрессий нет.
- Каждый вызванный метод/функция (`OssnUser::authenticate/getUser/save/
  resetPassword/deleteUser/isUsername/isPassword/isEmail/isOssnUsername/
  isOssnEmail/addUser/iconURL/profileURL`, `OssnFile::setFile/setPath/
  setStore/setExtension/addFile/getFileUploadError`, `OssnProfile::
  addPhotoWallPost`, `OssnDatabase::insert/select/update/delete/wheres`,
  core `input()/ossn_register_page()/ossn_register_callback()/
  ossn_route()`) подтверждён прямым чтением реального определения в
  этой сессии — не предполагался по аналогии.
- Ручная трассировка роутинга для каждого реального пути из `client.ts`
  (`POST /auth/register|login|logout`, `GET|PATCH /me`, `POST /me/avatar`,
  `GET /me/sessions`, `POST /me/sessions/{id}/revoke`, `POST /me/delete`)
  через `$pages` → `$segments` → конкретную ветку — все совпадают.
- Построчная сверка каждого ответа с реальными TS-типами
  (`BerxAuthSession`, `BerxUser`, `BerxSession`, и точные `Promise<...>`
  сигнатуры методов `client.ts`) — совпадение по составу полей.
- **Найден и исправлен один реальный баг до коммита**: `input()`
  реально возвращает `false` (не `null`) при отсутствии поля — прочитан
  реальный код `libraries/ossn.lib.input.php` до конца, а не
  предположен. Первая версия `me.php`'s PATCH-ветки проверяла
  `!== null`, что пропускало бы `false` как "поле пришло" и затирало бы
  `first_name`/`last_name`/`email` при каждом PATCH-запросе без этих
  полей. Исправлено на прямую truthy-проверку, как в остальном кодбейзе
  (`if (!empty($password))`-стиль).
- Задокументирован и решён реальный PHP-нюанс: `$_REQUEST`/`input()`
  не заполняются автоматически для PATCH/DELETE-тел
  (`application/x-www-form-urlencoded`) — PHP делает это только для
  POST. Решено один раз в диспетчере (`ossn_com.php`) через
  `parse_str(file_get_contents('php://input'), ...)` перед `include`,
  а не по одному разу в каждом v1-файле.
- Миграции `ossn_api_tokens`/`ossn_api_login_attempts`
  (`1785168400.php`/`1785168500.php`) НЕ создавались заново — только
  прочитаны, имена колонок сверены 1:1 с тем, что использует
  `OssnApiToken.php`.

**Чего НЕ было и не может быть в этом окружении:** реального запроса
через `index.php`, реальной MySQL-транзакции, реальной проверки
`.htaccess`-rewrite на живом сервере, реальной проверки
`getallheaders()`/`HTTP_AUTHORIZATION` под конкретной конфигурацией
Apache/Nginx/PHP-FPM VDS. Это остаётся первым, что нужно проверить на
VDS, когда до него дойдёт очередь — до тех пор Wave 0 годен только
как "готов к рантайм-проверке", не как "работает".

## 11. Явно вне рамок этого плана

Payments/Wallet/Tickets (нет провайдера), ban/suspend (нет backend-модели
в core OSSN), AI-ranking (канон — не требуется), WebSocket-транспорт
(Phase 2 по `SYSTEM_ARCHITECTURE.md`) — ничего из этого не входит в
`/api/v1` реализацию, описанную здесь.
