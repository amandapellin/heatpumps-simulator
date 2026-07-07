import '../../css/pool-viz.css'

/**
 * PoolViz — visualização isométrica da piscina em SVG puro (sem dependências).
 *
 * Uso:
 *   const viz = new PoolViz(containerEl)
 *   viz.update({ areas, velocidadeVento, dispositivoHidromassagem,
 *                larguraCascata, comprimentoBordaInfinita, utilizacaoCapaTermica })
 *
 * As áreas são desenhadas como um ÚNICO CORPO CONECTADO: cada área vira um
 * setor encostado no anterior ao longo do comprimento (mesma superfície d'água,
 * profundidades distintas). A ÁREA PRINCIPAL (areas[0]) concentra os detalhes —
 * dispositivos (hidromassagem/cascata/borda), efeitos de água e cotas — enquanto
 * o vento/ambiente envolve o conjunto todo. A viz reage a vento/ambiente,
 * hidromassagem, cascata, borda infinita e capa térmica.
 */

const NS = 'http://www.w3.org/2000/svg'
const COS = Math.cos(Math.PI / 6)
const SIN = Math.sin(Math.PI / 6)
const PRAINHA_DEPTH = 0.6

// Mapa vento -> muros/ambiente (espelha as opções do formulário e as tags do vídeo).
const WIND_ENCLOSURE = {
	sem_vento: { walls: [[0, 1], [1, 2], [2, 3], [3, 0]], roof: true,  tag: 'AMBIENTE FECHADO',       arrows: 0, dur: 0 },
	fraco:     { walls: [[0, 1], [1, 2], [2, 3], [3, 0]], roof: false, tag: 'MURO EM TODOS OS LADOS', arrows: 0, dur: 0 },
	medio:     { walls: [[0, 3], [0, 1]],                 roof: false, tag: 'MURO EM 2 LADOS',        arrows: 2, dur: 2.7 },
	forte:     { walls: [],                               roof: false, tag: 'EXPOSTO AO VENTO',       arrows: 4, dur: 1.8 },
}

const iso = (x, y, z, s) => ({ px: (x - y) * COS * s, py: (x + y) * SIN * s + z * s })
const norm = (v) => { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m } }
const bbox = (r) => {
	let a = 1e9, b = -1e9, c = 1e9, d = -1e9
	r.forEach(p => { a = Math.min(a, p.px); b = Math.max(b, p.px); c = Math.min(c, p.py); d = Math.max(d, p.py) })
	return { minX: a, maxX: b, minY: c, maxY: d, w: b - a, h: d - c }
}

function el(tag, attrs, cls) {
	const n = document.createElementNS(NS, tag)
	if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k])
	if (cls) n.setAttribute('class', cls)
	return n
}

export class PoolViz {
	constructor(container) {
		this.container = typeof container === 'string' ? document.querySelector(container) : container
		this.VBW = 640
		this.VBH = 460
		this.container.innerHTML = this._shell()
		this.svg = this.container.querySelector('svg')
		this.scene = this.svg.querySelector('.pv-scene')
		this.clipPoly = this.svg.querySelector('.pv-clip-poly')
		this.clipCascPoly = this.svg.querySelector('.pv-clipcasc-poly')
	}

	/**
	 * Métricas geométricas de todas as áreas (prainha fica fora do volume/área,
	 * como no dimensionamento).
	 */
	static metrics(areas = [], tDes = 0, tIni = 0) {
		let volume = 0, area = 0
		areas.forEach(a => {
			const c = parseFloat(a.comprimento) || 0
			const l = parseFloat(a.largura) || 0
			const p = parseFloat(a.profundidade) || 0
			if (p > PRAINHA_DEPTH) { volume += c * l * p; area += c * l }
		})
		return { volume, area, deltaT: Math.max(0, (parseFloat(tDes) || 0) - (parseFloat(tIni) || 0)) }
	}

	update(state = {}) {
		const src = (state.areas && state.areas.length) ? state.areas : [{}]
		const areas = src.map(a => ({
			L: parseFloat(a.comprimento) || 0.1,
			W: parseFloat(a.largura) || 0.1,
			H: parseFloat(a.profundidade) || 0.1,
		}))
		this._render({
			areas,
			vento: state.velocidadeVento || 'sem_vento',
			hidro: parseInt(state.dispositivoHidromassagem, 10) || 0,
			cascata: parseFloat(state.larguraCascata) || 0,
			borda: parseFloat(state.comprimentoBordaInfinita) || 0,
			capa: state.utilizacaoCapaTermica || 'nao',
		})
	}

	_shell() {
		return `
			<svg class="pv-svg" viewBox="0 0 ${this.VBW} ${this.VBH}" role="img"
			     aria-label="Visualização isométrica da piscina">
				<defs>
					<linearGradient id="pvWater" x1="0" y1="0" x2="0.35" y2="1">
						<stop offset="0" stop-color="#5bb8ff" stop-opacity=".52"/><stop offset="1" stop-color="#03737a" stop-opacity=".62"/></linearGradient>
					<linearGradient id="pvPra" x1="0" y1="0" x2="0.35" y2="1">
						<stop offset="0" stop-color="#8fe6da" stop-opacity=".5"/><stop offset="1" stop-color="#2aa9a0" stop-opacity=".6"/></linearGradient>
					<linearGradient id="pvFloor" x1="0" y1="0" x2="0.3" y2="1">
						<stop offset="0" stop-color="#0a5157"/><stop offset="1" stop-color="#022c31"/></linearGradient>
					<linearGradient id="pvWallO" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#0a565d"/><stop offset="1" stop-color="#00252a"/></linearGradient>
					<linearGradient id="pvWallO2" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#074449"/><stop offset="1" stop-color="#001b1f"/></linearGradient>
					<linearGradient id="pvWallI" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#0e7377"/><stop offset="1" stop-color="#064b50"/></linearGradient>
					<linearGradient id="pvGlass" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#d6f1ff" stop-opacity=".05"/><stop offset="1" stop-color="#a9dcff" stop-opacity=".28"/></linearGradient>
					<linearGradient id="pvSheen" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
					<linearGradient id="pvFall" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#bfefff" stop-opacity=".2"/><stop offset="1" stop-color="#7fd8ff" stop-opacity=".75"/></linearGradient>
					<clipPath id="pvClip"><polygon class="pv-clip-poly" points=""/></clipPath>
					<clipPath id="pvClipCasc"><polygon class="pv-clipcasc-poly" points=""/></clipPath>
				</defs>
				<g class="pv-scene"></g>
			</svg>`
	}

	_render(st) {
		const { areas, vento, hidro, cascata, borda, capa } = st
		const scene = this.scene
		scene.textContent = ''
		const ox0 = this.VBW, oy0 = this.VBH

		// Cada setor se encosta ao ANTERIOR pela lateral cuja dimensão coincide:
		//  - mesma largura  -> encaixa ao longo do COMPRIMENTO (eixo x);
		//  - mesmo comprimento -> encaixa ao longo da LARGURA (eixo y), formando um L;
		//  - nenhuma dimensão igual -> qualquer lado (segue no comprimento).
		// Superfície da água em z=0; profundidades (H) distintas por área.
		const EPS = 1e-3
		const boxes = []
		areas.forEach((a, i) => {
			let X0 = 0, Y0 = 0
			if (i > 0) {
				const prev = boxes[i - 1]
				if (Math.abs(a.W - prev.W) < EPS) {          // mesma largura -> ao longo do comprimento
					X0 = prev.X0 + prev.L; Y0 = prev.Y0
				} else if (Math.abs(a.L - prev.L) < EPS) {   // mesmo comprimento -> ao longo da largura
					X0 = prev.X0; Y0 = prev.Y0 + prev.W
				} else {                                     // sem dimensão igual -> segue no comprimento
					X0 = prev.X0 + prev.L; Y0 = prev.Y0
				}
			}
			boxes.push({ i, X0, Y0, L: a.L, W: a.W, H: a.H, pra: a.H <= PRAINHA_DEPTH && a.H > 0 })
		})
		const totalL = Math.max(...boxes.map(b => b.X0 + b.L)) || 0.1
		const maxW = Math.max(...boxes.map(b => b.Y0 + b.W)) || 0.1
		const prim = boxes[0]
		const last = boxes[boxes.length - 1]
		const multi = boxes.length > 1

		const cornersOf = (b) => [
			[b.X0, b.Y0, 0], [b.X0 + b.L, b.Y0, 0], [b.X0 + b.L, b.Y0 + b.W, 0], [b.X0, b.Y0 + b.W, 0],
			[b.X0, b.Y0, b.H], [b.X0 + b.L, b.Y0, b.H], [b.X0 + b.L, b.Y0 + b.W, b.H], [b.X0, b.Y0 + b.W, b.H],
		]
		const footC = [[0, 0, 0], [totalL, 0, 0], [totalL, maxW, 0], [0, maxW, 0]]

		// escala a partir do bounding box de todos os setores + do footprint
		const collect = (sc) => {
			const acc = []
			boxes.forEach(b => cornersOf(b).forEach(c => acc.push(iso(c[0], c[1], c[2], sc))))
			footC.forEach(c => acc.push(iso(c[0], c[1], c[2], sc)))
			return acc
		}
		let bb = bbox(collect(1))
		const s = Math.min((ox0 - 210) / bb.w, (oy0 - 200) / bb.h)
		bb = bbox(collect(s))
		const ox = ox0 / 2 - (bb.minX + bb.maxX) / 2
		const oy = oy0 / 2 - (bb.minY + bb.maxY) / 2 + 34
		const pt = (px, py, pz) => { const p = iso(px, py, pz, s); return { x: p.px + ox, y: p.py + oy } }

		boxes.forEach(b => { b.P = cornersOf(b).map(c => pt(c[0], c[1], c[2])) })
		const F = footC.map(c => pt(c[0], c[1], c[2]))
		const topMinY = Math.min(F[0].y, F[1].y, F[2].y, F[3].y)
		const ptsOf = (P, idx) => idx.map(i => P[i].x.toFixed(1) + ',' + P[i].y.toFixed(1)).join(' ')

		// sombra projetada do conjunto
		scene.appendChild(el('ellipse', { cx: ox0 / 2, cy: bb.maxY + oy - 4, rx: bb.w / 2 * .96, ry: bb.w / 2 * .1, fill: '#00353b', opacity: .09 }))

		// PASSA 1 — corpo sólido de cada setor (fundo a frente): interior, água,
		// paredes externas e wireframe. A ordem por X0 garante a oclusão correta.
		// pintor: setores ao fundo (menor x+y) primeiro; à frente por cima
		const drawOrder = boxes.slice().sort((a, b) => (a.X0 + a.Y0) - (b.X0 + b.Y0))
		drawOrder.forEach(b => {
			const P = b.P
			scene.appendChild(el('polygon', { points: ptsOf(P, [4, 5, 6, 7]), fill: 'url(#pvFloor)' }))
			scene.appendChild(el('polygon', { points: ptsOf(P, [0, 1, 5, 4]), fill: 'url(#pvWallI)', 'fill-opacity': .96 }))
			scene.appendChild(el('polygon', { points: ptsOf(P, [0, 3, 7, 4]), fill: 'url(#pvWallI)', 'fill-opacity': .9 }));
			[[4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, c]) =>
				scene.appendChild(el('line', { x1: P[a].x, y1: P[a].y, x2: P[c].x, y2: P[c].y, stroke: '#7fd3d8', 'stroke-opacity': .28, 'stroke-width': 1 })))

			scene.appendChild(el('polygon', { points: ptsOf(P, [0, 1, 2, 3]), fill: b.pra ? 'url(#pvPra)' : 'url(#pvWater)' }))

			scene.appendChild(el('polygon', { points: ptsOf(P, [1, 2, 6, 5]), fill: 'url(#pvWallO)' }))
			scene.appendChild(el('polygon', { points: ptsOf(P, [3, 2, 6, 7]), fill: 'url(#pvWallO2)' }));

			[[0, 1], [1, 2], [2, 3], [3, 0], [1, 5], [2, 6], [3, 7], [5, 6], [6, 7]].forEach(([a, c]) =>
				scene.appendChild(el('line', { x1: P[a].x, y1: P[a].y, x2: P[c].x, y2: P[c].y, stroke: '#8fe6ff', 'stroke-opacity': .6, 'stroke-width': 1.25 })))
		})

		// PASSA 2 — detalhes "herói" sobre a Área 1 (e conjunto), por cima do sólido.
		const P0 = prim.P
		const L = prim.L, W = prim.W, H = prim.H

		// efeitos na lâmina da Área 1 (recortados na sua superfície)
		this.clipPoly.setAttribute('points', ptsOf(P0, [0, 1, 2, 3]))
		const pbb = bbox(P0.map(p => ({ px: p.x, py: p.y })))
		const gw = el('g', { 'clip-path': 'url(#pvClip)' })
		for (let k = 0; k < 3; k++) {
			const q0 = iso(L * 0.1, W * (0.25 + 0.25 * k), 0, s)
			const q1 = iso(L * 0.9, W * (0.2 + 0.28 * k), 0, s)
			gw.appendChild(el('line', { x1: q0.px + ox, y1: q0.py + oy, x2: q1.px + ox, y2: q1.py + oy, stroke: '#dffcff', 'stroke-width': 2, 'stroke-opacity': .2, 'stroke-linecap': 'round' }, 'pv-caustic'))
		}
		if (capa !== 'sim') {
			gw.appendChild(el('rect', { x: pbb.minX - 40, y: pbb.minY - 40, width: 86, height: pbb.h + 80, fill: 'url(#pvSheen)', transform: 'translate(' + (pbb.w / 2) + ' 0)' }, 'pv-sheen'));
			[[.4, .4, 'pv-ripple'], [.62, .56, 'pv-ripple b'], [.5, .3, 'pv-ripple c']].forEach(([fx, fy, cls]) => {
				const q = iso(L * fx, W * fy, 0, s)
				gw.appendChild(el('ellipse', { cx: q.px + ox, cy: q.py + oy, rx: 15, ry: 8, fill: 'none', stroke: '#fff', 'stroke-opacity': .75, 'stroke-width': 1.3 }, cls))
			})
		}
		scene.appendChild(gw)

		// hidromassagem nas paredes internas da Área 1 (fundo), abaixo da lâmina
		const N = Math.min(hidro, 10)
		if (N > 0) {
			const zd = Math.min(0.35, H * 0.5)
			let nLen = Math.round(N * L / (L + W))
			nLen = Math.max(1, Math.min(N - (N > 1 ? 1 : 0), nLen))
			const nWid = N - nLen
			const jets = []
			for (let i = 0; i < nLen; i++) jets.push(iso(L * (i + 1) / (nLen + 1), 0, zd, s))
			for (let j = 0; j < nWid; j++) jets.push(iso(0, W * (j + 1) / (nWid + 1), zd, s))
			jets.forEach((q, i) => {
				const gx = q.px + ox, gy = q.py + oy
				scene.appendChild(el('circle', { cx: gx, cy: gy, r: 2.9, fill: '#eafcff', 'fill-opacity': .95 }))
				const jet = el('circle', { cx: gx, cy: gy, r: 4.6, fill: 'none', stroke: '#dff6ff', 'stroke-width': 1.5 }, 'pv-jet')
				jet.style.animationDelay = (i * 0.24) + 's'
				scene.appendChild(jet)
			})
		}

		// capa térmica sobre TODOS os setores
		if (capa === 'sim') {
			boxes.forEach(b => scene.appendChild(el('polygon', { points: ptsOf(b.P, [0, 1, 2, 3]), fill: '#7fae5a', 'fill-opacity': .6, stroke: '#5c8a2e', 'stroke-width': 1 })))
			const m = pt(L * .5, W * .5, 0)
			this._chip(m.x, m.y, 'CAPA TÉRMICA', '#3c5a12', '#eef7e0')
		}

		// cascata na parede do COMPRIMENTO da Área 1 (face 3-2-6-7) — externa
		if (cascata > 0) {
			this.clipCascPoly.setAttribute('points', ptsOf(P0, [3, 2, 6, 7]))
			const gc = el('g', { 'clip-path': 'url(#pvClipCasc)' })
			const frac = Math.max(.2, Math.min(.85, cascata / 300))
			const ax = P0[3].x, ay = P0[3].y, ex = P0[2].x - P0[3].x, ey = P0[2].y - P0[3].y
			const x1 = ax + ex * (.5 - frac / 2), y1 = ay + ey * (.5 - frac / 2)
			const x2 = ax + ex * (.5 + frac / 2), y2 = ay + ey * (.5 + frac / 2)
			const dx = P0[7].x - P0[3].x, dy = P0[7].y - P0[3].y
			gc.appendChild(el('polygon', { points: `${x1},${y1} ${x2},${y2} ${x2 + dx},${y2 + dy} ${x1 + dx},${y1 + dy}`, fill: 'url(#pvFall)' }))
			const strp = el('g', {}, 'pv-fall')
			for (let k = 0; k < 4; k++) {
				const t = .12 + .76 * k / 4, sx = x1 + (x2 - x1) * t, sy = y1 + (y2 - y1) * t
				strp.appendChild(el('line', { x1: sx, y1: sy, x2: sx + dx, y2: sy + dy, stroke: '#eaffff', 'stroke-opacity': .5, 'stroke-width': 1.5 }))
			}
			gc.appendChild(strp)
			scene.appendChild(gc)
		}

		// borda infinita: transbordo na parede da LARGURA do ÚLTIMO setor (extremo
		// direito, aresta 1-2) — parede externa oposta à cascata.
		if (borda > 0) {
			const LP = last.P
			scene.appendChild(el('line', { x1: LP[1].x, y1: LP[1].y, x2: LP[2].x, y2: LP[2].y, stroke: '#d9f7ff', 'stroke-width': 3, 'stroke-opacity': .95 }))
			const dx = (LP[5].x - LP[1].x) * .55, dy = (LP[5].y - LP[1].y) * .55
			scene.appendChild(el('polygon', { points: `${LP[1].x},${LP[1].y} ${LP[2].x},${LP[2].y} ${LP[2].x + dx},${LP[2].y + dy} ${LP[1].x + dx},${LP[1].y + dy}`, fill: 'url(#pvFall)', 'fill-opacity': .75 }, 'pv-fall'))
		}

		// ambiente (muros conforme o vento) envolvendo o conjunto (footprint) + tag
		const rise = Math.min(78, bb.h * 0.5)
		const up = (idx) => ({ x: F[idx].x, y: F[idx].y - rise })
		const enc = WIND_ENCLOSURE[vento] || WIND_ENCLOSURE.medio
		enc.walls.forEach(([a, b]) => {
			const A = up(a), B = up(b), front = (a === 2 || b === 2)
			scene.appendChild(el('polygon', {
				points: `${F[a].x},${F[a].y} ${F[b].x},${F[b].y} ${B.x},${B.y} ${A.x},${A.y}`,
				fill: 'url(#pvGlass)', 'fill-opacity': front ? .28 : 1, stroke: '#bfe9ff', 'stroke-opacity': front ? .35 : .6, 'stroke-width': 1,
			}))
		})
		if (enc.roof) {
			const R = [up(0), up(1), up(2), up(3)]
			scene.appendChild(el('polygon', { points: R.map(p => p.x + ',' + p.y).join(' '), fill: '#cdeeff', 'fill-opacity': .14, stroke: '#bfe9ff', 'stroke-opacity': .4, 'stroke-width': 1 }))
		}
		this._chip(this.VBW / 2, enc.walls.length ? topMinY - rise - 14 : topMinY - 20, enc.tag, '#fff', vento === 'forte' ? '#0a6ea0' : '#00353b')

		// vento no sentido do COMPRIMENTO do conjunto (F0->F1) — apenas médio/forte
		if (enc.arrows > 0) {
			const dir = norm({ x: F[1].x - F[0].x, y: F[1].y - F[0].y })
			const ang = Math.atan2(dir.y, dir.x) * 180 / Math.PI
			const dist = Math.hypot(F[1].x - F[0].x, F[1].y - F[0].y) * 1.15
			for (let i = 0; i < enc.arrows; i++) {
				const frac = (i + 1) / (enc.arrows + 1)
				const q = iso(0.02 * totalL, maxW * frac, 0, s)
				const sx = q.px + ox, sy = q.py + oy - 14
				const wrap = el('g', { transform: `translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${ang.toFixed(1)})` })
				const arw = el('path', { d: 'M0,0 h32 M26,-4 l6,4 -6,4', fill: 'none', stroke: '#afe327', 'stroke-opacity': .95, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, 'pv-wind')
				arw.style.setProperty('--pv-dist', dist.toFixed(0) + 'px')
				arw.style.setProperty('--pv-wd', enc.dur + 's')
				arw.style.animationDelay = (i * 0.5) + 's'
				wrap.appendChild(arw)
				scene.appendChild(wrap)
			}
		}

		// rótulos dos setores adicionais (Área 2, 3…) sobre a superfície
		if (multi) {
			boxes.forEach(b => {
				if (b.i === 0) return
				const c = pt(b.X0 + b.L / 2, b.Y0 + b.W * 0.6, 0)
				this._chip(c.x, c.y, 'Área ' + (b.i + 1), b.pra ? '#1c7a72' : '#00353b', '#fff')
			})
		}

		// cotas da Área 1 (com rótulo explícito quando há mais setores)
		const tag = multi ? ' (Área 1)' : ''
		this._measure(P0[0], P0[1], 20, { x: 0, y: -1 }, 'C ' + this._nf(L) + ' m' + tag)
		this._measure(P0[0], P0[3], 20, { x: 0, y: -1 }, 'L ' + this._nf(W) + ' m')
		this._measure(P0[1], P0[5], 22, { x: 1, y: 0 }, 'P ' + this._nf(H) + ' m')
	}

	_nf(n) { return n.toFixed(1).replace('.', ',') }

	_measure(a, b, dist, hint, label) {
		const dir = norm({ x: b.x - a.x, y: b.y - a.y })
		let perp = { x: -dir.y, y: dir.x }
		if (perp.x * hint.x + perp.y * hint.y < 0) perp = { x: -perp.x, y: -perp.y }
		const off = (p) => ({ x: p.x + perp.x * dist, y: p.y + perp.y * dist })
		const A = off(a), B = off(b), col = '#00353b'
		this.scene.appendChild(el('line', { x1: a.x, y1: a.y, x2: A.x, y2: A.y, stroke: col, 'stroke-opacity': .35, 'stroke-width': 1 }))
		this.scene.appendChild(el('line', { x1: b.x, y1: b.y, x2: B.x, y2: B.y, stroke: col, 'stroke-opacity': .35, 'stroke-width': 1 }))
		this.scene.appendChild(el('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: col, 'stroke-width': 1.4 }))
		this._arrow(A, dir, col)
		this._arrow(B, { x: -dir.x, y: -dir.y }, col)
		this._chip((A.x + B.x) / 2, (A.y + B.y) / 2, label, '#fff', '#00353b')
	}

	_arrow(tip, dir, col) {
		const w = 4, l = 8, p = { x: -dir.x, y: -dir.y }, pe = { x: -dir.y, y: dir.x }
		const p1 = { x: tip.x + p.x * l + pe.x * w, y: tip.y + p.y * l + pe.y * w }
		const p2 = { x: tip.x + p.x * l - pe.x * w, y: tip.y + p.y * l - pe.y * w }
		this.scene.appendChild(el('polygon', { points: `${tip.x},${tip.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`, fill: col }))
	}

	_chip(x, y, text, fg, bg) {
		const w = text.length * 7 + 16, h = 20
		const g = el('g', { transform: `translate(${(x - w / 2).toFixed(1)} ${(y - h / 2).toFixed(1)})` })
		g.appendChild(el('rect', { x: 0, y: 0, width: w, height: h, rx: 6, fill: bg, stroke: bg === '#fff' ? '#00353b' : 'transparent', 'stroke-opacity': bg === '#fff' ? .15 : 1 }))
		const t = el('text', { x: w / 2, y: h / 2 + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: fg })
		t.textContent = text
		g.appendChild(t)
		this.scene.appendChild(g)
	}
}
