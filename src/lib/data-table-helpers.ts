export function rangeFilter(value: unknown, filterValue: Array<string>) {
	const parsedValue = parseValue(value)
	const cleanedFilterValue = filterValue.map((v) => v.trim())
	return cleanedFilterValue.some((range) => {
		if (parsedValue instanceof Date) {
			return dateFilterEvaluation(range, parsedValue)
		}

		const [minPart, maxPart] = range.split(/(?:-|to|,)/).map((p) => p.trim())

		if (typeof parsedValue === 'number') {
			const min = Number(minPart)
			const max = Number(maxPart)
			return (
				!Number.isNaN(min) &&
				!Number.isNaN(max) &&
				parsedValue >= min &&
				parsedValue <= max
			)
		}

		if (typeof value === 'string') {
			const minNum = Number(minPart)
			const maxNum = Number(maxPart)
			if (!Number.isNaN(minNum) && !Number.isNaN(maxNum)) {
				return value.length >= minNum && value.length <= maxNum
			}

			return (
				value.localeCompare(minPart ?? '') >= 0 &&
				value.localeCompare(maxPart ?? '') <= 0
			)
		}

		return false
	})
}

export function dateFilterEvaluation(cleaned: string, value: Date) {
	const dateRangeMatch = cleaned.match(
		/^([\d]{4}[-/]\d{2}[-/]\d{2})\s*(?:to|\/|,|–|-)\s*([\d]{4}[-/]\d{2}[-/]\d{2})$/i,
	)
	if (dateRangeMatch && dateRangeMatch.length === 3) {
		const [_, rawMin, rawMax] = dateRangeMatch
		if (!rawMin || !rawMax) {
			return false
		}
		const minDate = new Date(rawMin.trim())
		const maxDate = new Date(rawMax.trim())
		const evaluation =
			!Number.isNaN(minDate.getTime()) &&
			!Number.isNaN(maxDate.getTime()) &&
			!Number.isNaN(value.getTime())
		if (evaluation) {
			const APPLY_TO_FILTER = value >= minDate && value <= maxDate
			return APPLY_TO_FILTER
		}
	}
	return false
}

export function parseValue(value: unknown) {
	switch (typeof value) {
		case 'number':
			return value
		case 'string': {
			const date = new Date(value)
			if (!Number.isNaN(date.getTime())) {
				return date
			}
			const numberValue = Number(value)
			if (!Number.isNaN(numberValue)) {
				return numberValue
			}
			return value
		}
		default:
			return String(value)
	}
}
