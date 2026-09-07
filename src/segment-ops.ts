import type { Segment, SegmentMode } from './types'

/** Сменить режим сегмента. При переходе на 'alt' добавляет пустое поле, если их нет. */
export function setSegmentMode(
	segments: Segment[],
	index: number,
	mode: SegmentMode,
): Segment[] {
	return segments.map((seg, i) => {
		if (i !== index) return seg
		const alts = mode === 'alt' && seg.alts.length === 0 ? [''] : seg.alts
		return { ...seg, mode, alts }
	})
}

/** Изменить основное значение сегмента. */
export function setSegmentValue(
	segments: Segment[],
	index: number,
	value: string,
): Segment[] {
	return segments.map((seg, i) => (i === index ? { ...seg, value } : seg))
}

/** Добавить пустое поле «или» к сегменту. */
export function addAlt(segments: Segment[], index: number): Segment[] {
	return segments.map((seg, i) =>
		i === index ? { ...seg, alts: [...seg.alts, ''] } : seg,
	)
}

/** Изменить одно значение «или» по его индексу. */
export function setAlt(
	segments: Segment[],
	index: number,
	altIndex: number,
	value: string,
): Segment[] {
	return segments.map((seg, i) => {
		if (i !== index) return seg
		const alts = seg.alts.map((a, j) => (j === altIndex ? value : a))
		return { ...seg, alts }
	})
}

/** Убрать одно значение «или». */
export function removeAlt(
	segments: Segment[],
	index: number,
	altIndex: number,
): Segment[] {
	return segments.map((seg, i) => {
		if (i !== index) return seg
		return { ...seg, alts: seg.alts.filter((_, j) => j !== altIndex) }
	})
}
