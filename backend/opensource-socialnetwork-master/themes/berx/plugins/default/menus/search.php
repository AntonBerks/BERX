<?php
/**
 * Open Source Social Network
 *
 * @package   Open Source Social Network (OSSN)
 * @author    OSSN Core Team <info@openteknik.com>
 * @copyright (C) OpenTeknik LLC
 * @license   Open Source Social Network License (OSSN LICENSE)  http://www.opensource-socialnetwork.org/licence
 * @link      https://www.opensource-socialnetwork.org/
 */
$type = input('type');
if(empty($type)) {
	$type = 'users';	
}
$menus = $params['menu'];
// The <li> items below were previously emitted directly into a <div>,
// which is invalid HTML and gives assistive tech no list semantics.
// The wrapper is a <ul> now; every existing `.ossn-menu-search li`
// CSS selector still matches, so nothing visual depends on the change.
echo '<div class="title">' . ossn_print('result:type') . '</div>';
echo "<ul class='ossn-menu-search'>";
foreach ($menus as $menu => $val) {
    foreach ($val as $link) {
        $text = ossn_print($link['text']);
		$link = $link['href'];
		$class = OssnTranslit::urlize($menu);
		$active = '';
		if($class == $type){
			$active = ' ossn-search-active-item';	
		}
        echo "<li class='ossn-menu-search-{$class} {$active}'>
				<a href='{$link}'>
					<div class='text'>{$text}</div>
				</a>
			</li>";
    }
}
echo '</ul>';
