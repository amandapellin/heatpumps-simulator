// Notificações inline não bloqueantes — substituem window.alert().
// Uso: showToast('Mensagem', 'error' | 'warning' | 'success' | 'info')

const TYPE_COLORS = {
	error:   { color: '#EF4444', bg: '#FEF2F2' },
	warning: { color: '#F59E0B', bg: '#FFFBEB' },
	success: { color: '#7CB342', bg: '#F1F8E9' },
	info:    { color: '#0288D1', bg: '#F0F9FF' },
}

function getContainer() {
	let container = document.querySelector('#eco-toast-container')
	if (!container) {
		container = document.createElement('div')
		container.id = 'eco-toast-container'
		container.className = 'eco-toast-container'
		document.body.appendChild(container)
	}
	return container
}

/**
 * Exibe uma notificação temporária e dispensável.
 * @param {string} message  Texto da mensagem (inserido como texto, sem HTML).
 * @param {'error'|'warning'|'success'|'info'} [type='error']
 * @param {number} [duration=4500] Tempo até sumir (ms). 0 = não some sozinha.
 */
export function showToast(message, type = 'error', duration = 4500) {
	const cfg = TYPE_COLORS[type] || TYPE_COLORS.error
	const container = getContainer()

	const toast = document.createElement('div')
	toast.className = `eco-toast eco-toast--${type}`
	toast.setAttribute('role', type === 'error' ? 'alert' : 'status')
	toast.style.setProperty('--toast-color', cfg.color)
	toast.style.setProperty('--toast-bg', cfg.bg)

	const msg = document.createElement('span')
	msg.className = 'eco-toast-msg'
	msg.textContent = message // textContent evita injeção de HTML

	const close = document.createElement('button')
	close.type = 'button'
	close.className = 'eco-toast-close'
	close.setAttribute('aria-label', 'Fechar')
	close.textContent = '×'

	const remove = () => {
		toast.classList.add('eco-toast--out')
		setTimeout(() => toast.remove(), 200)
	}

	close.addEventListener('click', remove)
	toast.appendChild(msg)
	toast.appendChild(close)
	container.appendChild(toast)

	if (duration > 0) {
		setTimeout(remove, duration)
	}

	return toast
}
