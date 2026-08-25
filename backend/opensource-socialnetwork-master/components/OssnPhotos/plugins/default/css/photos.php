/*** <style> ******/
.ossn-profile-module-albums img {
	padding: 1.5px;
	width: 100px;
	height: 100px;
}

.ossn-profile-module-albums h3 {
	padding: 4px;
	font-size: 16px;
	text-align: center;
	color: var(--berx-text-dim, #ccc);
}

.ossn-photos {
	display: flex;
	flex-wrap: wrap;
	gap: 15px;
	padding: 0;
	list-style: none;
	justify-content: flex-start;
}

.ossn-photos li {
	width: 200px;
	height: 200px;
	position: relative;
	border-radius: var(--berx-radius-sm, 12px);
	overflow: hidden;
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	-webkit-backdrop-filter: blur(var(--berx-blur-sm, 8px));
	backdrop-filter: blur(var(--berx-blur-sm, 8px));
	transition: transform 0.3s ease, border-color .15s ease;
	box-shadow: var(--berx-shadow, 0 4px 12px rgba(0,0,0,0.08));
}

.ossn-photos li:hover {
	transform: scale(1.03);
	z-index: 2;
}

.ossn-photos .pthumb {
	width: 100%;
	height: 100%;
	object-fit: cover;
	/* This removes the black spaces/gaps */
	display: block;
	border: 0;
}

.ossn-photos .ossn-album-name {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 30px 10px 10px;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
	color: #fff;
	font-size: 13px;
	font-weight: 600;
	text-align: center;
	pointer-events: none;
}

.ossn-photos-mod-title {
	text-align: center;
	font-size: 21px;
	text-transform: uppercase;
}

.ossn-photo-view a {
	float: right;
	margin-bottom: 10px;
}

.ossn-photo-viewer {
	text-align: center;
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
	/** pictures in single view are drifting rightwards out of place #629 **/
	width: 100%;
}

.ossn-viewer-comments {
	margin-top: 25px;
}

.ossn-viewer-comments .comments-likes .comment-text p img {
	max-width: 250px;
}

.ossn-viewer-comments .comments-likes .ossn-comment-attach-photo {
	margin-left: 222px;
}

.ossn-photos .pthumb {
	width: 100%;
	height: 200px;
	object-fit: cover;
}

.ossn-photo-menu li {
	display: block;
}

.ossn-photo-menu li a {
	font-size: 12px;
}

.ossn-profile-module-albums {}

.ossn-profile-module-albums a {
	margin-left: 3px;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}

.ossn-photo-view h2 {
	font-size: 18px;
	font-weight: bold;
	margin-top: 0px;
	display: inline;
}

.ossn-photo-menu {
	margin-top: 10px;
}

.ossn-photo-viewer .image-block {
	text-align: center;
	min-height: 200px;
}

.ossn-photos-add-button {
	text-align: center;
	padding: 20px;
	margin-top: 30px;
}

.ossn-photos-add-button .images {
	display: none;
}

.ossn-photos-wall {
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
	margin-bottom: 10px;
	padding-top: 10px;
	border-radius: var(--berx-radius-sm, 8px);
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	text-align: center;
}

.ossn-photos-wall-plain {
	border: none;
	text-align: center;
	background: initial;
}

.ossn-photos-wall-title a {
	font-weight: normal !important;
}

.ossn-photo-wall-item-small {
	width: 100px;
}

.ossn-photo-wall-item-medium {
	width: 200px;
}

.ossn-photos-wall-item {
	display: inline-block !important;
	cursor: pointer;
	margin-right: 2px;
}

.ossn-photo-view {
	margin-bottom: 10px;
}

#ossn-photos-show-gallery i {
	margin-right: 0;
}

.ossn-photos-album-comments-likes .comments-list {
	margin-left: -10px;
	margin-right: -10px;
}
/* ============================================================
   BERX PHOTOS — media-dominant grid
   Overrides only; all OssnPhotos markup, routes, upload forms,
   gallery JS (#ossn-photos-show-gallery) and album actions are
   untouched. The base rules above used fixed 200x200 flex tiles
   wrapped in glass + a border — the chrome competed with the
   photograph and left ragged end-of-row gaps. BERX puts the media
   first: a fluid responsive grid, no frame around the image, and
   motion on the photo rather than the tile.
   ============================================================ */
.ossn-photos {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: var(--berx-space-2, 8px);
	justify-content: initial;
}
.ossn-photos li {
	width: auto !important;
	height: auto !important;
	aspect-ratio: 1 / 1;
	border: none !important;
	background: var(--berx-graphite, #1a1a1a) !important;
	border-radius: var(--berx-radius, 16px);
	box-shadow: none !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	transition: none;
	overflow: hidden;
}
.ossn-photos li:hover {
	transform: none;   /* the photo moves, not the frame */
	z-index: auto;
}
.ossn-photos li a { display: block; width: 100%; height: 100%; }
.ossn-photos .pthumb {
	width: 100% !important;
	height: 100% !important;
	object-fit: cover;
	display: block;
	transition: transform 450ms var(--berx-ease, ease);
}
.ossn-photos li:hover .pthumb { transform: scale(1.06); }

/* Album/section heading as editorial type rather than a plain h2. */
.ossn-photos-mod-title {
	font-size: var(--berx-text-heading, 24px);
	font-weight: 800;
	letter-spacing: -0.02em;
	color: var(--berx-white, #fff);
}
.ossn-photos .ossn-album-name {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	padding: var(--berx-space-5, 20px) var(--berx-space-3, 12px) var(--berx-space-3, 12px);
	background: linear-gradient(to top, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0) 100%);
	color: var(--berx-white, #fff);
	font-weight: 700;
	font-size: var(--berx-text-caption, 13px);
}
.ossn-photos-add-button {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	border-radius: var(--berx-radius-pill, 999px);
}

@media (max-width: 767px) {
	.ossn-photos {
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 4px;
	}
	.ossn-photos li { border-radius: var(--berx-radius-sm, 12px); }
}
@media (prefers-reduced-motion: reduce) {
	.ossn-photos .pthumb { transition: none !important; }
	.ossn-photos li:hover .pthumb { transform: none; }
}
