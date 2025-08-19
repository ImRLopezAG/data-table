import { createFetcher } from './create-fetcher'
export const fetcher = async <T>(...args: Parameters<typeof fetch>) =>
	createFetcher<T>({})(...args)
