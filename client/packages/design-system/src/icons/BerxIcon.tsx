/**
 * !!! VERIFICATION STATUS: UNVERIFIED — see BerxButton.tsx header.
 *
 * BERX ICON — renders one glyph from the normalised family.
 *
 * The geometry is stored as raw SVG child markup (see geometry.ts), so
 * this parses it into real react-native-svg elements rather than
 * shipping 82 hand-written components. Stroke, caps and joins are set
 * here, once, which is what makes the family a system: a glyph cannot
 * carry its own weight or colour.
 */
import {memo, useMemo} from 'react';
import Svg, {Path, Circle, Rect, Line, Polyline, Polygon, Ellipse} from 'react-native-svg';
import {BERX_ICON_GEOMETRY} from './geometry';
import type {BerxIconName} from './geometry';
import {useBerxColors} from '../theme';

export interface BerxIconProps {
	name: BerxIconName;
	size?: number;
	color?: string;
	strokeWidth?: number;
}

const TAGS = {path: Path, circle: Circle, rect: Rect, line: Line, polyline: Polyline, polygon: Polygon, ellipse: Ellipse};

interface Node {
	tag: keyof typeof TAGS;
	attrs: Record<string, string>;
}

/** Parses the stored geometry once per glyph, then memoises it. */
function parse(markup: string): Node[] {
	const out: Node[] = [];
	const tagRe = /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)\/?>/g;
	let m: RegExpExecArray | null;
	while ((m = tagRe.exec(markup)) !== null) {
		const attrs: Record<string, string> = {};
		const attrRe = /([a-zA-Z-]+)="([^"]*)"/g;
		let a: RegExpExecArray | null;
		while ((a = attrRe.exec(m[2])) !== null) {
			// react-native-svg takes camelCase props, the markup is kebab.
			const key = a[1].replace(/-([a-z])/g, (_s: string, c: string) => c.toUpperCase());
			attrs[key] = a[2];
		}
		out.push({tag: m[1] as keyof typeof TAGS, attrs});
	}
	return out;
}

const CACHE = new Map<string, Node[]>();

export const BerxIcon = memo(function BerxIcon({name, size = 22, color, strokeWidth = 2}: BerxIconProps) {
	const colors = useBerxColors();
	const nodes = useMemo(() => {
		const hit = CACHE.get(name);
		if (hit) return hit;
		const parsed = parse(BERX_ICON_GEOMETRY[name] ?? '');
		CACHE.set(name, parsed);
		return parsed;
	}, [name]);

	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color ?? colors.text}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round">
			{nodes.map((n: Node, i: number) => {
				const Shape = TAGS[n.tag];
				return <Shape key={i} {...n.attrs} />;
			})}
		</Svg>
	);
});
