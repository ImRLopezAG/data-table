import { useState } from 'react'

export function App() {
	const [count, setCount] = useState(0)

	return (
		<div className='flex h-screen items-center justify-center'>
			<button
        type='button'

				className='rounded bg-blue-500 px-4 py-2 text-white'
				onClick={() => setCount((prev) => prev + 1)}
			>
				Count: {count}
			</button>
		</div>
	)
}

export default App  