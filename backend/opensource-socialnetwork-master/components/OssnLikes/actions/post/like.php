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
$OssnLikes = new OssnLikes();
$anotation = input('post');
$entity    = input('entity');
$object    = input('object');

$reaction_type = input('reaction_type');

if(!empty($anotation)){
		$subject = $anotation;
		$type    = 'post';
}
if(!empty($entity)){
		$subject = $entity;
		$type    = 'entity';
}
if(!empty($object)){
		$subject = $object;
		$type    = 'object';
}

// Block enforcement — same gap as comments: no check at all before
// liking a blocker's content (found in cross-module security audit).
// ossn_get_entity() resolves any of post/entity/object's underlying
// guid since OssnWall/OssnObject/etc. all extend OssnEntities.
if (com_is_active('OssnBlock') && !empty($subject)) {
	$liked_entity = ossn_get_entity($subject);
	if ($liked_entity && isset($liked_entity->owner_guid)) {
		$liker_user = ossn_loggedin_user();
		$owner_user = ossn_user_by_guid($liked_entity->owner_guid);
		if ($liker_user && $owner_user && OssnBlock::isBlocked($liker_user, $owner_user)) {
			if (!ossn_is_xhr()) {
				redirect(REF);
			} else {
				header('Content-Type: application/json');
				echo json_encode(array('done' => 0, 'container' => false, 'button' => ossn_print('ossn:like')));
			}
			exit;
		}
	}
}
if($OssnLikes->Like($subject, ossn_loggedin_user()->guid, $type, $reaction_type)){
		if(!ossn_is_xhr()){
				redirect(REF);
		} else {
				if($type == 'entity'){
						$likes_container = ossn_plugin_view('likes/post/likes_entity', array(
								'entity_guid' => $subject,
						));
				}
				if($type == 'object'){
						$likes_container = ossn_plugin_view('likes/post/likes_object', array(
								'object_guid' => $subject,
						));
				}
				if($type == 'post'){
						$object          = new stdClass();
						$object->guid    = $subject;
						$likes_container = ossn_plugin_view('likes/post/likes', $object);
				}
				header('Content-Type: application/json');
				$icon = ossn_plugin_view('likes/reacted_icon', array(
						'type' => $reaction_type,													 
				));				
				echo json_encode(array(
						'done'      => 1,
						'container' => $likes_container,
						'class'		=> 	"ossn-reacted-item ossn-reacted-{$reaction_type}",
						'button'    => "{$icon} <span>".ossn_print("ossn:reaction:{$reaction_type}").'</span>',
				));
		}
} else {
		if(!ossn_is_xhr()){
				redirect(REF);
		} else {
				header('Content-Type: application/json');
				echo json_encode(array(
						'done'      => 0,
						'container' => false,
						'button'    => ossn_print('ossn:like'),
				));
		}
}
exit();