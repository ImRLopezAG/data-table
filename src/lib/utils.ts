import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const dates = [
	[getDate(2000), getDate(2004)],
	[getDate(2005), getDate(2009)],
	[getDate(2010), getDate(2014)],
	[getDate(2015), getDate(2019)],
	[getDate(2020), getDate(2025)],
]
	.map(([min, max]) => {
		return `${min.toISOString().split('T')[0]} to ${
			max.toISOString().split('T')[0]
		}`
	})
	.map((value) => ({
		value,
		label: value,
	}))

export const values = [
	[0, 100],
	[100, 200],
	[200, 500],
	[500, 1000],
]
	.map(([min, max]) => {
		return `${min} - ${max}`
	})
	.map((value) => ({
		value,
		label: value,
	}))


function getDate(year: number) {
	const date = new Date(year, 0, 1)
	const start = date.getTime()
	const end = new Date(year + 1, 0, 1).getTime()
	const randomTime = Math.random() * (end - start) + start
	return new Date(randomTime)
}
