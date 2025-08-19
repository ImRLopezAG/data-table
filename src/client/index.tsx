import { createRoot } from 'react-dom/client'
import { Bootstrap } from './main'
import './style.css'
// Client-side hydration for SSR
if (typeof window !== 'undefined') {
	const container = window.document.getElementById('root')
	if (container) {
		createRoot(container).render(<Bootstrap />)
	}
}
