<?php
/**
 * BERX community members.
 * Theme override of OssnGroups' groups/pages/members — adds ONE real
 * control (owner/admin removes a member) that the original page never
 * exposed, even though the backend method has always supported it
 * (see themes/berx/actions/group/member/remove.php). Everything else —
 * markup, classes, the friend add/remove buttons, pagination — is
 * reproduced exactly so no existing CSS selector or JS binding shifts.
 */
$members = $params['group']->getMembers();
$count   = $params['group']->getMembers(true);

$caller_guid = ossn_isLoggedin() ? ossn_loggedin_user()->guid : 0;
$can_manage  = false;
if ($caller_guid) {
	$can_manage = ($params['group']->owner_guid === $caller_guid)
		|| ossn_isAdminLoggedin()
		|| $params['group']->isModerator($caller_guid);
}

if ($members) {
	echo '<div class="ossn-group-members ossn-output-users-list">';
	foreach ($members as $user) {
		$is_owner_row = (intval($user->guid) === intval($params['group']->owner_guid));
		?>
		<div class="user-item-card">
			<div class="user-item-inner">
				<div class="user-info-box">
					<div class="user-avatar-container">
						<img src="<?php echo $user->iconURL()->large; ?>" alt="user" />
					</div>
					<div class="user-details">
						<div class="user-name-text">
							<?php
								echo ossn_plugin_view('output/user/url', array(
									'user'  => $user,
									'class' => 'user-link-inherited',
								));
							?>
							<?php if ($is_owner_row) { ?>
								<span class="berx-group-owner-badge"><i class="fa fa-crown"></i></span>
							<?php } ?>
						</div>
						<div class="user-username-sub">@<?php echo $user->username; ?></div>
					</div>
				</div>

				<div class="user-controls-box">
					<?php
					if (ossn_isLoggedIn() && ossn_loggedin_user()->guid !== $user->guid) {
						if (!ossn_user_is_friend(ossn_loggedin_user()->guid, $user->guid)) {
							if (ossn_user()->requestExists(ossn_loggedin_user()->guid, $user->guid)) {
								echo ossn_plugin_view('output/url', array(
									'text'  => ossn_print('cancel:request'),
									'href'  => ossn_site_url("action/friend/remove?cancel=true&user={$user->guid}", true),
									'class' => 'ossn-action-btn btn-danger-outline',
								));
							} else {
								echo ossn_plugin_view('output/url', array(
									'text'  => '<i class="fa fa-user-plus"></i> ' . ossn_print('add:friend'),
									'href'  => ossn_site_url("action/friend/add?user={$user->guid}", true),
									'class' => 'ossn-action-btn btn-primary-outline',
								));
							}
						} else {
							echo ossn_plugin_view('output/url', array(
								'text'  => ossn_print('remove:friend'),
								'href'  => ossn_site_url("action/friend/remove?user={$user->guid}", true),
								'class' => 'ossn-action-btn btn-danger-outline',
							));
						}
					}
					// Real control, real backend, gated by the same
					// owner/admin/moderator check the action re-verifies
					// server-side — this button is a convenience, not the
					// authorization boundary.
					if ($can_manage && !$is_owner_row) {
						// output/url dumps any extra param straight into an
						// HTML attribute via ossn_args() (values pass through
						// htmlspecialchars, so quotes are safely entity-encoded
						// and the browser decodes them back when parsing the
						// attribute) — a fake 'confirm' param would render as
						// confirm="..." and do nothing. A real onclick handler
						// is what actually blocks navigation on Cancel.
						$confirm_js = 'return confirm(' . json_encode(ossn_print('berx:group:remove:confirm'), JSON_UNESCAPED_UNICODE) . ');';
						echo ossn_plugin_view('output/url', array(
							'text'    => '<i class="fa fa-user-slash"></i> ' . ossn_print('berx:group:remove:member'),
							'href'    => ossn_site_url("action/group/member/remove?group={$params['group']->guid}&user={$user->guid}", true),
							'class'   => 'ossn-action-btn btn-danger-outline berx-group-remove-member',
							'onclick' => $confirm_js,
						));
					}
					?>
				</div>
			</div>
		</div>
		<?php
	}
	echo '</div>';
	echo ossn_view_pagination($count);
}
