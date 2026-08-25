<?php
/**
 * Open Source Social Network
 *
 * @package   Open Source Social Network
 * @author    Open Source Social Network Core Team <info@openteknik.com>
 * @copyright (C) OpenTeknik LLC
 * @license   Open Source Social Network License (OSSN LICENSE)  http://www.opensource-socialnetwork.org/licence
 * @link      https://www.opensource-socialnetwork.org/
 */
$OssnLikes = new OssnLikes;
$anotation = input('annotation');
$reaction_type = input('reaction_type');

// Block enforcement — liking a comment (annotation) had no check at
// all, same gap class as the post/entity/object like action.
if (com_is_active('OssnBlock') && !empty($anotation)) {
	$liked_annotation = ossn_get_annotation($anotation);
	if ($liked_annotation && isset($liked_annotation->owner_guid)) {
		$liker_user = ossn_loggedin_user();
		$owner_user = ossn_user_by_guid($liked_annotation->owner_guid);
		if ($liker_user && $owner_user && OssnBlock::isBlocked($liker_user, $owner_user)) {
			if (!ossn_is_xhr()) {
				redirect(REF);
			} else {
				header('Content-Type: application/json');
				echo json_encode(array('done' => 0, 'container' => false));
			}
			exit;
		}
	}
}

if ($OssnLikes->Like($anotation, ossn_loggedin_user()->guid, 'annotation', $reaction_type)) {
    if (!ossn_is_xhr()) {
        redirect(REF);
    } else {
		$likes_container = ossn_plugin_view('likes/annotation/likes', array(
					'annotation_id' => $anotation,																	
		));			
        header('Content-Type: application/json');
        echo json_encode(array(
                'done' => 1,
				'container' => $likes_container,
        ));
	exit;
    }
} else {
    if (!ossn_is_xhr()) {
        redirect(REF);
    } else {
		$likes_container = ossn_plugin_view('likes/annotation/likes', array(
					'annotation_id' => $anotation,																	
		));					
        header('Content-Type: application/json');
        echo json_encode(array(
                'done' => 0,
				'container' => $likes_container,
        ));
	exit;
    }
}
