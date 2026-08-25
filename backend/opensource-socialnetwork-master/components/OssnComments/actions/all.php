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

$guid  = input('guid');
$type  = input('type');
$acl   = input('acl');

$ctype = false;

switch ($type) {
case 'p':
		$ctype = 'post';
		break;
case 'o':
		$ctype = 'object';
		break;
case 'e':
		$ctype = 'entity';
		break;
}

$comments             = new OssnComments();
$comments->limit      = false;
$comments->page_limit = false;

// Block enforcement — this is a direct, guessable-guid "load
// comments" endpoint with no access check at all before this fix
// (found in cross-module security audit): a blocked user could still
// read a blocker's comment thread just by knowing the post guid.
// This closes the OssnBlock-specific bypass; broader ACL/private-
// group visibility on this endpoint (core OSSN's own access_id
// system, separate from OssnBlock) is a larger, pre-existing gap
// this pass doesn't attempt to fully resolve without being able to
// test against real group/privacy configurations.
if (com_is_active('OssnBlock')) {
	$commented_entity = ossn_get_entity($guid);
	if ($commented_entity && isset($commented_entity->owner_guid)) {
		$viewer_user = ossn_loggedin_user();
		$owner_user = ossn_user_by_guid($commented_entity->owner_guid);
		if ($viewer_user && $owner_user && OssnBlock::isBlocked($viewer_user, $owner_user)) {
			header('Content-Type: application/json');
			echo json_encode(array('list' => false));
			exit;
		}
	}
}

$comments = $comments->GetComments($guid, $ctype);
$list     = '';
if($comments) {
		foreach ($comments as $comment) {
            	$comment->allow_comment_like = true;
            	if($acl == 'no'){
            	    $comment->allow_comment_like = false;
           	 	}			
				$data['comment'] = get_object_vars($comment);
				$list .= ossn_comment_view($data);
		}
}
header('Content-Type: application/json');
if(!empty($list)) {
		echo json_encode(array(
				'list' => $list,
		));
} else {
		echo json_encode(array(
				'list' => false,
		));
}