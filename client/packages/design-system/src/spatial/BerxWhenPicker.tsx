/**
 * BerxWhenPicker — when the thing happens, chosen rather than assumed.
 *
 * Creating an event and creating an experience both sent a hard-coded
 * "tomorrow at 19:00" to a server that stores a real timestamp. The
 * screens said so out loud, which was honest, but honest about a form
 * that cannot do the one thing the form is for: nobody's concert is
 * tomorrow at seven because BERX had no picker.
 *
 * The reason given was that a native date picker is not installable
 * here — true, and beside the point. BERX already ships every part of
 * a chooser: a chip rail for the day and the stepper idiom the
 * business-hours screen uses for the hour. This is those, composed. No
 * new dependency, no native module, and a real unix timestamp out of
 * it.
 *
 * What it will not do is offer a moment in the past. The day rail
 * starts today and the hour stepper on today's date stops at the
 * current hour, because an event that already began is not something
 * a create form should be able to produce.
 *
 * Spatially it is one object on the content plane holding two
 * controls on the plane in front of it, which is what it is: a choice
 * you operate, not a paragraph you read.
 */
import {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {spacing} from '../tokens';
import {BerxText} from './BerxText';
import {BerxChoiceChips} from './BerxChoiceChips';
import {BerxIconButton} from '../icons';

export interface BerxWhenPickerProps {
	/** The chosen moment, in unix seconds. */
	value: number;
	onChange: (unixSeconds: number) => void;
	/** How many days forward the rail offers, including today. */
	days?: number;
	/** Minute granularity of the stepper. */
	minuteStep?: number;
	label?: string;
	testID?: string;
}

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
	const c = new Date(d);
	c.setHours(0, 0, 0, 0);
	return c;
}

/** "Сегодня", "Завтра", then the real date. */
function dayLabel(target: Date, today: Date): string {
	const diff = Math.round((startOfDay(target).getTime() - startOfDay(today).getTime()) / DAY_MS);
	if (diff === 0) return 'Сегодня';
	if (diff === 1) return 'Завтра';
	return target.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
}

export function BerxWhenPicker({
	value,
	onChange,
	days = 14,
	minuteStep = 15,
	label = 'Начало',
	testID,
}: BerxWhenPickerProps) {
	const now = useMemo(() => new Date(), []);
	const chosen = new Date(value * 1000);

	const options = useMemo(() => {
		const base = startOfDay(now);
		return Array.from({length: days}, (_, i) => {
			const d = new Date(base.getTime() + i * DAY_MS);
			return {key: i, label: dayLabel(d, now)};
		});
	}, [now, days]);

	const dayIndex = Math.max(
		0,
		Math.round((startOfDay(chosen).getTime() - startOfDay(now).getTime()) / DAY_MS),
	);

	/* today cannot start earlier than now; any later day can start at
	   midnight. The floor moves with the rail rather than being a
	   single rule applied to every day. */
	const floor = dayIndex === 0 ? new Date(now.getTime()) : null;

	const commit = (next: Date) => {
		if (floor && next.getTime() < floor.getTime()) return;
		onChange(Math.floor(next.getTime() / 1000));
	};

	const pickDay = (index: number) => {
		const d = new Date(startOfDay(now).getTime() + index * DAY_MS);
		d.setHours(chosen.getHours(), chosen.getMinutes(), 0, 0);
		/* moving to today from a later day can land in the past; the
		   next whole hour from now is the nearest honest answer */
		if (index === 0 && d.getTime() < now.getTime()) {
			d.setHours(now.getHours() + 1, 0, 0, 0);
		}
		onChange(Math.floor(d.getTime() / 1000));
	};

	const shift = (field: 'hours' | 'minutes', delta: number) => {
		const next = new Date(chosen);
		if (field === 'hours') next.setHours(next.getHours() + delta);
		else next.setMinutes(next.getMinutes() + delta * minuteStep);
		/* staying on the chosen day: a stepper is not a way to change
		   the date behind the rail's back */
		if (startOfDay(next).getTime() !== startOfDay(chosen).getTime()) return;
		commit(next);
	};

	const hh = String(chosen.getHours()).padStart(2, '0');
	const mm = String(chosen.getMinutes()).padStart(2, '0');
	const spoken = chosen.toLocaleString('ru-RU', {
		day: 'numeric',
		month: 'long',
		hour: '2-digit',
		minute: '2-digit',
	});

	return (
		<View testID={testID} style={styles.root}>
			<BerxText role="micro" emphasis="tertiary">{label}</BerxText>

			<BerxChoiceChips
				scroll
				accessibilityLabel="День"
				value={dayIndex}
				onChange={pickDay}
				options={options}
			/>

			{/* D4 — two steppers, the same control the opening-hours
			    screen uses, so time is set the same way everywhere in BERX */}
			<View style={styles.time} accessible accessibilityLabel={`Выбрано: ${spoken}`}>
				<BerxIconButton
					name="minus"
					size={16}
					accessibilityLabel="Час раньше"
					onPress={() => shift('hours', -1)}
				/>
				<BerxText role="callout">{hh}</BerxText>
				<BerxIconButton
					name="plus"
					size={16}
					accessibilityLabel="Час позже"
					onPress={() => shift('hours', 1)}
				/>

				<BerxText role="callout" emphasis="tertiary">:</BerxText>

				<BerxIconButton
					name="minus"
					size={16}
					accessibilityLabel={`На ${minuteStep} минут раньше`}
					onPress={() => shift('minutes', -1)}
				/>
				<BerxText role="callout">{mm}</BerxText>
				<BerxIconButton
					name="plus"
					size={16}
					accessibilityLabel={`На ${minuteStep} минут позже`}
					onPress={() => shift('minutes', 1)}
				/>
			</View>

			{/* the composed answer, said once, in the words the rest of
			    BERX uses for a moment */}
			<BerxText role="meta" emphasis="secondary">{spoken}</BerxText>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {gap: spacing.sm},
	time: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
});
