<?php
/**
 * BERX Messages — three-pane conversation view.
 * Theme-level override of OssnMessages' messages/pages/view.
 *
 * STRUCTURE IS LOAD-BEARING. components/OssnMessages/plugins/default/js/
 * OssnMessages.php binds to an exact DOM shape, and the polling/append
 * logic silently stops working if any of it moves:
 *   - .ossn-messages .messages-recent .messages-from .inner  (nesting)
 *   - #get-recent, #message-append-{guid}, #message-send-{guid}
 *   - #message-with-user-widget + .ossn-inmessage-status-circle
 *   - #ossn-chat-sound
 * So the widget/view calls and their class names are reproduced here
 * verbatim; BERX adds a THIRD pane around them and restyles in CSS,
 * rather than rebuilding markup the JS depends on.
 *
 * The right pane is real data only (see berx_messages_context() in
 * themes/berx/ossn_theme.php): shared photos, files and links that
 * actually exist in ossn_messages. Voice messages, reactions, replies
 * and pinned messages are NOT rendered — OSSN has no such model, and a
 * control that does nothing is worse than an absent one.
 */
$has_user = isset($params['user']) && $params['user'] instanceof OssnUser;
$me       = ossn_loggedin_user();
$context  = array('media' => array(), 'files' => array(), 'links' => array());
if ($has_user && function_exists('berx_messages_context')) {
	$context = berx_messages_context($me->guid, $params['user']->guid);
}
?>
<div class="col-lg-12">
	<div class="ossn-messages berx-messages<?php echo $has_user ? ' berx-messages-active' : ''; ?>">
		<div class="row g-0">

			<?php /* ---------- LEFT: conversations ---------- */ ?>
			<div class="col-lg-3 berx-messages-col-list<?php echo $has_user ? ' d-none d-lg-block' : ''; ?>">
				<?php
				$toggle_mobile = '<span class="d-inline d-sm-none ossn-recent-messages-toggle"><i class="fas fa-angle-down"></i></span>';
				$unread = OssnMessages()->countUNREAD($me->guid);
				$unread_badge = $unread > 0 ? '<span class="berx-unread-pill">' . intval($unread) . '</span>' : '';
				// Message search entry point. A plain link in the widget
				// HEADING — outside .messages-from — so the polling DOM
				// contract (.messages-recent .messages-from .inner) is
				// untouched; the search UI lives on its own route.
				$search_link = '';
				if (com_is_active('OssnMessageSearch')) {
					$search_link = '<a class="berx-msgsearch-entry" href="'
						. ossn_site_url('messages-search') . '" title="'
						. ossn_print('berx:msgsearch:title') . '"><i class="fa fa-search"></i></a>';
				}
				echo ossn_plugin_view('widget/view', array(
					'title'    => '<span class="berx-inbox-title">' . ossn_print('inbox') . '</span>' . $unread_badge . $search_link . $toggle_mobile,
					'contents' => ossn_plugin_view('messages/pages/view/recent', $params),
					'class'    => 'messages-recent',
				));
				?>
			</div>

			<?php /* ---------- CENTER: active conversation ---------- */ ?>
			<div class="col-lg-6 berx-messages-col-thread">
				<?php
				if ($has_user) {
					$user = $params['user'];

					$status = 'ossn-inmessage-status-offline';
					if ($user->isOnline(10)) {
						$status = 'ossn-inmessage-status-online';
					}
					$status_container = "<span class='ossn-inmessage-status-circle'></span>";

					// Mobile-only back affordance: on phones the thread is a
					// full-screen view, so there has to be a way out of it.
					$back = "<a class='berx-msg-back d-inline d-lg-none' href='" . ossn_site_url('messages/all') . "'><i class='fas fa-angle-left'></i></a>";

					$delete = "<a data-guid='{$user->guid}' class='ossn-message-delete-conversation' href='javascript:void(0);' title='" . ossn_print('delete') . "'><i class='fas fa-trash-alt'></i></a>";

					$image = ossn_plugin_view('output/image', array(
						'src'   => $user->iconURL()->smaller,
						'class' => 'user-icon-smaller',
					));

					$presence = $user->isOnline(10)
						? ossn_print('berx:messages:online')
						: ossn_print('berx:messages:offline');

					$title = $back . $image . $status_container
						. "<span class='berx-msg-head-meta'>"
						. "<a class='berx-msg-head-name' href='" . $user->profileURL() . "'>" . htmlspecialchars($user->fullname, ENT_QUOTES, 'UTF-8') . "</a>"
						. "<span class='berx-msg-head-presence'>{$presence}</span>"
						. "</span>" . $delete;

					echo ossn_plugin_view('widget/view', array(
						'title'     => $title,
						'id'        => 'message-with-user-widget',
						'data-guid' => $user->guid,
						'contents'  => ossn_plugin_view('messages/pages/view/with', $params),
						'class'     => "messages-with {$status}",
					));
				} else {
					?>
					<div class="berx-messages-empty ossn-messages-select-conv">
						<i class="fa fa-comment-dots"></i>
						<h3><?php echo ossn_print('berx:messages:empty:title'); ?></h3>
						<p><?php echo ossn_print('berx:messages:empty:text'); ?></p>
					</div>
					<?php
				}
				?>
			</div>

			<?php /* ---------- RIGHT: conversation context ---------- */ ?>
			<div class="col-lg-3 berx-messages-col-context d-none d-lg-block">
				<?php if ($has_user) { $user = $params['user']; ?>
					<aside class="berx-context">
						<div class="berx-context-profile">
							<a href="<?php echo $user->profileURL(); ?>" class="berx-context-avatar">
								<img src="<?php echo $user->iconURL()->larger; ?>" alt="" />
							</a>
							<a class="berx-context-name" href="<?php echo $user->profileURL(); ?>">
								<?php echo htmlspecialchars($user->fullname, ENT_QUOTES, 'UTF-8'); ?>
							</a>
							<span class="berx-context-username">@<?php echo htmlspecialchars($user->username, ENT_QUOTES, 'UTF-8'); ?></span>

							<div class="berx-context-actions">
								<a class="btn" href="<?php echo $user->profileURL(); ?>">
									<i class="fa fa-user"></i> <?php echo ossn_print('berx:messages:view:profile'); ?>
								</a>
								<a class="btn berx-context-danger ossn-message-delete-conversation"
								   data-guid="<?php echo $user->guid; ?>" href="javascript:void(0);">
									<i class="fas fa-trash-alt"></i> <?php echo ossn_print('berx:messages:delete:conversation'); ?>
								</a>
							</div>
						</div>

						<?php if (!empty($context['media'])) { ?>
							<section class="berx-context-section">
								<h4><?php echo ossn_print('berx:messages:shared:media'); ?>
									<span class="berx-context-count"><?php echo count($context['media']); ?></span>
								</h4>
								<div class="berx-context-media-grid">
									<?php foreach (array_slice($context['media'], 0, 9) as $item) { ?>
										<a href="<?php echo $item['url']; ?>" data-fancybox="berx-context-media" class="berx-context-media-item">
											<img src="<?php echo $item['url']; ?>" alt="" loading="lazy" />
										</a>
									<?php } ?>
								</div>
							</section>
						<?php } ?>

						<?php if (!empty($context['files'])) { ?>
							<section class="berx-context-section">
								<h4><?php echo ossn_print('berx:messages:shared:files'); ?>
									<span class="berx-context-count"><?php echo count($context['files']); ?></span>
								</h4>
								<ul class="berx-context-list">
									<?php foreach (array_slice($context['files'], 0, 8) as $item) { ?>
										<li>
											<a href="<?php echo $item['url']; ?>" target="_blank" rel="noopener">
												<i class="fa fa-file"></i>
												<span><?php echo htmlspecialchars($item['name'], ENT_QUOTES, 'UTF-8'); ?></span>
											</a>
										</li>
									<?php } ?>
								</ul>
							</section>
						<?php } ?>

						<?php if (!empty($context['links'])) { ?>
							<section class="berx-context-section">
								<h4><?php echo ossn_print('berx:messages:shared:links'); ?>
									<span class="berx-context-count"><?php echo count($context['links']); ?></span>
								</h4>
								<ul class="berx-context-list">
									<?php foreach (array_slice($context['links'], 0, 8) as $item) { ?>
										<li>
											<a href="<?php echo htmlspecialchars($item['url'], ENT_QUOTES, 'UTF-8'); ?>" target="_blank" rel="noopener nofollow">
												<i class="fa fa-link"></i>
												<span><?php echo htmlspecialchars($item['host'], ENT_QUOTES, 'UTF-8'); ?></span>
											</a>
										</li>
									<?php } ?>
								</ul>
							</section>
						<?php } ?>

						<?php if (empty($context['media']) && empty($context['files']) && empty($context['links'])) { ?>
							<div class="berx-context-empty">
								<i class="fa fa-images"></i>
								<p><?php echo ossn_print('berx:messages:context:empty'); ?></p>
							</div>
						<?php } ?>
					</aside>
				<?php } ?>
			</div>

		</div>
	</div>
	<audio id="ossn-chat-sound" src="<?php echo ossn_site_url("components/OssnMessages/sound/pling.mp3"); ?>" preload="auto"></audio>
</div>
