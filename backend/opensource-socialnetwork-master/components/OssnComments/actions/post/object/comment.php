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
$OssnComment = new OssnComments;
$image       = input('comment-attachment');
//comment image check if is attached or not
if(!empty($image)) {
		$OssnComment->comment_image = $image;
}
//entity on which comment is going to be posted
$object_guid = input('object_guid');

// Block enforcement — same gap as post/comment.php, same fix.
if (com_is_active('OssnBlock')) {
	$entity = ossn_get_entity($object_guid);
	if ($entity && isset($entity->owner_guid)) {
		$commenter_user = ossn_loggedin_user();
		$owner_user = ossn_user_by_guid($entity->owner_guid);
		if ($commenter_user && $owner_user && OssnBlock::isBlocked($commenter_user, $owner_user)) {
			if (!ossn_is_xhr()) {
				redirect(REF);
			} else {
				header('Content-Type: application/json');
				echo json_encode(array('process' => 0));
			}
			exit;
		}
	}
}

//comment text
$comment = input('comment');
if($OssnComment->PostComment($object_guid, ossn_loggedin_user()->guid, $comment, 'object')) {
		$vars            = array();
		$vars['comment'] = (array) ossn_get_comment($OssnComment->getCommentId());
		$data            = ossn_comment_view($vars);
		if(!ossn_is_xhr()) {
				redirect(REF);
		} else {
				header('Content-Type: application/json');
				echo json_encode(array(
						'comment' => $data,
						'process' => 1
				));
				exit;
		}
} else {
		if(!ossn_is_xhr()) {
				redirect(REF);
		} else {
				header('Content-Type: application/json');
				echo json_encode(array(
						'process' => 0
				));
				exit;
		}
}
