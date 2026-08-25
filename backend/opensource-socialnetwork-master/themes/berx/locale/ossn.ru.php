<?php
/**
 * BERX theme locale overrides — only for strings referenced by
 * theme-level view files that the base OSSN/component locale files
 * don't cover (found via a locale-key coverage audit, not guessed).
 */
return array(
	'more' => 'Ещё',

	// Messages (three-pane view)
	'berx:messages:online' => 'в сети',
	'berx:messages:offline' => 'не в сети',
	'berx:messages:empty:title' => 'Выберите диалог',
	'berx:messages:empty:text' => 'Здесь появятся ваши сообщения. Выберите беседу слева, чтобы начать.',
	'berx:messages:view:profile' => 'Профиль',
	'berx:messages:delete:conversation' => 'Удалить диалог',
	'berx:messages:shared:media' => 'Общие фото',
	'berx:messages:shared:files' => 'Файлы',
	'berx:messages:shared:links' => 'Ссылки',
	'berx:messages:context:empty' => 'В этом диалоге пока нет общих фото, файлов и ссылок.',

	// Communities (member removal)
	'berx:group:member:removed' => 'Участник удалён из сообщества.',
	'berx:group:remove:owner' => 'Нельзя удалить владельца сообщества.',
	'berx:group:remove:member' => 'Удалить из сообщества',
	'berx:group:remove:confirm' => 'Удалить этого участника из сообщества?',

	// Settings
	'berx:settings:username:locked' => 'Имя пользователя изменить нельзя.',
	'berx:settings:password:hint' => 'Оставьте поле пустым, чтобы не менять пароль.',

	// Albums
	'berx:album:delete:confirm' => 'Удалить альбом со всеми фото? Это действие необратимо.',

	// Group moderators
	'berx:group:moderator:added' => 'Модератор назначен.',
	'berx:group:moderator:removed' => 'Права модератора сняты.',
	'berx:group:moderator:notmember' => 'Сначала человек должен быть участником сообщества.',
	'berx:group:moderator:error' => 'Не удалось изменить права модератора.',

	// Notifications: bulk delete
	'berx:notifications:delete:all' => 'Удалить все',
	'berx:notifications:delete:all:confirm' => 'Удалить все уведомления безвозвратно?',
	'berx:notifications:deleted:all' => 'Все уведомления удалены.',
	'berx:notifications:deleted:none' => 'Уведомлений для удаления не найдено.',

	// Settings: devices & delete account
	'berx:settings:devices:tab' => 'Устройства',
	'berx:settings:devices:title' => 'Устройства и сессии',
	'berx:settings:devices:note' => 'Устройства, где вы вошли через мобильное приложение BERX. Веб-сессия в браузере сюда не входит.',
	'berx:settings:devices:empty' => 'Активных устройств нет.',
	'berx:settings:devices:unavailable' => 'Список устройств временно недоступен.',
	'berx:settings:devices:unnamed' => 'Неизвестное устройство',
	'berx:settings:devices:never:used' => 'ещё не использовалось',
	'berx:settings:devices:signed:in' => 'Вход: %s',
	'berx:settings:devices:last:used' => 'Последняя активность: %s',
	'berx:settings:devices:revoke' => 'Выйти',
	'berx:settings:devices:revoke:confirm' => 'Завершить сессию на этом устройстве?',
	'berx:settings:devices:revoked' => 'Сессия завершена.',
	'berx:settings:devices:revoke:fail' => 'Не удалось завершить сессию.',
	'berx:settings:delete:tab' => 'Удалить аккаунт',
	'berx:settings:delete:title' => 'Удаление аккаунта',
	'berx:settings:delete:warning' => 'Это действие необратимо. Аккаунт и все связанные данные будут удалены безвозвратно.',
	'berx:settings:delete:point:posts' => 'Все ваши посты, комментарии и лайки будут удалены',
	'berx:settings:delete:point:media' => 'Все загруженные фото и файлы будут удалены',
	'berx:settings:delete:point:places' => 'Места и события, которые вы создали, останутся, но перестанут быть связаны с вашим профилем',
	'berx:settings:delete:point:irreversible' => 'Отменить это действие будет невозможно',
	'berx:settings:delete:password:label' => 'Введите пароль для подтверждения',
	'berx:settings:delete:submit' => 'Удалить аккаунт навсегда',
	'berx:settings:delete:confirm' => 'Вы точно хотите навсегда удалить свой аккаунт? Это действие нельзя отменить.',
	'berx:settings:delete:password:required' => 'Введите пароль.',
	'berx:settings:delete:password:wrong' => 'Неверный пароль.',
	'berx:settings:delete:failed' => 'Не удалось удалить аккаунт. Попробуйте позже.',

	// Search
	'berx:search:empty:hint' => 'Проверьте написание или попробуйте другой запрос — либо переключите тип результатов слева.',
	'berx:search:idle:title' => 'Найдите людей и сообщества',
	'berx:search:idle:text' => 'Введите имя, никнейм или название сообщества. Или загляните в «Обзор», чтобы посмотреть, что происходит сейчас.',

	// Feed
	'berx:feed:carousel' => 'фото',
);
