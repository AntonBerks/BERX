/***** <style> **********/
/***********************************
	Ossn Notifications
***************************************/

.ossn-notifications-box .collapsing {
	-webkit-transition: none;
	transition: none;
	display: none;
}

.ossn-notifications-box {
	width: 430px;
	color: var(--berx-text, #f2f2f2);
	position: absolute;
	top: 100%;
	right: 20px;
	z-index: 1000;
	display: none;
	float: left;
	min-width: 160px;
	padding: 5px 0;
	margin: 2px 0 0;
	font-size: 14px;
	text-align: left;
	list-style: none;
	background: var(--berx-glass-3, rgba(255,255,255,0.10));
	-webkit-backdrop-filter: blur(var(--berx-blur-lg, 28px));
	backdrop-filter: blur(var(--berx-blur-lg, 28px));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	border-radius: var(--berx-radius, 16px);
	box-shadow: var(--berx-shadow, 0 6px 12px rgba(0,0,0,0.35));
}

.ossn-notifications-box .notificaton-item {
	border-bottom: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

.ossn-notifications-box .notificaton-item:hover,
.ossn-notifications-box .notificaton-item .active {
	background-color: var(--berx-glass-2, rgba(255,255,255,0.07));
}

.ossn-notifications-box .type-name {
	font-size: 13px;
	font-weight: bold;
	padding: 1px 10px 5px 10px;
	color: var(--berx-text, #f2f2f2);
	height: 25px;
	border-bottom: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

.ossn-notification-box-loading {
	margin: 0 auto;
	margin-top: 20px;
	margin-bottom: 20px;
}

.ossn-no-notification {
	text-align: center;
	padding: 10px;
}

.ossn-notifications-box .type-name .title {
	display: inline-block;
}

.ossn-notifications-box .type-name .links {
	display: inline-block;
	float: right;
}

.ossn-notifications-box .type-name .links a {
	color: var(--berx-accent, #D9A93F);
	display: inline;
	font-weight: normal;
}

.ossn-notifications-box .notification-image,
.ossn-notifications-box .notification-image img {
	width: 50px;
	height: 50px;
}

.ossn-notifications-all a {
	padding: 10px;
}

.ossn-notifications-box .bottom-all a,
.ossn-notifications-box .notfi-meta strong {
	color: var(--berx-accent, #D9A93F);
}

.ossn-notifications-box .notfi-meta {
	width: 330px;
	margin-left: 5px;
	display: inline-block;
	float: right;
	color: var(--berx-text, #f2f2f2);
}

.ossn-notifications-box .bottom-all a {
	font-weight: bold;
}

.ossn-notifications-box .bottom-all {
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
	text-align: center;
	padding: 0px;
	padding-top: 10px;
	display: block;
	height: 40px;
	border-top: 1px solid #eee;
	border-bottom-left-radius: 7px;
	border-bottom-right-radius: 7px;
}

.ossn-notifications-box .metadata {
	margin-bottom: -5px;
}

.ossn-notifications-box .messages-inner {
	max-height: 400px;
	overflow: hidden;
	overflow-y: scroll;
}

.latest-users img {
	margin-bottom: 5px;
}

.ossn-notification-mark-read {
	float: right;
}

.ossn-notif-delete-item i {
	margin-right: 0;
	font-size: initial !important;
	margin-top: initial !important;
}

.ossn-notif-delete-item {
	position: absolute;
	right: 0;

	top: 0;
	margin-top: 0px;
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	width: 30px;
	height: 30px;
	text-align: center;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	border-radius: 100%;

	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.ossn-notif-delete-item {
	opacity: 0;
	transform: scale(0.8);
	transition: all 0.3s ease;
	pointer-events: none;
	/* prevent accidental clicks when hidden */
}

/* Show on hover of the <a> inside <li> */
.ossn-notifications-all li a:hover .ossn-notif-delete-item {
	opacity: 1;
	transform: scale(1);
	pointer-events: auto;
}

.ossn-notifications-all li {
	display: block;
}

.ossn-notifications-all a:hover {
	cursor: pointer;
	background-color: transparent;
	text-decoration: none;
}

.ossn-notifications-box li:hover,
.ossn-notifications-box a:hover,
.ossn-notifications-all a:hover,
.ossn-notifications-all li:hover {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
}

.ossn-notification-container {
	background-color: #dc0d17;
	background-image: -webkit-linear-gradient(#fa3c45, #dc0d17);
	color: #fff;
	min-height: 13px;
	padding: 1px 3px;
	text-shadow: 0 -1px 0 rgba(0, 0, 0, .4);
	-webkit-border-radius: 2px;
	-webkit-box-shadow: 0 1px 1px rgba(0, 0, 0, .7);
	-webkit-background-clip: padding-box;
	display: inline-block;
	font-size: 11px;
	line-height: normal;
	position: absolute;
	margin-left: -10px;
	z-index: 1;
}

.notification-friends .image {
	width: 50px;
	height: 50px;
	display: inline-table;
	float: left;
}

.ossn-notifications-friends-inner a {
	color: var(--berx-text, #f2f2f2) !important;
	display: inline-block !important;
}

.ossn-notifications-friends-inner {
	padding: 0px 5px;
}

.ossn-notifications-friends-inner form {
	display: inline-table;
}

.ossn-notification-page li img {
	display: none;
}

.notification-friends li {
	width: 100%;
	border-bottom: 1px solid #eee;
}

.notification-friends .notfi-meta a {
	color: var(--berx-accent, #D9A93F);
	font-weight: bold;
	display: inline-block;
	width: 200px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.ossn-notifications-friends-inner .controls {
	float: right;
	margin-top: 6px;
	display: inline-block;
}

.friends-added-text {
	/**float: left !important;
    margin-top: -18px !important;
    display: block !important;
    margin-left: 10px; **/
	font-size: 13px;
}

.ossn-notifications-friends-inner .btn {
	padding: 3px 9px;
	border-radius: 1px;
}

.notification-friends {
	max-height: 400px;
}

.ossn-notification-icon-comment {
	display: inline-block;
}

.ossn-notification-icon-comment:before {
	content: "\f075";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: 900;
	font-size: 18px;
}

.ossn-notification-icon-tag {
	display: inline-block;
}

.ossn-notification-icon-tag:before {
	content: "\f507";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: 900;
	font-size: 18px;
}

.ossn-notification-icon-like {
	display: inline-block;
}

.ossn-notification-icon-like:before {
	content: "\f164";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: normal;
	font-size: 18px;
}

.ossn-notification-icon-like-post:before {
	display: inline-block;
}

.ossn-notification-icon-like-post:before {
	content: "\f087";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: 900;
	font-size: 18px;
}

.ossn-notifications-all .data {
	display: inline;
	margin-left: 5px;
}

.ossn-notification-friend-submit {
	background: var(--berx-accent-soft, rgba(217, 169, 63,0.16));
}

.menu-section-item-notifications:before {
	content: "\f0f3" !important
}

.ossn-notifications-all .time-created {
	font-weight: bold;
	font-size: 13px;
	margin-left: 10px;
}

@media (max-width: 480px) {
	/***************************
    	Topbar notification box
   *****************************/
	.ossn-notifications-box {
		width: 300px !important;
	}

	.ossn-notifications-box .notfi-meta {
		width: 210px;
	}

	.notification-friends .notfi-meta a {
		width: 100px;
	}

	.ossn-notification-messages .user-item .data {
		width: 215px !important;
	}

	.ossn-notification-messages .user-item .data .name {
		width: 110px !important;
	}

	.ossn-notification-messages .reply-text-from {
		width: 200px !important;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}
/* ============================================================
   BERX NOTIFICATIONS
   Styles the real template markup only
   (notifications/template/view.php):
     li.ossn-notification-unviewed   unread row
     .ossn-notification-item-a       whole-row link
     .notification-image img         real actor avatar
     .notfi-meta / .data             text + strong actor name
     .ossn-notification-icon-{type}  comment|tag|like|groups|poke
     .ossn-notif-delete-item         per-item delete
   Only the types OSSN can actually generate are given an identity:
   like, comment, tag, groups (join request), poke, friendrequest,
   dating. No invented types, no invented actions.
   ============================================================ */

/* ---------- Unread state ----------
   REAL DEFECT FIX: the template emits class="ossn-notification-unviewed"
   on unread rows, but nothing in OSSN's CSS ever styled it — read and
   unread notifications rendered identically. */
.ossn-notifications-all li.ossn-notification-unviewed,
.ossn-notification-page li.ossn-notification-unviewed {
	position: relative;
	background: var(--berx-accent-soft, rgba(217, 169, 63,0.16));
	border-radius: var(--berx-radius, 16px);
}
.ossn-notifications-all li.ossn-notification-unviewed::before,
.ossn-notification-page li.ossn-notification-unviewed::before {
	content: '';
	position: absolute;
	left: 6px;
	top: 50%;
	transform: translateY(-50%);
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--berx-accent, #D9A93F);
	box-shadow: 0 0 8px rgba(217, 169, 63,0.8);
}
.ossn-notifications-all li.ossn-notification-unviewed .data,
.ossn-notification-page li.ossn-notification-unviewed .data {
	color: var(--berx-white, #fff);
}

/* ---------- Row layout ---------- */
.ossn-notifications-all li,
.ossn-notification-page li {
	list-style: none;
	border-radius: var(--berx-radius, 16px);
	transition: background-color 150ms var(--berx-ease, ease);
}
.ossn-notification-item-a {
	align-items: center;
	gap: var(--berx-space-3, 12px);
	padding: var(--berx-space-3, 12px) var(--berx-space-3, 12px) var(--berx-space-3, 12px) var(--berx-space-4, 16px);
	border-radius: var(--berx-radius, 16px);
	text-decoration: none;
	color: var(--berx-text, #f2f2f2) !important;
}
.ossn-notifications-all li:hover,
.ossn-notification-page li:hover {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
}

/* Real actor avatar, with the type glyph badged onto it so the row
   reads at a glance without a second column. */
.ossn-notification-page .notification-image,
.ossn-notifications-all .notification-image {
	position: relative;
	flex-shrink: 0;
}
.ossn-notification-page li img,
.ossn-notifications-all .notification-image img {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

.ossn-notifications-all .notfi-meta,
.ossn-notification-page .notfi-meta {
	display: flex;
	align-items: center;
	gap: var(--berx-space-2, 8px);
	min-width: 0;
}
.ossn-notifications-all .data,
.ossn-notification-page .data {
	display: block;
	margin-left: 0;
	font-size: var(--berx-text-body, 15px);
	line-height: 1.4;
	color: var(--berx-text-dim, #a3a3a3);
	min-width: 0;
	flex: 1;
}
.ossn-notifications-all .data strong,
.ossn-notification-page .data strong {
	color: var(--berx-white, #fff);
	font-weight: 700;
}
.ossn-notifications-all .time-created,
.ossn-notification-page .time-created {
	display: block;
	margin-top: 2px;
	font-size: var(--berx-text-micro, 11px);
	color: var(--berx-text-faint, #6f6f6f);
}

/* ---------- Type glyphs: badged, colour-coded by real type ---------- */
.ossn-notifications-all [class^="ossn-notification-icon-"],
.ossn-notification-page [class^="ossn-notification-icon-"] {
	order: 2;
	flex-shrink: 0;
	width: 30px;
	height: 30px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	color: var(--berx-text-dim, #a3a3a3);
}
.ossn-notifications-all [class^="ossn-notification-icon-"]:before,
.ossn-notification-page [class^="ossn-notification-icon-"]:before {
	font-size: 13px !important;
	line-height: 1;
}
.ossn-notification-icon-like { color: var(--berx-accent, #D9A93F) !important; }
.ossn-notification-icon-comment { color: #4f8dff !important; }
.ossn-notification-icon-tag { color: #2ee6a8 !important; }
.ossn-notification-icon-groups { color: #c07cff !important; }
.ossn-notification-icon-poke { color: #ff5d73 !important; }
/* Groups / poke had no glyph at all in core CSS — only a bare class. */
.ossn-notification-icon-groups:before {
	content: "\f0c0";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: 900;
}
.ossn-notification-icon-poke:before {
	content: "\f256";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: 900;
}

/* ---------- Per-item delete: revealed on hover, never covering text ---------- */
.ossn-notifications-all .ossn-notif-delete-item,
.ossn-notification-page .ossn-notif-delete-item {
	order: 3;
	position: static;
	flex-shrink: 0;
	width: 30px;
	height: 30px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	opacity: 0;
	transition: opacity 150ms var(--berx-ease, ease), background-color 150ms var(--berx-ease, ease);
}
.ossn-notifications-all li:hover .ossn-notif-delete-item,
.ossn-notification-page li:hover .ossn-notif-delete-item {
	opacity: 1;
}
.ossn-notifications-all .ossn-notif-delete-item:hover,
.ossn-notification-page .ossn-notif-delete-item:hover {
	background: rgba(255,77,79,0.16);
}
/* Touch devices get no hover — keep the control permanently visible. */
@media (hover: none) {
	.ossn-notifications-all .ossn-notif-delete-item,
	.ossn-notification-page .ossn-notif-delete-item {
		opacity: 0.65;
	}
}

/* ---------- Empty state ---------- */
.ossn-no-notification {
	text-align: center;
	padding: var(--berx-space-10, 40px) var(--berx-space-5, 20px);
	color: var(--berx-text-dim, #a3a3a3);
	font-size: var(--berx-text-caption, 13px);
}

@media (prefers-reduced-motion: reduce) {
	.ossn-notifications-all li,
	.ossn-notification-page li,
	.ossn-notifications-all .ossn-notif-delete-item { transition: none !important; }
}
