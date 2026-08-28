/******************************
	Basic <style>
**********************************/
:root {
	--layout-sidebar-width: 240px;
}

/* Regular (400) */
@font-face {
  font-family: 'PT Sans';
  font-style: normal;
  font-weight: 400;
  src: url('<?php echo ossn_theme_url();?>vendors/fonts/PTSans/PTSans-Regular.woff2') format('woff2');
}

/* Italic (400italic) */
@font-face {
  font-family: 'PT Sans';
  font-style: italic;
  font-weight: 400;
  src: url('<?php echo ossn_theme_url();?>vendors/fonts/PTSans/PTSans-Italic.woff2') format('woff2');
}

/* Bold (700) */
@font-face {
  font-family: 'PT Sans';
  font-style: normal;
  font-weight: 700;
  src: url('<?php echo ossn_theme_url();?>vendors/fonts/PTSans/PTSans-Bold.woff2') format('woff2');
}

body {
	font-size: 15px;
	background-color: #eaeaea;
	font-family: 'PT Sans', sans-serif;
	height: 100%;
}

.ossn-required {
	color: #a94442;
}

::-webkit-scrollbar {
	width: 12px;
}

/* Dark scrollbars — the light track/thumb was one of the most visible
   remaining "this is an OSSN install" tells on every scrollable pane. */
::-webkit-scrollbar-track {
	background-color: rgba(255,255,255,0.03);
	border-left: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

::-webkit-scrollbar-thumb {
	background-color: rgba(255,255,255,0.16);
	border-radius: var(--berx-radius-pill, 999px);
}

::-webkit-scrollbar-thumb:hover {
	background-color: rgba(255,255,255,0.26);
}

* {
	scrollbar-color: rgba(255,255,255,0.18) rgba(255,255,255,0.03);
	scrollbar-width: thin;
}

.ossn-form input[type='number'],
.ossn-form input[type='email'],
.ossn-form input[type='password'],
.ossn-form text,
.ossn-form select,
.ossn-form textarea,
.ossn-form input[type='text'] {
	width: 100%;
	padding: 8px;
	margin-bottom: 5px;
	outline: none;
	display: block;
	border-radius: 5px;
	border-radius: 5px;
	box-shadow: none;
	-webkit-box-shadow: none;
	/* Was #f1f5f9 with a #ccc border: light-mode inputs on every form in
	   the product (settings, group create/edit, comments, admin forms).
	   Fixed at the root so every form inherits BERX fields rather than
	   patching them page by page. */
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border, rgba(255,255,255,0.12));
	color: var(--berx-text, #f2f2f2);
	border-radius: var(--berx-radius, 16px);
	padding: 12px 15px;
	height: auto;
}

.ossn-form textarea {
	resize: vertical;
}

.ossn-form input[type='number']:focus,
.ossn-form input[type='email']:focus,
.ossn-form input[type='password']:focus,
.ossn-form text:focus,
.ossn-form select:focus,
.ossn-form textarea:focus,
.ossn-form input[type='text']:focus {
	outline: none;
	border: 1px solid var(--berx-accent, #D9A93F);
	background: var(--berx-glass-3, rgba(255,255,255,0.10));
}

/* Was #dbdbdb — the same light-grey "locked box" problem as the
   username field, but applying to every readonly input site-wide. */
.ossn-form select[readonly],
.ossn-form textarea[readonly],
.ossn-form input[readonly] {
	background: rgba(255,255,255,0.02);
	color: var(--berx-text-faint, #6f6f6f);
	border-style: dashed;
	cursor: not-allowed;
}

.ossn-form input[type="file"] {
	display: block;
}

[contentEditable=true]:empty:not(:focus)::before {
	content: attr(placeholder);
	pointer-events: none;
	display: block;
}

.btn:focus,
.btn:active {
	outline: none !important;
}

.btn-link {
	font-weight: 400;
	/* legacy Bootstrap 3 blue -> BERX accent */
	color: var(--berx-accent, #D9A93F);
}

.form-control {
	height: initial;
}

.ossn-form-group-half {
	display: inline-block;
	width: calc(50% - 2px);
	float: left;
	box-sizing: border-box;
}

.radio-block-container {
	margin-bottom: 20px;
}

.ossn-form input[type='submit'] {
	margin-top: 5px;
	margin-bottom: 5px;
}

.ossn-red-borders {
	border: 1px solid #a94442 !important;
}

.fa,
.fas,
.far,
.fal,
.fad,
.fab {
	margin-right: 5px;
}

.hidden,
.ossn-hidden {
	display: none !important;
}

p {
	font-size: 15px;
}

.col-center {
	float: none;
	margin: 0 auto;
}

.container-table {
	display: table;
	width: 100%;
}

.center-row {
	display: table-cell;
	text-align: center;
}

.checkbox-block,
.radio-block {
	margin-top: 10px;
	margin-bottom: 10px;
}

.checkbox-block span,
.radio-block span {
	display: inline-block;
	margin-right: 10px;
	font-size: 15px;
	font-weight: bold;
	margin-left: 10px;
	cursor: pointer;
}

.ossn-checkbox-input {
	width: 20px;
	height: 20px;
	color: #0b769c;
	-webkit-appearance: none;
	background: none;
	border: 0;
	outline: 0;
	flex-grow: 0;
	background-color: #FFFFFF;
	transition: background 300ms;
	cursor: pointer;
	float: left;
	margin-top: 2px;
}

.checkbox-block [type=checkbox]::before {
	content: "";
	color: transparent;
	display: block;
	width: inherit;
	height: inherit;
	border-radius: inherit;
	border: 0;
	background-color: transparent;
	background-size: contain;
	box-shadow: inset 0 0 0 1px #CCD3D8;
}


.checkbox-block [type=checkbox]:checked {
	background-color: currentcolor;
}

.checkbox-block [type=checkbox]:checked::before {
	box-shadow: none;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E %3Cpath d='M15.88 8.29L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 0 0 0-1.41c-.39-.39-1.03-.39-1.42 0z' fill='%23fff'/%3E %3C/svg%3E");
}

.checkbox-block [type=checkbox]:disabled {
	background-color: #CCD3D8;
	opacity: 0.84;
	cursor: not-allowed;
}

a {
	color: #0f3b4a;
	text-decoration: none;
}


/************************************
	Layouts
************************************/
/** didn't we have a minimum page height in goblue? #702 **/

.ossn-layout-module,
.ossn-layout-contents,
.ossn-layout-media,
.ossn-layout-newsfeed {
	margin-top: 10px;
	min-height: 400px;
}

.ossn-home-container {
	z-index: 1;
	position: relative;
}

.ossn-home-container,
.ossn-layout-startup {
	min-height: 560px;
}

.ossn-home-container .ossn-page-contents {
	background: rgba(255, 255, 255, 0);
	border: 1px solid rgba(238, 238, 238, 0);
}

.ossn-layout-startup {
	min-height: 560px;
}

.ossn-layout-startup-background {
	min-height: 560px;
	background: url("<?php echo ossn_add_cache_to_url(ossn_theme_url('images/background.jpg'));?>") no-repeat;
	background-size: cover;
}

.ossn-layout-startup .col-lg-11 {
	width: 100%;
}

.ossn-layout-startup footer .ossn-footer-menu a {
	color: #fff;
}

.ossn-home-container {
	margin-top: 20px;
}

.ossn-layout-newsfeed .newsfeed-right {}

.ossn-page-container {
	overflow-x: hidden;
	min-height: 400px;
}

.ossn-layout-module {
	margin-top: 10px;
	background: #fff;
	margin-bottom: 10px;
	background-color: rgb(255, 255, 255);
	box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 2px;
	border-radius: 10px;
}

.ossn-layout-module .module-title {
	background: #F9F7F7;
	border: 1px solid #eee;
	padding: 10px;
	border-top-right-radius: 10px;
	border-top-left-radius: 10px;
}

.ossn-layout-module .module-contents {
	padding: 10px;
}

.ossn-layout-module .module-title .title {
	font-weight: bold;
	display: inline-block;
}

.ossn-layout-module .controls {
	float: right;
	display: inline-table;
}

.ossn-layout-media {
	margin-top: 10px;
}

.ossn-layout-media .like-share,
.ossn-layout-media .comments-list {
	margin-left: -10px;
	margin-right: -10px;
}

.ossn-layout-media .content,
.ossn-page-contents {
	background: #fff;
	padding: 10px;
	border: 1px solid #eee;
	border-radius: 10px;
}

.opensource-socalnetwork {
	min-height: 500px;
}

.ossn-home-container .row {
	margin-right: 10px;
	margin-left: 10px;
}

#ossn-signup-errors {
	display: none;
	margin-top: 10px;
}

.ossn-error-page {
	text-align: center;
	padding: 100px;
}

.ossn-error-page .error-heading {
	font-size: 50px;
	font-weight: bold;
}

.ossn-error-page .error-text {
	font-size: 16px;
}

.ossn-error-page .fa-exclamation-triangle {
	font-size: 100px;
}

.ossn-page-loading-annimation {
	background: #fff;
	position: fixed;
	left: 0px;
	top: 0px;
	width: 100%;
	height: 100%;
	z-index: 9999;
}

.ossn-page-loading-annimation .ossn-page-loading-annimation-inner {
	width: 24px;
	margin: 0 auto;
	margin-top: 20%;
}

.newsfeed-middle-top {
	display: none;
	background-color: #fff;
	box-shadow: inset 0 0 0 1px rgba(144, 144, 144, 0.25);
	border-radius: 3px;
	margin-top: 2px;
	margin-bottom: 4px;
	padding: 9px;
}

@media (min-width: 992px) {
	.newsfeed-col-wall {
		flex: 0 0 62.5%; 
		max-width: 62.5%;
	}
	.newsfeed-col-sidebar {
		flex: 0 0 37.5%; 
		max-width: 37.5%;
	}
}
/*******************************
	Topbar	
********************************/

.topbar {
	background: #0b769c;
	color: #fff;
	z-index: 1;
	position: fixed;
	height: 55px;
	width:100%;
	z-index: 1051;
	
	-webkit-transition: width 0.5s ease;
	-moz-transition: width 0.5s ease;
	transition: width 0.5s ease;
}

.sidebar-close-page-container .topbar,
.ossn-page-container .topbar {
	width: 100%;
}

.sidebar-open-page-container .topbar {
	width: calc(100% - var(--layout-sidebar-width)) !important;
}
.sidebar-open-page-container-no-annimation .topbar {
	transition: none !important;
	-webkit-transition: none !important;
	-moz-transition: none !important;
	width: calc(100% - var(--layout-sidebar-width)) !important;
}
/** inner page padding because of topbar fixed **/
:not(:has(.topbar.position-relative)) .ossn-inner-page {
    margin-top: 70px;
}
.topbar .fa {
	font-size: 20px;
	margin-top: 5px;
}

.topbar .site-name a {
	text-transform: uppercase;
	font-size: 20px;
	padding: 10px;
	color: #fff;
	display: block;
	font-weight: bold;
}

.topbar .site-name a:hover {
	text-decoration: none;
}

.topbar-menu-left {
	position: relative;
	z-index: 1;
}

.topbar-menu-right ul {
	margin-bottom: 0px;
}

.topbar-menu-right li,
.topbar-menu-left li {
	display: inline-block;
}

.topbar-menu-right li a:not(.topbar-menu-right li .dropdown-item),
.topbar-menu-left li a {
	padding: 13px 10px;
	display: block;
	color: #fff;
}

.topbar-menu-right li:hover,
.topbar-menu-left li:hover {
	cursor: pointer;
	background-color: #0a6586;
}

.topbar .right-side-nospace .topbar-menu-right {
	margin-right: 0px;
	-webkit-transition: all 0.5s ease;
	-moz-transition: all 0.5s ease;
	-o-transition: all 0.5s ease;
	transition: all 0.5s ease;
}

.topbar .right-side-space .topbar-menu-right {
	margin-right: 10px;
	-webkit-transition: all 0.5s ease;
	-moz-transition: all 0.5s ease;
	-o-transition: all 0.5s ease;
	transition: all 0.5s ease;
}

.topbar .ossn-icons-topbar-friends,
.topbar .ossn-icons-topbar-messages,
.topbar .ossn-icons-topbar-notification i {
	color: #0f3b4a;
}

.topbar .ossn-icons-topbar-friends-new,
.topbar .ossn-icons-topbar-messages-new,
.topbar .ossn-icons-topbar-notifications-new i {
	color: #fff;
}

.topbar .left-side {
	left: 0;
}

.topbar .right-side {
	right: 0;
}

.topbar .site-name {
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	position: absolute;
}

.topbar .site-name,
.topbar .right-side {
	position: absolute;
}

/************************************************
   Topbar Dropdown and Post+Comment menu icons
*************************************************/
/**********************************************
[B] Icons for comment edit and delete on photo view not showing #2416
***********************************************/
.ossn-comment-menu .dropdown-menu li a:before,
.ossn-topbar-dropdown-menu ul li a:before {
	content: "\f068";
	display: inline-block;
	float: left;
	margin-right: 10px;
	font-family: var(--fa-style-family, "Font Awesome 6 Free");
	font-weight: var(--fa-style, 900);
}

.menu-topbar-dropdown-administration:before {
	content: "\f085" !important;
}

.menu-topbar-dropdown-account_settings:before {
	content: "\f4fe" !important;
}

.menu-topbar-dropdown-logout:before {
	content: "\f011" !important;
}


.ossn-topbar-dropdown-menu {
	float: right;
}

.ossn-topbar-dropdown-menu ul li a,
.ossn-topbar-dropdown-menu ul li {
	display: block;
	width: 100%;
	color: #000;
}

.ossn-topbar-dropdown-menu .dropdown-menu {
	margin: 1px -120px 0;
	min-width: 200px;
}

/********************************
	Global
***********************************/

.time-created {
	font-size: 14px;
	font-style: italic;
	color: #999;
}


/********************************
	Sidebar Nav
*********************************/

.sidebar {
	background-color: #1e293b;
	;
	height: 200px;
	z-index: 1000;
	width: var(--layout-sidebar-width);
	position: fixed;
	height: 100%;
	margin-left: calc(-1 * var(--layout-sidebar-width));
	overflow-y: auto;
	overflow-x: hidden;
	color: #fff;

	scrollbar-width: thin;
	scrollbar-color: #64748b #1e293b;
}

.sidebar::-webkit-scrollbar {
	width: 8px;
}

.sidebar::-webkit-scrollbar-track {
	background: #1e293b;
}

.sidebar::-webkit-scrollbar-thumb {
	background-color: #334155;
	border-radius: 4px;
	border: 2px solid #1e293b;
}

.sidebar::-webkit-scrollbar-thumb:hover {
	background-color: #475569;
}

.sidebar a {
	color: #fff;
	font-size: 14px;
}

.sidebar a li:before {
	font-size: initial;
}

.sub-menu.collapse {
	transition: none !important;
}

.sidebar-close {
	-webkit-transition: all 0.5s ease;
	-moz-transition: all 0.5s ease;
	-o-transition: all 0.5s ease;
	transition: all 0.5s ease;
}

.sidebar-open {
	margin-left: 0px;
	-webkit-transition: all 0.5s ease;
	-moz-transition: all 0.5s ease;
	-o-transition: all 0.5s ease;
	transition: all 0.5s ease;
}

.sidebar-open-no-annimation {
	margin-left: 0px;
}

.sidebar-open-page-container {
	margin-left: var(--layout-sidebar-width);
	-webkit-transition: all 0.5s ease;
	-moz-transition: all 0.5s ease;
	-o-transition: all 0.5s ease;
	transition: all 0.5s ease;
}

.sidebar-open-page-container-no-annimation {
	margin-left: var(--layout-sidebar-width);
}

.sidebar-close-page-container {
	-webkit-transition: all 0.5s ease;
	-moz-transition: all 0.5s ease;
	-o-transition: all 0.5s ease;
	transition: all 0.5s ease;
}

.newseed-uinfo {
	display: flex;
	align-items: center;
	padding: 15px;
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 12px;
	margin: 10px;
	gap: 12px;
}

/* Small Avatar Styling */
.user-icon-small {
	width: 48px;
	height: 48px;
	border-radius: 10px;
	object-fit: cover;
}

/* Name and Links Container */
.newseed-uinfo .name {
	display: flex;
	flex-direction: column;
	justify-content: center;
}

/* User Display Name */
.newsfeed-user-info-top {
	font-size: 15px;
	font-weight: 700;
	color: #ffffff !important;
	text-decoration: none !important;
	line-height: 1.2;
	transition: color 0.2s ease;
}

.newsfeed-user-info-top:hover {
	color: #3fb1d9 !important;
}

/* Edit Profile Link */
.edit-profile {
	font-size: 11px;
	color: #64748b !important;
	/* Muted Slate */
	text-decoration: none !important;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	margin-top: 4px;
	font-weight: 600;
	transition: color 0.2s ease;
}

.edit-profile:hover {
	color: #ffffff !important;
}

.sidebar-menu-nav {
	overflow: auto;
	font-size: 13px;
	font-weight: 200;
	top: 0px;
	width: 100%;
	height: 100%;
}

.sidebar-menu-nav li:not(.sub-menu li) {
	padding: 5px;
	margin: 10px;
	cursor: pointer;

}

.sidebar-menu-nav ul {
	list-style: none;
	padding: 0px;
	margin: 0px;
}

.sub-menu.collapsing,
.sub-menu.show {
	background: #293850;
	margin: 10px;
	border-radius: 10px;
}

.sidebar .sub-menu a {
	padding: 7px;
	display: block;
}

.sidebar .sub-menu li {}

.sidebar .sidebar-parent-item-main[aria-expanded="true"] a {
	color: #000;
}

.sidebar .sidebar-parent-item-main[aria-expanded="true"] {
	background: #fff;
	padding: 10px;
	border-radius: 10px;
}

.sidebar-menu-nav ul:not(collapsed) .arrow:before,
.sidebar-menu-nav li:not(collapsed) .arrow:before {
	font-family: 'Font Awesome 5 Free';
	content: "\f078";
	display: inline-block;
	padding-left: 10px;
	padding-right: 10px;
	font-weight: 900;
	vertical-align: middle;
	float: right;
}

.sidebar .sidebar-parent-item-main[aria-expanded="true"] a .arrow:before {
	content: "\f077" !important;
}

.sidebar-menu-nav ul .sub-menu li,
.sidebar-menu-nav li .sub-menu li {
	border: none;
}

.sidebar-menu-nav ul .sub-menu li:before,
.sidebar-menu-nav li .sub-menu li:before {
	font-family: 'Font Awesome 5 Free';
	content: "\f105";
	display: inline-block;
	padding-left: 10px;
	padding-right: 10px;
	vertical-align: middle;
	font-weight: 900;
	font-size: 13px;
}

.sidebar-menu-nav li {
	padding-left: 0px;
	border-bottom: 1px solid #23282e;
}

.sidebar-menu-nav li a {
	text-decoration: none;
	color: #fff;
}

.sidebar-menu-nav li a i {
	padding-left: 10px;
	width: 20px;
	padding-right: 20px;
}

.sidebar .sub-menu a {}

.sidebar .sub-menu a:hover {
	background-color: #4f5b69;
	-webkit-transition: all 1s ease;
	-moz-transition: all 1s ease;
	-o-transition: all 1s ease;
	-ms-transition: all 1s ease;
	transition: all 1s ease;
	border-radius: 10px;
}

@media (max-width: 767px) {
	.sidebar-menu-nav {
		position: relative;
		width: 100%;
		margin-bottom: 10px;
	}
}


/******************************
	Ossn global css clsses
*******************************/

.right {
	float: right;
}

.left {
	float: left;

}

.text-right {
	text-align: right;
}

.text-left {
	text-align: left;
}

.text-center {
	text-align: center;
}

.margin-top-10 {
	margin-top: 10px;
}

.margin-top-20 {
	margin-top: 20px;
}


/************************
	Dropdown
***************************/

.dropdown-submenu {
	position: relative;
}

.dropdown-submenu>.dropdown-menu {
	top: 0;
	left: 100%;
	margin-top: -6px;
	margin-left: -1px;
	-webkit-border-radius: 0 6px 6px 6px;
	-moz-border-radius: 0 6px 6px;
	border-radius: 0 6px 6px 6px;
}

.dropdown-submenu:hover>.dropdown-menu {
	display: block;
}

.dropdown-submenu>a:after {
	display: block;
	content: " ";
	float: right;
	width: 0;
	height: 0;
	border-color: transparent;
	border-style: solid;
	border-width: 5px 0 5px 5px;
	border-left-color: #ccc;
	margin-top: 5px;
	margin-right: -10px;
}

.dropdown-submenu:hover>a:after {
	border-left-color: #fff;
}

.dropdown-submenu.pull-left {
	float: none;
}

.dropdown-submenu.pull-left>.dropdown-menu {
	left: -100%;
	margin-left: 10px;
	-webkit-border-radius: 6px 0 6px 6px;
	-moz-border-radius: 6px 0 6px 6px;
	border-radius: 6px 0 6px 6px;
}

.dropmenu-topbar-icons {
	left: inherit;
	right: 0;
}

/*****************************
	Widgets
******************************/

.ossn-widget {
	margin-bottom: 10px;
	background-color: #fff;
	border-radius: 10px;
	box-shadow: rgba(0, 0, 0, 0.2) 0px 1px 2px;
}

.ossn-widget .widget-heading {
	background: #F6F7F8;
	border: 1px solid #eee;
	padding: 10px;
	font-weight: bold;
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
}

.ossn-widget .widget-contents {
	padding: 10px;
	border-bottom: 1px solid #eee;
	border-bottom-left-radius: 10px;
	border-bottom-right-radius: 10px;
}

.ossn-privacy .radio-block {
	margin-bottom: 0;
	margin-top: 0;
	display: flex;
}

.ossn-privacy label {
	margin-bottom: 0px;
}

.ossn-privacy .radio-block span {
	font-weight: normal;
	width: 85%;
	margin-top: 7px;
}

/*****************************
	Side Menu icons
*******************************/

.menu-section-item-newsfeed:before {
	content: "\f0a1" !important;
}

.menu-section-item-friends:before {
	content: "\f0c0" !important;
}

.menu-section-item-allgroups:before {
	content: "\f0c0" !important;
}

.menu-section-item-photos:before {
	content: "\f03e" !important;
}

.menu-section-item-messages:before {
	content: "\f0e0" !important;
}

.menu-section-item-invite-friends:before {
	content: "\f234" !important;
}

.menu-section-item-addgroup:before {
	content: "\f067" !important;
}

li[class^="menu-section-item-"] {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	width: 100%;
	padding-right: 10px;
}


/******************************
	Search
******************************/

.ossn-menu-search li {
	display: block;
}

.ossn-menu-search li:hover {
	background: #F9F9F9;
}

.ossn-menu-search li a {
	display: block;
	width: 100%;
	padding: 5px;
}

.ossn-menu-search li a:hover {
	text-decoration: none;
}

.ossn-menu-search li a .text {
	display: inline-block;
}

.ossn-search-page .ossn-users-list-item {
	margin-left: 0px;
	margin-right: 0px;
}

.ossn-search-page .ossn-users-list-item .uinfo {
	margin-left: 25px;
}

.ossn-menu-search-users .text:before {
	font-family: 'Font Awesome 5 Free';
	content: "\f007";
	font-weight: 900;
	padding-right: 10px;
	vertical-align: middle;
	float: left;
}

.ossn-menu-search-groups .text:before {
	font-family: 'Font Awesome 5 Free';
	content: "\f0c0";
	font-weight: 900;
	padding-right: 10px;
	vertical-align: middle;
	float: left;
}

.ossn-menu-search-dating .text:before {
	font-family: 'Font Awesome 5 Free';
	content: "\f004";
	font-weight: 900;
	padding-right: 10px;
	vertical-align: middle;
	float: left;
}

/* Container and Form Reset */
.ossn-search {
	margin: 5px;
	padding: 0;
}

.ossn-search fieldset {
	border: none;
	padding: 0;
	margin: 0;
	position: relative;
}

/* The Search Input Field */
.ossn-search input[type="text"] {
	width: 100%;
	background: rgba(255, 255, 255, 0.05) !important;
	/* Low-opacity glass */
	border: 1px solid rgba(255, 255, 255, 0.1) !important;
	border-radius: 10px !important;
	/* Consistent with your avatar style */
	padding: 10px 15px 10px 40px !important;
	/* Extra left padding for icon */
	color: #ffffff !important;
	font-size: 14px !important;
	height: 40px !important;
	transition: all 0.3s ease;
	outline: none;
}

/* Add a Search Icon via CSS */
.ossn-search fieldset::before {
	content: "\f002";
	/* FontAwesome Search Icon */
	font-family: "FontAwesome";
	position: absolute;
	left: 15px;
	top: 50%;
	transform: translateY(-50%);
	color: #64748b;
	/* Muted slate color */
	font-size: 14px;
	pointer-events: none;
}

/* Focus State: Brand Blue Glow */
.ossn-search input[type="text"]:focus {
	background: rgba(255, 255, 255, 0.08) !important;
	border-color: #0b769c !important;
	/* Your brand blue */
	box-shadow: 0 0 0 3px rgba(11, 118, 156, 0.2);
}

/* Placeholder Color */
.ossn-search input[type="text"]::placeholder {
	color: #64748b;
	opacity: 1;
}

/******************************
	Token Input
*******************************/

ul.token-input-list {
	overflow: hidden;
	height: auto !important;
	width: 100%;
	cursor: text;
	font-size: 12px;
	min-height: 1px;
	margin: 0;
	z-index: 999;
	background-color: #fff;
	list-style-type: none;
	clear: left;
	color: #2B5470;
	border-top: 1px dashed #EEE;
	border-right: 1px solid #EEE;
	border-left: 1px solid #EEE;
	border-bottom: 1px solid #eee;
	padding: 5px 0 0;
	border-radius: 10px;
}

li.token-input-token {
	overflow: hidden;
	height: auto !important;
	height: 15px;
	margin: 3px;
	padding: 1px 3px;
	background-color: #eff2f7;
	color: #2B5470;
	cursor: default;
	font-weight: bold;
	border: 1px solid #ccd5e4;
	font-size: 11px;
	border-radius: 5px;
	-moz-border-radius: 5px;
	-webkit-border-radius: 5px;
	float: left;
	white-space: nowrap;
}

li.token-input-token p {
	display: inline;
	padding: 0;
	margin: 0;
	font-size: 12px;
}

li.token-input-token span {
	color: #a6b3cf;
	margin-left: 5px;
	font-weight: bold;
	cursor: pointer;
}

li.token-input-selected-token {
	background-color: #F9F9F9;
	border: 1px solid #eee;
	color: #2B5470;
	font-weight: bold;
}

li.token-input-input-token {
	margin: 0;
	padding: 0;
	list-style-type: none;
}

div.token-input-dropdown {
	position: absolute;
	width: 400px;
	background-color: #fff;
	overflow: hidden;
	border-left: 1px solid #ccc;
	border-right: 1px solid #ccc;
	border-bottom: 1px solid #ccc;
	cursor: default;
	font-size: 11px;
	z-index: 1;
}

div.token-input-dropdown p {
	margin: 0;
	padding: 5px;
}

div.token-input-dropdown ul {
	margin: 0;
	padding: 0;
}

div.token-input-dropdown ul li {
	background-color: #fff;
	padding: 3px;
	margin: 0;
	list-style-type: none;
}

div.token-input-dropdown ul li.token-input-dropdown-item {
	background-color: #fff;
}

div.token-input-dropdown ul li.token-input-dropdown-item2 {
	background-color: #fff;
}

div.token-input-dropdown ul li em {
	font-weight: bold;
	font-style: normal;
}

div.token-input-dropdown ul li.token-input-selected-dropdown-item {
	background-color: #F9F9F9;
	color: #2B5470;
	font-weight: bold;
}

/*************************************
	0ssn modal box
***************************************/

.ossn-halt {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	z-index: 10000;
	background-color: #c4c4c487;
	cursor: auto;
	height: 100%;
	display: none;
}

.ossn-light {}

.ossn-viewer {
	width: 940px;
	margin: 0 auto;
	position: relative;
}

.ossn-viewer .ossn-container {
	height: 200px;
	position: fixed;
	width: 900px;
	z-index: 10000;
	margin-top: 70px;
	min-height: 515px;
}

.ossn-viewer-loding {
	font-size: 15px;
}

.ossn-viewer .ossn-container .close-viewer {
	float: right;
	cursor: pointer;
	margin-right: 5px;
	font-weight: bold;
	font-size: 13px;
	color: #ccc;
}

.ossn-container tbody {
	background: #000;
}

.ossn-viewer .info-block {
	background: #fff;
	height: 100%;
	width: 325px;
	float: right;
	margin-left: -3px;
}

.image-block img {
	max-width: 700px;
}

.ossn-message-box {
	width: 470px;
	min-height: 96px;
	background: #fff;
	border-radius: 10px;
	border: none;
	position: fixed;
	top: 0px;
	left: 0px;
	right: 0px;
	margin-left: auto;
	margin-right: auto;
	z-index: 60000;
	margin-top: 100px;
	display: none;
	background-clip: padding-box;
	box-shadow: 0 2px 26px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.ossn-message-box .close-box {
	float: right;
	color: #ccc;
	cursor: pointer;
}

.ossn-message-box .title {
	background: #F5F6F7;
	padding: 11px;
	border-top-right-radius: 10px;
	border-top-left-radius: 10px;
	border-bottom: 1px solid #E5E5E5;
	color: #5E5656;
	font-size: 14px;
	font-weight: bold;
}

.ossn-message-box .contents {
	padding: 10px;
	min-height: 150px;
	max-height: 420px;
	overflow-x: auto;
	overflow: overlay;
	overflow-x: hidden;
}

.ossn-message-box .control {
	height: 45px;
	padding: 10px;
	border-top: 1px solid #E9EAED;
	background: #F5F6F7;
	border-bottom-right-radius: 10px;
	border-bottom-left-radius: 10px;
}

.ossn-message-box .control .controls {
	float: right;
}

.ossn-message-box .control .controls .btn {
	padding: 2px 13px;
	border-radius: 5px;
}

.ossn-message-box .contents input[type='text'] {
	border: 1px solid #EEE;
	width: 292px;
	padding: 7px;
}

.ossn-message-box .contents input[type='text'],
.ossn-message-box .contents label {
	display: inline-table;
}

.ossn-message-box .contents label {
	color: #666;
	font-weight: bold;
	margin-right: 13px;
}

.ossn-form input[type=checkbox],
.ossn-form input[type=radio] {
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	display: inline-block;
	position: relative;
	background-color: #ececec;
	color: #666;
	top: 5px;
	height: 20px;
	width: 20px;
	border: 0;
	border-radius: 50px;
	cursor: pointer;
	outline: none;
	flex-grow: 0;
	transition: background 300ms;
}

.ossn-form input[type=checkbox] {
	border-radius: 2px;
}

.ossn-form input[type=checkbox]:checked::before {
	font: 9px/1 'Open Sans', sans-serif;
	left: 7px;
	top: 5px;
	content: '\02143';
}

.ossn-form input[type=radio]:checked::before {
	position: absolute;
	font: 9px/1 'Open Sans', sans-serif;
	left: 7px;
	top: 5px;
	content: '\02143';
	transform: rotate(40deg);
}

.ossn-form input[type=checkbox]:hover,
.ossn-form input[type=radio]:hover {
	background-color: #f7f7f7;
}

.ossn-form input[type=checkbox]:checked,
.ossn-form input[type=radio]:checked {
	background-color: #0b769c;
	color: #fff;
	font-weight: bold;
}

.checkbox-block span {
	margin-top: 6px;
}

.checkbox-block-container {
	margin-bottom: 20px;
}

#ossn-home-signup .checkbox-block {
	margin-top: 0;
	margin-bottom: 0;
}

/*******************************
	Ossn Blocked
*********************************/

.ossn-blocked i {
	font-size: 100px;
}

.ossn-blocked {
	text-align: center;
	padding: 100px;
}

.ossn-blocked div {
	font-size: 50px;
	font-weight: bold;
}

.ossn-blocked p {
	font-size: 16px;
}


/********************************
	Loading Icon
    @source: https://github.com/jlong/css-spinners
*********************************/

@-moz-keyframes three-quarters-loader {
	0% {
		-moz-transform: rotate(0deg);
		transform: rotate(0deg);
	}

	100% {
		-moz-transform: rotate(360deg);
		transform: rotate(360deg);
	}
}

@-webkit-keyframes three-quarters-loader {
	0% {
		-webkit-transform: rotate(0deg);
		transform: rotate(0deg);
	}

	100% {
		-webkit-transform: rotate(360deg);
		transform: rotate(360deg);
	}
}

@keyframes three-quarters-loader {
	0% {
		-moz-transform: rotate(0deg);
		-ms-transform: rotate(0deg);
		-webkit-transform: rotate(0deg);
		transform: rotate(0deg);
	}

	100% {
		-moz-transform: rotate(360deg);
		-ms-transform: rotate(360deg);
		-webkit-transform: rotate(360deg);
		transform: rotate(360deg);
	}
}


/* :not(:required) hides this rule from IE9 and below */

.ossn-loading:not(:required) {
	-moz-animation: three-quarters-loader 1250ms infinite linear;
	-webkit-animation: three-quarters-loader 1250ms infinite linear;
	animation: three-quarters-loader 1250ms infinite linear;
	border: 8px solid #38e;
	border-right-color: transparent;
	border-radius: 16px;
	box-sizing: border-box;
	position: relative;
	overflow: hidden;
	text-indent: -9999px;
	width: 24px;
	height: 24px;
}


.ossn-box-loading {
	margin-left: 216px;
	margin-top: 37px;
}


/*******************************
	Buttons
*********************************/

.button-grey,
.btn-action {
	color: #333;
	font-weight: bold;
	width: auto;
	margin: 0;
	font-size: 12px;
	line-height: 16px;
	padding: 5px 6px;
	cursor: pointer;
	outline: none;
	text-align: center;
	white-space: nowrap;
	-webkit-box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 #FFF;
	-moz-box-shadow: 0 1px 0 rgba(0, 0, 0, 0.10), inset 0 1px 0 #fff;
	box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 #FFF;
	border: 1px solid #ccc;
	background: -webkit-gradient(linear, 0 0, 0 100%, from(#F5F6F6), to(#E4E4E3));
	background: -moz-linear-gradient(#f5f6f6, #e4e4e3);
	background: -o-linear-gradient(#f5f6f6, #e4e4e3);
	background: linear-gradient(#F5F6F6, #E4E4E3);
	border-radius: 4px;
	text-decoration: none;
}

.button-grey:hover,
.btn-action:hover {
	text-decoration: none;
	background: -webkit-gradient(linear, 0 0, 0 100%, from(#E4E4E3), to(#F5F6F6));
	background: -moz-linear-gradient(#E4E4E3, #F5F6F6);
	background: -o-linear-gradient(#E4E4E3, #F5F6F6);
	background: linear-gradient(#E4E4E3, #F5F6F6);
}


/******************************
	Users List
*******************************/

.ossn-users-list-item .users-list-controls {
	margin-top: 20px;
}

.ossn-users-list-item .users-list-controls a {
	margin-left: 5px;
}

.ossn-users-list-item {
	border: 1px solid #E9EAED;
	margin-bottom: 10px;
	margin-right: -10px;
	margin-left: -10px;
}

.ossn-users-list-item .uinfo a {
	font-size: 14px;
	font-weight: bold;
	margin-top: 20px;
	float: left;
	text-overflow: ellipsis;
	max-width: 300px;
	white-space: nowrap;
	overflow: hidden;
}

.ossn-users-list-item .col-lg-2 {
	text-align: center;
}


/*********************************
	Footer
**********************************/

footer {
	margin-top: 20px;
	padding-top: 5px;
	position: relative;
}

footer {
	border-top: 1px solid #d2d2d2;
}

footer .container {}

footer .ossn-footer-menu {
	padding-bottom: 10px;
}

footer .ossn-footer-menu a {
	color: #807D7D;
	font-size: 13px;
}

footer .ossn-footer-menu a::after {
	content: "|";
	margin-left: 10px;
	margin-right: 10px;
}

footer .ossn-footer-menu a:nth-last-child(2)::after,
footer .ossn-footer-menu a:last-child::after {
	content: "";
}

.menu-footer-powered {
	float: right;
}

.menu-footer-powered:after {
	display: none;
}

.menu-footer-a_copyrights {
	text-transform: uppercase;
}


/****************************
	Home
****************************/

.home-left-contents {}

.home-left-contents .logo {
	text-align: center;
}

.home-left-contents .description {
	font-size: 17px;
	text-transform: uppercase;
	font-weight: bold;
	margin-top: 20px;
	text-align: justify;
	color: #fff;
}

.home-left-contents .buttons {
	text-align: center;
	margin-top: 10px;
}

#ossn-home-signup p {
	margin-top: 10px;
}

#ossn-home-signup .radio-block {
	margin-top: 0;
	margin-bottom: 0;
}

#ossn-home-signup .ossn-form-group-half:last-child {
	float: right;
}

#ossn-home-signup .form-group {
	margin-bottom: 0px;
}


/**************************
	System
***************************/

.ossn-list-users {
	height: 60px;
	border-bottom: 1px solid #E9EAED;
	display: block;
	margin-left: 5px;
	margin-bottom: 10px;
}

.ossn-list-users img,
.ossn-list-users .uinfo {
	display: inline-block;
}

.ossn-list-users .uinfo .userlink {
	font-size: 14px;
	font-weight: bold;
	float: right;
	margin-left: 12px;
	text-overflow: ellipsis;
	width: 370px;
	white-space: nowrap;
	overflow: hidden;
}

.ossn-list-users .friendlink {
	float: right;
	margin-top: 10px;
	margin-right: 9px;
	text-overflow: ellipsis;
	width: 280px;
	white-space: nowrap;
	overflow: hidden;
}

.sidebar-menu-nav .sidebar-menu .menu-content {
	display: block;
}

.landing-page-icons {
	color: #fff;
	text-align: center;
	margin-top: 30px;
}

.landing-page-icons-span {
	border: 3px solid;
	border-radius: 50px;
	display: inline-block;
	width: 90px;
	text-align: center;
	padding-top: 20px;
	padding-bottom: 20px;
	margin: 10px;
}

.landing-page-icons-span .fa {
	margin-right: 0px;
}


/**************************
	Similies
**************************/

.ossn-smiley-item {
	display: inline-block !important;
	margin-left: 2px;
	margin-right: 2px;
	width: initial !important;
	margin-bottom: 0px !important;
	margin-top: 0px !important;
	border: 0px !important;
}


/**************************
	Embed
 **************************/

.ossn_embed_video {
	margin-top: 10px;
	margin-bottom: 10px;
	padding-top: 0px;
}


/**************************
	Photos
***************************/

.ossn-photo-viewer .image-block img,
.ossn-photo-viewer {
	max-width: 100% !important;
}

.ui-draggable {
	opacity: 0.7;
}


/**************************
	Mobile Layout Settings
***************************/

@media (max-width: 480px) {
	.ossn-list-users .uinfo .userlink {
		text-overflow: ellipsis;
		width: 195px;
		white-space: nowrap;
		overflow: hidden;
	}

	.ossn-list-users a.right.btn.btn-primary {
		display: none;
	}

	.ossn-list-users a.right.btn.btn-danger {
		display: none;
	}

	.ossn-message-box .contents {
		height: 280px;
		overflow-x: auto;
		overflow: overlay;
	}

	/*****************************
     	System
     *****************************/
	.ossn-users-list-item img {
		display: none;
	}

	.ossn-users-list-item .users-list-controls {
		margin-top: 10px;
		margin-bottom: 10px;
	}

	.ossn-users-list-item .uinfo a {
		margin-top: 10px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 90px;
	}

	.ossn-search-page .ossn-users-list-item .uinfo a {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100px;
	}

	.ossn-users-list-item {
		padding-bottom: 10px;
	}

	.ossn-widget .widget-contents {
		padding: 5px;
	}

	.ossn-message-box {
		min-width: 300px;
		width: 300px;
	}

	.ossn-box-loading {
		margin-left: 0;
		margin-top: 0;
		margin: 40px auto;
	}

	.ossn-message-box .contents input[type="text"] {
		width: 195px;
	}

	footer .ossn-footer-menu a:nth-last-child(2)::after {
		content: "|";
	}

	.sidebar-menu-nav .sidebar-menu .menu-content {
		display: block;
	}

	.sidebar-hide-contents-xs {
		display: none !important;
	}

	.home-left-contents .landing-page-icons {
		display: none;
	}

	/**************************
     	Layouts
     ****************************/
	.newsfeed-right {
		display: none;
	}

	.newsfeed-middle-top {
		display: block;
	}

	/*************************
     	Home Page
     **************************/
	.logo img {
		width: 260px;
	}

	.home-left-contents .description {
		font-size: 16px;
	}

	.home-left-contents {
		margin-bottom: 20px;
	}

	.dropdown-menu {
		margin-left: -110px;
	}

	.menu-footer-powered {
		float: none;
	}
}


/***************************************
	Tablets
****************************************/

@media only screen and (max-width: 992px) {
	.dropdown-menu {
		margin-left: -110px;
	}


	/**************************
     	Layouts
     ****************************/
	.newsfeed-right {
		display: none;
	}

	.newsfeed-middle-top {
		display: block;
	}

	.sidebar-menu-nav .sidebar-menu .menu-content {
		display: block;
	}
}

@media only screen and (max-width: 1199px) {
	.ossn-search-page .ossn-users-list-item .uinfo {
		margin-left: 35px;
	}

	.ossn-search-page .ossn-users-list-item .uinfo a {
		text-overflow: ellipsis;
		max-width: 200px;
		white-space: nowrap;
		overflow: hidden;
	}

	.ossn-users-list-item .users-list-controls {
		margin-bottom: 10px;
	}
}

@media only screen and (max-width: 767px) {
	.ossn-search-page .ossn-users-list-item .uinfo {
		margin-left: 0;
	}
}


/*****************************************************
		Adding icons for some 3rd party components
******************************************************/

.sidebar-menu-nav ul .sub-menu li:before {
	font-family: 'Font Awesome 5 Free';
	display: inline-block;
	padding-left: 10px;
	padding-right: 10px;
	vertical-align: middle;
	width: 35px;
	float: left;
}

.btn-close {
	background-size: .7em;
}

.img-responsive {
	display: block;
	max-width: 100%;
	height: auto;
}

/*************************
	3.x buttons styles
***************************/
.btn-close:focus {
	box-shadow: none;
}

.btn-warning {
	color: #fff;
}

.btn-primary {
	background-color: #2a87a7;
	border-color: #2e6da4;
}

.btn-primary:hover {
	color: #fff;
	background-color: #286090;
	border-color: #204d74;
}

.btn-primary:focus,
.btn-primary.focus {
	color: #fff;
	background-color: #286090;
	border-color: #122b40;
}

.btn-check:checked+.btn-primary:focus,
.btn-check:active+.btn-primary:focus,
.btn-primary:active:focus,
.btn-primary.active:focus,
.show>.btn-primary.dropdown-toggle:focus {
	box-shadow: none;
}

.btn:focus {
	box-shadow: none;
}

.btn-warning {
	color: #fff;
	background-color: #f0ad4e;
	border-color: #eea236;
}

.btn-warning:active {
	color: #fff;
}

.btn-warning:focus,
.btn-warning.focus {
	color: #fff;
	background-color: #ec971f;
	border-color: #985f0d;
}

.btn-default {
	color: #333;
	background-color: #fff;
	border-color: #ccc;
}

.btn-default:focus,
.btn-default.focus {
	color: #333;
	background-color: #e6e6e6;
	border-color: #8c8c8c;
}

.btn-default:hover {
	color: #333;
	background-color: #e6e6e6;
	border-color: #adadad;
}

.btn-default:active,
.btn-default.active,
.open>.dropdown-toggle.btn-default {
	color: #333;
	background-color: #e6e6e6;
	border-color: #adadad;
}

.pagination {}

.dropdown-item.active,
.dropdown-item:active {
	color: #212529;
	background-color: #e9ecef;
}

.page-item.active .page-link {
	background-color: #337ab7;
	border-color: #337ab7;
}

.page-link {
	color: #337ab7;
}

.page-link:hover {
	color: #23527c;
	background-color: #eee;
	border-color: #ddd;
}

label {
	display: inline-block;
	max-width: 100%;
	margin-bottom: 5px;
	font-weight: 700;
}

.dropdown-menu {
	box-shadow: 0 12px 28px 0 rgba(0, 0, 0, 0.20), 0 2px 4px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}

/*****************************
	Startup Layout Ossn 9.0
******************************/
.ossn-startup-wrapper {
	position: relative;
	background: #f8f8f8;
	min-height: 100vh;
	overflow: hidden;
	display: flex;
	align-items: center;
}

.ossn-startup-wrapper .blob-container {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 0;
}

.ossn-startup-wrapper .blob {
	position: absolute;
	width: 600px;
	height: 600px;
	/* Was a hardcoded indigo/violet gradient predating the accent —
	   tracks the live accent token now, same as everywhere else. */
	background: linear-gradient(135deg, var(--berx-accent-soft, rgba(217, 169, 63,0.4)) 0%, rgba(122, 90, 22, 0.4) 100%);
	filter: blur(70px);
	border-radius: 43% 57% 70% 30% / 30% 45% 55% 70%;
}

.ossn-startup-wrapper .blob-1 {
	top: -10%;
	left: -10%;
	background: var(--berx-accent-soft, rgba(217, 169, 63,0.2));
}

.ossn-startup-wrapper .blob-2 {
	bottom: -10%;
	right: -5%;
	background: rgba(255, 126, 179, 0.15);
}

.ossn-startup-wrapper .blob-3 {
	top: 20%;
	right: 20%;
	width: 300px;
	height: 300px;
	background: rgba(130, 255, 160, 0.1);
}

.ossn-startup-wrapper .blob-4 {
	bottom: 10%;
	left: 20%;
	width: 400px;
	height: 400px;
	background: rgba(0, 210, 255, 0.1);
}

/* Glass Branding Box */
.ossn-startup-wrapper .brand-glass-box {
	display: inline-block;
	padding: 15px 25px;
	background: #fff;
	backdrop-filter: blur(5px);
	border-radius: 15px;
	border: 1px solid rgba(255, 255, 255, 0.5);
}

.ossn-startup-wrapper .main-logo {
	max-width: 180px;
}

.ossn-startup-wrapper .signup-title span {
	font-size: 14px;
	text-transform: uppercase;
	letter-spacing: 1px;
	display: block;
	margin-bottom: 10px;
}

/* Pill styles */
.ossn-startup-wrapper .feature-pills-modern {
	display: flex;
	gap: 10px;
	margin-top: 25px;
}

.ossn-startup-wrapper .feature-tag,
.ossn-startup-wrapper .pill {
	display: inline-flex;
	align-items: center;
	padding: 8px 18px;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 50px;
	font-size: 13px;
	font-weight: 600;
	color: #475569;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	margin-right: 10px;
	margin-bottom: 10px;
	transition: transform 0.2s ease, border-color 0.2s ease;
}

/* Hover effect */
.ossn-startup-wrapper .feature-tag:hover,
.ossn-startup-wrapper .pill:hover {
	transform: translateY(-2px);
	border-color: #cbd5e1;
	background: #fdfdff;
}

/* Icon inside the pill */
.ossn-startup-wrapper .feature-tag i,
.ossn-startup-wrapper .pill i {
	margin-right: 8px;
	color: #0b769c;
	font-size: 14px;
}

/* Background & Hero */
.ossn-startup-wrapper .ossn-modern-landing {
	background: #f8fafc;
	min-height: 100vh;
	position: relative;
	overflow: hidden;
	padding: 50px 0;
}

.ossn-startup-wrapper .bg-blob,
.ossn-startup-wrapper .bg-blob-2 {
	position: absolute;
	width: 400px;
	height: 400px;
	/* Was #667eea/#764ba2 — the same discarded indigo/violet pairing. */
	background: linear-gradient(135deg, var(--berx-accent, #D9A93F) 0%, #7A5A16 100%);
	filter: blur(80px);
	opacity: 0.15;
	z-index: 0;
	border-radius: 50%;
}

.ossn-startup-wrapper .bg-blob {
	top: -100px;
	right: -50px;
}

.ossn-startup-wrapper .bg-blob-2 {
	bottom: -100px;
	left: -50px;
}

.ossn-startup-wrapper .hero-logo {
	max-width: 200px;
	margin-bottom: 25px;
}

.ossn-startup-wrapper .hero-tagline {
	font-size: 2.5rem;
	font-weight: 700;
	color: #2d3748;
	margin-bottom: 30px;
}

.ossn-startup-wrapper .feature-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 15px;
	margin-bottom: 30px;
}

.ossn-startup-wrapper .feature-item {
	font-size: 1rem;
	color: #4a5568;
}

.ossn-startup-wrapper .feature-item i {
	color: var(--berx-accent, #D9A93F);
	margin-right: 8px;
}

.ossn-startup-wrapper .glass-signup-card {
	background: #fff;
	color: #fff;
	backdrop-filter: blur(25px);
	-webkit-backdrop-filter: blur(25px);
	padding: 45px;
	border-radius: 30px;
	border: 1px solid rgba(255, 255, 255, 0.4);
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
	z-index: 2;
	position: relative;
	overflow: hidden;
}

/* Inner glow */
.ossn-startup-wrapper .glass-signup-card::after {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	border-radius: 30px;
	pointer-events: none;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%);
	z-index: -1;
}

.ossn-startup-wrapper .signup-title h2 {
	font-weight: 800;
	margin-bottom: 0px;
	text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

/* Inline Form Logic */
.ossn-startup-wrapper .custom-row {
	display: flex;
	flex-wrap: wrap;
	gap: 15px;
}

.ossn-startup-wrapper .custom-col {
	flex: 1;
	min-width: 0;
}

.ossn-startup-wrapper .modern-field:focus {
	background: #fff !important;
	border-color: var(--berx-accent, #D9A93F) !important;
	box-shadow: 0 4px 12px var(--berx-accent-soft, rgba(217, 169, 63,0.1)) !important;
}

.ossn-startup-wrapper .terms-text {
	font-size: 14px;
	color: #fff;
	margin-top: 15px;
}

.topbar::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background:
		radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
		radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
	pointer-events: none;
}

.ossn-startup-wrapper .glass-signup-card:before {
	content: "";
	position: absolute;
	inset: 0;
	background-size: cover;
	z-index: -2;
	background: url("<?php echo ossn_theme_url();?>images/background.jpg") no-repeat;
	background-size: cover;
}

.ossn-startup-wrapper .glass-signup-card:after {
	content: "";
	position: absolute;
	inset: 0;
	z-index: -1;
	border-radius: 24px;
	background: linear-gradient(to bottom, rgba(255, 255, 255, 0) -2%, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.4) 90%);
}

.ossn-startup-wrapper #ossn-home-signup a {
	color: #fff;
	font-weight: bold;
}

.ossn-startup-wrapper #ossn-home-signup .ossn-red-borders {
	border: 2px solid #ff4d4d !important;
}

#ossn-home-signup .ossn-required {
	color: rgb(255 143 142);
}

#ossn-submit-button {
	width: 100%;
	padding: 15px;
	border-radius: 10px;

	/* Intentional: a solid white pill CTA against the dark glass auth
	   card. Kept — this is a premium button choice, not a leftover
	   light surface. Only the TEXT colour was stale: #0b769c was a
	   blue tone from an earlier accent, unrelated to any of orange,
	   cyan, or the current gold accent. Now tracks the live token so
	   the button follows the accent automatically. */
	background: #ffffff;
	color: var(--berx-accent, #D9A93F);

	font-weight: 700;
	letter-spacing: 0.5px;
	margin-top: 20px;
	cursor: pointer;
	transition: all 0.3s ease;

	/* Subtle shadow to prevent it from blending into the glass */
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	border-color: transparent;
}

/* Hover State: Inverts the colors for a high-end feel */
#ossn-submit-button:hover {
	background: #e7e7e7;
	color: #000;
	/* Was rgba(102,126,234,0.3) — an indigo/violet glow left over from
	   the discarded "Electric Violet" brief, never matching any accent
	   BERX actually shipped (orange, then cyan, now gold). Rebuilt
	   from the live accent token so the glow always matches the
	   current accent. */
	box-shadow: 0 6px 15px rgba(217, 169, 63, 0.3);
	transform: translateY(-1px);
}

/* Active State: Click effect */
#ossn-submit-button:active {
	transform: translateY(0);
}

.ossn-login input[type="submit"] {
	width: 100%;
	margin-bottom: 10px;
	display: block;
	padding: 15px;
	border-radius: 10px;
	font-weight: 700;
	letter-spacing: 0.5px;
	margin-top: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	border-color: transparent;
}

.ossn-login .glass-signup-card:before {
	display: none;
}

.ossn-login {
	color: #fff;
}

/* The Floating Icon Badge */
.ossn-login .login-icon-badge {
	background: linear-gradient(135deg, #0b769c 0%, #085e7d 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 70px;
	height: 70px;
	background: #0b769c;
	color: #fff;
	font-size: 24px;
	box-shadow: 0 8px 20px rgba(11, 118, 156, 0.2);
	border: 4px solid #fff;
	margin: 0 auto;
}

.ossn-login .ossn-startup-wrapper .glass-signup-card .login-card-custom,
.ossn-login .login-card-custom {
	color: #000 !important;
}

.ossn-login .login-card-custom:before {
	display: none;
}

/* Add a subtle animation to the icon */
.ossn-login .login-icon-badge i {
	animation: pulse-soft 3s infinite;
}

@keyframes pulse-soft {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.05);
	}

	100% {
		transform: scale(1);
	}
}


/* Title Decoration */
.ossn-login .header-line {
	width: 40px;
	height: 4px;
	background: #0b769c;
	margin: 8px auto;
	border-radius: 10px;
}

/* Links Styling */
.ossn-login .forgot-link {
	color: #0b769c;
	text-decoration: none;
	transition: color 0.2s;
}

.ossn-login .forgot-link:hover {
	color: #0b769c;
}

.ossn-login .signup-link-text {
	color: #0b769c;
	font-weight: 700;
	text-decoration: none;
	margin-left: 5px;
}

/* Styling the custom button */
.ossn-topbar-login-btn {
	/* Position it to the right */
	float: right;
	margin-top: 5px;

	/* Modern Glass Style */
	background: rgba(255, 255, 255, 0.15) !important;
	backdrop-filter: blur(5px);
	-webkit-backdrop-filter: blur(5px);
	border: 1px solid rgba(255, 255, 255, 0.3) !important;
	color: #ffffff !important;

	/* Shape & Typography */
	padding: 6px 20px !important;
	border-radius: 8px !important;
	font-weight: 600 !important;
	font-size: 14px;
	transition: all 0.3s ease-in-out !important;
	margin: 10px;
}

/* Hover effect: Smooth transition to solid white */
.ossn-topbar-login-btn:hover {
	background: #ffffff !important;
	color: #0b769c !important;
	/* Brand blue from your topbar */
	transform: translateY(-1px);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Active/Click effect */
.ossn-topbar-login-btn:active {
	transform: translateY(0);
}

/* Tier 1: Tablets and Phones (Standard stacking) */
@media (max-width: 768px) {
	.custom-row {
		display: block !important;
	}

	.custom-col {
		width: 100% !important;
		display: block;
		margin-bottom: 2px;
	}
}

/* Tier 2: Extra Small Devices (XS - 480px and below) */
@media (max-width: 480px) {

	/* Reduce card padding so the inputs have more room to breathe */
	.glass-signup-card {
		padding: 20px 15px !important;
	}
}

/******************************
	Output/users
*****************************/
/* Was hardcoded blue/red on plain rgba() values — a pre-BERX leftover
   that, by CSS specificity, silently overrode the tokenized accent
   styling components/OssnSearch/.../search.php ships for this exact
   list. `.ossn-output-users-list` renders on Search, Friends, Group
   members and Invite — so the mismatch wasn't Search-only, it could
   surface anywhere this list appears. Rebuilt on shared --berx-*
   tokens so every page agrees, and the avatar reads as a real photo
   (rounded-square portrait crop) rather than a small round icon,
   matching the Discover person cards this list sits next to in the
   product. Class names unchanged — CSS-only fix, no markup risk. */
.ossn-output-users-list .user-item-card {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	border-radius: var(--berx-radius, 16px);
	margin-bottom: var(--berx-space-3, 12px);
	padding: var(--berx-space-3, 12px) var(--berx-space-4, 16px);
	transition: transform 200ms var(--berx-ease, ease), border-color 200ms var(--berx-ease, ease);
	-webkit-backdrop-filter: blur(var(--berx-blur-md, 16px));
	backdrop-filter: blur(var(--berx-blur-md, 16px));
	box-shadow: none;
}
.ossn-output-users-list .user-item-card:hover {
	transform: translateY(-2px);
	border-color: var(--berx-border-strong, rgba(255,255,255,0.16));
}

.ossn-output-users-list .user-item-inner {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--berx-space-4, 16px);
}

/* Avatar Styling — portrait crop, same language as Discover's person
   cards, instead of the old small square thumbnail. */
.ossn-output-users-list .user-avatar-container img {
	width: 56px;
	height: 56px;
	border-radius: var(--berx-radius-sm, 10px);
	object-fit: cover;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

/* Grouping Name and Avatar */
.ossn-output-users-list .user-info-box {
	display: flex;
	align-items: center;
	gap: var(--berx-space-3, 12px);
	min-width: 0;
}

.ossn-output-users-list .user-name-text {
	font-weight: 700;
	font-size: var(--berx-text-body, 15px);
	color: var(--berx-white, #fff);
}

.ossn-output-users-list .user-username-sub {
	font-size: var(--berx-text-micro, 11px);
	margin-top: 2px;
	color: var(--berx-text-faint, rgba(245,245,247,0.38));
}

/* Control Buttons */
.ossn-output-users-list .ossn-action-btn {
	display: inline-flex;
	align-items: center;
	gap: var(--berx-space-2, 8px);
	padding: 7px 16px;
	border-radius: var(--berx-radius-pill, 999px);
	font-size: var(--berx-text-caption, 13px);
	font-weight: 600;
	text-decoration: none !important;
	white-space: nowrap;
	border: 1px solid var(--berx-border, rgba(255,255,255,0.12));
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	color: var(--berx-text, #f2f2f2) !important;
	transition: background-color 150ms var(--berx-ease, ease), border-color 150ms var(--berx-ease, ease), color 150ms var(--berx-ease, ease);
}

/* Primary action (Add friend, etc.) — the one BERX accent (gold). */
.ossn-output-users-list .btn-primary-outline {
	background: var(--berx-accent-soft, rgba(217, 169, 63,0.16));
	color: var(--berx-accent, #D9A93F) !important;
	border: 1px solid rgba(217, 169, 63,0.35);
}

.ossn-output-users-list .btn-primary-outline:hover {
	background: var(--berx-accent, #D9A93F);
	color: #050505 !important;
	border-color: var(--berx-accent, #D9A93F);
}

/* Danger action (Remove/Cancel) — kept semantically red per the
   design system's own --berx-danger token, not an arbitrary red. */
.ossn-output-users-list .btn-danger-outline {
	background: rgba(255,77,79,0.12);
	color: var(--berx-danger, #ff4d4f) !important;
	border: 1px solid rgba(255,77,79,0.32);
}

.ossn-output-users-list .btn-danger-outline:hover {
	background: var(--berx-danger, #ff4d4f);
	color: #050505 !important;
	border-color: var(--berx-danger, #ff4d4f);
}

/* Small Device Adjustments */
@media (max-width: 480px) {
	.ossn-output-users-list .user-item-inner {
		justify-content: center;
		text-align: center;
	}

	.ossn-output-users-list .user-info-box {
		flex-direction: column;
		width: 100%;
	}

	.ossn-output-users-list .user-controls-box {
		width: 100%;
	}

	.ossn-output-users-list .ossn-action-btn {
		width: 100%;
		justify-content: center;
	}
}

@media (prefers-reduced-motion: reduce) {
	.ossn-output-users-list .user-item-card { transition: none !important; }
	.ossn-output-users-list .user-item-card:hover { transform: none; }
}
/* ============================================================
   BERX PREMIUM GLASS DESIGN SYSTEM
   Layered on top of the OSSN structural/layout CSS above.
   Deep black base + three translucent glass elevations + a single
   gold accent. Same token model as the (parked) Node/React build —
   surface1/2/3, three blur steps, one shared easing curve — so the
   two front-ends read as one product if either is ever revived.
   ============================================================ */
:root {
	--berx-black: #050505;
	--berx-bg: #050505;
	--berx-graphite: #111113;

	--berx-glass-1: rgba(255,255,255,0.04);
	--berx-glass-2: rgba(255,255,255,0.07);
	--berx-glass-3: rgba(255,255,255,0.10);
	--berx-surface: var(--berx-glass-2);
	--berx-surface-2: var(--berx-glass-3);
	--berx-border: rgba(255,255,255,0.10);
	--berx-border-soft: rgba(255,255,255,0.08);
	--berx-border-strong: rgba(255,255,255,0.16);

	--berx-white: #ffffff;
	--berx-text: #f5f5f7;
	--berx-text-dim: rgba(245,245,247,0.64);
	--berx-text-faint: rgba(245,245,247,0.38);

	/* BERX accent — RETIRED cyan #4fd6e8, now a warm gold #D9A93F. See
	   BERX_DECISIONS.md: cyan is explicitly retired (not a third
	   repaint of the same rejected hue families — this is neither the
	   earlier-rejected pure orange #ff6a00 nor the earlier-rejected
	   violet #8b5cf6, a distinct warm-gold/brass hue chosen so it
	   isn't read as "back to orange"). Variable names kept as
	   --berx-accent-* — renaming ~40 usages across 11 files is a
	   bigger, separate change; the visible color is what matters.
	   The --berx-orange-* aliases below predate even the cyan repaint
	   (from when this token briefly held an orange value) — kept as
	   back-compat for any component CSS or third-party override not
	   yet migrated to --berx-accent-* directly. */
	--berx-accent: #D9A93F;
	--berx-accent-hover: #EABD5C;
	--berx-accent-soft: rgba(217, 169, 63, 0.16);
	/* Back-compat aliases — do not add new usages. */
	--berx-orange: var(--berx-accent);
	--berx-orange-hover: var(--berx-accent-hover);
	--berx-orange-soft: var(--berx-accent-soft);

	--berx-danger: #ff4d4f;
	--berx-success: #3ddc84;

	--berx-blur-sm: 8px;
	--berx-blur-md: 16px;
	--berx-blur-lg: 28px;

	--berx-radius: 16px;
	--berx-radius-sm: 10px;
	--berx-radius-lg: 24px;
	--berx-radius-pill: 999px;

	--berx-shadow: 0 20px 60px -20px rgba(0,0,0,0.55);
	--berx-shadow-glow: 0 0 32px var(--berx-accent-soft);
	--berx-ease: cubic-bezier(0.16, 1, 0.3, 1);
}

html, body {
	background: radial-gradient(ellipse at top, #0d0d0f 0%, var(--berx-bg) 60%) !important;
	color: var(--berx-text) !important;
	/* PT Sans only — it's the one typeface actually self-hosted above
	   (Regular/Italic/Bold .woff2 in vendors/fonts/PTSans). The old
	   'Inter' lead was never shipped as a font file anywhere in this
	   theme, so every browser was silently falling straight through
	   to PT Sans anyway — removing it just makes that explicit instead
	   of implying a second typeface exists. */
	font-family: 'PT Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}

a { color: var(--berx-text); }
a:hover { color: var(--berx-accent); }

::-webkit-scrollbar-track { background-color: var(--berx-black); border-left: 1px solid var(--berx-border-soft); }
::-webkit-scrollbar-thumb { background-color: var(--berx-glass-3); }
::-webkit-scrollbar-thumb:hover { background-color: var(--berx-border-strong); }

/* ---------- Glass surfaces (elevation 2 = default card depth) ---------- */
.ossn-box, .ossn-panel, .card, .ossn-widget, .ossn-wall-post, .panel {
	background: var(--berx-glass-2) !important;
	border: 1px solid var(--berx-border-soft) !important;
	border-radius: var(--berx-radius-lg) !important;
	color: var(--berx-text) !important;
	box-shadow: var(--berx-shadow) !important;
	-webkit-backdrop-filter: blur(var(--berx-blur-md));
	backdrop-filter: blur(var(--berx-blur-md));
	transition: border-color 200ms var(--berx-ease), box-shadow 200ms var(--berx-ease);
}

/* Buttons */
.btn-primary, .ossn-btn-primary, button[type="submit"], input[type="submit"] {
	background-color: var(--berx-accent) !important;
	border-color: var(--berx-accent) !important;
	color: #050505 !important;
	font-weight: 600;
	border-radius: var(--berx-radius-pill) !important;
	transition: background-color 200ms var(--berx-ease), transform 120ms var(--berx-ease);
}
.btn-primary:hover, .ossn-btn-primary:hover {
	background-color: var(--berx-accent-hover) !important;
	border-color: var(--berx-accent-hover) !important;
}
.btn-primary:active, .ossn-btn-primary:active { transform: scale(0.97); }
.btn, .btn-default, .ossn-btn {
	background: var(--berx-glass-2);
	color: var(--berx-text);
	border: 1px solid var(--berx-border-soft);
	border-radius: var(--berx-radius-pill);
	-webkit-backdrop-filter: blur(var(--berx-blur-md));
	backdrop-filter: blur(var(--berx-blur-md));
}
.btn:hover, .ossn-btn:hover { border-color: var(--berx-border-strong); }

/* Form fields */
.ossn-form input[type='text'],
.ossn-form input[type='email'],
.ossn-form input[type='password'],
.ossn-form input[type='number'],
.ossn-form select,
.ossn-form textarea {
	background: var(--berx-glass-1) !important;
	border: 1px solid var(--berx-border-soft) !important;
	border-radius: var(--berx-radius-sm) !important;
	color: var(--berx-text) !important;
	transition: border-color 150ms var(--berx-ease);
}
.ossn-form input:focus, .ossn-form textarea:focus, .ossn-form select:focus {
	border-color: var(--berx-accent) !important;
	outline: none;
}
.ossn-form input::placeholder, .ossn-form textarea::placeholder {
	color: var(--berx-text-faint) !important;
}

/* ---------- Topbar: elevation 3 (floats above the page) ---------- */
.topbar {
	background: rgba(5,5,5,0.72) !important;
	-webkit-backdrop-filter: blur(var(--berx-blur-md));
	backdrop-filter: blur(var(--berx-blur-md));
	border-bottom: 1px solid var(--berx-border-soft) !important;
}
.topbar .site-name a { color: var(--berx-white) !important; font-weight: 700; letter-spacing: 0.5px; }
.topbar .fa { color: var(--berx-text-dim); }
.topbar .fa:hover { color: var(--berx-accent); }

/* ---------- BERX Sidebar: elevation 1 (recessed, not floating) ---------- */
.berx-sidebar {
	background: var(--berx-glass-1) !important;
	border-right: 1px solid var(--berx-border-soft);
	display: flex;
	flex-direction: column;
	padding: 18px 14px;
}
.berx-sidebar-brand { padding: 8px 10px 18px; }
.berx-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.berx-logo-text { font-weight: 800; font-size: 20px; letter-spacing: 1px; color: var(--berx-white); }

.berx-create-btn {
	display: flex; align-items: center; justify-content: center; gap: 8px;
	background: var(--berx-accent);
	color: #050505 !important;
	font-weight: 700;
	border-radius: var(--berx-radius-pill);
	padding: 12px 16px;
	margin: 4px 6px 18px;
	text-decoration: none;
	transition: background-color 200ms var(--berx-ease), transform 120ms var(--berx-ease);
}
.berx-create-btn:hover { background: var(--berx-accent-hover); transform: translateY(-1px); }

.berx-nav-list { list-style: none; margin: 0; padding: 0; }
.berx-nav-item a, .berx-nav-item > span {
	display: flex; align-items: center; gap: 14px;
	padding: 11px 12px;
	border-radius: var(--berx-radius-sm);
	color: var(--berx-text-dim);
	text-decoration: none;
	font-size: 15px; font-weight: 500;
	transition: background-color 150ms var(--berx-ease), color 150ms var(--berx-ease);
}
.berx-nav-item a:hover { background: var(--berx-glass-2); color: var(--berx-white); }
.berx-nav-item i { width: 20px; text-align: center; color: inherit; }
.berx-nav-active a {
	background: var(--berx-accent-soft);
	color: var(--berx-accent) !important;
	font-weight: 700;
	box-shadow: var(--berx-shadow-glow);
}
.berx-nav-disabled > span { color: var(--berx-text-faint); cursor: default; justify-content: space-between; }
.berx-nav-disabled > span > span:first-of-type { display: flex; align-items: center; gap: 14px; flex: 1; }
.berx-soon-badge {
	font-style: normal; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
	color: var(--berx-text-faint);
	border: 1px solid var(--berx-border-soft);
	border-radius: var(--berx-radius-pill);
	padding: 2px 8px;
}

.berx-theme-toggle { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px; color: var(--berx-text-dim); font-size: 14px; }
.berx-switch { position: relative; display: inline-block; width: 38px; height: 22px; }
.berx-switch input { opacity: 0; width: 0; height: 0; }
.berx-switch-slider { position: absolute; inset: 0; cursor: not-allowed; background-color: var(--berx-accent); border-radius: var(--berx-radius-pill); transition: .2s; }
.berx-switch-slider::before { content: ""; position: absolute; height: 16px; width: 16px; left: 19px; top: 3px; background-color: #050505; border-radius: 50%; transition: .2s; }

/* ---------- Mobile bottom nav: elevation 3 (floats above content) ---------- */
.berx-mobile-nav {
	display: none;
	position: fixed; left: 0; right: 0; bottom: 0; z-index: 1000;
	background: rgba(5,5,5,0.85);
	-webkit-backdrop-filter: blur(var(--berx-blur-lg));
	backdrop-filter: blur(var(--berx-blur-lg));
	border-top: 1px solid var(--berx-border-soft);
	padding: 8px 10px calc(8px + env(safe-area-inset-bottom));
}
.berx-mobile-nav ul { list-style: none; margin: 0; padding: 0; display: flex; align-items: center; justify-content: space-between; }
.berx-mobile-nav li a, .berx-mobile-nav li span {
	display: flex; flex-direction: column; align-items: center; gap: 3px;
	color: var(--berx-text-dim); text-decoration: none; font-size: 10px;
}
.berx-mobile-nav li a.berx-mobile-active { color: var(--berx-accent); }
.berx-mobile-nav .berx-mobile-create {
	width: 46px; height: 46px;
	background: var(--berx-accent);
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	color: #050505; margin-top: -22px;
	box-shadow: var(--berx-shadow), var(--berx-shadow-glow);
}
.berx-mobile-nav .berx-mobile-create i { font-size: 18px; }

@media (max-width: 991px) {
	.berx-sidebar { display: none !important; }
	.berx-mobile-nav { display: block; }
	.ossn-inner-page { padding-bottom: 78px !important; }
}

/* ============================================================
   BERX PREMIUM GLASS — PHASE EXTENSION
   Fills gaps the block above didn't reach yet: type/spacing
   scale, real wall-post markup (.ossn-wall-item, not the
   generic .ossn-wall-post guess), reactions, comments.
   Targets classes confirmed in components/OssnWall,
   OssnLikes and OssnComments — not invented selectors.
   ============================================================ */
:root {
	/* Type scale (section 3 "TYPOGRAPHY" of the design brief) */
	--berx-text-display: 34px;
	--berx-text-heading: 24px;
	--berx-text-title: 18px;
	--berx-text-body: 15px;
	--berx-text-caption: 13px;
	--berx-text-label: 12px;
	--berx-text-micro: 11px;

	/* Spacing scale (section 3 "SPACING") */
	--berx-space-1: 4px;
	--berx-space-2: 8px;
	--berx-space-3: 12px;
	--berx-space-4: 16px;
	--berx-space-5: 20px;
	--berx-space-6: 24px;
	--berx-space-8: 32px;
	--berx-space-10: 40px;
	--berx-space-12: 48px;

	/*
	 * Secondary accents — NOT applied anywhere below by default.
	 * Orange (--berx-accent, above) stays the one shipped brand
	 * accent. These exist so a specific feature area (e.g. BERX
	 * Match, an events category chip) can borrow one deliberately,
	 * per the brief's own rule: never run every accent on one
	 * screen at once. Wire a specific one in only when a feature
	 * actually calls for it — don't default any component to these.
	 */
	--berx-violet: #7c5cff;
	--berx-blue: #4f8dff;
	--berx-mint: #2ee6a8;
	--berx-coral: #ff5d73;
}

/* HYGIENE (pass 2): the .berx-text-* utility CLASSES that sat here were
   dead — verified zero occurrences of class="berx-text-*" anywhere in
   system/, components/ or themes/. The underlying --berx-text-* TOKENS
   are heavily used (profile, groups, notifications, search, messages)
   and are defined above; only the unused utility rules were removed. */

/* ---------- Wall post card (real markup: .ossn-wall-item) ---------- */
.ossn-wall-item {
	background: var(--berx-glass-2) !important;
	border: 1px solid var(--berx-border-soft) !important;
	border-radius: var(--berx-radius-lg) !important;
	box-shadow: var(--berx-shadow) !important;
	-webkit-backdrop-filter: blur(var(--berx-blur-md));
	backdrop-filter: blur(var(--berx-blur-md));
	padding: var(--berx-space-5) !important;
	margin-bottom: var(--berx-space-5) !important;
	color: var(--berx-text) !important;
	transition: border-color 200ms var(--berx-ease);
}
.ossn-wall-item .user { color: var(--berx-white) !important; font-weight: 700; }
.ossn-wall-item .post-meta,
.ossn-wall-item .time-created { color: var(--berx-text-faint) !important; font-size: var(--berx-text-micro); }
.ossn-wall-item .post-contents { color: var(--berx-text) !important; font-size: var(--berx-text-body); line-height: 1.5; }

/* Living Media: post images are the visual anchor, not an afterthought */
.ossn-wall-image-container {
	border-radius: var(--berx-radius) !important;
	overflow: hidden;
	margin: var(--berx-space-3) 0;
}
.ossn-wall-image-container img {
	width: 100%;
	max-height: 620px;
	object-fit: cover;
	display: block;
	transition: transform 400ms var(--berx-ease);
}
.ossn-wall-image-container:hover img { transform: scale(1.015); }

/* ---------- Reaction bar (.comments-likes / .menu-likes-comments-share) ---------- */
.comments-likes {
	border-top: 1px solid var(--berx-border-soft) !important;
	margin-top: var(--berx-space-3);
	padding-top: var(--berx-space-2);
}
.menu-stats { color: var(--berx-text-faint) !important; font-size: var(--berx-text-caption); }
.menu-likes-comments-share {
	display: flex;
	gap: var(--berx-space-2);
}
.menu-likes-comments-share > * ,
.like-share {
	background: var(--berx-glass-1);
	border: 1px solid var(--berx-border-soft);
	border-radius: var(--berx-radius-pill) !important;
	padding: var(--berx-space-1) var(--berx-space-4) !important;
	color: var(--berx-text-dim) !important;
	font-size: var(--berx-text-caption);
	transition: background-color 150ms var(--berx-ease), color 150ms var(--berx-ease);
	cursor: pointer;
}
.menu-likes-comments-share > *:hover,
.like-share:hover { background: var(--berx-glass-2); color: var(--berx-white) !important; }

/* ---------- Comments (.comments-item / .comment-user-img) ---------- */
.comments-item { margin-top: var(--berx-space-3); }
.comment-user-img {
	width: 32px; height: 32px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft);
}
.comments-item .ps-1.w-100 {
	background: var(--berx-glass-1);
	border-radius: var(--berx-radius);
	padding: var(--berx-space-2) var(--berx-space-3);
	color: var(--berx-text) !important;
}
.comments-item a { color: var(--berx-white) !important; font-weight: 600; }

/* ============================================================
   BERX MESSAGES — three-pane spatial messenger
   Layout only; the DOM it styles is OssnMessages' own (the JS
   binds to it), so every selector below targets real existing
   classes rather than a rebuilt markup tree.
   ============================================================ */
.berx-messages {
	--berx-msg-height: calc(100vh - 150px);
	border-radius: var(--berx-radius-lg);
	overflow: hidden;
	border: 1px solid var(--berx-border-soft);
	background: var(--berx-glass-1);
	-webkit-backdrop-filter: blur(var(--berx-blur-lg));
	backdrop-filter: blur(var(--berx-blur-lg));
}
.berx-messages > .row {
	min-height: var(--berx-msg-height);
}

/* Panes are separated by hairlines, not stacked cards — one continuous
   surface reads as a single application rather than three widgets. */
.berx-messages-col-list {
	border-right: 1px solid var(--berx-border-soft);
	background: rgba(255,255,255,0.015);
}
.berx-messages-col-context {
	border-left: 1px solid var(--berx-border-soft);
	background: rgba(255,255,255,0.015);
}
.berx-messages .ossn-widget {
	background: transparent !important;
	border: none !important;
	box-shadow: none !important;
	border-radius: 0 !important;
	height: 100%;
	display: flex;
	flex-direction: column;
}
.berx-messages .widget-heading {
	display: flex;
	align-items: center;
	gap: var(--berx-space-3);
	padding: var(--berx-space-4) var(--berx-space-4);
	border-bottom: 1px solid var(--berx-border-soft);
	background: rgba(5,5,5,0.55);
	-webkit-backdrop-filter: blur(var(--berx-blur-md));
	backdrop-filter: blur(var(--berx-blur-md));
	font-weight: 700;
	color: var(--berx-white);
	min-height: 68px;
}
.berx-messages .widget-contents {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	padding: 0;
}
.berx-inbox-title { font-size: var(--berx-text-title); }
.berx-unread-pill {
	background: var(--berx-accent);
	color: #050505;
	font-size: var(--berx-text-micro);
	font-weight: 800;
	border-radius: var(--berx-radius-pill);
	padding: 2px 8px;
	min-width: 22px;
	text-align: center;
}

/* ---------- Left pane: conversation rows ---------- */
.berx-messages .messages-from {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: var(--berx-space-2);
}
/* PROVEN specificity conflict, found by a targeted audit rather than
   assumed: the base rule is
   .ossn-messages .messages-recent .messages-from .user-item
   (4 chained classes) setting border-bottom:#eee, and .user-item is
   really on every row (verified in recent.php's real markup). My
   original 2-class selector below could never beat that regardless of
   source order or the shorthand `border` property. Matching the exact
   chain — rather than reaching for !important — is what actually wins. */
.ossn-messages .messages-recent .messages-from .ossn-recent-message-item.user-item {
	border-bottom: 1px solid var(--berx-border-soft);
}
.berx-messages .ossn-recent-message-item {
	align-items: center;
	gap: var(--berx-space-3);
	padding: var(--berx-space-3);
	border-radius: var(--berx-radius);
	cursor: pointer;
	border: 1px solid transparent;
	transition: background-color 150ms var(--berx-ease), border-color 150ms var(--berx-ease);
}
.berx-messages .ossn-recent-message-item:hover {
	background: var(--berx-glass-2);
	border-color: var(--berx-border-soft);
}
.berx-messages .ossn-recent-message-item .msg-flex-c1 {
	position: relative;
	flex-shrink: 0;
}
.berx-messages .ossn-recent-message-item img.image {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft);
}
.berx-messages .ossn-recent-message-item .msg-flex-c2 {
	min-width: 0;
	flex: 1;
}
.berx-messages .ossn-recent-message-item .name {
	color: var(--berx-white);
	font-weight: 600;
	font-size: var(--berx-text-body);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.berx-messages .ossn-recent-message-item .time {
	color: var(--berx-text-faint);
	font-size: var(--berx-text-micro);
}
.berx-messages .ossn-recent-message-item .reply,
.berx-messages .ossn-recent-message-item .reply-text,
.berx-messages .ossn-recent-message-item .reply-text-from {
	color: var(--berx-text-dim);
	font-size: var(--berx-text-caption);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
/* Unread: accent bar + brighter text, not just bold — legible at a glance. */
.berx-messages .ossn-recent-message-item.message-new {
	background: var(--berx-accent-soft);
	border-color: rgba(217, 169, 63,0.28);
}
.berx-messages .ossn-recent-message-item.message-new .name { color: #fff; }
.berx-messages .ossn-recent-message-item.message-new .reply-text-from {
	color: var(--berx-text);
	font-weight: 600;
}

/* Presence dot — OSSN toggles the -online/-offline class on the row. */
.berx-messages .ossn-inmessage-status-circle {
	position: absolute;
	right: 0;
	bottom: 0;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 2px solid var(--berx-black);
	background: var(--berx-text-faint);
}
.berx-messages .ossn-recent-message-status-online .ossn-inmessage-status-circle,
.berx-messages .ossn-inmessage-status-online .ossn-inmessage-status-circle {
	background: var(--berx-success);
	box-shadow: 0 0 10px rgba(61,220,132,0.55);
}

/* ---------- Center pane: conversation header ---------- */
.berx-messages .messages-with .widget-heading .user-icon-smaller {
	width: 42px;
	height: 42px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft);
}
.berx-messages .messages-with .widget-heading {
	position: relative;
}
.berx-messages .messages-with .widget-heading .ossn-inmessage-status-circle {
	position: static;
	margin-left: -18px;
	align-self: flex-end;
	margin-bottom: 4px;
}
.berx-msg-head-meta {
	display: flex;
	flex-direction: column;
	line-height: 1.3;
	min-width: 0;
	flex: 1;
}
.berx-msg-head-name {
	color: var(--berx-white) !important;
	font-weight: 700;
	font-size: var(--berx-text-title);
	text-decoration: none;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.berx-msg-head-presence {
	color: var(--berx-text-faint);
	font-size: var(--berx-text-micro);
	font-weight: 500;
}
.messages-with.ossn-inmessage-status-online .berx-msg-head-presence {
	color: var(--berx-success);
}
.berx-msg-back {
	color: var(--berx-text-dim) !important;
	font-size: 22px;
	padding-right: var(--berx-space-1);
}
/* PROVEN conflict: #message-with-user-widget is an ID selector in the
   base CSS — an ID always outranks any number of classes, so no
   .berx-messages chain, however long, could ever have overridden its
   border-left:#eee. Matched with the same ID here. */
#message-with-user-widget {
	border-left: 1px solid var(--berx-border-soft);
}
.berx-messages .ossn-message-delete-conversation {
	color: var(--berx-text-faint) !important;
	font-size: 15px;
	margin-left: auto;
	transition: color 150ms var(--berx-ease);
}
.berx-messages .ossn-message-delete-conversation:hover {
	color: var(--berx-danger) !important;
}

/* ---------- Center pane: thread ---------- */
.berx-messages .message-with {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
}
.berx-messages .message-inner {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding: var(--berx-space-5) var(--berx-space-5) var(--berx-space-3);
	display: flex;
	flex-direction: column;
	gap: 2px;
	scroll-behavior: smooth;
}
.berx-messages .message-inner .row { margin: 0; }

/* Bubbles: asymmetric tail-side radius gives direction without a tail
   graphic; sent uses the accent, received stays on glass. */
.berx-messages .message-box-sent,
.berx-messages .message-box-recieved {
	position: relative;
	display: inline-block;
	max-width: 74%;
	padding: var(--berx-space-3) var(--berx-space-4);
	margin: 3px 0;
	font-size: var(--berx-text-body);
	line-height: 1.45;
	border-radius: var(--berx-radius-lg);
	word-wrap: break-word;
	overflow-wrap: anywhere;
	animation: berx-msg-in 220ms var(--berx-ease);
}
@keyframes berx-msg-in {
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: none; }
}
.berx-messages .message-box-sent {
	background: linear-gradient(135deg, var(--berx-accent) 0%, #EABD5C 100%);
	color: #1a0c00;
	float: right;
	border-bottom-right-radius: var(--berx-radius-sm);
	box-shadow: 0 6px 20px -8px rgba(217, 169, 63,0.5);
}
.berx-messages .message-box-recieved {
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border-soft);
	color: var(--berx-text);
	float: left;
	border-bottom-left-radius: var(--berx-radius-sm);
	-webkit-backdrop-filter: blur(var(--berx-blur-sm));
	backdrop-filter: blur(var(--berx-blur-sm));
}
.berx-messages .message-box-sent .time-created,
.berx-messages .message-box-recieved .time-created {
	font-size: 10px;
	margin-top: 4px;
	opacity: 0.7;
}
.berx-messages .message-box-sent .time-created { color: #3d1c00; }
.berx-messages .message-box-recieved .time-created { color: var(--berx-text-faint); }
.berx-messages .ossn-message-deleted {
	background: var(--berx-glass-1) !important;
	border: 1px dashed var(--berx-border) !important;
	color: var(--berx-text-faint) !important;
	box-shadow: none !important;
	font-style: italic;
}
/* Per-message menu stays hidden until the bubble is hovered — chrome
   shouldn't compete with the conversation. */
.berx-messages .ossn-message-delete {
	position: absolute;
	top: 6px;
	right: -26px;
	color: var(--berx-text-faint) !important;
	opacity: 0;
	cursor: pointer;
	transition: opacity 150ms var(--berx-ease);
}
.berx-messages .message-box-sent .ossn-message-delete { right: auto; left: -26px; }
.berx-messages .message-box-sent:hover .ossn-message-delete,
.berx-messages .message-box-recieved:hover .ossn-message-delete { opacity: 1; }

/* Attachments inside bubbles */
.berx-messages .ossn-message-show-image-attachment {
	margin-top: var(--berx-space-2);
	border-radius: var(--berx-radius);
	max-width: 100%;
	display: block;
}
.berx-messages .ossn-message-attachment {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin-top: var(--berx-space-2);
	padding: var(--berx-space-2) var(--berx-space-3);
	border-radius: var(--berx-radius-sm);
	background: rgba(0,0,0,0.18);
	font-size: var(--berx-text-caption);
}

/* ---------- Composer ---------- */
.berx-messages .message-form-form {
	border-top: 1px solid var(--berx-border-soft);
	padding: var(--berx-space-3) var(--berx-space-4);
	background: rgba(5,5,5,0.55);
	-webkit-backdrop-filter: blur(var(--berx-blur-md));
	backdrop-filter: blur(var(--berx-blur-md));
	display: flex;
	flex-direction: column;
	gap: var(--berx-space-2);
}
.berx-messages .message-form-form textarea {
	width: 100%;
	min-height: 46px;
	max-height: 160px;
	resize: none;
	padding: var(--berx-space-3) var(--berx-space-4);
	border-radius: var(--berx-radius-lg);
	background: var(--berx-glass-2) !important;
	border: 1px solid var(--berx-border) !important;
	color: var(--berx-text) !important;
	font-size: var(--berx-text-body);
	outline: none;
	transition: border-color 150ms var(--berx-ease);
}
.berx-messages .message-form-form textarea:focus {
	border-color: var(--berx-accent) !important;
}
.berx-messages .message-form-form .controls {
	display: flex;
	align-items: center;
	gap: var(--berx-space-2);
}
.berx-messages .message-form-form .controls input[type="submit"] {
	order: 3;
	margin-left: auto;
	border-radius: var(--berx-radius-pill);
	padding: 8px 22px;
	font-weight: 700;
}
.berx-messages .ossn-message-icon-attachment {
	order: 1;
	width: 38px;
	height: 38px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border-soft);
	color: var(--berx-text-dim);
	cursor: pointer;
	transition: color 150ms var(--berx-ease), border-color 150ms var(--berx-ease);
}
.berx-messages .ossn-message-icon-attachment:hover {
	color: var(--berx-accent);
	border-color: var(--berx-accent);
}
.berx-messages .ossn-message-icon-attachment::before {
	content: "\f0c6"; /* paperclip */
	font-family: 'Font Awesome 5 Free';
	font-weight: 900;
}
.berx-messages .ossn-message-attachment-details:not(:empty) {
	padding: var(--berx-space-2) var(--berx-space-3);
	border-radius: var(--berx-radius-sm);
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border-soft);
	font-size: var(--berx-text-caption);
	color: var(--berx-text-dim);
}

/* ---------- Right pane: context ---------- */
.berx-context {
	padding: var(--berx-space-5) var(--berx-space-4);
	overflow-y: auto;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: var(--berx-space-6);
}
.berx-context-profile {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 4px;
}
.berx-context-avatar img {
	width: 92px;
	height: 92px;
	border-radius: 50%;
	object-fit: cover;
	border: 2px solid var(--berx-border-soft);
	box-shadow: var(--berx-shadow);
}
.berx-context-name {
	color: var(--berx-white) !important;
	font-weight: 700;
	font-size: var(--berx-text-title);
	text-decoration: none;
	margin-top: var(--berx-space-2);
}
.berx-context-username {
	color: var(--berx-text-faint);
	font-size: var(--berx-text-micro);
}
.berx-context-actions {
	display: flex;
	flex-direction: column;
	gap: var(--berx-space-2);
	width: 100%;
	margin-top: var(--berx-space-4);
}
.berx-context-actions .btn {
	width: 100%;
	justify-content: center;
	font-size: var(--berx-text-caption);
}
.berx-context-danger:hover {
	color: var(--berx-danger) !important;
	border-color: rgba(255,77,79,0.4) !important;
}
.berx-context-section h4 {
	display: flex;
	align-items: center;
	gap: var(--berx-space-2);
	font-size: var(--berx-text-label);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--berx-text-faint);
	margin: 0 0 var(--berx-space-3);
}
.berx-context-count {
	background: var(--berx-glass-2);
	border-radius: var(--berx-radius-pill);
	padding: 1px 7px;
	font-size: 10px;
	color: var(--berx-text-dim);
}
.berx-context-media-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 4px;
}
.berx-context-media-item {
	aspect-ratio: 1 / 1;
	border-radius: var(--berx-radius-sm);
	overflow: hidden;
	background: var(--berx-graphite);
}
.berx-context-media-item img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
	transition: transform 300ms var(--berx-ease);
}
.berx-context-media-item:hover img { transform: scale(1.08); }
.berx-context-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.berx-context-list a {
	display: flex;
	align-items: center;
	gap: var(--berx-space-2);
	padding: var(--berx-space-2);
	border-radius: var(--berx-radius-sm);
	color: var(--berx-text-dim) !important;
	font-size: var(--berx-text-caption);
	text-decoration: none;
	transition: background-color 150ms var(--berx-ease);
}
.berx-context-list a:hover {
	background: var(--berx-glass-2);
	color: var(--berx-white) !important;
}
.berx-context-list span {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.berx-context-empty,
.berx-messages-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: var(--berx-space-3);
	color: var(--berx-text-dim);
	padding: var(--berx-space-8) var(--berx-space-4);
}
.berx-messages-empty { height: 100%; }
.berx-context-empty i,
.berx-messages-empty i {
	font-size: 30px;
	color: var(--berx-text-faint);
}
.berx-messages-empty h3 {
	color: var(--berx-white);
	font-size: var(--berx-text-title);
	font-weight: 700;
	margin: 0;
}
.berx-messages-empty p,
.berx-context-empty p {
	margin: 0;
	font-size: var(--berx-text-caption);
	max-width: 34ch;
}

/* ---------- Mobile: single immersive conversation ---------- */
@media (max-width: 991px) {
	.berx-messages {
		--berx-msg-height: calc(100vh - 132px);
		border-radius: 0;
		border-left: none;
		border-right: none;
	}
	.berx-messages .message-box-sent,
	.berx-messages .message-box-recieved {
		max-width: 86%;
	}
	.berx-messages .message-inner {
		padding: var(--berx-space-4) var(--berx-space-3) var(--berx-space-2);
	}
	.berx-messages .ossn-message-delete {
		position: static;
		opacity: 1;
		display: inline-block;
		margin-left: 6px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.berx-messages .message-box-sent,
	.berx-messages .message-box-recieved {
		animation: none;
	}
	.berx-messages .message-inner { scroll-behavior: auto; }
}

/* ============================================================
   BERX FEED — post composition variants
   Every variant below is keyed off markup OSSN ACTUALLY emits,
   verified in the component sources:
     .ossn-photos-wall           multi-photo album post (OssnPhotos)
     .ossn-photos-wall-plain     single-photo album post (OssnPhotos)
     .ossn-wall-image-container  single wall image (OssnWall)
     .postbg-container           background post (OssnPostBackground)
     .embed-responsive-item      link/video embed (OssnEmbed)
     .ossn-photos-wall-title     album attribution
   Text-only is detected with :has() rather than a fabricated
   backend flag. There is deliberately NO styling for "event",
   "place", "travel" or "creator" post types: OSSN has no such
   post model, so any such card would be decoration, not data.
   ============================================================ */

/* Media-first: let real photos drive their own height instead of
   forcing every post into one uniform crop. Portrait and landscape
   therefore compose differently with no server-side metadata. */
.ossn-wall-image-container img,
.ossn-photos-wall-plain img {
	width: 100%;
	height: auto;
	max-height: 78vh;
	object-fit: contain;
	background: #000;
}

/* ---------- Text-only post: typographic, no empty media frame ---------- */
.ossn-wall-item .post-contents:not(:has(img)):not(:has(iframe)) p {
	font-size: 19px;
	line-height: 1.5;
	letter-spacing: -0.01em;
	color: var(--berx-white);
	margin: var(--berx-space-2) 0;
}
.ossn-wall-item .post-contents:not(:has(img)):not(:has(iframe)):not(:has(.postbg-container)) p:only-child {
	padding: var(--berx-space-2) 0;
}

/* ---------- Background post (OssnPostBackground) ---------- */
.ossn-wall-item .postbg-container {
	border-radius: var(--berx-radius) !important;
	min-height: 260px;
	display: flex !important;
	align-items: center;
	justify-content: center;
	text-align: center;
	padding: var(--berx-space-8) var(--berx-space-6) !important;
	font-size: 26px !important;
	font-weight: 700;
	line-height: 1.3;
	color: #fff;
	overflow: hidden;
	box-shadow: inset 0 0 120px rgba(0,0,0,0.35);
}

/* ---------- Multi-photo album post: real mosaic ---------- */
.ossn-photos-wall {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 4px;
	border-radius: var(--berx-radius);
	overflow: hidden;
	margin-top: var(--berx-space-3);
}
.ossn-photos-wall .ossn-photos-wall-item {
	margin: 0 !important;
	padding: 0 !important;
	aspect-ratio: 1 / 1;
	overflow: hidden;
	background: var(--berx-graphite);
}
.ossn-photos-wall .ossn-photos-wall-item img,
.ossn-photos-wall .ossn-photos-wall-item a {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 400ms var(--berx-ease);
}
.ossn-photos-wall .ossn-photos-wall-item:hover img { transform: scale(1.03); }
/* Odd counts read better with a lead image spanning the full width. */
.ossn-photos-wall .ossn-photos-wall-item:first-child:nth-last-child(odd) {
	grid-column: 1 / -1;
	aspect-ratio: 16 / 10;
}
.ossn-photos-wall-plain {
	border-radius: var(--berx-radius);
	overflow: hidden;
	margin-top: var(--berx-space-3);
}
.ossn-photos-wall-title a {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: var(--berx-text-dim) !important;
	font-size: var(--berx-text-caption);
	text-decoration: none;
}
.ossn-photos-wall-title a:hover { color: var(--berx-accent) !important; }

/* ---------- Link / video embed (OssnEmbed) ---------- */
.ossn-wall-item .embed-responsive-item,
.ossn-wall-item iframe {
	width: 100%;
	border: 1px solid var(--berx-border-soft);
	border-radius: var(--berx-radius);
	overflow: hidden;
	margin-top: var(--berx-space-3);
	aspect-ratio: 16 / 9;
	height: auto;
	display: block;
	background: #000;
}

/* ---------- Community / group post attribution ---------- */
.ossn-wall-item .ossn-wall-item-type {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: var(--berx-text-micro);
	color: var(--berx-text-faint);
	font-weight: 500;
}

/* ---------- Tagged people ---------- */
.ossn-wall-item .friends {
	margin-top: var(--berx-space-1);
	font-size: var(--berx-text-caption);
	color: var(--berx-text-dim);
}
.ossn-wall-item .friends a { color: var(--berx-white) !important; font-weight: 600; }

/* ---------- Post header composition ---------- */
.ossn-wall-item .meta {
	display: flex;
	align-items: center;
	gap: var(--berx-space-3);
	margin-bottom: var(--berx-space-3);
	position: relative;
}
.ossn-wall-item .meta .user-img {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft);
	flex-shrink: 0;
}
.ossn-wall-item .meta .user { flex: 1; min-width: 0; }
.ossn-wall-item .meta .user > a {
	color: var(--berx-white) !important;
	font-weight: 700;
	font-size: var(--berx-text-body);
	text-decoration: none;
}
.ossn-wall-item .post-menu { margin-left: auto; }
.ossn-wall-item .post-menu a { color: var(--berx-text-faint) !important; }
.ossn-wall-item .post-menu a:hover { color: var(--berx-white) !important; }

@media (max-width: 767px) {
	/* Edge-to-edge media on phones — the photo is the content. */
	.ossn-wall-item {
		border-radius: var(--berx-radius) !important;
		padding: var(--berx-space-4) !important;
	}
	.ossn-wall-image-container,
	.ossn-photos-wall,
	.ossn-photos-wall-plain {
		margin-left: calc(-1 * var(--berx-space-4));
		margin-right: calc(-1 * var(--berx-space-4));
		border-radius: 0;
	}
	.ossn-wall-item .post-contents:not(:has(img)):not(:has(iframe)) p {
		font-size: 17px;
	}
	.ossn-wall-item .postbg-container {
		min-height: 220px;
		font-size: 22px !important;
	}
}

@media (prefers-reduced-motion: reduce) {
	.ossn-photos-wall .ossn-photos-wall-item img,
	.ossn-wall-image-container img { transition: none !important; }
	.ossn-photos-wall .ossn-photos-wall-item:hover img { transform: none; }
}

/* ============================================================
   BERX SETTINGS / ACCOUNT
   OSSN registers exactly TWO real account sections engine-wide:
     basic    -> OssnProfile  (profile/edit/tabs)
     blocking -> OssnBlock
   There is no separate privacy / notifications / devices / data
   settings backend, so none is styled or implied here.
   Layout classes come from OssnProfile's profile/edit.php:
   .ossn-profile-edit-layout, .profile-edit-layout-title,
   .profile-edit-tabs, .profile-edit-layout-right
   (tab item + active classes are styled in OssnProfile's profile.php).
   ============================================================ */
.ossn-profile-edit-layout {
	border: 1px solid var(--berx-border-soft);
	border-radius: var(--berx-radius-lg);
	overflow: hidden;
	background: var(--berx-glass-1);
	-webkit-backdrop-filter: blur(var(--berx-blur-lg));
	backdrop-filter: blur(var(--berx-blur-lg));
}
.ossn-profile-edit-layout .profile-edit-tabs {
	padding: var(--berx-space-3);
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.berx-settings-form {
	display: flex;
	flex-direction: column;
	gap: var(--berx-space-6);
	padding: var(--berx-space-5) var(--berx-space-4);
}
.berx-settings-group {
	display: flex;
	flex-direction: column;
	gap: var(--berx-space-4);
	padding-bottom: var(--berx-space-5);
	border-bottom: 1px solid var(--berx-border-soft);
}
.berx-settings-group:last-of-type { border-bottom: none; padding-bottom: 0; }
.berx-settings-group-title {
	margin: 0;
	font-size: var(--berx-text-label);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--berx-text-faint);
}
.berx-field-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: var(--berx-space-4);
}
.berx-field { display: flex; flex-direction: column; gap: 6px; }
.berx-field label {
	font-size: var(--berx-text-caption);
	font-weight: 600;
	color: var(--berx-text-dim);
}
.berx-field input[type="text"],
.berx-field input[type="password"],
.berx-field input[type="email"],
.berx-settings-custom-fields input[type="text"],
.berx-settings-form select {
	width: 100%;
	height: 44px;
	padding: 0 var(--berx-space-4);
	border-radius: var(--berx-radius);
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border);
	color: var(--berx-text);
	font-size: var(--berx-text-body);
	outline: none;
	transition: border-color 150ms var(--berx-ease);
}
.berx-field input:focus,
.berx-settings-form select:focus { border-color: var(--berx-accent); }

/* Locked field: reads as non-editable without the old inline
   light-grey background that couldn't be overridden from CSS. */
.berx-field-locked {
	background: rgba(255,255,255,0.02) !important;
	color: var(--berx-text-faint) !important;
	border-style: dashed !important;
	cursor: not-allowed;
}
.berx-field-hint {
	font-size: var(--berx-text-micro);
	color: var(--berx-text-faint);
}
.berx-settings-actions {
	display: flex;
	justify-content: flex-end;
	padding-top: var(--berx-space-2);
}
.berx-settings-actions .btn-primary {
	padding: 10px 28px;
	border-radius: var(--berx-radius-pill);
	font-weight: 700;
}

/* Custom user fields come from ossn_prepare_user_fields() — real,
   admin-defined, so they inherit the same field styling. */
.berx-settings-custom-fields label {
	font-size: var(--berx-text-caption);
	font-weight: 600;
	color: var(--berx-text-dim);
	display: block;
	margin-bottom: 6px;
}
.berx-settings-custom-fields > div { margin-bottom: var(--berx-space-4); }

@media (max-width: 991px) {
	.ossn-profile-edit-layout .profile-edit-tabs {
		flex-direction: row;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--berx-border-soft);
	}
	.berx-settings-form { padding: var(--berx-space-4) var(--berx-space-3); }
	.berx-settings-actions .btn-primary { width: 100%; }
}

/* ============================================================
   BERX AUTH — legacy contrast fix
   system/plugins/default/pages/contents/user/{login,resetlogin,
   resetcode}.php mark their headings with Bootstrap's .text-dark,
   which resolves to near-black — invisible on the dark glass auth
   card. Scoped to the auth containers only, so .text-dark keeps its
   normal meaning anywhere a genuinely light surface uses it.
   ============================================================ */
.ossn-login .text-dark,
.ossn-startup-wrapper .text-dark,
.ossn-login h2.text-dark,
.ossn-startup-wrapper h2.text-dark {
	color: var(--berx-white) !important;
}
.ossn-login .alert-danger {
	background: rgba(255,77,79,0.12);
	border: 1px solid rgba(255,77,79,0.35);
	color: #ffb3b4;
	border-radius: var(--berx-radius);
	display: flex;
	align-items: center;
	gap: var(--berx-space-2);
}

/* ============================================================
   BERX PASS 2 — SHARED SURFACES
   Everything below styles markup that already exists and is
   genuinely reachable. Bootstrap modals/popovers are deliberately
   NOT styled: OSSN never renders them (only bootstrap.min.css
   defines those classes), so rules for them would be dead weight.
   ============================================================ */

/* ---------- Pagination ----------
   Had NO BERX styling at all — raw Bootstrap on every paginated
   list (search, users, groups, photos, notifications, messages).
   Class names come from themes/berx/plugins/default/pagination/view.php
   and the messages JS reads `.ossn-pagination .active`, so the
   active marker stays a real .active class, only restyled. */
.container-table-pagination { margin: var(--berx-space-5) 0; }
.pagination.ossn-pagination {
	display: flex;
	gap: var(--berx-space-1);
	padding: 0;
	margin: 0;
	list-style: none;
}
.ossn-pagination .page-item { list-style: none; }
.ossn-pagination .page-link {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 38px;
	height: 38px;
	padding: 0 12px;
	border-radius: var(--berx-radius-pill);
	background: var(--berx-glass-2) !important;
	border: 1px solid var(--berx-border-soft) !important;
	color: var(--berx-text-dim) !important;
	font-size: var(--berx-text-caption);
	font-weight: 600;
	text-decoration: none;
	box-shadow: none !important;
	transition: background-color 150ms var(--berx-ease), color 150ms var(--berx-ease);
}
.ossn-pagination .page-link:hover {
	background: var(--berx-glass-3) !important;
	color: var(--berx-white) !important;
}
.ossn-pagination .page-item.active .page-link {
	background: var(--berx-accent) !important;
	border-color: var(--berx-accent) !important;
	color: #050505 !important;
}

/* ---------- Confirm / message dialog ----------
   .ossn-halt + .ossn-message-box is OSSN's real dialog system
   (system/plugins/default/javascripts/libraries/ossn.lib.messageboxes.php),
   shown on every delete/confirm action site-wide. It was a white
   card behind a light-grey scrim. The JS only toggles display and
   injects HTML, so restyling is safe. */
.ossn-halt {
	background-color: rgba(5,5,5,0.68);
	-webkit-backdrop-filter: blur(var(--berx-blur-sm));
	backdrop-filter: blur(var(--berx-blur-sm));
}
.ossn-message-box {
	background: var(--berx-surface-2, #16181d) !important;
	border: 1px solid var(--berx-border-soft) !important;
	border-radius: var(--berx-radius-lg) !important;
	box-shadow: var(--berx-shadow) !important;
	color: var(--berx-text);
	overflow: hidden;
	max-width: calc(100vw - 32px);
}
.ossn-message-box .title {
	background: var(--berx-glass-2) !important;
	border-bottom: 1px solid var(--berx-border-soft) !important;
	color: var(--berx-white) !important;
	font-weight: 700;
	border-radius: 0 !important;
}
.ossn-message-box .contents { color: var(--berx-text-dim); }
.ossn-message-box .close-box { color: var(--berx-text-faint); }
.ossn-message-box .close-box:hover { color: var(--berx-white); }
.ossn-message-box .control {
	background: transparent !important;
	border-top: 1px solid var(--berx-border-soft);
}
.ossn-message-box .contents input[type='text'] {
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border);
	color: var(--berx-text);
	border-radius: var(--berx-radius);
}

/* ---------- Error / 404 / permission pages ---------- */
.ossn-error-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: var(--berx-space-3);
	padding: var(--berx-space-12) var(--berx-space-6);
	border-radius: var(--berx-radius-lg);
	border: 1px dashed var(--berx-border);
	background: var(--berx-glass-1);
}
.ossn-error-page i { font-size: 38px; color: var(--berx-accent); opacity: 0.85; }
.ossn-error-page .error-heading {
	font-size: var(--berx-text-heading);
	font-weight: 800;
	color: var(--berx-white);
}
.ossn-error-page .error-text {
	color: var(--berx-text-dim);
	font-size: var(--berx-text-body);
	max-width: 46ch;
}

/* ---------- Tooltips (used by OssnChat + berx.php) ---------- */
.tooltip-inner {
	background: var(--berx-surface-2, #16181d) !important;
	border: 1px solid var(--berx-border-soft);
	color: var(--berx-text) !important;
	border-radius: var(--berx-radius-sm) !important;
	font-size: var(--berx-text-micro);
	padding: 6px 10px;
}
.tooltip .tooltip-arrow::before { border-top-color: var(--berx-surface-2, #16181d) !important; }

/* ============================================================
   BERX PASS 3 — INTERACTION SYSTEM
   Shared states applied to controls that already exist. No new
   behaviour, no JS: these are visual states only, so nothing can
   interfere with existing handlers.
   ============================================================ */

/* Keyboard focus. :focus-visible only — so mouse users don't get
   rings, but keyboard navigation is actually traceable. */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
	outline: 2px solid var(--berx-accent);
	outline-offset: 2px;
	border-radius: var(--berx-radius-sm);
}

/* Disabled: consistent, and never looks clickable. */
.btn:disabled,
.btn.disabled,
button:disabled,
input:disabled,
select:disabled,
textarea:disabled,
.berx-nav-disabled > span {
	opacity: 0.45;
	cursor: not-allowed;
	pointer-events: none;
}

/* Touch: remove the grey tap flash, keep an intentional press state. */
a, button, .btn, [role="button"] {
	-webkit-tap-highlight-color: transparent;
}
@media (hover: none) {
	.btn:active,
	a.btn:active,
	.ossn-action-btn:active {
		transform: scale(0.985);
	}
}

/* Loading spinner used across the product (.ossn-loading). */
.ossn-loading {
	border-color: var(--berx-border) !important;
	border-top-color: var(--berx-accent) !important;
}

/* Validation + system messages. OSSN emits these classes from
   ossn_trigger_message(); colours only, no layout change. */
.ossn-system-messages .ossn-message-error,
.alert-danger {
	background: rgba(255,77,79,0.12);
	border: 1px solid rgba(255,77,79,0.32);
	color: #ffb3b4;
	border-radius: var(--berx-radius);
}
.ossn-system-messages .ossn-message-success,
.alert-success {
	background: rgba(61,220,132,0.12);
	border: 1px solid rgba(61,220,132,0.32);
	color: #9df0c2;
	border-radius: var(--berx-radius);
}

/* Global reduced-motion honouring, on top of the per-module rules. */
@media (prefers-reduced-motion: reduce) {
	*,
	*::before,
	*::after {
		animation-duration: 0.001ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.001ms !important;
		scroll-behavior: auto !important;
	}
}

/* Message search entry point — sits in the inbox widget heading, which
   is OUTSIDE .messages-from, so the polling DOM contract is untouched.
   Colours come from --berx-* tokens, so it follows the accent. */
.berx-msgsearch-entry {
	margin-left: auto;
	width: 34px;
	height: 34px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border-soft);
	color: var(--berx-text-dim) !important;
	font-size: 13px;
	transition: color 150ms var(--berx-ease), border-color 150ms var(--berx-ease);
}
.berx-msgsearch-entry:hover {
	color: var(--berx-accent) !important;
	border-color: var(--berx-accent);
}

/* ============================================================
   BERX SETTINGS — devices/sessions + delete account.
   Rendered inside the already-BERX-styled .profile-edit-layout-right
   pane, so it inherits that surface; only the section-specific
   pieces are styled here.
   ============================================================ */
.berx-settings-section { display: flex; flex-direction: column; gap: var(--berx-space-4); }
.berx-settings-section-title { margin: 0; font-size: var(--berx-text-title); font-weight: 700; color: var(--berx-white); }
.berx-settings-section-note { margin: 0; color: var(--berx-text-dim); font-size: var(--berx-text-caption); }
.berx-settings-empty {
	padding: var(--berx-space-6);
	text-align: center;
	color: var(--berx-text-faint);
	border: 1px dashed var(--berx-border);
	border-radius: var(--berx-radius);
	background: var(--berx-glass-1);
}

.berx-settings-devices-list { display: flex; flex-direction: column; gap: var(--berx-space-2); }
.berx-settings-device {
	display: flex;
	align-items: center;
	gap: var(--berx-space-3);
	padding: var(--berx-space-3) var(--berx-space-4);
	border-radius: var(--berx-radius);
	border: 1px solid var(--berx-border-soft);
	background: var(--berx-glass-2);
}
.berx-settings-device-icon {
	width: 40px; height: 40px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	background: var(--berx-glass-3);
	color: var(--berx-accent);
	flex-shrink: 0;
}
.berx-settings-device-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.berx-settings-device-info strong { color: var(--berx-white); font-size: var(--berx-text-body); }
.berx-settings-device-meta { color: var(--berx-text-faint); font-size: var(--berx-text-micro); }
.berx-settings-device-revoke {
	background: transparent;
	border: 1px solid var(--berx-border);
	color: var(--berx-text-dim);
	border-radius: var(--berx-radius-pill);
	padding: 7px 16px;
	font-size: var(--berx-text-caption);
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	transition: color 150ms var(--berx-ease), border-color 150ms var(--berx-ease);
}
.berx-settings-device-revoke:hover { color: var(--berx-danger); border-color: rgba(255,77,79,0.4); }

.berx-settings-danger-title { color: var(--berx-danger); }
.berx-settings-delete-list {
	margin: 0; padding-left: 20px;
	display: flex; flex-direction: column; gap: 6px;
	color: var(--berx-text-dim); font-size: var(--berx-text-caption);
}
.berx-settings-delete-form { display: flex; flex-direction: column; gap: var(--berx-space-3); max-width: 360px; margin-top: var(--berx-space-2); }
.berx-settings-delete-form label { color: var(--berx-text-dim); font-size: var(--berx-text-caption); font-weight: 600; }
.berx-settings-delete-form input[type="password"] {
	height: 44px; padding: 0 var(--berx-space-4);
	border-radius: var(--berx-radius);
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border);
	color: var(--berx-text);
	font-size: var(--berx-text-body);
	outline: none;
}
.berx-settings-delete-form input[type="password"]:focus { border-color: var(--berx-danger); }
.berx-settings-delete-btn {
	background: rgba(255,77,79,0.14);
	border: 1px solid rgba(255,77,79,0.4);
	color: var(--berx-danger);
	border-radius: var(--berx-radius-pill);
	padding: 11px 24px;
	font-weight: 700;
	font-size: var(--berx-text-caption);
	cursor: pointer;
	transition: background-color 150ms var(--berx-ease);
}
.berx-settings-delete-btn:hover { background: rgba(255,77,79,0.24); }

@media (max-width: 767px) {
	.berx-settings-device { flex-wrap: wrap; }
	.berx-settings-delete-form { max-width: none; }
}

/* ============================================================
   BERX NOTIFICATIONS — full history page controls.
   Reuses .ossn-notifications-all / .ossn-no-notification, already
   fully dark-themed in components/OssnNotifications/plugins/default/
   css/notifications.php — only the new page-head bar is styled here.
   ============================================================ */
.berx-notifications-page { display: flex; flex-direction: column; gap: var(--berx-space-4); }
.berx-notifications-page-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--berx-space-3);
	flex-wrap: wrap;
}
.berx-notifications-page-head h1 { margin: 0; font-size: var(--berx-text-heading); font-weight: 800; color: var(--berx-white); }
.berx-notifications-page-actions { display: flex; gap: var(--berx-space-2); }
.berx-notif-action-btn {
	display: inline-flex;
	align-items: center;
	padding: 8px 16px;
	border-radius: var(--berx-radius-pill);
	background: var(--berx-glass-2);
	border: 1px solid var(--berx-border-soft);
	color: var(--berx-text-dim) !important;
	font-size: var(--berx-text-caption);
	font-weight: 600;
	text-decoration: none;
	cursor: pointer;
	transition: color 150ms var(--berx-ease), border-color 150ms var(--berx-ease);
}
.berx-notif-action-btn:hover { color: var(--berx-white) !important; border-color: var(--berx-border-strong); }
.berx-notif-action-danger:hover { color: var(--berx-danger) !important; border-color: rgba(255,77,79,0.4); }

@media (max-width: 767px) {
	.berx-notifications-page-head { flex-direction: column; align-items: flex-start; }
	.berx-notifications-page-actions { width: 100%; }
	.berx-notif-action-btn { flex: 1; justify-content: center; }
}

/* ============================================================
   BERX ALBUMS — profile module create/edit/delete controls.
   Grid itself already renders real covers; only the toolbar and
   per-tile controls are new (the JS binding for #ossn-add-album /
   #ossn-photos-edit-album is real, existing OssnPhotos JS — untouched).
   ============================================================ */
.berx-albums-module { display: flex; flex-direction: column; gap: var(--berx-space-3); }
.berx-albums-toolbar { display: flex; justify-content: flex-end; }
.berx-album-add-btn {
	display: inline-flex; align-items: center; gap: 7px;
	background: var(--berx-accent);
	color: #050505;
	border: none;
	border-radius: var(--berx-radius-pill);
	padding: 8px 18px;
	font-weight: 700;
	font-size: var(--berx-text-caption);
	cursor: pointer;
}
.berx-album-tile { position: relative; border-radius: var(--berx-radius); overflow: hidden; }
.berx-album-tile-media { display: block; aspect-ratio: 1 / 1; background: var(--berx-graphite); }
.berx-album-tile-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.berx-album-tile-controls {
	position: absolute; top: 6px; right: 6px;
	display: flex; gap: 4px;
	opacity: 0; transition: opacity 150ms var(--berx-ease);
}
.berx-album-tile:hover .berx-album-tile-controls { opacity: 1; }
.berx-album-ctrl {
	width: 28px; height: 28px;
	display: flex; align-items: center; justify-content: center;
	border: none; border-radius: 50%;
	background: rgba(5,5,5,0.7);
	color: var(--berx-text-dim);
	cursor: pointer;
	text-decoration: none;
}
.berx-album-ctrl:hover { color: var(--berx-white); }
.berx-album-ctrl-danger:hover { color: var(--berx-danger); }
.berx-albums-empty { color: var(--berx-text-faint); font-size: var(--berx-text-caption); }
@media (hover: none) { .berx-album-tile-controls { opacity: 1; } }
