.ossn-block-lists {
	background: #eee;
	border-top: 1px solid #ccc;
	padding: 10px;
}

.ossn-block-lists li {
	list-style-type: square;
    margin-left: 10px;
}

.ossn-block-lists li a {
	font-weight: bold;
}

.ossn-block-lists li span {}
/* BERX: the blocked-users list under Settings > Privacy. */
.ossn-block-lists {
	background: var(--berx-glass-1, rgba(255,255,255,0.04)) !important;
	border-top: 1px solid var(--berx-border-soft, rgba(255,255,255,0.08)) !important;
	border-radius: var(--berx-radius, 16px);
	color: var(--berx-text, #f2f2f2);
}
.ossn-block-lists li a {
	color: var(--berx-white, #fff) !important;
}
