type FetcherResponse<T> = Promise<[Error, undefined] | [undefined, T]>

interface FetcherConfig<T = unknown> {
	onBeforeFetch?: (args: Parameters<typeof fetch>) => Promise<void>
	onAfterFetch?: (response: Response) => Promise<void>
	onError?: (error: Error) => Promise<void>
	onUnsuccessfulResponse?: (
		response: Response,
		args: Parameters<typeof fetch>,
	) => FetcherResponse<T>
	handleResponse?: (response: Response) => FetcherResponse<T>
}

export function createFetcher<T = unknown>(config: FetcherConfig<T> = {}) {
	return async (...args: Parameters<typeof fetch>): FetcherResponse<T> => {
		try {
			if (config.onBeforeFetch) await config.onBeforeFetch(args)

			const response = await fetch(...args)

			if (config.onAfterFetch) await config.onAfterFetch(response)

			if (!response.ok) {
				if (config.onUnsuccessfulResponse)
					return await config.onUnsuccessfulResponse(response, args)

				return [
					Error(
						`Request failed with status ${response.status}, ${response.statusText}`,
					),
					undefined,
				]
			}

			if (config.handleResponse) return await config.handleResponse(response)

			const contentType = response.headers.get('Content-Type')
			if (!contentType?.includes('application/json')) {
				return [Error('Unexpected non-JSON response'), undefined]
			}

			const data = await response.json()
			return [undefined, data as T]
		} catch (error) {
			const appError =
				error instanceof Error ? error : new Error('Unknown error occurred')

			if (config.onError) await config.onError(appError)

			return [appError, undefined]
		}
	}
}
