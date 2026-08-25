<?php
/**
 * BERX left navigation sidebar.
 *
 * Real, working links go to actual OSSN routes/components.
 * Items for modules that don't exist yet in the OSSN engine
 * (Reels, BERX Match, Events, Map, Restaurants, Afisha, Saved)
 * are rendered as visibly disabled "coming soon" entries rather
 * than dead links that look like they work — per the product
 * requirement not to fake functionality.
 */
if (!ossn_isLoggedin()) {
	return;
}

$me = ossn_loggedin_user();

$nav_active = array(
	array('icon' => 'fa-home',          'text' => 'Главная',      'href' => ossn_site_url(),                       'active' => true),
	array('icon' => 'fa-compass',       'text' => 'Обзор',        'href' => ossn_site_url('discover')),
	array('icon' => 'fa-search',        'text' => 'Поиск',        'href' => ossn_site_url('search')),
	array('icon' => 'fa-comment-dots',  'text' => 'Сообщения',    'href' => ossn_site_url('messages')),
	array('icon' => 'fa-heart',         'text' => 'Знакомства',   'href' => ossn_site_url('dating')),
	array('icon' => 'fa-users',         'text' => 'Сообщества',   'href' => ossn_site_url('communities')),
	array('icon' => 'fa-utensils',      'text' => 'Места',        'href' => ossn_site_url('places')),
	array('icon' => 'fa-calendar',      'text' => 'События',      'href' => ossn_site_url('events')),
	array('icon' => 'fa-map-marker-alt','text' => 'Карта',        'href' => ossn_site_url('places/map')),
	array('icon' => 'fa-bookmark',      'text' => 'Сохранённое',  'href' => ossn_site_url('places/saved')),
	array('icon' => 'fa-bell',          'text' => 'Уведомления',  'href' => ossn_site_url('notifications')),
	array('icon' => 'fa-user',          'text' => 'Профиль',      'href' => $me->profileURL()),
	array('icon' => 'fa-cog',           'text' => 'Настройки',    'href' => $me->profileURL('/edit')),
);

// Not yet backed by a real component/backend — shown, disabled, labeled.
$nav_soon = array(
	array('icon' => 'fa-play',          'text' => 'Reels'),

);
?>
<div class="sidebar berx-sidebar">
	<div class="berx-sidebar-brand">
		<a href="<?php echo ossn_site_url(); ?>" class="berx-logo" aria-label="BERX">
			<svg width="30" height="30" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M8 6H24C29 6 33 9.5 33 14C33 17 31 19.3 28.3 20.2C31.6 21 34 23.6 34 27C34 31.8 30 35 24.5 35H8V6Z" stroke="var(--berx-accent)" stroke-width="2.6" stroke-linejoin="round"/>
				<path d="M8 20.5H24" stroke="var(--berx-accent)" stroke-width="2.6" stroke-linecap="round"/>
			</svg>
			<span class="berx-logo-text">BERX</span>
		</a>
	</div>

	<?php // The post composer lives inline on the home feed (OssnWall) — no
	// separate "create" route exists in OSSN, so this links there rather
	// than to a page that doesn't exist. ?>
	<a href="<?php echo ossn_site_url(); ?>#berx-post-composer" class="berx-create-btn">
		<i class="fa fa-plus"></i> <span>Создать</span>
	</a>

	<div class="sidebar-contents berx-nav">
		<ul class="berx-nav-list">
			<?php foreach ($nav_active as $item) { ?>
				<li class="berx-nav-item<?php echo !empty($item['active']) ? ' berx-nav-active' : ''; ?>">
					<a href="<?php echo $item['href']; ?>">
						<i class="fa <?php echo $item['icon']; ?>"></i>
						<span><?php echo $item['text']; ?></span>
					</a>
				</li>
			<?php } ?>

			<?php foreach ($nav_soon as $item) { ?>
				<li class="berx-nav-item berx-nav-disabled" title="Скоро">
					<span>
						<i class="fa <?php echo $item['icon']; ?>"></i>
						<span><?php echo $item['text']; ?></span>
						<em class="berx-soon-badge">скоро</em>
					</span>
				</li>
			<?php } ?>
		</ul>

		<?php
		if (ossn_is_hook('newsfeed', "sidebar:left")) {
			$newsfeed_left = ossn_call_hook('newsfeed', "sidebar:left", NULL, array());
			echo implode('', $newsfeed_left);
		}
		?>

		<div class="berx-theme-toggle">
			<label class="berx-switch">
				<input type="checkbox" id="berx-night-mode-toggle" checked disabled>
				<span class="berx-switch-slider"></span>
			</label>
			<span>Ночной режим</span>
		</div>
	</div>
</div>

<nav class="berx-mobile-nav" aria-label="Основная навигация">
	<ul>
		<li><a href="<?php echo ossn_site_url(); ?>" class="berx-mobile-active"><i class="fa fa-home"></i>Главная</a></li>
		<li><a href="<?php echo ossn_site_url('discover'); ?>"><i class="fa fa-compass"></i>Обзор</a></li>
		<li><a href="<?php echo ossn_site_url(); ?>#berx-post-composer" class="berx-mobile-create"><i class="fa fa-plus"></i></a></li>
		<li><a href="<?php echo ossn_site_url('messages'); ?>"><i class="fa fa-comment-dots"></i>Сообщения</a></li>
		<li><a href="<?php echo $me->profileURL(); ?>"><i class="fa fa-user"></i>Профиль</a></li>
	</ul>
</nav>
