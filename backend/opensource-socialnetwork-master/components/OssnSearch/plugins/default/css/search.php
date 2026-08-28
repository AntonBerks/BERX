.ossn-search {
    margin-top: 20px;
}
/* REAL DEFECT FIX: this was hardcoded `color: #000`, which rendered the
   typed query as black text on BERX's dark input surface — effectively
   invisible while typing. */
.ossn-search input[type='text']{
    width: 95%;
    margin: 0 auto;
    color: var(--berx-text, #f2f2f2);
    background: var(--berx-glass-2, rgba(255,255,255,0.07));
    border: 1px solid var(--berx-border, rgba(255,255,255,0.12));
    border-radius: var(--berx-radius-pill, 999px);
    padding: 8px 16px;
    outline: none;
    transition: border-color 150ms var(--berx-ease, ease);
}
.ossn-search input[type='text']:focus {
    border-color: var(--berx-accent, #D9A93F);
}
.ossn-search input[type='text']::placeholder {
    color: var(--berx-text-faint, #6f6f6f);
}
.ossn-search-active-item {
    background: var(--berx-accent-soft, rgba(217, 169, 63,0.16));
    color: var(--berx-accent, #D9A93F);
}

/* ============================================================
   BERX SEARCH
   Real surfaces only: the three registered result types
   (users / groups / dating), the engine's own ('search','left')
   tab menu, and the page-based ossn_view_pagination() each
   handler appends. No fabricated categories.
   ============================================================ */

/* ---------- Hero + prominent field ---------- */
.berx-search-hero {
	position: relative;
	padding: var(--berx-space-8, 32px) var(--berx-space-6, 24px);
	margin-bottom: var(--berx-space-5, 20px);
	border-radius: var(--berx-radius-lg, 24px);
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	overflow: hidden;
	background:
		radial-gradient(ellipse at 15% 0%, rgba(217, 169, 63,0.16) 0%, rgba(217, 169, 63,0) 58%),
		var(--berx-glass-1, rgba(255,255,255,0.04));
	-webkit-backdrop-filter: blur(var(--berx-blur-lg, 28px));
	backdrop-filter: blur(var(--berx-blur-lg, 28px));
}
.berx-search-form {
	position: relative;
	display: flex;
	align-items: center;
	gap: var(--berx-space-2, 8px);
}
.berx-search-icon {
	position: absolute;
	left: 18px;
	color: var(--berx-text-faint, #6f6f6f);
	pointer-events: none;
	z-index: 1;
}
.berx-search-form input[type="text"] {
	flex: 1;
	min-width: 0;
	height: 52px;
	padding: 0 var(--berx-space-4, 16px) 0 46px;
	border-radius: var(--berx-radius-pill, 999px);
	border: 1px solid var(--berx-border, rgba(255,255,255,0.12));
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	color: var(--berx-text, #f2f2f2);
	font-size: var(--berx-text-title, 18px);
	outline: none;
	transition: border-color 150ms var(--berx-ease, ease);
}
.berx-search-form input[type="text"]:focus {
	border-color: var(--berx-accent, #D9A93F);
	box-shadow: 0 0 0 4px rgba(217, 169, 63,0.12);
}
.berx-search-form input[type="text"]::placeholder {
	color: var(--berx-text-faint, #6f6f6f);
}
.berx-search-form .btn-primary {
	height: 52px;
	padding: 0 var(--berx-space-6, 24px);
	white-space: nowrap;
}
.berx-search-context {
	margin: var(--berx-space-4, 16px) 0 0;
	color: var(--berx-text-dim, #a3a3a3);
	font-size: var(--berx-text-caption, 13px);
}
.berx-search-context strong { color: var(--berx-white, #fff); }

/* ---------- Tabs (engine-rendered ('search','left') menu) ---------- */
.ossn-menu-search {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.ossn-menu-search li a {
	display: block;
	padding: var(--berx-space-2, 8px) var(--berx-space-3, 12px);
	border-radius: var(--berx-radius-pill, 999px);
	color: var(--berx-text-dim, #a3a3a3) !important;
	font-size: var(--berx-text-caption, 13px);
	font-weight: 600;
	text-decoration: none;
	transition: background-color 150ms var(--berx-ease, ease), color 150ms var(--berx-ease, ease);
}
.ossn-menu-search li a:hover {
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	color: var(--berx-white, #fff) !important;
}
.ossn-menu-search .ossn-search-active-item a {
	background: var(--berx-accent-soft, rgba(217, 169, 63,0.16));
	color: var(--berx-accent, #D9A93F) !important;
}
.ossn-menu-search + .title,
.ossn-search-page .title {
	font-size: var(--berx-text-label, 12px);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--berx-text-faint, #6f6f6f);
	margin-bottom: var(--berx-space-3, 12px);
}

/* ---------- People results (.ossn-output-users-list) ---------- */
.ossn-output-users-list {
	display: flex;
	flex-direction: column;
	gap: var(--berx-space-3, 12px);
}
.user-item-card {
	border-radius: var(--berx-radius, 16px);
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	-webkit-backdrop-filter: blur(var(--berx-blur-md, 16px));
	backdrop-filter: blur(var(--berx-blur-md, 16px));
	transition: transform 200ms var(--berx-ease, ease), border-color 200ms var(--berx-ease, ease);
}
.user-item-card:hover {
	transform: translateY(-2px);
	border-color: var(--berx-border-strong, rgba(255,255,255,0.18));
}
.user-item-inner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--berx-space-4, 16px);
	padding: var(--berx-space-3, 12px) var(--berx-space-4, 16px);
	flex-wrap: wrap;
}
.user-info-box {
	display: flex;
	align-items: center;
	gap: var(--berx-space-3, 12px);
	min-width: 0;
	flex: 1;
}
.user-avatar-container img {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	object-fit: cover;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
	display: block;
}
.user-details { min-width: 0; }
.user-name-text a,
.user-link-inherited {
	color: var(--berx-white, #fff) !important;
	font-weight: 700;
	font-size: var(--berx-text-body, 15px);
	text-decoration: none;
}
.user-username-sub {
	color: var(--berx-text-faint, #6f6f6f);
	font-size: var(--berx-text-micro, 11px);
}
.ossn-action-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 16px;
	border-radius: var(--berx-radius-pill, 999px);
	font-size: var(--berx-text-caption, 13px);
	font-weight: 600;
	text-decoration: none;
	border: 1px solid var(--berx-border, rgba(255,255,255,0.12));
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
	color: var(--berx-text, #f2f2f2) !important;
	transition: background-color 150ms var(--berx-ease, ease), border-color 150ms var(--berx-ease, ease);
}
.ossn-action-btn.btn-primary-outline:hover {
	border-color: var(--berx-accent, #D9A93F);
	color: var(--berx-accent, #D9A93F) !important;
}
.ossn-action-btn.btn-danger-outline:hover {
	border-color: rgba(255,77,79,0.5);
	color: var(--berx-danger, #ff4d4f) !important;
}

/* ---------- Community results: real cover, monogram fallback ---------- */
.berx-group-result-media {
	position: relative;
	display: block;
	width: 100%;
	aspect-ratio: 1 / 1;
	border-radius: var(--berx-radius, 16px);
	overflow: hidden;
	background: var(--berx-graphite, #1a1a1a);
}
.berx-group-result-media img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
	transition: transform 400ms var(--berx-ease, ease);
}
.group-search-items .row:hover .berx-group-result-media img { transform: scale(1.05); }
.berx-group-result-meta {
	display: flex;
	align-items: center;
	gap: 6px;
	margin: var(--berx-space-1, 4px) 0 0;
	color: var(--berx-text-faint, #6f6f6f);
	font-size: var(--berx-text-micro, 11px);
}
.ossn-group-search-by {
	color: var(--berx-text-dim, #a3a3a3);
	font-size: var(--berx-text-caption, 13px);
	margin: 2px 0 0;
}
.ossn-group-search-by a { color: var(--berx-white, #fff) !important; font-weight: 600; }

/* ---------- Empty / idle / no-results ---------- */
.berx-search-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: var(--berx-space-3, 12px);
	padding: var(--berx-space-12, 48px) var(--berx-space-6, 24px);
	border-radius: var(--berx-radius, 16px);
	border: 1px dashed var(--berx-border, rgba(255,255,255,0.12));
	background: var(--berx-glass-1, rgba(255,255,255,0.04));
}
.berx-search-empty i {
	font-size: 30px;
	color: var(--berx-text-faint, #6f6f6f);
}
.berx-search-empty h3 {
	margin: 0;
	font-size: var(--berx-text-title, 18px);
	font-weight: 700;
	color: var(--berx-white, #fff);
}
.berx-search-empty p {
	margin: 0;
	max-width: 42ch;
	color: var(--berx-text-dim, #a3a3a3);
	font-size: var(--berx-text-caption, 13px);
}

@media (max-width: 767px) {
	.berx-search-hero { padding: var(--berx-space-5, 20px) var(--berx-space-4, 16px); }
	.berx-search-form { flex-direction: column; align-items: stretch; }
	.berx-search-form .btn-primary { width: 100%; }
	.ossn-menu-search { flex-direction: row; flex-wrap: wrap; }
	.user-item-inner { align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
	.user-item-card,
	.berx-group-result-media img { transition: none !important; }
	.user-item-card:hover { transform: none; }
	.group-search-items .row:hover .berx-group-result-media img { transform: none; }
}
