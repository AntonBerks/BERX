<?php
/**
 * BERX Albums module (profile grid).
 * Theme override of OssnPhotos' photos/modules/profile/albums.
 *
 * REAL GAP CLOSED, NOT NEW FUNCTIONALITY INVENTED: every piece this
 * file wires up already existed and worked —
 *   #ossn-add-album / #album-add  -> Ossn.MessageBox('album/add')
 *      -> ossn_album_page_handler's 'add' case (registered, real)
 *      -> forms/OssnPhotos/album/add.php -> action/ossn/album/add
 *   #ossn-photos-edit-album[data-guid] -> MessageBox('album/edit/{guid}')
 *      -> the handler's 'edit' case (owner-only, already checked
 *         server-side) -> action/ossn/album/edit
 * (both handlers live in components/OssnPhotos/plugins/default/js/
 * OssnPhotos.php — untouched, reused verbatim)
 *
 * Delete had NO client trigger anywhere (verified: zero matches for
 * any delete-album selector in the component's JS). No JS handler
 * existed to bind to, so this uses the same plain-token-link pattern
 * already established elsewhere this session (group member removal,
 * notification delete-all) rather than inventing a new JS mechanism —
 * a real GET-with-CSRF-token link to the real, already-registered
 * action/ossn/album/delete, confirmed via onclick to require the same
 * confirmation UX every other destructive action in BERX uses.
 *
 * Read-only display logic (cover resolution, ossn_access_validate()
 * privacy filtering, the no-albums fallback) is reproduced exactly —
 * only the three missing controls are added.
 */
$viewer   = ossn_isLoggedin() ? ossn_loggedin_user() : false;
$is_owner = $viewer && intval($viewer->guid) === intval($params['user']->guid);
?>
<div class="ossn-profile-module-albums berx-albums-module">
	<?php if ($is_owner) { ?>
		<div class="berx-albums-toolbar">
			<button type="button" id="ossn-add-album" class="berx-album-add-btn">
				<i class="fa fa-plus"></i> <?php echo ossn_print('add:album'); ?>
			</button>
		</div>
	<?php }

	$albums = new OssnAlbums;
	$list   = $albums->GetAlbums($params['user']->guid, array(
		'page_limit' => 9,
		'offset'     => 1,
	));

	if ($list) {
		foreach ($list as $album) {
			if (!ossn_access_validate($album->access, $album->owner_guid)) {
				continue;
			}
			$images = new OssnPhotos;
			$cover  = $images->GetPhotos($album->guid);
			if (isset($cover->{0}->guid)) {
				$cover_url = "{$cover->{0}->getURL()}?size=small";
			} else {
				$cover_url = ossn_site_url() . 'components/OssnPhotos/images/nophoto-album.png';
			}
			$view_url = ossn_site_url() . 'album/view/' . $album->guid;
			?>
			<div class="berx-album-tile">
				<a href="<?php echo $view_url; ?>" class="berx-album-tile-media">
					<img src="<?php echo $cover_url; ?>" alt="<?php echo htmlspecialchars($album->title, ENT_QUOTES, 'UTF-8'); ?>" loading="lazy" />
				</a>
				<?php if ($is_owner) { ?>
					<div class="berx-album-tile-controls">
						<button type="button" id="ossn-photos-edit-album" data-guid="<?php echo $album->guid; ?>"
						        class="berx-album-ctrl" title="<?php echo ossn_print('edit'); ?>">
							<i class="fa fa-pen"></i>
						</button>
						<a class="berx-album-ctrl berx-album-ctrl-danger"
						   href="<?php echo ossn_site_url("action/ossn/album/delete?guid={$album->guid}", true); ?>"
						   onclick="return confirm(<?php echo htmlspecialchars(json_encode(ossn_print('berx:album:delete:confirm'), JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8'); ?>);"
						   title="<?php echo ossn_print('delete'); ?>">
							<i class="fa fa-trash-alt"></i>
						</a>
					</div>
				<?php } ?>
			</div>
			<?php
		}
	} else {
		echo '<h3 class="berx-albums-empty">' . ossn_print('no:albums') . '</h3>';
	}
	?>
</div>
