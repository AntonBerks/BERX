/** <style> **/
.giphy-container {
	display: none;
	background: #fff;
	padding: 10px 10px 20px;
	width: 250px;
	z-index: 1;
	border-radius: 5px;
	right: 0;
	margin-right: 20px;
	box-shadow: 0 12px 28px 0 rgb(0 0 0 / 13%), 0 2px 4px 0 rgb(0 0 0 / 13%), inset 0 0 0 1px rgb(0 0 0 / 13%);
}

.giphy-container-inner {
	height: 300px;
}

.giphy-container-inner .giphy-list {
	overflow-y: scroll;
	overflow-x: hidden;
	height: 250px;
}

.giphy-icon {
	background: url('<?php echo ossn_site_url();?>components/OssnGiphy/images/gif.png');
	float: right;
	position: relative;
	margin-right: 5px;
	margin-top: 4px;
	width: 25px;
	height: 25px;
	padding: 5px;
	cursor: pointer;
}

.search-giphy {
	height: 32px;
	background-color: #f2f3f5;
	border: 1px solid #ccd0d5;
	border-radius: 15px;
	display: block;
	margin-right: 20px;
	margin-bottom: 10px;
	padding: 5px 10px;
	outline: none;
}

.giphy-list .ossn-pagination li {
	visibility: hidden;
}

.giphy-list .pagination {
	margin: 0;
}

.giphy-container-inner .ossn-loading {
	margin: -20px auto;
}

.giphy-container-inner .ossn-loading-initial {
	margin: 0 auto;
}

.close-giphy-container {
	float: right;
	top: 0;
	position: absolute;
	right: 0;
	padding: 5px;
	margin: 10px 1px;
	border-radius: 10px;
	cursor: pointer;
}

.giphy-list img {
	cursor: pointer
}

.giphy-powerd-text {
    font-size: 12px;
    margin-bottom: 5px;
    margin-left: 5px;
    display: block;
    bottom: 0;
    position: absolute;
}
/* ============================================================
   BERX — dark GIF picker.
   Same real defect as the emoji picker: this popover appears in the
   wall composer (and wherever OssnGiphy is extended) and was still
   fully vendor-light — #fff panel, #f2f3f5 search field, #ccd0d5
   border. Overrides only; the show/hide and search JS are untouched.
   ============================================================ */
.giphy-container {
	background: var(--berx-surface-2, #16181d) !important;
	box-shadow: var(--berx-shadow, 0 20px 60px -20px rgba(0,0,0,0.55)) !important;
	border: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08));
}
.search-giphy {
	background-color: var(--berx-glass-2, rgba(255,255,255,0.07)) !important;
	border: 1px solid var(--berx-border, rgba(255,255,255,0.12)) !important;
	color: var(--berx-text, #f2f2f2) !important;
}
.search-giphy::placeholder {
	color: var(--berx-text-faint, #6f6f6f);
}
.close-giphy-container {
	color: var(--berx-text-faint, #6f6f6f);
}
.close-giphy-container:hover {
	color: var(--berx-white, #fff);
	background: var(--berx-glass-2, rgba(255,255,255,0.07));
}
.giphy-powerd-text {
	color: var(--berx-text-faint, #6f6f6f);
}
