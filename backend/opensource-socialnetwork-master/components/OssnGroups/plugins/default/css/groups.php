/**** <style> ***/

.group-header-menu {}

.group-header-menu .first-item {
	border-left: 1px solid #EEE;
}

#group-header-menu {
	border: 0px;
	padding: 0 10px;
	font-size: 14px;
	font-weight: bold;
	width: 100%;
}

#group-header-menu .dropdown a:hover {
	background: none;
}

#group-header-menu ul {
	list-style: none;
	margin: 0;
	padding: 0;
	border-top: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

#group-header-menu .dropdown-toggle::after {
	display: none;
}

#group-header-menu li:first-child {}

.group-header-sep {
	height: 60px;
}

#group-header-menu li {
	padding: 0px;
	display: inline-block;
}

#group-header-menu>ul>li>a:not(.group-header-more) {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	display: block;
	line-height: 42px;
	margin: 5px 0;
	padding: 0px 10px;
	text-decoration: none;
	font-weight: bold;
	border-radius: var(--berx-radius-sm, 8px);
}

.group-header-more {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border-radius: var(--berx-radius-lg, 10px);
	padding: 10px 20px;
	margin-left: 10px;
}

#group-header-menu>ul>li>a {
	color: var(--berx-text, #f2f2f2);
	font-weight: bold;
	height: 44px;
}

#group-header-menu>li>a:not(.group-header-menu .dropdown-toggle):hover,
#group-header-menu>ul>li:hover>a:not(.group-header-menu .dropdown-toggle) {
	background: var(--berx-accent-soft, rgba(79, 214, 232,0.16));
	color: var(--berx-accent, #4fd6e8);
	text-decoration: none;
	border-radius: var(--berx-radius-lg, 10px);
}

#group-header-menu p {
	clear: left;
}

.groups-sidebar {
	color: var(--berx-text-faint, #6f6f6f);
	font-weight: bold;
	margin-top: 5px;
}

.ossn-group-approve-all {
	float: right;
	margin-bottom: 5px;
	margin-right: 2px;
}

.ossn-layout-group {}

.ossn-layout-group .coloum-left {
	width: 160px;
	float: left;
	display: inline-table;
}

.ossn-layout-group .coloum-middle {
	width: 800px;
	display: inline-table;
	margin-left: 6px;
	margin-right: 6px;
}

.ossn-layout-group .ossn-inner {
	width: 995px;
}


.ossn-group-no-requests {
	text-align: center;
}

.ossn-group-profile {}

/* ---------- BERX community hero ----------
   NOTE ON THE COVER IMAGE: #draggable is repositioned by
   Ossn.Drag()/Ossn.repositionGroupCOVER(), which read and write the
   img's CSS top/left. So the image keeps position:relative and its
   natural height (overflowing the container is what makes dragging
   meaningful) — object-fit/height:100% would visually "fix" the crop
   and silently break cover repositioning for group owners.
   OSSN groups have a cover but NO avatar/icon field, so this hero is
   composed around the cover and typography rather than inventing an
   avatar the backend cannot store. */
.ossn-group-profile .profile-header {
	position: relative;
	width: 100%;
	opacity: .99;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	border-radius: var(--berx-radius-lg, 24px);
	overflow: hidden;
	box-shadow: var(--berx-shadow, 0 20px 60px -20px rgba(0,0,0,0.55));
	background:
		radial-gradient(ellipse at 20% 0%, rgba(79, 214, 232,0.14) 0%, rgba(79, 214, 232,0) 55%),
		var(--berx-glass-1, rgba(255,255,255,0.04));
}

.ossn-group-profile .profile-header .header-bottom {
	position: relative;
	background: linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
	-webkit-backdrop-filter: blur(var(--berx-blur-md, 16px));
	backdrop-filter: blur(var(--berx-blur-md, 16px));
	height: auto;
	min-height: 96px;
	padding: var(--berx-space-5, 20px) var(--berx-space-6, 24px) 0;
	border-bottom-left-radius: var(--berx-radius-lg, 24px);
	border-bottom-right-radius: var(--berx-radius-lg, 24px);
}

/* Name + actions share one flex row; the original used floats, which
   collapsed the row height and forced the fixed 115px header. */
.ossn-group-profile .profile-header .group-header-sep {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: var(--berx-space-4, 16px);
	flex-wrap: wrap;
}

.ossn-group-profile .profile-header .group-name {
	font-size: var(--berx-text-heading, 24px);
	font-weight: 800;
	letter-spacing: -0.02em;
	padding: 0;
	float: none;
	min-width: 0;
	flex: 1;
}

.ossn-group-profile .profile-header .group-name a {
	color: var(--berx-white, #fff);
	text-decoration: none;
	text-shadow: 0 2px 12px rgba(0,0,0,0.35);
}

.ossn-group-profile .profile-header .group-name a:hover {
	color: var(--berx-white, #fff);
}

.groups-buttons {
	float: none;
	padding: 0;
	display: flex;
	align-items: center;
	gap: var(--berx-space-2, 8px);
	flex-wrap: wrap;
}

.group-about .heading {
	color: var(--berx-text-faint, #6f6f6f);
	font-size: 11px;
	font-weight: bold;
}

.group-about .text {
	font-size: 12px;
	margin-top: 4px;
}

.members-count {
	margin-top: 4px;
	font-size: 12px;
	font-weight: bold;
}

.group-closed-container {}

.group-closed-container p {
	padding: 3px 6px;
}

.ossn-group-cover {
	position: relative;
	overflow: hidden;
	height: 420px;
	border-top-right-radius: var(--berx-radius-lg, 24px);
	border-top-left-radius: var(--berx-radius-lg, 24px);
	background: radial-gradient(ellipse at top, #1a1216 0%, var(--berx-black, #050505) 70%);
}

/* Cinematic scrim so the name/actions below stay legible against any
   cover photo. pointer-events:none keeps the drag surface usable. */
.ossn-group-cover::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(to top, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.12) 38%, rgba(5,5,5,0) 62%);
	pointer-events: none;
	z-index: 1;
}

.ossn-group-cover img {
	position: relative; /* required by the reposition drag — do not change */
	width: 100%;
}

.ossn-group-cover:hover>.ossn-group-cover-button {
	display: block;
}

.ossn-group-cover-button {
	margin-right: 10px;
	top: 0;
	margin-top: 20px;
	z-index: 9;
	position: absolute;
	right: 0px;
}

.ossn-group-cover-button a {
	display: inline-block;
}

.group-c-position {
	display: none !important;
}

.groups-buttons a {
	display: inline-block;
}

.ossn-notification-icon-groups,
.ossn-notification-icon-groups:before {
	display: inline-block;
}

.ossn-notification-icon-groups:before {
	content: "\f0c0";
	font-family: 'Font Awesome 5 Free';
	font-style: normal;
	font-weight: 900;
	font-size: 18px;
}

.ossn-group-notification-item .data {
	display: inline;
	margin-left: 5px;
}

.delete-group {
	float: right;
}

.group-widget-members img {
	margin-right: 5px;
	/* group-widget-members img need bottom margin #699 */
	margin-bottom: 5px;
}

.ossn-notification-unviewed {
	background: var(--berx-accent-soft, rgba(79, 214, 232,0.16));
}

.ossn-group-profile .widget-description .widget-contents {
	text-align: justify;
}

.ossn-group-profile .group-requests-widget .widget-contents {
	text-align: center;
}

.ossn-group-profile .group-requests-widget a {
	font-weight: bold;
	text-transform: uppercase;
}

.group-search-details {
	padding: 20px;
}

.group-search-details .group-name {
	font-weight: bold;
	font-size: 15px;

}

.group-search-items .row {
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	border-radius: var(--berx-radius, 16px);
	margin-left: 0;
	margin-right: 0;
	margin-bottom: 10px;
}

.group-search-details .ossn-group-search-by {
	margin-top: 5px;
}

.group-search-details .ossn-group-search-by a {
	margin-left: 5px;
}

@media only screen and (max-width: 767px) {
	.btn-responsive {
		padding: 4px 9px;
		font-size: 90%;
		line-height: 1.2;
	}
}

.group-header-menu .dropdown-menu a:first-child:hover {}

.group-header-menu .dropdown-menu li {
	width: 100%;
}

.group-header-more i {
	margin-right: 0px;
}

.group-total-members {
	font-size: 14px;
	color: var(--berx-text-faint, #6f6f6f);
	margin-bottom: 0;
}

/**v6.2**/
@media (max-width: 480px) {
	.group-header-menu .dropdown-toggle {
		padding: 8px 10px !important;
		margin: 0 !important;
	}
}


@media (max-width: 767px) {
	.ossn-group-members {
		text-align: center;
	}

	.ossn-group-members .request-controls {
		float: none;
		padding-bottom: 10px;
	}

	.ossn-group-members .uinfo .userlink {
		float: none !important;
	}
}

.group-add-privacy .radio-block span {
	margin-top: 5px;
}

.group-add-privacy .radio-block .ossn-radio-input {
	float: left;
}

/* Was `width: auto`, which left the cover at its natural pixel width —
   narrow uploads sat in a letterboxed gutter inside the hero. The BERX
   hero rule above (`width: 100%`) is the intended sizing; this later
   top-level rule silently overrode it, so it is neutralised here rather
   than fought with !important. Height stays unset so the image can
   still overflow the container, which is what makes the owner-only
   cover drag-reposition meaningful. */
.ossn-group-cover img {
	width: 100%;
	height: auto;
}

@media (max-width: 480px) {

	/**********************
    	Groups
    ************************/
	.ossn-group-cover {
		height: 180px !important;
	}

	.ossn-group-cover-header,
	.ossn-group-profile .profile-header,
	.ossn-group-profile .profile-header .header-bottom {
		height: auto !important;
	}

	.ossn-group-profile .profile-header {
		max-height: inherit !important;
	}

	.ossn-group-profile .profile-header .group-name {
		float: none !important;
	}

	.group-name {
		width: 100%;
	}

	.group-header-sep {
		height: auto !important;
		text-align: center;
	}

	.ossn-group-members {
		margin-left: 15px;
		margin-right: 15px;
	}

	.ossn-group-members .request-controls,
	.ossn-group-members .uinfo {
		display: block;
	}

	.ossn-group-members .uinfo .userlink {
		margin-left: 10px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

@media only screen and (max-width: 1199px) {
	.group-search-details {
		margin-left: 10px;
	}
}

.menu-section-item-groups:before {
	content: "\f07b" !important
}

.ossn-group-members {
	margin-right: 5px;
}

.ossn-group-cover-button a:before {
	font-family: 'Font Awesome 5 Free';
	display: inline-block;
	padding-right: 5px;
	vertical-align: middle;
	font-weight: 900;
}

#reposition-group-cover:before {
	content: "\f303";
}

#add-cover-group:before {
	content: "\f0b2";
	font-family: 'Font Awesome 5 Free';
}
/* ============================================================
   BERX COMMUNITIES — premium surfaces
   Targets the real OssnGroups markup only. Every JS hook is left
   structurally untouched: #group-upload-cover, .coverfile, .upload,
   #draggable, #container, #add-cover-group, #reposition-group-cover,
   .group-c-position, .ossn-group-cover, .groups-buttons, .header-users,
   .ossn-covers-uploading-annimation, .ossn-group-change-owner.
   ============================================================ */

/* Member count reads as a meta chip under the title, not body text. */
.ossn-group-profile .group-total-members {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin: var(--berx-space-2, 8px) 0 0;
	padding: 3px 10px;
	border-radius: var(--berx-radius-pill, 999px);
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	color: var(--berx-text-dim, #a3a3a3);
	font-size: var(--berx-text-caption, 13px);
	font-weight: 600;
}
.ossn-group-profile .group-total-members i { color: var(--berx-accent, #4fd6e8); }

/* ---------- Cover controls: glass, revealed on hover ---------- */
.ossn-group-cover-button {
	margin-right: var(--berx-space-4, 16px);
	margin-top: var(--berx-space-4, 16px);
	display: none;
	z-index: 9;
}
.ossn-group-cover-button a {
	display: inline-block;
	-webkit-backdrop-filter: blur(var(--berx-blur-md, 16px));
	backdrop-filter: blur(var(--berx-blur-md, 16px));
}
/* SCOPED (freeze pass): this selector is ALSO defined by OssnProfile's
   profile.php, and both files extend css/ossn.default — so they load
   into the same stylesheet and the later one silently won for BOTH the
   profile cover upload and the group cover upload. Scoping to
   .ossn-group-cover makes the group rule apply only to groups and
   leaves the profile overlay to profile.php, removing the load-order
   dependency entirely. Proven by structural analysis, not guessed. */
.ossn-group-cover .ossn-covers-uploading-annimation {
	position: absolute;
	inset: 0;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(5,5,5,0.55);
	-webkit-backdrop-filter: blur(var(--berx-blur-sm, 8px));
	backdrop-filter: blur(var(--berx-blur-sm, 8px));
}

/* ---------- Community tab menu ---------- */
#group-header-menu {
	margin-top: var(--berx-space-4, 16px);
	border-top: none;
}
#group-header-menu ul {
	display: flex;
	flex-wrap: wrap;
	gap: var(--berx-space-1, 4px);
	border-top: none;
	padding-bottom: var(--berx-space-2, 8px);
}
#group-header-menu>ul>li>a:not(.group-header-more) {
	display: block;
	padding: var(--berx-space-2, 8px) var(--berx-space-4, 16px);
	border-radius: var(--berx-radius-pill, 999px);
	color: var(--berx-text-dim, #a3a3a3);
	font-size: var(--berx-text-caption, 13px);
	font-weight: 600;
	text-decoration: none;
	transition: background-color 150ms var(--berx-ease, ease), color 150ms var(--berx-ease, ease);
}
#group-header-menu>li>a:not(.group-header-menu .dropdown-toggle):hover,
#group-header-menu>ul>li:hover>a:not(.group-header-menu .dropdown-toggle) {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	color: var(--berx-white, #fff);
	border-radius: var(--berx-radius-pill, 999px);
	text-decoration: none;
}

/* ---------- Sidebar widgets / members ---------- */
.ossn-group-profile .widget-description {
	white-space: pre-line;
	line-height: 1.55;
}
.group-widget-members .widget-contents {
	display: flex;
	flex-wrap: wrap;
	gap: var(--berx-space-2, 8px);
}
.group-widget-members .user-icon-small {
	width: 46px;
	height: 46px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	transition: transform 200ms var(--berx-ease, ease), border-color 200ms var(--berx-ease, ease);
}
.group-widget-members a:hover .user-icon-small {
	transform: translateY(-2px);
	border-color: var(--berx-accent, #4fd6e8);
}
.group-requests-widget .widget-contents a {
	color: var(--berx-accent, #4fd6e8) !important;
	font-weight: 600;
	font-size: var(--berx-text-caption, 13px);
}

/* ---------- Closed/private community state ---------- */
.group-closed-container .ossn-widget {
	border: 1px dashed var(--berx-border, rgba(255,255,255,0.12));
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
	text-align: center;
}
.group-closed-container p {
	padding: var(--berx-space-4, 16px) var(--berx-space-5, 20px);
	color: var(--berx-text-dim, #a3a3a3);
	margin: 0;
}

/* ---------- Community discovery cards (search/browse) ---------- */
.group-search-items .row {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	padding: var(--berx-space-3, 12px);
	transition: border-color 200ms var(--berx-ease, ease), transform 200ms var(--berx-ease, ease);
}
.group-search-items .row:hover {
	transform: translateY(-2px);
	border-color: var(--berx-border-strong, rgba(255,255,255,0.18));
}
.group-search-details .group-name a {
	color: var(--berx-white, #fff) !important;
	font-weight: 700;
	text-decoration: none;
}

/* ---------- No-requests / empty states ---------- */
.ossn-group-no-requests {
	text-align: center;
	padding: var(--berx-space-10, 40px) var(--berx-space-5, 20px);
	color: var(--berx-text-dim, #a3a3a3);
	border: 1px dashed var(--berx-border, rgba(255,255,255,0.12));
	border-radius: var(--berx-radius, 16px);
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
}

@media (max-width: 991px) {
	.ossn-group-cover { height: 240px; }
	.ossn-group-profile .profile-header .header-bottom {
		padding: var(--berx-space-4, 16px) var(--berx-space-4, 16px) 0;
	}
	.ossn-group-profile .profile-header .group-name {
		font-size: var(--berx-text-title, 18px);
	}
	.groups-buttons { width: 100%; }
	.groups-buttons a { flex: 1; text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
	.group-search-items .row,
	.group-widget-members .user-icon-small { transition: none !important; }
	.group-search-items .row:hover,
	.group-widget-members a:hover .user-icon-small { transform: none; }
}

/* ---------- BERX: owner-only member management ---------- */
.berx-group-owner-badge {
	margin-left: 6px;
	color: var(--berx-accent, #4fd6e8);
	font-size: 12px;
}
.user-controls-box { display: flex; align-items: center; gap: var(--berx-space-2, 8px); flex-wrap: wrap; }
.berx-group-remove-member { white-space: nowrap; }
