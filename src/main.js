import './css/components.css'
import { App } from './js/app.js'
import { createIcons, icons } from 'lucide'

const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400;500;600;700;800&display=swap'
document.head.appendChild(link)

document.addEventListener('DOMContentLoaded', () => {
	const app = new App('#app')
	app.render()
	createIcons({icons})
})

export { createIcons, icons }