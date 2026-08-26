# BERX — 250 UI States Product Blueprint

**Тип документа:** product blueprint, не implementation status. Ничего
здесь не утверждает "это уже построено" — статус реализации живёт
отдельно, в `client/BERX_PROGRESS.md` и `docs/BERX_API_V1_IMPLEMENTATION_PLAN.md`.
Этот документ описывает **целевые UI-состояния**, к которым существующая
и планируемая архитектура должна вести — ни строчки кода здесь нет и не
должно быть.

## Метод

Взят как источник истины **уже существующий** продукт: домены из
`docs/BERX_NEXT_ARCHITECTURE/docs/architecture/DOMAIN_MAP.md` и
`PRODUCT_CAPABILITY_MAP.md`, реальные backend-возможности, задокументированные
в `client/BERX_PROGRESS.md` и подтверждённые в этой сессии при построении
`docs/BERX_API_V1_IMPLEMENTATION_PLAN.md` (Wave 0–2 уже реализованы и
запушены; Places/Events — Wave 3, архитектурно спланированы, но ещё не
реализованы backend'ом). Ни один state ниже не вводит домен, которого нет
ни в одном из этих источников. Explicitly **не построено и не описано как
existing**: Wallet/Tickets/Payments (нет провайдера), AI-ranking (канон
запрещает), ban/suspend (нет backend-модели) — см. `BERX_PROGRESS.md`'s
"Explicitly NOT built".

## Основной продуктовый цикл

```
DISCOVER → CONNECT → GO → EXPERIENCE → SHARE → VERIFY → EARN → LEVEL UP → DISCOVER MORE
```

Каждый state ниже отмечен тем, в какую фазу цикла он попадает (колонка
не выделена отдельно — фаза очевидна из группировки разделов и глагола в
"User Goal"). Это не клон VK/Instagram/Tinder: лента — не центр
приложения (BERX_FUTURE_CORE.md прямо называет её "примитивной" по
дизайну, не по недосмотру), центр — реальный мир (Places/Events/NOW) и
единый Social Graph, связывающий людей, места, события, сообщества и
experiences в один цикл, а не в параллельные вкладки-копии чужих
приложений.

## Формат записи

Каждый из 250 states имеет ровно эти поля:

| Поле | Смысл |
|---|---|
| # | Уникальный номер 1–250 |
| State | Название состояния экрана |
| User Goal | Что пользователь хочет получить именно здесь |
| Entry From | Из какого state/действия сюда попадают |
| Actions | Реальные действия, доступные на этом state |
| Next State | Куда ведёт основное действие |
| Data / API | Реальный или запланированный источник данных (домен/эндпоинт) |
| Why Daily | Почему это состояние нужно для ежедневного использования, а не разового |

---

## 1. Onboarding & Identity (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 1 | Welcome | Понять, что это за приложение, выбрать вход | Первый запуск | Login / Register | Login или Register | статический контент | первый и единственный раз, но блокирует весь остальной цикл |
| 2 | Register | Создать аккаунт | Welcome | Ввод username/имени/email/пароля | Register Pending Activation | `POST /auth/register` | ворота в продукт — без него не начинается DISCOVER |
| 3 | Register Pending Activation | Понять, что делать дальше | Register (успех) | Открыть почту, повторно войти позже | Login | статус аккаунта (validated=false) | честный gate — без активации логин не пройдёт |
| 4 | Email Activation Result | Подтвердить, что аккаунт активен | Ссылка из письма | Перейти к Login | Login | server-side validation | разовый, но обязательный шаг доверия |
| 5 | Login | Войти в аккаунт | Welcome / logout | Ввод логина+пароля | Home Feed или First-Run Profile Setup | `POST /auth/login` | каждый холодный старт без сохранённого токена |
| 6 | Login Error | Понять, почему вход не удался | Login (ошибка) | Повтор, Forgot Password | Login | 401/429 от `/auth/login` | реальный rate-limit — честная обратная связь |
| 7 | Forgot Password Request | Восстановить доступ | Login Error / Login | Ввод email | Reset Password Form | core reset-code flow | редко, но критично для удержания аккаунта |
| 8 | Reset Password Form | Задать новый пароль | письмо со ссылкой | Ввод нового пароля | Login | `OssnUser::resetPassword()` | восстановление доступа без потери графа связей |
| 9 | First-Run Profile Setup | Заполнить имя/фото/город один раз | Login (первый вход) | Загрузить аватар, ввести город | Home Feed | `POST /me/avatar`, `PATCH /me` | делает Discover/Match релевантным с первого дня |
| 10 | Permissions Primer | Понять, зачем нужны геолокация/пуши, до системного окна | First-Run Profile Setup | Разрешить / пропустить | Home Feed | нет API, чистый UI | каждое включение NOW/Places зависит от honest opt-in, не тёмного паттерна |

## 2. Profile & Social Graph (14)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 11 | My Profile | Увидеть себя, как видят другие | Tab bar | Открыть Edit, Friends, Settings | Edit Profile / Friends List | `GET /me`, `GET /profiles/{username}` | ежедневная проверка своего присутствия в графе |
| 12 | Other User Profile | Узнать человека, решить связаться | Comment author, feed, search | Добавить в друзья, написать, пожаловаться | Conversation Thread / Friend Requests Outgoing | `GET /profiles/{username}` | основа CONNECT-фазы цикла |
| 13 | Edit Profile | Обновить имя/email | My Profile | Сохранить поля | My Profile | `PATCH /me` | поддержание актуальности идентичности |
| 14 | Avatar Upload | Сменить фото профиля | Edit Profile | Выбрать/сделать фото | Edit Profile | `POST /me/avatar` | визуальная узнаваемость в графе каждый день |
| 15 | Friends List (own) | Увидеть своих друзей | My Profile | Открыть профиль друга, удалить из друзей | Other User Profile | `GET /friends` | основа выбора участников Trips/Circles/Experiences ежедневно |
| 16 | Friend Requests Incoming | Решить, кого впустить в граф | Notification, My Profile | Принять / отклонить | Friends List (own) | `POST /friend/{guid}` | ежедневный входящий поток CONNECT |
| 17 | Friend Requests Outgoing | Отследить отправленные запросы | Other User Profile (после отправки) | Отменить запрос | Friends List (own) | `DELETE /friend/{guid}` | честная видимость статуса запроса |
| 18 | Friend Search/Add | Найти конкретного человека | Friends List, Global Search Hub | Ввести имя, отправить запрос | Other User Profile | `GET /search/users` | рост графа — ежедневная точка входа новых связей |
| 19 | Profile Menu | Быстрый доступ к настройкам/выходу | My Profile | Открыть Settings, Devices, Logout | Settings Hub | нет отдельного API | навигационный хаб, используется ежедневно |
| 20 | Devices & Sessions List | Проверить, где ещё активен аккаунт | Profile Menu | Отозвать сессию | Devices & Sessions List | `GET /me/sessions` | безопасность при мультиустройственном использовании |
| 21 | Revoke Session Confirm | Выйти на другом устройстве | Devices & Sessions List | Подтвердить отзыв | Devices & Sessions List | `POST /me/sessions/{id}/revoke` | реагирование на потерю/продажу устройства |
| 22 | Delete Account Confirm | Необратимо удалить аккаунт | Settings Hub | Ввести пароль, подтвердить | Welcome | `POST /me/delete` | редкий, но обязательный выход из продукта |
| 23 | Block List | Управлять заблокированными | Settings Hub, Report flow | Разблокировать | Blocked-User Empty State / Block List | `GET /block` | ежедневная защита личного пространства |
| 24 | Blocked-User Empty State | Понять, что список пуст | Block List (нет записей) | Вернуться | Settings Hub | пустой `GET /block` | честное состояние, не заглушка |

## 3. Home Feed & Posts (14)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 25 | Home Feed | Увидеть свою хронику | Login / tab bar | Скролл, лайк, комментировать, открыть пост | Post Detail | `GET /feed` | точка входа в SHARE каждый день |
| 26 | Feed Empty State | Понять, что публиковать первым | Home Feed (нет постов) | Compose Post | Compose Post | пустой `GET /feed` | честный призыв к первому действию, не фейковый контент |
| 27 | Compose Post | Поделиться мыслью/фото | Home Feed, Profile | Ввести текст, прикрепить медиа, выбрать видимость | Home Feed | `POST /posts` | ежедневная точка SHARE-фазы |
| 28 | Post Visibility Picker | Выбрать, кто увидит пост | Compose Post | Public / Friends / конкретный Circle | Compose Post | `GET /circles` (для списка) | контроль приватности при каждой публикации |
| 29 | Post Detail | Прочитать пост и реакции целиком | Feed, профиль, уведомление | Лайк, комментировать, поделиться | Post Comments List | `GET /posts/{id}` | глубокое погружение из ленты ежедневно |
| 30 | Post Comments List | Прочитать обсуждение | Post Detail | Добавить комментарий, открыть автора | Add Comment | `GET /posts/{id}/comments` | социальная валидация SHARE-фазы |
| 31 | Add Comment | Ответить на пост | Post Comments List | Ввести текст, отправить | Post Comments List | `POST /posts/{id}/comments` | ежедневное участие в диалоге |
| 32 | Comment Author Card | Узнать, кто комментирует | Post Comments List | Перейти в профиль | Other User Profile | встроено в ответ `GET .../comments` | расширение графа через контент |
| 33 | Post Options Menu | Управлять своим постом | Post Detail (свой пост) | Удалить | Delete Post Confirm | владелец = `owner_guid` | ежедневный контроль над своим следом |
| 34 | Delete Post Confirm | Убедиться перед удалением | Post Options Menu | Подтвердить/отменить | Home Feed | `DELETE /posts/{id}` | необратимое действие требует явного подтверждения |
| 35 | Post Media Attach Picker | Прикрепить фото/видео к посту | Compose Post | Выбрать из галереи/снять | Compose Post | `POST /media`, затем `POST /media/{id}/attach` | визуальный SHARE — основной формат ежедневного контента |
| 36 | Post Media Full-Screen Viewer | Рассмотреть медиа поста | Post Detail | Свайп между вложениями | Post Detail | `GET /media/context/post/{id}` | полноценное потребление контента, не миниатюра |
| 37 | Post Like Animation State | Мгновенно увидеть реакцию | Feed, Post Detail | тап на лайк | тот же state (optimistic) | `POST /posts/{id}/like` | микро-подкрепление при каждом использовании |
| 38 | Post Not Found / Removed State | Понять, что пост исчез | Уведомление/ссылка на удалённый пост | Вернуться в Feed | Home Feed | 404 от `GET /posts/{id}` | честная обработка устаревших ссылок, не пустой экран |

## 4. Notifications (6)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 39 | Notifications List | Узнать, что произошло, пока меня не было | Tab bar, badge | Открыть источник, отметить прочитанным | Post Detail / Event Detail / другое | `GET /notifications` | главный ежедневный триггер возврата в приложение |
| 40 | Notifications Empty State | Понять, что новостей нет | Notifications List (пусто) | Вернуться к Feed | Home Feed | пустой `GET /notifications` | честное "пока тихо", не фейковый список |
| 41 | Notification → Redirect Resolving | Дождаться перехода к источнику | Тап по уведомлению | (авто) | Post/Event/Place Detail | `subject_guid`/`item_guid` маршрутизация | бесшовный переход — используется при каждом клике |
| 42 | Mark-All-Read Confirm | Быстро очистить список | Notifications List | Подтвердить | Notifications List | `POST /notifications/read-all` | ежедневная гигиена входящего потока |
| 43 | Delete Single Notification | Убрать конкретное уведомление | Notifications List (свайп) | Удалить | Notifications List | `DELETE /notifications/{id}` | управление вниманием |
| 44 | Unread Badge Summary | Увидеть, что есть непрочитанное, не открывая список | Любой экран с tab bar | Тап → Notifications List | Notifications List | `GET /notifications/unread-count` | фоновый ежедневный сигнал возврата |

## 5. Messaging (12)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 45 | Conversations List | Увидеть все диалоги | Tab bar | Открыть диалог, найти сообщение | Conversation Thread | `GET /conversations` | ежедневный CONNECT-хаб |
| 46 | Conversations Empty State | Понять, с кого начать | Conversations List (пусто) | Start New Conversation | Start New Conversation | пустой `GET /conversations` | честный призыв вместо пустоты |
| 47 | Conversation Thread | Переписываться с человеком | Conversations List, Other User Profile | Отправить сообщение, прокрутить историю | Message Compose Bar | `GET /conversations/{guid}` | основной ежедневный канал живого общения |
| 48 | Typing Indicator State | Понять, что собеседник печатает | Conversation Thread (активно) | (пассивно наблюдать) | Conversation Thread | `GET /conversations/{guid}/typing` (polling) | ощущение живого диалога каждый день |
| 49 | Message Compose Bar | Написать и отправить сообщение | Conversation Thread | Ввод текста, отправка | Conversation Thread | `POST /conversations/{guid}/messages` | базовое ежедневное действие мессенджера |
| 50 | Message Search | Найти конкретное сообщение | Conversations List, Conversation Thread | Ввести запрос | Message Search Results | `GET /messagesearch` | поиск в истории при частом использовании |
| 51 | Message Search Results | Перейти к найденному сообщению | Message Search | Открыть диалог с этим сообщением | Conversation Thread | `GET /messagesearch` | завершение сценария поиска |
| 52 | Delete Message Confirm | Убрать своё сообщение | Conversation Thread (долгий тап) | Подтвердить | Conversation Thread | `DELETE /conversations/{guid}/messages/{id}` | контроль над своим следом в переписке |
| 53 | Conversation Unread Divider | Быстро найти, что новое | Conversation Thread (много сообщений) | Прокрутка к разделителю | Conversation Thread | `POST /conversations/{guid}/read` (отметка) | экономия времени при ежедневном чтении |
| 54 | Start New Conversation | Начать диалог с другом | Conversations Empty State, Friend Profile | Выбрать друга | Conversation Thread | `GET /friends` | точка входа в новую переписку |
| 55 | Blocked-Conversation State | Понять, почему нельзя написать | Conversation Thread (если блок) | Разблокировать через профиль | Other User Profile | server-side block-check | честная блокировка вместо тихого сбоя |
| 56 | Message Delivery Failed / Retry | Понять, что сообщение не ушло | Message Compose Bar (сеть недоступна) | Повторить отправку | Conversation Thread | повтор `POST .../messages` | реалистичная сеть — используется ежедневно при плохом сигнале |

## 6. Places (16)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 57 | Places List | Просмотреть места вокруг темы | Discover tab, BERX World | Фильтр по категории, открыть место | Place Detail | `GET /places` (Wave 3) | основа GO-фазы — куда пойти сегодня |
| 58 | Places Category Filter | Сузить список по типу места | Places List | Выбрать категорию | Places List | `GET /places/categories` | ежедневная навигация по намерению (еда/кофе/спорт) |
| 59 | Place Detail | Решить, идти ли сюда | Places List, Nearby, Search | Сохранить, оставить отзыв, построить маршрут | Place Reviews List / Nearby Route Action | `GET /places/{guid}` | ключевой момент перехода DISCOVER → GO |
| 60 | Place Reviews List | Оценить репутацию места | Place Detail | Прочитать, написать отзыв | Write Review | `GET /places/{guid}/reviews` | доверие перед визитом каждый день |
| 61 | Write Review | Поделиться опытом после визита | Place Reviews List, Experience Detail | Оценка+текст | Place Reviews List | `POST /places/{guid}/reviews` | VERIFY-фаза — превращает визит в публичный сигнал |
| 62 | Place Photo Gallery | Увидеть место визуально | Place Detail | Пролистать фото | Place Detail | `GET /media/context/place/{guid}` | визуальное решение "идти или нет" |
| 63 | Place Map View | Понять, где именно место | Place Detail | Открыть карту, построить маршрут | Nearby Route Action | геокоординаты места | ежедневная ориентация в городе |
| 64 | Places Nearby | Найти, что рядом прямо сейчас | Discover tab, NOW Hub | Ввести/подтвердить координаты | Place Detail | `GET /places/nearby` | спонтанный ежедневный сценарий "я тут, что рядом" |
| 65 | Saved Places List | Вернуться к местам "на потом" | My Profile, Collections | Открыть сохранённое место | Place Detail | `GET /places/saved` | планирование на неделю вперёд |
| 66 | Save/Unsave Place Toggle | Быстро отметить интерес | Place Detail, Places List | Тап на "сохранить" | тот же state | `POST /places/{guid}/save` | ежедневное лёгкое действие без commitment |
| 67 | Create Place Form | Добавить место, которого нет в базе | Places List (нет результата) | Заполнить название/категорию/адрес | Place Detail (новое) | `POST /places` | рост базы силами сообщества |
| 68 | Edit Place | Исправить данные своего места | Place Detail (владелец) | Изменить поля | Place Detail | `PATCH /places/{guid}` | актуальность данных для ежедневных посетителей |
| 69 | Place Cover Upload | Задать обложку места | Edit Place | Загрузить фото | Edit Place | `POST /places/{guid}/cover` | визуальная привлекательность в списках |
| 70 | Place Hours Editor | Указать реальные часы работы | Edit Place, Business Dashboard | Задать интервалы по дням | Edit Place | `POST /business/places/{guid}/hours` | предотвращает "пришёл, а закрыто" — ежедневная польза |
| 71 | Place Business Badge Detail | Понять, что значит "верифицировано" | Place Detail | Просмотр статуса | Place Detail | `is_business`/`verified` поля | доверие к месту при частом посещении разных мест |
| 72 | Place Not Found / Deleted State | Понять, что место исчезло | Устаревшая ссылка/уведомление | Вернуться к Places List | Places List | 404 от `GET /places/{guid}` | честная обработка устаревших данных |

## 7. NOW / Nearby Live (8)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 73 | Nearby Now Hub | Узнать, что происходит рядом прямо сейчас | Discover tab, BERX World | Переключить "сегодня", открыть карточку | Nearby Impression Detail | `GET /nearby` | ежедневный "что рядом прямо сейчас" — сердце GO-фазы |
| 74 | Nearby Now Today Toggle | Отфильтровать только сегодняшнее | Nearby Now Hub | Включить/выключить | Nearby Now Hub | `today=1` параметр `/nearby` | спонтанные планы на сегодня |
| 75 | Nearby Now Open-Now Filter | Отфильтровать только открытое сейчас | Nearby Now Hub | Включить (или увидеть честное "недоступно") | Nearby Now Hub | `open_now_available:false` пока честно неизвестно | попытка ежедневного использования даже при частичных данных |
| 76 | Nearby Impression Detail | Решить, стоит ли идти | Nearby Now Hub | Открыть Place/Event, построить маршрут | Place Detail / Event Detail | `POST /impressions/places/{guid}/action` | конверсия "увидел рядом" → "пошёл" |
| 77 | Business Moment Feed | Увидеть свежие анонсы мест рядом | Nearby Now Hub | Открыть карточку момента | Business Moment Detail | `GET /moments/places/{guid}` (по месту) | ежедневные "счастливые часы" и подобное |
| 78 | Business Moment Detail | Понять условия предложения | Business Moment Feed | Перейти к месту | Place Detail | момент из `/moments` | сиюминутная ценность, обновляется каждый день |
| 79 | Nearby Route Action | Построить маршрут до места | Place Detail, Nearby Impression Detail | Открыть карты | внешнее приложение карт | запись действия `route` в impressions | завершение цикла DISCOVER → GO |
| 80 | Nearby Empty State | Понять, что рядом пока пусто | Nearby Now Hub (нет данных) | Расширить радиус | Nearby Now Hub | пустой `GET /nearby` | честность в малонаселённых районах, не фейковые карточки |

## 8. Events (16)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 81 | Events List | Посмотреть, что происходит в городе | Discover tab, BERX World | Фильтр, открыть событие | Event Detail | `GET /events` (Wave 3) | ежедневное планирование досуга |
| 82 | Events Category Filter | Сузить по типу события | Events List | Выбрать категорию | Events List | `GET /events/categories` | навигация по интересу |
| 83 | Event Detail | Решить, идти ли на событие | Events List, Nearby, Notification | RSVP, пригласить друга, открыть место | Event RSVP Confirm | `GET /events/{guid}` | ключевой момент CONNECT → GO |
| 84 | Event RSVP Confirm | Подтвердить участие | Event Detail | Подтвердить "иду" | My Events | `POST /events/{guid}/rsvp` | реальное commitment, видимое друзьям |
| 85 | Event RSVP Full State | Понять, что мест нет | Event Detail (capacity достигнут) | Добавиться в лист ожидания (если есть) / уйти | Event Detail | реальная проверка capacity сервером | честная обратная связь при популярных событиях |
| 86 | Event Attendees List | Увидеть, кто идёт | Event Detail | Открыть профиль участника | Other User Profile | `GET /events/{guid}/attendees` | социальное подтверждение перед визитом |
| 87 | Event Invite Friend Picker | Позвать друга на событие | Event Detail | Выбрать друга, отправить | Event Detail | `GET /friends`, `POST /events/{guid}/invite` | ежедневный механизм совместных планов |
| 88 | Create Event Form | Организовать своё событие | Events List, Place Detail | Заполнить название/время/место | Event Detail (новое) | `POST /events` | рост предложения событий силами пользователей |
| 89 | Edit Event | Обновить детали своего события | Event Detail (организатор) | Изменить поля | Event Detail | `PATCH /events/{guid}` | актуальность при изменении планов |
| 90 | Event Cover Upload | Задать обложку события | Edit Event | Загрузить фото | Edit Event | `POST /events/{guid}/cover` | визуальная привлекательность в списках |
| 91 | My Events | Увидеть свои предстоящие события | My Profile, tab bar | Открыть событие | Event Detail | `GET /events/going` | ежедневная сверка личного календаря |
| 92 | Event Comments/Discussion | Обсудить событие до визита | Event Detail | Написать, прочитать | Event Detail | `GET/POST /comments?type=event` | координация деталей ("во сколько встречаемся") |
| 93 | Event Story Wall | Увидеть живые истории с события | Event Detail (во время/после) | Открыть историю | Story Viewer | `GET /stories/event/{guid}` | эффект присутствия — ежедневно при живых событиях |
| 94 | Add Event Story | Поделиться моментом с события | Event Detail (я иду) | Снять/выбрать медиа | Event Story Wall | `POST /stories` с `event_guid` | честный RSVP-gate — только реальные участники |
| 95 | Event Cancel RSVP Confirm | Отменить участие | My Events, Event Detail | Подтвердить отмену | Event Detail | `POST /events/{guid}/rsvp/cancel` | реалистичные изменения планов |
| 96 | Event Past/Ended State | Понять, что событие завершилось | Events List, ссылка на прошедшее | Открыть отзывы/фото | Place Detail (если привязано) | `past=1` в `/events` | превращение GO в EXPERIENCE/SHARE после факта |

## 9. Communities (14)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 97 | Communities Browse | Найти сообщество по интересу | Discover tab | Открыть сообщество | Community Detail | `GET /communities` | ежедневный источник тематического CONNECT |
| 98 | Communities Search | Найти конкретное сообщество | Communities Browse | Ввести запрос | Communities Browse | `GET /communities?q=` | точный поиск при частом использовании |
| 99 | My Communities | Увидеть свои сообщества | My Profile, tab bar | Открыть сообщество | Community Detail | `GET /communities/mine` | ежедневная точка входа в привычные группы |
| 100 | Community Detail | Решить, вступать ли / участвовать | Communities Browse, ссылка | Вступить, открыть участников | Community Join Request Sent State | `GET /communities/{guid}` | центр тематического взаимодействия |
| 101 | Create Community Form | Создать своё сообщество | Communities Browse | Название/описание/приватность | Community Detail (новое) | `POST /communities` | рост платформы силами пользователей |
| 102 | Edit Community | Обновить описание сообщества | Community Detail (владелец) | Изменить поля | Community Detail | `PATCH /communities/{guid}` | поддержание актуальности группы |
| 103 | Community Members List | Увидеть участников | Community Detail | Открыть профиль участника | Other User Profile | `GET /communities/{guid}/members` | понимание "кто ещё здесь" ежедневно |
| 104 | Community Join Request Sent State | Понять, что заявка отправлена | Community Detail (приватное) | Ждать / отменить | Community Detail | `POST /communities/{guid}/join` | честная обратная связь для приватных групп |
| 105 | Community Join Requests | Рассмотреть заявки (владелец/модератор) | Community Detail | Одобрить/отклонить | Approve/Decline Request Confirm | `GET /communities/{guid}/requests` | ежедневная модерация активных сообществ |
| 106 | Approve/Decline Request Confirm | Принять решение по заявке | Community Join Requests | Подтвердить | Community Join Requests | `POST .../approve` или `.../decline` | контроль состава группы |
| 107 | Community Moderators List | Увидеть, кто модерирует | Community Detail | Добавить/убрать модератора | Add Moderator Picker | `GET /communities/{guid}/moderators` | распределение ответственности в активных группах |
| 108 | Add Moderator Picker | Назначить нового модератора | Community Moderators List (владелец) | Выбрать участника | Community Moderators List | `POST .../moderators/{guid}` | масштабирование модерации без владельца 24/7 |
| 109 | Leave Community Confirm | Выйти из сообщества | Community Detail | Подтвердить | Communities Browse | `deleteMember` через `.../leave` | реалистичное изменение интересов |
| 110 | Community Deleted/Not-Found State | Понять, что сообщество исчезло | Устаревшая ссылка | Вернуться к Communities Browse | Communities Browse | 404 от `GET /communities/{guid}` | честная обработка устаревших данных |

## 10. Match (14)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 111 | Match Onboarding | Создать анкету знакомств | BERX World, tab bar (первый раз) | Псевдоним/возраст/город/цель/био | Match Discover Stack | `POST /dating/profile` | вход в отдельный, честно обособленный CONNECT-контур |
| 112 | Match Discover Stack | Просмотреть анкеты кандидатов | Match Onboarding, tab bar | Лайк, пропустить, открыть карточку | Match Profile Card Detail | `GET /dating/discover` | ежедневный основной цикл Match |
| 113 | Match Profile Card Detail | Рассмотреть анкету подробно | Match Discover Stack | Лайк/пропустить | Match Discover Stack | карточка из `/dating/discover` | осознанное решение перед лайком |
| 114 | Match Like Action | Выразить интерес | Match Discover Stack | Тап/свайп вправо | Mutual Match Celebration State или Match Discover Stack | `POST /dating/interests` | ежедневное ядро механики Match |
| 115 | Match Pass Action | Пропустить анкету | Match Discover Stack | Тап/свайп влево | Match Discover Stack | `POST /dating/pass` | поддержание релевантности следующих карточек |
| 116 | Match Undo Last Pass | Исправить случайный пропуск | Match Discover Stack | Тап "отменить" | Match Discover Stack | `POST /dating/undo` | снижает раздражение при ежедневном использовании |
| 117 | Mutual Match Celebration State | Узнать о взаимном совпадении | Match Like Action (взаимно) | Написать сообщение | Conversation Thread | `mutual:true` в ответе `/dating/interests` | эмоциональный пик цикла CONNECT |
| 118 | Match List | Увидеть все свои совпадения | Match Discover Stack, tab | Открыть переписку с совпадением | Conversation Thread | `GET /dating/matches` | ежедневная точка продолжения знакомств |
| 119 | Match Search | Найти анкету по имени | Match List, Match Discover Stack | Ввести запрос | Match Profile Card Detail | `GET /dating/search` | целевой поиск при большом объёме анкет |
| 120 | Match Privacy Settings | Скрыть возраст/город/онлайн-статус | Match Onboarding, Settings | Переключатели приватности | Match Privacy Settings | `PATCH /dating/privacy` | контроль видимости — ежедневное доверие к разделу |
| 121 | Match Location Settings | Управлять видимостью координат | Match Privacy Settings | Задать/скрыть координаты | Match Privacy Settings | `PATCH /dating/location` | безопасность при ежедневном использовании геоданных |
| 122 | Match Photos Manager | Управлять приватными фото | Match Onboarding, Profile | Просмотреть, удалить фото | Match Photos Manager | `GET /dating/photos`, `DELETE /dating/photos/{id}` | контроль над чувствительным контентом |
| 123 | Match Private Photo Request | Ответить на запрос доступа к фото | Notification, Match Photo Requests | Разрешить/отклонить | Match Photos Manager | `GET /dating/photo-requests` | ежедневная модерация приватности |
| 124 | Match Private Photo Grant/Deny | Подтвердить решение по запросу | Match Private Photo Request | Подтвердить | Match Photos Manager | `POST /dating/photo-respond` | явное согласие вместо автоматического доступа |

## 11. Global Discover/Search (8)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 125 | Global Search Hub | Найти что угодно одним запросом | Tab bar | Ввести запрос, выбрать вкладку | Search Users/Places/Events/Communities Results | `GET /search/*` | универсальная ежедневная точка входа в DISCOVER |
| 126 | Search Users Results | Найти конкретного человека | Global Search Hub | Открыть профиль | Other User Profile | `GET /search/users` | быстрый доступ к CONNECT |
| 127 | Search Places Results | Найти конкретное место | Global Search Hub | Открыть место | Place Detail | `GET /search/places` | целевой поиск вместо просмотра списка |
| 128 | Search Events Results | Найти конкретное событие | Global Search Hub | Открыть событие | Event Detail | `GET /search/events` | целевой поиск конкретного плана |
| 129 | Search Communities Results | Найти конкретное сообщество | Global Search Hub | Открыть сообщество | Community Detail | `GET /search/communities` | целевой поиск тематической группы |
| 130 | Search Empty State | Понять, что ничего не найдено | Любая вкладка поиска (0 результатов) | Изменить запрос | Global Search Hub | пустой ответ поиска | честная обратная связь вместо тишины |
| 131 | Recent Searches | Быстро повторить прошлый запрос | Global Search Hub (пустое поле) | Тап по прошлому запросу | Search Results | локальное хранилище на устройстве | экономия времени при частом использовании |
| 132 | Search-in-Progress Loading State | Понимать, что поиск идёт | Global Search Hub (после ввода) | Дождаться | Search Results | (сетевой запрос в процессе) | базовая обратная связь при каждом поиске |

## 12. Stories (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 133 | Stories Rail | Увидеть, у кого есть новые истории | Home Feed (верх) | Открыть историю | Story Viewer | `GET /stories` | ежедневный, самый частый повод открыть приложение |
| 134 | Story Viewer | Посмотреть историю целиком | Stories Rail | Свайп далее/назад, ответить | Story Progress/Tap-Navigate State | `GET /stories/{id}/media` | основной формат ежедневного лёгкого потребления |
| 135 | Story Progress/Tap-Navigate State | Управлять просмотром вручную | Story Viewer | Тап вперёд/назад, удержание-пауза | Story Viewer | клиентская навигация по уже загруженному списку | привычный, ожидаемый паттерн ежедневного использования |
| 136 | Create Story | Поделиться моментом на 24 часа | Stories Rail (своя аватарка), Event Detail | Снять/выбрать фото или видео | Story Caption Editor | multipart-загрузка, поле `story` | самый низкий барьер SHARE — ежедневный |
| 137 | Story Caption Editor | Добавить подпись | Create Story | Ввести текст | Stories Rail (опубликовано) | `POST /stories` | контекст к моменту без полноценного поста |
| 138 | Story Video-Not-Viewable Fallback | Понять, что видео-историю пока нельзя посмотреть в приложении | Story Viewer (video, приватный маршрут) | Закрыть, дождаться будущей поддержки | Stories Rail | честно раскрытое ограничение, не молчаливый сбой | доверие вместо тихой поломки при ежедневном использовании |
| 139 | My Active Stories | Увидеть свои опубликованные истории | My Profile | Открыть, удалить | Story Viewer / Delete Story Confirm | `GET /stories/own` | контроль над активным 24-часовым следом |
| 140 | Story View-Count | Узнать, кто посмотрел мою историю | My Active Stories | Просмотреть список | My Active Stories | `POST /stories/{id}/view` агрегация | ежедневная обратная связь по вовлечённости |
| 141 | Story Expired State | Понять, что история исчезла через 24ч | Ссылка/уведомление на истёкшую историю | Вернуться | Stories Rail | `time_expires` в прошлом | честная эфемерность — часть механики продукта |
| 142 | Delete Story Confirm | Убрать историю раньше срока | My Active Stories | Подтвердить | My Active Stories | `POST /stories/{id}/delete` | контроль при ошибке публикации |

## 13. Video / Reels (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 143 | Video Feed | Посмотреть короткие видео от сообщества | BERX World, Creator Profile | Скролл, лайк, открыть видео | Video Detail/Player | `GET /videos` | ежедневное лёгкое видео-потребление |
| 144 | Video Detail/Player | Досмотреть видео и обсуждение | Video Feed | Воспроизвести, комментировать | Video Comments | `GET /videos/{postGuid}` | основной момент SHARE-контента |
| 145 | My Videos | Увидеть свои опубликованные видео | My Profile, Creator Profile | Открыть, удалить | Video Detail/Player | `GET /videos?user=` | контроль над своим видео-архивом |
| 146 | Create Video | Опубликовать видео с подписью | Compose Post, Profile | Загрузить видео, текст | Video Feed | `POST /posts`+`POST /media`+`attach` | ежедневная точка публикации видео-контента |
| 147 | Video Comments | Обсудить видео | Video Detail/Player | Написать, прочитать | Video Detail/Player | те же `GET/POST /posts/{id}/comments` | тот же социальный слой, что у постов |
| 148 | Video Like State | Мгновенно отреагировать | Video Feed, Video Detail | Тап на лайк | тот же state | `POST /posts/{id}/like` | микро-подкрепление при каждом видео |
| 149 | Video Delete Confirm | Убрать своё видео | My Videos (владелец) | Подтвердить | My Videos | `DELETE /posts/{id}` | контроль над публичным следом |
| 150 | Video Player External-Handoff State | Посмотреть видео через системный плеер | Video Detail/Player | Открыть во внешнем приложении | (ОС) | честно раскрытое ограничение вместо фейкового плеера | реальная работоспособность каждый день без встроенного плеера |
| 151 | Video Not Found State | Понять, что видео удалено | Устаревшая ссылка | Вернуться к Video Feed | Video Feed | 404 от `GET /videos/{postGuid}` | честная обработка устаревших ссылок |
| 152 | Creator Videos Tab | Увидеть все видео конкретного автора | Creator Profile | Открыть видео | Video Detail/Player | `GET /videos?user={creator_guid}` | ежедневное потребление контента любимого автора |

## 14. Music / Tracks (8)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 153 | Track Feed | Открыть для себя новую аудио-публикацию | BERX World, Creator Profile | Скролл, воспроизвести, открыть | Track Detail/Player | `GET /tracks` | ежедневное лёгкое аудио-потребление |
| 154 | Track Detail/Player | Дослушать и обсудить трек | Track Feed | Воспроизвести, комментировать | Track Comments | `GET /tracks/{postGuid}` | основная точка взаимодействия с треком |
| 155 | My Tracks | Увидеть свои опубликованные треки | My Profile, Creator Profile | Открыть, удалить | Track Detail/Player | `GET /tracks?user=` | контроль над своим аудио-архивом |
| 156 | Create Track | Опубликовать аудио с подписью | Compose Post, Profile | Загрузить mp3, текст | Track Feed | `POST /posts`+`POST /media`+`attach` | ежедневная точка публикации аудио |
| 157 | Track Comments | Обсудить трек | Track Detail/Player | Написать, прочитать | Track Detail/Player | те же `GET/POST /posts/{id}/comments` | тот же социальный слой, что у постов |
| 158 | Track Play State | Управлять воспроизведением в приложении | Track Detail/Player | Play/pause через `Linking` | Track Detail/Player | реальный `/media/get/{guid}` URL | ежедневное фоновое прослушивание |
| 159 | Track Delete Confirm | Убрать свой трек | My Tracks (владелец) | Подтвердить | My Tracks | `DELETE /posts/{id}` | контроль над публичным следом |
| 160 | Track Not Found State | Понять, что трек удалён | Устаревшая ссылка | Вернуться к Track Feed | Track Feed | 404 от `GET /tracks/{postGuid}` | честная обработка устаревших ссылок |

## 15. Creator (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 161 | Creator Enable Onboarding | Стать автором с публичной страницей | My Profile | Указать категорию/био | Creator Profile (own) | `POST /creator/enable` | вход в LEVEL UP-контур для активных пользователей |
| 162 | Creator Profile (own) | Управлять своей публичной страницей | My Profile (после enable) | Открыть настройки, контент | Creator Settings / Creator Content Tabs | `GET /creator/{username}` | ежедневная точка для активных авторов |
| 163 | Creator Profile (public view) | Оценить автора перед подпиской/просмотром | Video/Track Feed, Search | Открыть контент, посмотреть аудиторию | Creator Content Tabs | `GET /creator/{username}` | точка входа в контент конкретного автора |
| 164 | Creator Settings | Обновить категорию/био | Creator Profile (own) | Изменить поля | Creator Profile (own) | `PATCH /creator` | поддержание актуальности публичной страницы |
| 165 | Creator Audience Summary | Понять реальный охват | Creator Profile (own) | Просмотреть цифры | Creator Profile (own) | `audience` из `GET /creator/{username}` | ежедневная обратная связь для авторов — честные COUNT(), не оценки |
| 166 | Creator Content Tabs | Просмотреть всё, что публикует автор | Creator Profile | Переключить посты/альбомы/события/experiences | Post Detail / Album Detail / Event Detail | `GET /creator/{username}/content` | агрегированное ежедневное потребление контента одного автора |
| 167 | Creator View Log | Понять, кто и когда смотрел профиль | Creator Audience Summary | Просмотреть агрегат | Creator Audience Summary | `POST /creator/{username}/view` (запись), агрегат в audience | реальная, не выдуманная метрика вовлечённости |
| 168 | Creator Disable Confirm | Отключить публичный статус автора | Creator Settings | Подтвердить | My Profile | `POST /creator/disable` | реалистичный выход из роли автора |
| 169 | Creator Badge Detail | Понять, что даёт статус автора | Other User Profile (creator) | Просмотр | Creator Profile (public view) | `is_creator` в `GET /profiles/{username}` | прозрачность статуса при ежедневном просмотре профилей |
| 170 | Creator Videos/Tracks Aggregation View | Увидеть весь медиа-контент автора в одном месте | Creator Content Tabs | Открыть видео/трек | Video Detail / Track Detail | `GET /videos?user=`, `GET /tracks?user=` | цельное потребление контента любимого автора |

## 16. Collections (6)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 171 | Collections List | Увидеть свои тематические подборки | My Profile | Открыть коллекцию | Collection Detail | `GET /collections` | ежедневная организация сохранённого |
| 172 | Collection Detail | Просмотреть содержимое подборки | Collections List | Открыть элемент, убрать элемент | Place Detail / Event Detail / Post Detail | `GET /collections/{id}` | практичное использование накопленного списка ("куда сходить в выходные") |
| 173 | Create Collection | Начать новую тематическую подборку | Collections List, Add-to-Collection Picker | Название, видимость | Collection Detail (новая) | `POST /collections` | организация DISCOVER-находок под конкретную цель |
| 174 | Add-to-Collection Picker | Сохранить место/событие в подборку | Place Detail, Event Detail | Выбрать/создать коллекцию | Place Detail / Event Detail | `POST /collections/{id}/items` | ежедневное лёгкое действие "сохранить на потом" |
| 175 | Collection Visibility Toggle | Сделать подборку публичной/приватной | Collection Detail (владелец) | Переключить | Collection Detail | `PATCH /collections/{id}` | контроль над тем, кто видит планы |
| 176 | Remove-from-Collection Confirm | Убрать элемент из подборки | Collection Detail | Подтвердить | Collection Detail | `DELETE /collections/{id}/items/{type}/{guid}` | поддержание актуальности подборки |

## 17. Circles (6)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 177 | Circles List | Увидеть свои приватные группы близких | Settings, My Profile | Открыть круг | Circle Detail | `GET /circles` | основа приватного SHARE ("только для семьи") |
| 178 | Circle Detail | Увидеть состав круга | Circles List | Добавить/убрать участника | Add Circle Member | `GET /circles/{id}` | управление приватным контуром общения |
| 179 | Create Circle | Создать новый приватный круг | Circles List | Название, тип (семья/работа/близкие) | Circle Detail (новый) | `POST /circles` | точная настройка приватности постов под жизненные контексты |
| 180 | Add Circle Member | Добавить в круг реального друга | Circle Detail | Выбрать из друзей | Circle Detail | `POST /circles/{id}/members/{guid}` | круги строятся только из подтверждённых друзей — честная приватность |
| 181 | Circle Post-Visibility Picker Entry | Опубликовать пост только для круга | Post Visibility Picker | Выбрать конкретный круг | Compose Post | `visibility: circle:{id}` в `POST /posts` | ежедневный выбор аудитории для чувствительного контента |
| 182 | Remove Circle Member Confirm | Убрать человека из круга | Circle Detail | Подтвердить | Circle Detail | `DELETE /circles/{id}/members/{guid}` | поддержание актуальности приватного контура |

## 18. Trips (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 183 | Trips List | Увидеть свои поездки (свои и как участник) | My Profile | Открыть поездку | Trip Detail | `GET /trips` | планирование на неделю/отпуск — не разовый сценарий |
| 184 | Trip Detail | Увидеть маршрут по дням | Trips List | Добавить остановку, открыть день | Add Trip Stop | `GET /trips/{id}` | центр EXPERIENCE-планирования для многодневных поездок |
| 185 | Create Trip | Начать планировать новую поездку | Trips List | Название, даты, приватность | Trip Detail (новая) | `POST /trips` | превращение набора идей в конкретный план |
| 186 | Add Trip Stop | Добавить место/событие в маршрут | Trip Detail, Place Detail, Event Detail | Выбрать день, добавить заметку | Trip Detail | `POST /trips/{id}/stops` | ежедневное наполнение плана по мере находок в DISCOVER |
| 187 | Trip Day Reorder | Перестроить порядок остановок | Trip Detail | Перетащить остановки | Trip Detail | сортировка через повторные `POST .../stops` | практичное редактирование реального маршрута |
| 188 | Trip Participants List | Увидеть, кто едет | Trip Detail | Открыть профиль участника | Other User Profile | `GET /trips/{id}/participants` | координация с реальными спутниками поездки |
| 189 | Add Trip Participant | Позвать друга в поездку | Trip Detail | Выбрать из друзей | Trip Detail | `POST /trips/{id}/participants/{guid}` | только подтверждённые друзья — честная модель, не открытый список |
| 190 | Trip Stop Note Editor | Добавить заметку к остановке | Trip Detail | Ввести текст | Trip Detail | `note` поле в `POST .../stops` | практическая полезность плана в моменте поездки |
| 191 | Remove Trip Stop Confirm | Убрать остановку из маршрута | Trip Detail | Подтвердить | Trip Detail | `DELETE /trips/{id}/stops/{stopId}` | гибкость при изменении планов |
| 192 | Trip Visibility Settings | Решить, кто видит маршрут | Trip Detail (владелец) | Public/Private | Trip Detail | `PATCH /trips/{id}` | контроль приватности планов поездки |

## 19. Experiences (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 193 | Experiences List | Увидеть организованные совместные планы | My Profile, tab bar | Открыть experience | Experience Detail | `GET /experiences` | структурированный слой EXPERIENCE-фазы поверх Places/Events |
| 194 | Experience Detail | Понять план и состав участников | Experiences List | Пригласить, ответить на приглашение | Experience Invite Friend / Experience Invite Response | `GET /experiences/{id}` | центр совместного EXPERIENCE-планирования |
| 195 | Create Experience | Организовать конкретный совместный выход | Place Detail, Event Detail | Название, время, привязка к месту/событию | Experience Detail (новый) | `POST /experiences` | превращение "давай сходим" в конкретный план с временем |
| 196 | Experience Invite Friend | Пригласить конкретного друга | Experience Detail (владелец) | Выбрать из друзей | Experience Detail | `POST /experiences/{id}/invite/{guid}` | ежедневная координация небольших групп |
| 197 | Experience Invite Response | Принять/отклонить приглашение | Notification, Experience Detail | Accept/Decline | Experience Detail | `POST /experiences/{id}/respond` | явное согласие вместо предполагаемого |
| 198 | Experience Participants List | Увидеть, кто подтвердил участие | Experience Detail | Открыть профиль | Other User Profile | `GET /experiences/{id}/participants` | понимание реального состава перед выходом |
| 199 | Experience Schedule Editor | Изменить время/описание | Experience Detail (владелец) | Обновить поля | Experience Detail | `PATCH /experiences/{id}` | реалистичные изменения планов |
| 200 | Remove Experience Participant Confirm | Убрать себя или другого участника | Experience Participants List | Подтвердить | Experience Participants List | `DELETE /experiences/{id}/participants/{guid}` | гибкость состава при изменении планов |
| 201 | Experience Anchor Missing State | Понять, что привязанное место/событие удалено | Experience Detail (anchor удалён) | Вернуться к списку | Experiences List | anchor resolve = null | честная обработка устаревших связей |
| 202 | My Upcoming Experiences | Увидеть ближайшие подтверждённые планы | My Profile | Открыть experience | Experience Detail | фильтр по `scheduled_start` в `/experiences` | ежедневная сверка личного расписания |

## 20. Memories & Wrapped (6)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 203 | Memories Hub | Вспомнить, что было в этот день раньше | My Profile, Notification | Открыть память | Memory Detail | `GET /memories` | ежедневный повод вернуться и пересмотреть прошлое |
| 204 | Memory Detail | Пересмотреть старый пост/фото | Memories Hub | Открыть исходный пост/альбом | Post Detail / Album Detail | элемент из `GET /memories` | эмоциональная точка возврата, не разовая |
| 205 | Memories Insufficient-Data State | Понять, что вспоминать пока нечего | Memories Hub (новый аккаунт) | Продолжить пользоваться | Home Feed | пустой `GET /memories` | честное состояние вместо выдуманного контента |
| 206 | BERX Wrapped Period Picker | Выбрать период сводки | Points Balance Hub, Profile | Неделя/месяц | Wrapped Summary Card | параметр `period` в `GET /wrapped` | периодическая, но регулярная точка рефлексии |
| 207 | Wrapped Summary Card | Увидеть сводку своей активности | Wrapped Period Picker | Пролистать карточки | Wrapped Share Card | `GET /wrapped` (реальные COUNT()) | честная геймификация без выдуманных инсайтов |
| 208 | Wrapped Share Card | Поделиться своей сводкой | Wrapped Summary Card | Сохранить/поделиться | (внешний шаринг) | те же данные `/wrapped` | превращение личной статистики в SHARE-контент |

## 21. Rewards / Points / Streak (10)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 209 | Points Balance Hub | Увидеть текущий баланс и уровень | My Profile, tab bar | Открыть историю, потратить баллы | Points History List | `GET /points` | ежедневная точка EARN-фазы |
| 210 | Points Level Progress | Понять, сколько осталось до следующего уровня | Points Balance Hub | Просмотр прогресс-бара | Points Balance Hub | `level_progress_ratio` из `GET /points` | видимый ежедневный прогресс LEVEL UP |
| 211 | Points History List | Понять, за что начислены баллы | Points Balance Hub | Прокрутка истории | Points Balance Hub | `GET /points/history` | прозрачность механики — доверие при ежедневном использовании |
| 212 | Streak Check-In Result | Подтвердить ежедневную активность | Login (авто, первый раз за день) | Просмотр результата | Home Feed | `POST /points/streak/check-in` | буквально ежедневный механизм удержания |
| 213 | Streak Milestone Celebration | Отпраздновать 7/30 дней подряд | Streak Check-In Result (веха достигнута) | Закрыть, поделиться | Home Feed | milestone-поле из streak check-in | пиковый момент вознаграждения за регулярность |
| 214 | Points Spend Menu | Решить, на что потратить баллы | Points Balance Hub | Выбрать опцию (напр. Match-буст) | Points Spend Confirm | реальный список из `OssnPoints::SPEND_PRICES` | практическая ценность накопленных баллов |
| 215 | Points Spend Confirm | Подтвердить трату баллов | Points Spend Menu | Подтвердить | Points Balance Hub | `POST /points/spend` | осознанное решение перед необратимой тратой |
| 216 | Points Insufficient-Balance State | Понять, что баллов не хватает | Points Spend Confirm (402) | Вернуться, заработать больше | Points Balance Hub | 402 от `POST /points/spend` | честная граница вместо фейкового успеха |
| 217 | Leaderboard Placeholder/Not-Available State | Понять, что общего рейтинга пока нет | Points Balance Hub | Вернуться | Points Balance Hub | нет реального агрегата — не строится, пока не появится честный источник | прозрачность вместо выдуманного рейтинга |
| 218 | Rewards Explainer | Понять, как вообще начисляются баллы | Points Balance Hub (первый раз) | Прочитать, закрыть | Points Balance Hub | статический контент + реальные reason-коды из истории | снижает недоверие к игровому слою при регулярном использовании |

## 22. Business (14)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 219 | Business Enable Onboarding | Превратить своё место в бизнес-аккаунт | Place Detail (владелец) | Подтвердить включение | Business Dashboard | `POST /places/{guid}/business/enable` | вход в LEVEL UP-контур для владельцев мест |
| 220 | Business Dashboard | Увидеть реальные показатели места | Place Detail (business) | Открыть команду, отзывы, часы | Business Team List / Business Review Reply Composer | `GET /places/{guid}/business/dashboard` | ежедневная сверка состояния своего места |
| 221 | Business Team List | Увидеть, кто управляет местом | Business Dashboard | Добавить/убрать сотрудника | Add Team Member | `GET /business/places/{guid}/team` | делегирование операционки — не только владелец 24/7 |
| 222 | Add Team Member | Дать доступ сотруднику/менеджеру | Business Team List | Выбрать роль, подтвердить | Business Team List | `POST /business/places/{guid}/team` | масштабирование управления местом |
| 223 | Business Subscription Status | Понять текущий статус доступа | Business Dashboard | Начать пробный период | Start Free Trial Confirm | `GET /business/places/{guid}/subscription` | прозрачность доступа к бизнес-функциям |
| 224 | Start Free Trial Confirm | Активировать 7-дневный пробный период | Business Subscription Status | Подтвердить | Business Dashboard | `POST /business/places/{guid}/subscription/start-trial` | честный, реальный триал без фейковой оплаты |
| 225 | Business Verified Badge Detail | Понять, как получить верификацию | Business Dashboard | Просмотр статуса | Business Dashboard | `verified` — только admin-действие | доверие посетителей к месту при ежедневных визитах |
| 226 | Business Place Claim Form | Заявить права на существующее место | Place Detail (место без владельца) | Заполнить заявку | Claim Pending Review State | `POST /business/places/{guid}/claim` | реалистичный сценарий "это моё место, добавленное кем-то ещё" |
| 227 | Claim Pending Review State | Дождаться решения по заявке | Business Place Claim Form | Ждать | Business Dashboard (если одобрено) | `GET /business/claims/mine` | честная обратная связь по статусу заявки |
| 228 | Admin Claim Review Queue | Рассмотреть заявки на владение (admin) | Admin панель | Одобрить/отклонить | Business Place Claim Form (заявителю) | `GET /business/claims/pending` | контроль качества данных платформы |
| 229 | Business Review Reply Composer | Ответить на отзыв о месте | Business Dashboard | Ввести текст ответа | Business Dashboard | `POST /business/reviews/{guid}/reply` | ежедневная работа с репутацией для активных владельцев |
| 230 | Business Moment Composer | Опубликовать анонс на 2 часа | Business Dashboard | Ввести текст, время окончания | Business Moment Feed (для посетителей) | `POST /moments/places/{guid}` | ежедневный инструмент привлечения посетителей прямо сейчас |
| 231 | Business Hours Editor | Задать реальные часы работы | Business Dashboard | Указать интервалы по дням | Business Dashboard | `POST /business/places/{guid}/hours` | базовая операционная информация, нужная каждый день посетителям |
| 232 | Business Access-Expired State | Понять, что пробный период закончился | Business Dashboard (trial истёк) | Просмотр статуса | Business Subscription Status | `hasActiveAccess()=false` | честная граница вместо тихого отключения функций |

## 23. Settings & Privacy (8)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 233 | Settings Hub | Найти нужный раздел настроек | Profile Menu | Открыть подраздел | Account Settings / Privacy Settings / … | навигационный хаб | точка входа при любом изменении конфигурации |
| 234 | Account Settings | Управлять email/паролем | Settings Hub | Изменить поля | Edit Profile | `PATCH /me` | базовое обслуживание аккаунта |
| 235 | Privacy Settings | Настроить видимость данных | Settings Hub | Переключатели | Settings Hub | связано с Circles/Match privacy | контроль приватности при ежедневном использовании |
| 236 | Notification Preferences | Настроить, что присылать | Settings Hub | Переключатели по типам | Settings Hub | клиентская настройка поверх `/notifications` | снижение усталости от уведомлений — удержание |
| 237 | Data & Storage Settings | Понять, что хранится/скачать данные | Settings Hub | Запросить экспорт (если есть) | Settings Hub | честно ограничено текущими возможностями backend | доверие к платформе при длительном использовании |
| 238 | Language Settings | Сменить язык интерфейса | Settings Hub | Выбрать язык | Settings Hub | клиентская локализация | базовая доступность продукта ежедневно |
| 239 | About/Legal | Прочитать условия использования | Settings Hub | Открыть документ | Settings Hub | статический контент | разовый, но обязательный доступ к прозрачности |
| 240 | Settings Search | Быстро найти нужную настройку | Settings Hub | Ввести запрос | конкретный подраздел | клиентский поиск по пунктам меню | экономия времени при разросшемся меню настроек |

## 24. Trust & Safety (6)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 241 | Report Content Form | Пожаловаться на контент/человека | Post Options Menu, Other User Profile, Community Detail | Выбрать тип, причину, описание | Report Reason Picker | `POST /report` | базовый механизм безопасности сообщества |
| 242 | Report Reason Picker | Указать точную причину жалобы | Report Content Form | Выбрать из реального списка причин | Report Content Form | `OssnReport::VALID_REASONS` | честная классификация вместо свободного текста только |
| 243 | Report Submitted Confirm | Убедиться, что жалоба отправлена | Report Content Form | Закрыть | предыдущий экран | 200 от `POST /report` | доверие к тому, что жалоба реально обработается |
| 244 | Block User Confirm | Оградить себя от конкретного человека | Other User Profile | Подтвердить | Other User Profile | `POST /block/{guid}` | немедленная личная безопасность при столкновении с нежелательным контактом |
| 245 | Unblock User Confirm | Снять блокировку | Block List | Подтвердить | Block List | `DELETE /block/{guid}` | пересмотр решения при изменении ситуации |
| 246 | Safety Center Hub | Понять, какие инструменты безопасности есть | Settings Hub | Открыть Block List/Report | Block List | навигационный хаб | ощущение контроля при ежедневном использовании соцфункций |

## 25. Admin (4)

| # | State | User Goal | Entry From | Actions | Next State | Data/API | Why Daily |
|---|---|---|---|---|---|---|---|
| 247 | Admin Unvalidated Users Queue | Проверить новых пользователей, ждущих активации | Admin панель | Просмотреть список | Bulk Validate Confirm | `GET /admin/unvalidated` | ежедневная операционная задача для админов растущей платформы |
| 248 | Bulk Validate Confirm | Подтвердить пачку аккаунтов | Admin Unvalidated Users Queue | Выбрать, подтвердить | Admin Unvalidated Users Queue | `POST /admin/validate` | масштабирование модерации регистраций |
| 249 | Admin Report Queue | Рассмотреть накопленные жалобы | Admin панель | Открыть жалобу | Admin Report Resolve Action | `GET /report/queue` | ежедневная операционная задача доверия и безопасности |
| 250 | Admin Report Resolve Action | Принять решение по жалобе | Admin Report Queue | Разрешить/отклонить/удалить контент | Admin Report Queue | `POST /report/{id}/resolve` или `.../action` | закрытие цикла Trust & Safety — необходимо ежедневно на активной платформе |

---

## Проверка: ровно 250 уникальных states

| Раздел | Диапазон # | Количество |
|---|---|---|
| 1. Onboarding & Identity | 1–10 | 10 |
| 2. Profile & Social Graph | 11–24 | 14 |
| 3. Home Feed & Posts | 25–38 | 14 |
| 4. Notifications | 39–44 | 6 |
| 5. Messaging | 45–56 | 12 |
| 6. Places | 57–72 | 16 |
| 7. NOW / Nearby Live | 73–80 | 8 |
| 8. Events | 81–96 | 16 |
| 9. Communities | 97–110 | 14 |
| 10. Match | 111–124 | 14 |
| 11. Global Discover/Search | 125–132 | 8 |
| 12. Stories | 133–142 | 10 |
| 13. Video / Reels | 143–152 | 10 |
| 14. Music / Tracks | 153–160 | 8 |
| 15. Creator | 161–170 | 10 |
| 16. Collections | 171–176 | 6 |
| 17. Circles | 177–182 | 6 |
| 18. Trips | 183–192 | 10 |
| 19. Experiences | 193–202 | 10 |
| 20. Memories & Wrapped | 203–208 | 6 |
| 21. Rewards / Points / Streak | 209–218 | 10 |
| 22. Business | 219–232 | 14 |
| 23. Settings & Privacy | 233–240 | 8 |
| 24. Trust & Safety | 241–246 | 6 |
| 25. Admin | 247–250 | 4 |
| **Итого** | **1–250** | **250** |

Нумерация сплошная без пропусков и повторов (1 → 250, каждый раздел
начинается ровно там, где закончился предыдущий). Каждое из 250 названий
states уникально в пределах документа — ни одно не повторяет другое
дословно (списки/детали/создание/редактирование/пустые/ошибочные
состояния для одного домена сформулированы как разные, содержательно
различные экраны, а не под копирку).

## Явно не включено (осознанно, не забыто)

Wallet/Кошелёк, покупка билетов, любые формы оплаты — нет платёжного
провайдера (см. `client/BERX_PROGRESS.md`, `CANONICAL_CORRECTIONS.md`).
AI-рекомендации/AI-чат — канон прямо исключает AI как источник истины
для ранжирования. Ban/suspend аккаунта — нет backend-модели, только
validate/delete. Ни один из этих states не был бы честным — они
намеренно не в списке ровно 250, а не выкинуты для количества.
