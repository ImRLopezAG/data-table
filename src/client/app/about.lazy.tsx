import { createLazyFileRoute } from '@tanstack/react-router'
export const Route = createLazyFileRoute('/about')({
	component: About,
})

function About() {
	return (
		<div className='flex h-full w-full items-center justify-center'>
			<div className='flex flex-col items-center gap-4'>
				<h1 className='font-bold text-2xl'>About</h1>
				<p className='text-center text-gray-600'>
					This is a sample about page for the Data Table application.
				</p>
			</div>
		</div>
	)
}
