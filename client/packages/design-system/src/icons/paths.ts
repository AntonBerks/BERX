/**
 * BERX icon geometry — the real glyph paths.
 *
 * The v9 archive ships 185 named icon contracts and, deliberately,
 * one placeholder SVG repeated for all of them: "the SVGs are
 * geometry contracts/placeholders; final bespoke glyph paths can be
 * substituted without changing component geometry"
 * (02_DESIGN_SYSTEM_V2/icons/ICON_RULES.md). Shipping the archive's
 * files verbatim would render 185 identical circles, so what is
 * archived is the contract, and this file is BERX's answer to it.
 *
 * The contract, enforced here and in BerxIcon.tsx:
 *   24×24 grid · 1.7px stroke · rounded caps and joins ·
 *   optical alignment over mathematical centering ·
 *   cyan is stateful, never decorative ·
 *   44×44 touch target even though the glyph is 24 ·
 *   an accessible name is required unless the icon is decorative ·
 *   motion 140–360ms, and nothing rotates continuously except loading.
 *
 * Every glyph below is drawn on the same 24 grid with the same
 * optical weight, so the set reads as one family rather than
 * assembled clip art. `d` is a path; `circles` are the few shapes a
 * path would only approximate.
 */

export interface BerxIconGeometry {
	/** Path data on the 24×24 grid. */
	d?: string;
	/** Circles, for glyphs where a true circle matters optically. */
	circles?: {cx: number; cy: number; r: number}[];
	/** Filled dots — the only place a glyph uses fill rather than stroke. */
	dots?: {cx: number; cy: number; r: number}[];
}

export const BERX_ICON_PATHS: Record<string, BerxIconGeometry> = {
	/* ---- navigation ---- */
	home: {d: 'M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-6v6h-4A1.5 1.5 0 0 1 3.5 19z'},
	explore: {d: 'M15.6 8.4 13.9 14 8.4 15.6 10.1 10z', circles: [{cx: 12, cy: 12, r: 8.5}]},
	now: {d: 'M12 7v5l3.2 2', circles: [{cx: 12, cy: 12, r: 8.5}]},
	people: {d: 'M3.5 20v-1.4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V20M17 14.8a4 4 0 0 1 3.5 4V20', circles: [{cx: 9.5, cy: 7.8, r: 3.3}, {cx: 16.4, cy: 8.2, r: 2.6}]},
	places: {d: 'M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21z', circles: [{cx: 12, cy: 10.6, r: 2.4}]},
	events: {d: 'M4.5 6.8h15a1 1 0 0 1 1 1v11.7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7.8a1 1 0 0 1 1-1zM8 3.5v4.5M16 3.5v4.5M3.5 11.6h17'},
	experiences: {d: 'M12 3.5 14.7 9l6.1.9-4.4 4.3 1 6.1L12 17.4l-5.4 2.9 1-6.1L3.2 9.9 9.3 9z'},
	memories: {d: 'M4 19.5V6a1.5 1.5 0 0 1 1.5-1.5h9L20 10v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5zM14.5 4.5V10H20M8 14h8M8 17.2h5'},
	business: {d: 'M3.5 20.5V9.4L12 4l8.5 5.4v11.1M9.5 20.5v-6h5v6', dots: [{cx: 12, cy: 11.2, r: 1}]},
	messages: {d: 'M4 5.5h16a1 1 0 0 1 1 1v8.6a1 1 0 0 1-1 1H9.4L5 20v-3.9H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z'},
	profile: {d: 'M4.5 20.2v-1a5.5 5.5 0 0 1 5.5-5.5h4a5.5 5.5 0 0 1 5.5 5.5v1', circles: [{cx: 12, cy: 8, r: 3.8}]},

	/* ---- actions ---- */
	search: {d: 'M16.6 16.6 21 21', circles: [{cx: 10.8, cy: 10.8, r: 6.8}]},
	filter: {d: 'M3.5 6.5h17M6.5 12h11M10 17.5h4'},
	menu: {d: 'M4 7h16M4 12h16M4 17h16'},
	close: {d: 'M6 6l12 12M18 6 6 18'},
	back: {d: 'M20 12H4.5M10.5 5.5 4 12l6.5 6.5'},
	forward: {d: 'M4 12h15.5M13.5 5.5 20 12l-6.5 6.5'},
	plus: {d: 'M12 5v14M5 12h14'},
	minus: {d: 'M5 12h14'},
	check: {d: 'M4.5 12.6 9.5 17.5 19.5 6.8'},
	share: {d: 'M8.9 10.8 15.1 7.4M8.9 13.2l6.2 3.4', circles: [{cx: 6.2, cy: 12, r: 2.7}, {cx: 17.4, cy: 6, r: 2.7}, {cx: 17.4, cy: 18, r: 2.7}]},
	send: {d: 'M20.5 3.5 3.5 10.4l7.1 2.9 2.9 7.2z M10.6 13.3 20.5 3.5'},
	save: {d: 'M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4-6.5 4v-16a1 1 0 0 1 1-1z'},
	edit: {d: 'M4 20h4.2L20 8.2a2.1 2.1 0 0 0-3-3L5.2 17z M4 20v-4.2'},
	'delete': {d: 'M4.5 6.5h15M9.5 6.5V4.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.3M6.5 6.5l1 13a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-13'},
	more: {dots: [{cx: 5.5, cy: 12, r: 1.5}, {cx: 12, cy: 12, r: 1.5}, {cx: 18.5, cy: 12, r: 1.5}]},
	settings: {d: 'M12 3.5 13.8 6l3-.4.5 3 2.7 1.5-1.4 2.7 1.4 2.7-2.7 1.5-.5 3-3-.4L12 21.5 10.2 19l-3 .4-.5-3L4 14.9l1.4-2.7L4 9.5l2.7-1.5.5-3 3 .4z', circles: [{cx: 12, cy: 12, r: 3}]},
	refresh: {d: 'M20 12a8 8 0 1 1-2.6-5.9M20 3.6V8h-4.4'},
	loading: {d: 'M12 3.5a8.5 8.5 0 1 0 8.5 8.5'},

	/* ---- content ---- */
	heart: {d: 'M12 20.4 4.6 13a4.6 4.6 0 1 1 7.4-5.3A4.6 4.6 0 1 1 19.4 13z'},
	bookmark: {d: 'M6.5 3.8h11a1 1 0 0 1 1 1v15.4L12 16.2l-6.5 4V4.8a1 1 0 0 1 1-1z'},
	star: {d: 'M12 3.6 14.7 9l6.1.9-4.4 4.3 1 6.1L12 17.5l-5.4 2.8 1-6.1L3.2 9.9 9.3 9z'},
	image: {d: 'M4.5 4.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1zM3.8 16.4l4.6-4.3 4 3.6 3-2.6 4.7 4', circles: [{cx: 9, cy: 9, r: 1.6}]},
	camera: {d: 'M3.5 8h3.2l1.5-2.4h7.6L17.3 8h3.2a1 1 0 0 1 1 1v9.6a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', circles: [{cx: 12, cy: 13.4, r: 3.7}]},
	gallery: {d: 'M7.5 3.5h13a1 1 0 0 1 1 1v13M4.5 7.5h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z'},
	video: {d: 'M3.5 6.5h11a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM15.5 10.4 21.5 7v10l-6-3.4z'},
	play: {d: 'M8.5 5.6 18.8 12 8.5 18.4z'},
	pause: {d: 'M9 5.5v13M15 5.5v13'},
	music: {d: 'M9 18V6.2l10-2v11.6', circles: [{cx: 6.5, cy: 18, r: 2.6}, {cx: 16.5, cy: 15.8, r: 2.6}]},
	mic: {d: 'M5.5 11.2a6.5 6.5 0 0 0 13 0M12 17.7V21M8.6 21h6.8M12 3a3 3 0 0 1 3 3v5.2a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z'},
	tag: {d: 'M11.4 3.5H20a.5.5 0 0 1 .5.5v8.6L11.9 21a1.4 1.4 0 0 1-2 0l-6.9-6.9a1.4 1.4 0 0 1 0-2z', dots: [{cx: 16.4, cy: 7.6, r: 1.2}]},

	/* ---- place & time ---- */
	location: {d: 'M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21z', circles: [{cx: 12, cy: 10.6, r: 2.4}]},
	pin: {d: 'M12 12.8V21M9 3.5h6l-.8 4.6 2.6 3.2a1 1 0 0 1-.8 1.6H7a1 1 0 0 1-.8-1.6l2.6-3.2z'},
	navigation: {d: 'M20.5 3.5 3.5 10.4l7.6 2.5 2.5 7.6z'},
	map: {d: 'M3.5 6.6 9 4.2v13.2l-5.5 2.4zM9 4.2l6 2.4v13.2L9 17.4zM15 6.6l5.5-2.4v13.2L15 19.8z'},
	route: {d: 'M7 7.5h6.5a3.5 3.5 0 0 1 0 7H10a3 3 0 0 0 0 6h7', circles: [{cx: 5, cy: 7.5, r: 2.2}, {cx: 19, cy: 20.5, r: 2.2}]},
	nearby: {d: 'M6.6 6.6a7.6 7.6 0 0 0 0 10.8M17.4 17.4a7.6 7.6 0 0 0 0-10.8M9.2 9.2a3.9 3.9 0 0 0 0 5.6M14.8 14.8a3.9 3.9 0 0 0 0-5.6', dots: [{cx: 12, cy: 12, r: 1.6}]},
	calendar: {d: 'M4.5 6.8h15a1 1 0 0 1 1 1v11.7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7.8a1 1 0 0 1 1-1zM8 3.5v4.5M16 3.5v4.5M3.5 11.6h17'},
	/* the handset, drawn on the same grid as the rest: a place with a
	   phone number had an emoji beside it until now */
	phone: {d: 'M7.8 3.9 5 4.9a2 2 0 0 0-1.3 2.2c.6 4 2.4 7.2 5 9.8s5.8 4.4 9.8 5a2 2 0 0 0 2.2-1.3l1-2.8a1.4 1.4 0 0 0-.7-1.7l-3.4-1.6a1.4 1.4 0 0 0-1.6.3l-1.4 1.5a13.4 13.4 0 0 1-5.5-5.5l1.5-1.4a1.4 1.4 0 0 0 .3-1.6L9.5 4.6a1.4 1.4 0 0 0-1.7-.7z'},
	clock: {d: 'M12 7v5l3.2 2', circles: [{cx: 12, cy: 12, r: 8.5}]},
	live: {d: 'M7.2 7.2a6.8 6.8 0 0 0 0 9.6M16.8 16.8a6.8 6.8 0 0 0 0-9.6', dots: [{cx: 12, cy: 12, r: 2.6}]},
	globe: {d: 'M3.5 12h17M12 3.5c2.4 2.5 3.6 5.3 3.6 8.5S14.4 18.5 12 20.5c-2.4-2-3.6-5.3-3.6-8.5S9.6 6 12 3.5z', circles: [{cx: 12, cy: 12, r: 8.5}]},

	/* ---- identity & safety ---- */
	verified: {d: 'M8.6 12.2 11 14.6l4.4-4.6M12 3.2l2.3 1.9 3-.2.6 2.9 2.4 1.8-1.3 2.7 1.3 2.7-2.4 1.8-.6 2.9-3-.2-2.3 1.9-2.3-1.9-3 .2-.6-2.9L3.7 15l1.3-2.7L3.7 9.6l2.4-1.8.6-2.9 3 .2z'},
	lock: {d: 'M6.5 10.5h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8.2 10.5V7.7a3.8 3.8 0 0 1 7.6 0v2.8', dots: [{cx: 12, cy: 15.2, r: 1.3}]},
	unlock: {d: 'M6.5 10.5h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8.2 10.5V7.7a3.8 3.8 0 0 1 7.3-1.4', dots: [{cx: 12, cy: 15.2, r: 1.3}]},
	shield: {d: 'M12 3.4 19.5 6v6.1c0 4.2-3 7.3-7.5 8.5-4.5-1.2-7.5-4.3-7.5-8.5V6z M9 12.2l2.2 2.2 4-4.2'},
	safety: {d: 'M12 3.4 19.5 6v6.1c0 4.2-3 7.3-7.5 8.5-4.5-1.2-7.5-4.3-7.5-8.5V6z M12 9v4', dots: [{cx: 12, cy: 15.8, r: 1.1}]},
	report: {d: 'M5 21V4.2h11.5l-1.7 3.6 1.7 3.6H5'},
	privacy: {d: 'M3.5 12s3.4-5.6 8.5-5.6S20.5 12 20.5 12s-3.4 5.6-8.5 5.6S3.5 12 3.5 12zM5 19 19 5', circles: [{cx: 12, cy: 12, r: 2.8}]},
	eye: {d: 'M3.5 12s3.4-5.6 8.5-5.6S20.5 12 20.5 12s-3.4 5.6-8.5 5.6S3.5 12 3.5 12z', circles: [{cx: 12, cy: 12, r: 2.8}]},
	'eye-off': {d: 'M9.5 5.2A9.6 9.6 0 0 1 12 4.9c5.1 0 8.5 5.6 8.5 5.6a16 16 0 0 1-2.6 3.2M6.4 6.6A16 16 0 0 0 3.5 10.5s3.4 5.6 8.5 5.6a9 9 0 0 0 3-.5M4 4l16 16'},
	bell: {d: 'M6 16.2V10a6 6 0 0 1 12 0v6.2l1.6 2.3H4.4zM10 20.4a2 2 0 0 0 4 0'},
	logout: {d: 'M14.5 8V5.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V16M10 12h10.5M17.2 8.7 20.5 12l-3.3 3.3'},
	login: {d: 'M9.5 8V5.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V16M14 12H3.5M6.8 8.7 3.5 12l3.3 3.3'},

	/* ---- social ---- */
	'user-add': {d: 'M3.5 20v-1.2a4.6 4.6 0 0 1 4.6-4.6h3a4.6 4.6 0 0 1 4.6 4.6V20M18.5 7.5v5M21 10h-5', circles: [{cx: 9.6, cy: 8, r: 3.6}]},
	users: {d: 'M3.5 20v-1.4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V20M17 14.8a4 4 0 0 1 3.5 4V20', circles: [{cx: 9.5, cy: 7.8, r: 3.3}, {cx: 16.4, cy: 8.2, r: 2.6}]},
	community: {d: 'M3.5 20.5v-1a3.5 3.5 0 0 1 3.5-3.5h2a3.5 3.5 0 0 1 3.5 3.5v1M12 20.5v-1a3.5 3.5 0 0 1 3.5-3.5h2a3.5 3.5 0 0 1 3.5 3.5v1', circles: [{cx: 8, cy: 9.5, r: 2.9}, {cx: 16.5, cy: 9.5, r: 2.9}]},
	chat: {d: 'M4 5.5h16a1 1 0 0 1 1 1v8.6a1 1 0 0 1-1 1H9.4L5 20v-3.9H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z'},
	reply: {d: 'M9 6.5 3.5 12 9 17.5M3.5 12h8.9a8 8 0 0 1 8 8v.5'},
	dating: {d: 'M12 20.4 4.6 13a4.6 4.6 0 1 1 7.4-5.3A4.6 4.6 0 1 1 19.4 13z M9.6 11.2h4.8'},
	creator: {d: 'M12 3.6 14.7 9l6.1.9-4.4 4.3 1 6.1L12 17.5l-5.4 2.8 1-6.1L3.2 9.9 9.3 9z M12 8.6v4.8'},

	/* ---- value ---- */
	wallet: {d: 'M3.5 8.2a2 2 0 0 1 2-2h12.4a1 1 0 0 1 1 1v2.3M3.5 8.2v10.3a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-2.2M19.5 9.5h-4a2.5 2.5 0 0 0 0 5h4z', dots: [{cx: 16.2, cy: 12, r: 0.9}]},
	coin: {d: 'M12 8.4v7.2M10 10.4h3a1.6 1.6 0 0 1 0 3.2h-2a1.6 1.6 0 0 0 0 3.2h3', circles: [{cx: 12, cy: 12, r: 8.5}]},
	reward: {d: 'M4.5 10.5h15v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1zM3.5 7h17v3.5h-17zM12 7v13.5M12 7S9.8 3.5 7.8 3.5a2.2 2.2 0 0 0 0 3.5zM12 7s2.2-3.5 4.2-3.5a2.2 2.2 0 0 1 0 3.5z'},
	level: {d: 'M4 20.5V13h4v7.5M10 20.5V8h4v12.5M16 20.5V4h4v16.5'},
	analytics: {d: 'M3.5 20.5h17M6.5 17V11M11 17V6.5M15.5 17v-4M20 17V9'},
	trend: {d: 'M3.5 16.5 9.5 10l4 3.6L20.5 6M20.5 6h-4.6M20.5 6v4.6'},

	/* ---- system ---- */
	info: {d: 'M12 11v5.4', circles: [{cx: 12, cy: 12, r: 8.5}], dots: [{cx: 12, cy: 8, r: 1}]},
	warning: {d: 'M12 3.8 21 19.6H3zM12 10v4.2', dots: [{cx: 12, cy: 17, r: 1}]},
	error: {d: 'M8.6 8.6 15.4 15.4M15.4 8.6 8.6 15.4', circles: [{cx: 12, cy: 12, r: 8.5}]},
	success: {d: 'M8.2 12.3 10.9 15 15.9 9.4', circles: [{cx: 12, cy: 12, r: 8.5}]},
	offline: {d: 'M4 4l16 16M8.6 15.3a4.8 4.8 0 0 1 3.4-1.4c.7 0 1.4.1 2 .4M5.2 11.8a9.6 9.6 0 0 1 4-2.3M18.8 11.8a9.6 9.6 0 0 0-6.6-2.6h-.6', dots: [{cx: 12, cy: 18.6, r: 1.1}]},
	wifi: {d: 'M5.2 11.8a9.6 9.6 0 0 1 13.6 0M8.6 15.3a4.8 4.8 0 0 1 6.8 0', dots: [{cx: 12, cy: 18.6, r: 1.1}]},
	download: {d: 'M12 3.8v11.4M7.8 11.2 12 15.4l4.2-4.2M4 20.2h16'},
	upload: {d: 'M12 20.2V8.8M7.8 12.8 12 8.6l4.2 4.2M4 3.8h16'},
	grid: {d: 'M4 4.5h6v6H4zM14 4.5h6v6h-6zM4 13.5h6v6H4zM14 13.5h6v6h-6z'},
	list: {d: 'M8.5 6.5h12M8.5 12h12M8.5 17.5h12', dots: [{cx: 4.5, cy: 6.5, r: 1.2}, {cx: 4.5, cy: 12, r: 1.2}, {cx: 4.5, cy: 17.5, r: 1.2}]},
	layers: {d: 'M12 3.6 21 8.3l-9 4.7-9-4.7zM3 12.5 12 17.2l9-4.7M3 16.7 12 21.4l9-4.7'},
	spatial: {d: 'M12 3.5 20 8v8l-8 4.5L4 16V8zM12 12l8-4M12 12v8.5M12 12 4 8'},
	chevronRight: {d: 'M9.5 5.5 16 12l-6.5 6.5'},
	chevronLeft: {d: 'M14.5 5.5 8 12l6.5 6.5'},
	chevronUp: {d: 'M5.5 14.5 12 8l6.5 6.5'},
	chevronDown: {d: 'M5.5 9.5 12 16l6.5-6.5'},
	drag: {dots: [{cx: 9, cy: 6, r: 1.4}, {cx: 15, cy: 6, r: 1.4}, {cx: 9, cy: 12, r: 1.4}, {cx: 15, cy: 12, r: 1.4}, {cx: 9, cy: 18, r: 1.4}, {cx: 15, cy: 18, r: 1.4}]},
	palette: {d: 'M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2.2-.9 2.2-2 0-.6-.2-1-.6-1.4-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h1.4a4 4 0 0 0 4-4c0-3.6-3.8-6.3-8.5-6.3z', dots: [{cx: 8.4, cy: 9.4, r: 1.2}, {cx: 12, cy: 7.4, r: 1.2}, {cx: 15.6, cy: 9.4, r: 1.2}]},
	motion: {d: 'M3.5 8.5h9M3.5 15.5h6M14 12h6.5M17.5 8.8 20.8 12l-3.3 3.2', circles: [{cx: 12, cy: 12, r: 0}]},
	accessibility: {d: 'M4.5 8.4 12 10l7.5-1.6M12 10v4.4M12 14.4 9 20.5M12 14.4l3 6.1', circles: [{cx: 12, cy: 5.2, r: 2}]},
	device: {d: 'M8 3.5h8a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z', dots: [{cx: 12, cy: 17.6, r: 1}]},
	session: {d: 'M12 7.4V12l3 1.8M20.5 5.5v4.4h-4.4', circles: [{cx: 12, cy: 12, r: 8.5}]},
	admin: {d: 'M12 3.4 19.5 6v6.1c0 4.2-3 7.3-7.5 8.5-4.5-1.2-7.5-4.3-7.5-8.5V6z M9.3 12.6h5.4M12 9.9v5.4'},
};

export type BerxIconName = keyof typeof BERX_ICON_PATHS;

/** Names that at least one BERX screen renders today. */
export const BERX_ICON_NAMES = Object.keys(BERX_ICON_PATHS) as BerxIconName[];
