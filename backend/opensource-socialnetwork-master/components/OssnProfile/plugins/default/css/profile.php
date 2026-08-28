/**** <style> ******/
/*******************************
	Profile
********************************/
.ossn-profile .top-container {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	color: var(--berx-text, #f2f2f2);
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	-webkit-backdrop-filter: blur(var(--berx-blur-md, 16px));
	backdrop-filter: blur(var(--berx-blur-md, 16px));
	border-bottom-left-radius: var(--berx-radius, 5px);
	border-bottom-right-radius: var(--berx-radius, 5px);
	border-top-right-radius: var(--berx-radius-lg, 10px);
	border-top-left-radius: var(--berx-radius-lg, 10px);
}

.ossn-profile-usermetadata {
	position: relative;
	min-height: 85px;
	padding-bottom: 10px;
	border-bottom: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

.profile-hr-menu {
	border-bottom: none;
	border-bottom-left-radius: var(--berx-radius-lg, 24px);
	border-bottom-right-radius: var(--berx-radius-lg, 24px);
}

/* ---------- Profile hero: cinematic cover, spatial depth ---------- */
.ossn-profile .top-container .profile-cover {
	height: 420px;
	overflow: hidden;
	opacity: .99;
	position: relative;
	/* Ambient embers behind the cover photo, visible while it loads and
	   through its edges, plus a strong bottom gradient so name/avatar
	   stay legible over any photo. */
	background:
		linear-gradient(to top, var(--berx-black, #050505) 0%, rgba(5,5,5,0.05) 45%, rgba(5,5,5,0.05) 60%, rgba(5,5,5,0.65) 100%),
		radial-gradient(ellipse at top, #1a1216 0%, var(--berx-black, #050505) 70%);
}

.ossn-profile .top-container .profile-cover::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(to top, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.15) 32%, rgba(5,5,5,0) 55%);
	pointer-events: none;
}

.ossn-profile .top-container .profile-cover img.profile-cover-img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	position: relative;
	z-index: 0;
}

.ossn-profile-row {
	margin-bottom: 20px;
}

.profile-hr-menu ul {
	margin: 7px 0 5px;
	padding: 0px;
}

.profile-hr-menu ul li {
	display: inline-block;
}

.profile-hr-menu ul {
	display: flex;
	flex-wrap: wrap;
	gap: var(--berx-space-1, 4px);
	padding: var(--berx-space-2, 8px) !important;
}

.profile-hr-menu ul li a:not(.dropdown a) {
	display: block;
	padding: var(--berx-space-2, 8px) var(--berx-space-4, 16px);
	margin-right: 0;
	font-weight: 600;
	font-size: var(--berx-text-caption, 13px);
	color: var(--berx-text-dim, rgba(245,245,247,0.64));
	border-radius: var(--berx-radius-pill, 999px);
	transition: background-color 150ms var(--berx-ease, ease), color 150ms var(--berx-ease, ease);
}

.profile-hr-menu a:hover {
	color: var(--berx-white, #fff);
}

.profile-hr-menu>li>a:not(.profile-hr-menu .dropdown-toggle):hover,
.profile-hr-menu>ul>li:hover>a:not(.profile-hr-menu .dropdown-toggle) {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	text-decoration: none;
	border-radius: var(--berx-radius-pill, 999px);
	color: var(--berx-white, #fff);
}

.profile-hr-menu .dropdown-menu {
	margin-left: 0px;
}

.profile-hr-menu .dropdown-menu li {
	display: block;
	border-bottom: 0;
	padding: initial;
	margin: auto;
}

.profile-hr-menu .dropdown a i {
	margin-left: 5px;
}

.profile-hr-menu .dropdown-menu li a {
	border-right: 0px;
	margin-right: 0px;
}

.profile-hr-menu ul li:hover {}

.profile-hr-menu ul li:last-child {
	border-right: none;
}

/* ---------- Avatar: floats over the hero, glass ring + soft glow ---------- */
.ossn-profile .profile-photo {
	position: absolute;
	margin-left: 28px;
	margin-top: -96px;
	background-color: var(--berx-glass-3, rgba(255,255,255,0.10));
	border: 3px solid var(--berx-black, #050505);
	border-radius: 50%;
	padding: 4px;
	width: 176px;
	height: 176px;
	box-shadow: var(--berx-shadow, 0 20px 60px -20px rgba(0,0,0,0.55)), 0 0 0 1px var(--berx-border-soft, rgba(255,255,255,0.08));
	z-index: 2;
}

.ossn-profile .profile-photo img {
	border-radius: 50%;
	width: 168px;
	height: 168px;
	object-fit: cover;
}

.profile-menu-hr-container {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	-webkit-backdrop-filter: blur(var(--berx-blur-md, 16px));
	backdrop-filter: blur(var(--berx-blur-md, 16px));
	margin: 10px 0;
	border-radius: var(--berx-radius, 5px);
}

.ossn-profile .user-fullname {
	color: var(--berx-white, #fff);
	font-weight: 800;
	font-size: var(--berx-text-heading, 24px);
	letter-spacing: -0.01em;
	max-width: 600px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	text-shadow: 0 2px 12px rgba(0,0,0,0.4);
}

.ossn-profile-role {
	font-size: 15px !important;
	color: var(--berx-text-dim, rgba(245,245,247,0.64));
}

.ossn-profile .user-username {
	font-size: var(--berx-text-caption, 13px);
	font-weight: 400;
	color: var(--berx-text-faint, rgba(245,245,247,0.38));
}

/* Legacy light-mode "grey" utility button, now a small glass chip so it
   still functions anywhere older markup references it, without breaking
   the dark surface it now sits on. */
.btn-standalone-grey {
	color: var(--berx-text, #f5f5f7);
	font-weight: 600;
	text-decoration: none;
	width: auto;
	margin: 0;
	font-size: 12px;
	line-height: 16px;
	padding: 5px 10px;
	cursor: pointer;
	outline: none;
	text-align: center;
	white-space: nowrap;
	box-shadow: none;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	border-radius: var(--berx-radius-pill, 999px);
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	transition: background-color 150ms var(--berx-ease, ease);
}

.btn-standalone-grey:active {
	background: var(--berx-glass-3, rgba(255,255,255,0.10));
	box-shadow: none;
}

.btn-standalone-grey:hover {
	color: var(--berx-white, #fff);
	background: var(--berx-glass-3, rgba(255,255,255,0.10));
	text-decoration: none;
}

.profile-cover-controls {
	position: absolute;
	width: 100%;
	top: 0;
	margin-top: 20px;
	z-index: 1;
}

.profile-cover-controls a:before {
	font-family: 'Font Awesome 5 Free';
	display: inline-block;
	padding-right: 5px;
	vertical-align: middle;
	font-weight: 900;
}


.profile-cover-controls a {
	float: right;
	position: relative;
	margin-right: 10px;
}

.change-cover:before {
	content: "\f303";
}

.reposition-cover:before {
	content: "\f0b2";
	font-family: 'Font Awesome 5 Free';
}

.profile-menu {
	position: relative;
	margin-right: 20px;
}

#cover-menu {
	display: none;
}

.upload-photo {
	background: var(--berx-accent, #D9A93F);
	position: absolute;
	font-size: 15px;
	font-family: sans-serif;
	bottom: 0;
	right: 0;
	margin-bottom: 20px;
	width: 40px;
	height: 40px;
	border-radius: 50%;
}

.upload-photo span {
	text-align: center;
	display: block;
	margin-top: 5px;
	font-size: 20px;
	color: #050505;
}

.user-cover-uploading {
	opacity: 0.4;
}

.user-photo-uploading {
	height: 100%;
	opacity: 0.8;
	background: var(--berx-glass-3, rgba(255,255,255,0.10));
	width: 100%;
	position: absolute;
	border-radius: 50%;
	margin-bottom: 0;
	margin-left: -5px;
	margin-top: -5px;
}

.user-photo-uploading span {
	display: none;
}

.ossn-profile-bottom {
	margin-top: 10px;
}

.page-sidebar,
.ossn-profile-sidebar {}

.ossn-layout-media .content {
	margin-right: 10px;
	margin-left: 10px;
}

.ossn-profile-extra-menu {
	display: inline-block;
}

#ossn-home-signup .checkbox-block,
.ossn-profile-bottom .ossn-edit-form .checkbox-block {
	margin-top: 0;
	margin-bottom: 0;
}

@media (max-width: 480px) {
	.profile-hr-menu ul li {
		padding: 10px 0;
	}

	/******************************
    	Profile
    ********************************/
	.ossn-profile .profile-photo img {}

	.ossn-profile .user-fullname {
		width: auto;
		white-space: normal;
	}

	.ossn-profile .top-container .profile-cover {
		height: 220px;
	}

	.ossn-profile .profile-photo {
		position: relative;
		width: 120px;
		height: 120px;
		margin: -60px auto 0;
	}

	.ossn-profile .profile-photo img {
		width: 112px;
		height: 112px;
	}

	.ossn-profile-usermetadata {
		min-height: 230px;
	}

	.profile-menu {
		float: initial;
		text-align: center;
		margin: 10px 0;
	}

	.ossn-profile .top-container .profile-cover img {
		width: auto;
	}

	.upload-photo {
		margin-bottom: 0px;
		transform: scale(0.8);
	}

	.profile-hr-menu ul li {
		display: block;
		margin-right: 0px;
		margin-left: 10px;
	}

	.profile-hr-menu ul li a:not(.dropdown a) {
		margin-right: 0px;
		padding: 10px;
	}

	.ossn-profile-role {
		font-size: 15px !important;
		position: relative;
	}
}

@media only screen and (max-width: 992px) {
	.profile-menu {
		margin: 10px 0;
	}

	.ossn-profile .user-fullname {
		max-width: initial;
	}
}

@media only screen and (max-width: 1199px) {
	.ossn-profile .user-fullname {
		max-width: initial;
	}
}

@media only screen and (max-width: 767px) {
	.ossn-profile .user-fullname {
		max-width: initial;
	}

}

/**************************** End *****************/
.ossn-profile-module-friends img {
	padding: 1.5px;
}

.ossn-profile-module-friends .user-image {
	width: 100px;
	height: 100px;
	margin-bottom: 5px;
	display: inline-block;
}

.ossn-profile-module-friends .user-name {
	position: absolute;
	margin-top: -27px;
	margin-left: 8px;
	font-size: 12px;
	color: #fff;
	max-width: 90px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ossn-profile-module-friends h3 {
	padding: 4px;
	text-align: center;
	font-size: 16px;
	color: var(--berx-text-dim, rgba(245,245,247,0.64));
}

.ossn-profile-extra-menu {
	display: inline-block;
}

.ossn-profile-extra-menu .btn-action i {
	margin: 0 auto;
}

.ossn-profile .profile-cover img {
	position: relative;
}

/* Was a translucent WHITE overlay — a light-mode leftover that flashed
   over the dark profile hero during a cover upload. Darkened to match
   the group overlay; scoped by its own file to the profile only (see
   the note in OssnGroups/css/groups.php about the shared selector). */
.ossn-covers-uploading-annimation {
	float: right;
	background: rgba(5, 5, 5, 0.62);
	padding: 20px;
	border-radius: 20px;
	z-index: 1;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.ossn-profile-bottom .ossn-edit-form .radio-block {
	margin-top: 0;
	margin-bottom: 0;
}

/** profile edit layout **/
.ossn-profile-edit-layout {
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
	color: var(--berx-text, #f2f2f2);
	border-top-left-radius: var(--berx-radius, 5px);
	border-top-right-radius: var(--berx-radius, 5px);
}

.profile-edit-tabs {}

.profile-edit-tabs a {
	padding: 12px 4px 12px 16px;
	display: block;
	border-left: 2px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	color: var(--berx-text-dim, rgba(245,245,247,0.64));
	cursor: pointer;
	text-decoration: none;
}

.profile-edit-tab-item-active {
	border-left: 3px solid var(--berx-accent, #D9A93F) !important;
	color: var(--berx-white, #fff) !important;
	font-weight: bold;
}

.profile-edit-layout-right {
	padding: 10px;
	border-left: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

.profile-edit-layout-title {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	color: var(--berx-white, #fff);
	padding: 12px 20px;
	font-weight: bold;
	border-top-left-radius: var(--berx-radius, 16px);
	border-top-right-radius: var(--berx-radius, 16px);
}

.profile-hr-menu .dropdown-toggle::after {
	display: none;
}