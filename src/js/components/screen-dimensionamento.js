import '../../css/screen-dimensionamento.css'
import { createIcons, icons } from '../../main.js'
import { showToast } from '../toast.js'
import { PoolViz } from './pool-viz.js'

// Espelha App\Utils\Constants::PRAINHA_DEPTH no backend.
const PRAINHA_DEPTH = 0.6

const VENTO_LABEL = {
	sem_vento: 'Ambiente fechado',
	fraco: 'Muro em todos os lados',
	medio: 'Muro em 2 lados',
	forte: 'Exposto ao vento',
}

/**
 * Tela 1 — Dimensionamento. Une Localização + Piscina numa única tela com a
 * visualização 3D ao vivo. Reaproveita a lógica das telas antigas e entrega os
 * mesmos shapes (locationData, poolData) que o StepResult já consome.
 */
export class ScreenDimensionamento {
	constructor(apiService) {
		this.apiService = apiService
		this.location = { state: '', city: '', state_city: '' }
		this.states = []
		this.cities = []
		this.areaCounter = 0
		this.areas = [{ id: ++this.areaCounter, comprimento: '', largura: '', profundidade: '' }]
		this.viz = null
		this.data = {
			areas: [],
			tanqueCompensacao: 'nao',
			tipoUtilizacao: 'privada',
			utilizacaoAnual: 'ano_inteiro',
			utilizacaoMensal: 'finais_de_semana',
			localizacaoPiscina: 'externa',
			utilizacaoCapaTermica: 'nao',
			velocidadeVento: 'sem_vento',
			reabastecimentoDiario: 0,
			temperaturaDesejada: 32,
			temperaturaInicial: 20,
			comprimentoBordaInfinita: 0,
			larguraCascata: 0,
			dispositivoHidromassagem: 0,
		}
	}

	// ---------------------------------------------------------------- clima/local
	capitalizeWords(str) {
		const prep = ['do', 'da', 'dos', 'das', 'de', 'di', 'du', 'e', 'a', 'o']
		return String(str).toLowerCase().split(' ').map((w, i) =>
			(i !== 0 && prep.includes(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)
		).join(' ')
	}

	async loadStates() {
		try {
			const res = await this.apiService.getStates()
			this.states = res.data || res
			const sel = document.querySelector('#state')
			if (!sel) return
			sel.innerHTML = '<option value="">Selecione o estado</option>' + this.states.map(s => {
				const code = typeof s === 'object' ? s.uf : String(s)
				const name = typeof s === 'object' ? s.uf_name : String(s)
				return `<option value="${code}">${this.capitalizeWords(name)}</option>`
			}).join('')
		} catch (e) {
			console.error('Erro ao carregar estados:', e)
			showToast('Não foi possível carregar os estados. Tente novamente mais tarde.', 'error')
		}
	}

	async loadCities(state) {
		try {
			const res = await this.apiService.getCities(state)
			this.cities = res.data || res
			const sel = document.querySelector('#city')
			if (!sel) return
			sel.innerHTML = '<option value="">Selecione a cidade</option>' + this.cities.map(c => {
				const name = typeof c === 'object' ? c.cidade : String(c)
				// value = nome cru (compõe a chave uf_cidade da busca); rótulo formatado.
				return `<option value="${name}">${this.capitalizeWords(name)}</option>`
			}).join('')
		} catch (e) {
			console.error('Erro ao carregar cidades:', e)
			showToast('Não foi possível carregar as cidades. Tente novamente mais tarde.', 'error')
		}
	}

	async loadClimate(stateCity) {
		try {
			const res = await this.apiService.getClimateData(stateCity)
			const c = res.data || res
			this.climateData = c
			const chips = document.querySelector('#climateChips')
			if (chips) {
				const umid = c.umidade_rel_media != null ? (parseFloat(c.umidade_rel_media) * 100).toFixed(0) + '%' : '—'
				chips.innerHTML = `
					<span class="dim-chip">🌡 Mín. ${c.temp_minima ?? '—'} °C</span>
					<span class="dim-chip">💧 ${umid}</span>
					<span class="dim-chip">🌬 ${c.vel_vento ?? '—'} m/s</span>
					<span class="dim-chip">⛰ ${c.altitude ?? '—'} m</span>`
			}
			// wind_category vem do backend (City::getWindCategory) — fonte única.
			const windSel = document.querySelector('#velocidadeVento')
			if (windSel && c.wind_category) {
				windSel.value = c.wind_category
				this.data.velocidadeVento = c.wind_category
				this.refreshViz()
			}
			return c
		} catch (e) {
			console.error('Erro ao carregar dados climáticos:', e)
			showToast('Não foi possível carregar os dados climáticos. Tente novamente mais tarde.', 'error')
		}
	}

	// ---------------------------------------------------------------- áreas
	addArea() {
		this.areas.push({ id: ++this.areaCounter, comprimento: '', largura: '', profundidade: '' })
		this.renderAreas()
		this.refreshViz()
	}

	removeArea(id) {
		this.areas = this.areas.filter(a => a.id !== id)
		this.renderAreas()
		this.refreshViz()
	}

	_isPrainhaDepth(p) {
		const d = parseFloat(p)
		return !isNaN(d) && d > 0 && d < PRAINHA_DEPTH
	}

	renderAreas() {
		const container = document.querySelector('#poolAreasContainer')
		if (!container) return
		container.innerHTML = this.areas.map((area, i) => `
			<div class="eco-area-card" data-area-id="${area.id}">
				<div class="eco-area-header">
					<h3>Área ${i + 1}</h3>
					${this.areas.length > 1 ? `<button type="button" class="eco-btn-remove" data-area-id="${area.id}">
						<i data-lucide="trash-2" class="eco-icon-trash"></i></button>` : ''}
				</div>
				<div class="eco-area-fields">
					<div class="eco-form-group"><label class="eco-label">Comprimento (m)</label>
						<input type="number" class="eco-input" data-field="comprimento" data-area-id="${area.id}" value="${area.comprimento}" placeholder="Ex: 8" step="0.1" min="0"></div>
					<div class="eco-form-group"><label class="eco-label">Largura (m)</label>
						<input type="number" class="eco-input" data-field="largura" data-area-id="${area.id}" value="${area.largura}" placeholder="Ex: 4" step="0.1" min="0"></div>
					<div class="eco-form-group"><label class="eco-label">Profundidade (m)</label>
						<input type="number" class="eco-input" data-field="profundidade" data-area-id="${area.id}" value="${area.profundidade}" placeholder="Ex: 1.5" step="0.1" min="0"></div>
				</div>
				<div class="eco-area-prainha-badge${this._isPrainhaDepth(area.profundidade) ? ' is-visible' : ''}" data-prainha-badge="${area.id}">
					<i data-lucide="waves"></i>
					<span>Esta área será tratada como <strong>prainha</strong> (parte rasa, profundidade &lt; ${PRAINHA_DEPTH} m).</span>
				</div>
			</div>`).join('')

		container.querySelectorAll('.eco-btn-remove').forEach(btn =>
			btn.addEventListener('click', e => this.removeArea(parseInt(e.currentTarget.dataset.areaId, 10))))

		container.querySelectorAll('[data-area-id][data-field]').forEach(inp =>
			inp.addEventListener('input', e => {
				const id = parseInt(e.target.dataset.areaId, 10)
				const area = this.areas.find(a => a.id === id)
				if (!area) return
				area[e.target.dataset.field] = e.target.value
				if (e.target.dataset.field === 'profundidade') {
					const badge = container.querySelector(`[data-prainha-badge="${id}"]`)
					if (badge) badge.classList.toggle('is-visible', this._isPrainhaDepth(area.profundidade))
				}
				this.refreshViz()
			}))

		setTimeout(() => createIcons({ icons }), 0)
	}

	// ---------------------------------------------------------------- viz + métricas
	refreshViz() {
		const mount = document.querySelector('#poolVizMount')
		if (!mount) return
		const prim = this.areas[0] || {}
		const valid = parseFloat(prim.comprimento) > 0 && parseFloat(prim.largura) > 0 && parseFloat(prim.profundidade) > 0

		if (!valid) {
			this.viz = null
			mount.innerHTML = `<div style="padding:48px 16px;text-align:center;color:var(--cinza-medio-escuro,#999);font-size:14px;">
				<i data-lucide="ruler" style="width:34px;height:34px;"></i>
				<p style="margin-top:10px;">Informe as dimensões da Área 1 para ver a piscina.</p></div>`
			setTimeout(() => createIcons({ icons }), 0)
		} else {
			if (!this.viz) this.viz = new PoolViz(mount)
			this.viz.update({
				areas: this.areas,
				velocidadeVento: this.data.velocidadeVento,
				dispositivoHidromassagem: this.data.dispositivoHidromassagem,
				larguraCascata: this.data.larguraCascata,
				comprimentoBordaInfinita: this.data.comprimentoBordaInfinita,
				utilizacaoCapaTermica: this.data.utilizacaoCapaTermica,
			})
		}

		const m = PoolViz.metrics(this.areas, this.data.temperaturaDesejada, this.data.temperaturaInicial)
		const nf = (n) => n.toFixed(1).replace('.', ',')
		this._setMetric('dimVol', nf(m.volume), 'm³')
		this._setMetric('dimArea', nf(m.area), 'm²')
		this._setMetric('dimDelta', Math.round(m.deltaT), '°C')
		const tipoEl = document.querySelector('#dimTipo')
		if (tipoEl) tipoEl.textContent = this._isPrainhaDepth(prim.profundidade) ? 'Prainha' : 'Piscina'

		this._renderLegend()
	}

	_setMetric(id, val, unit) {
		const node = document.querySelector('#' + id)
		if (node) node.innerHTML = `${val} <small>${unit}</small>`
	}

	_renderLegend() {
		const box = document.querySelector('#dimLegend')
		if (!box) return
		const items = [`🌬 ${VENTO_LABEL[this.data.velocidadeVento] || '—'}`]
		const h = parseInt(this.data.dispositivoHidromassagem, 10) || 0
		if (h) items.push(`💧 ${h} hidromassagem`)
		const cc = parseFloat(this.data.larguraCascata) || 0
		if (cc) items.push(`🌊 Cascata ${cc} cm`)
		const bd = parseFloat(this.data.comprimentoBordaInfinita) || 0
		if (bd) items.push(`♾ Borda ${bd} cm`)
		if (this.data.utilizacaoCapaTermica === 'sim') items.push('🟩 Capa térmica')
		box.innerHTML = items.map(t => `<span class="dim-lg">${t}</span>`).join('')
	}

	// ---------------------------------------------------------------- render
	render() {
		return `
			<div class="dim-wrap">
				<div class="dim-head">
					<h2 class="dim-title">Dados da piscina</h2>
					<p class="dim-subtitle">Preencha os parâmetros — a visualização atualiza em tempo real.</p>
				</div>
				<div class="dim-grid">
					<div class="dim-col">
						<div class="dim-card">
							<div class="dim-card-head"><span class="dim-ic">📍</span><h3>Localização</h3></div>
							<div class="dim-card-b">
								<div class="dim-row2">
									<div class="eco-form-group"><label class="eco-label" for="state">Estado</label>
										<select class="eco-select" id="state"><option value="">Selecione o estado</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="city">Cidade</label>
										<select class="eco-select" id="city" disabled><option value="">Selecione a cidade</option></select></div>
								</div>
								<div class="dim-chips" id="climateChips"></div>
							</div>
						</div>

						<div class="dim-card">
							<div class="dim-card-head"><span class="dim-ic">🏊</span><h3>Áreas da piscina</h3>
								<button type="button" class="dim-add" id="btnAddArea">+ Área</button></div>
							<div class="dim-card-b">
								<div class="eco-pool-info"><i data-lucide="info"></i>
									<p class="eco-pool-info-text">Áreas com menos de 0,6 m de profundidade são consideradas prainhas.</p></div>
								<div id="poolAreasContainer"></div>
							</div>
						</div>

						<div class="dim-card">
							<div class="dim-card-head"><span class="dim-ic">🌡️</span><h3>Temperatura &amp; uso</h3></div>
							<div class="dim-card-b">
								<div class="eco-pool-parameters">
									<div class="eco-form-group"><label class="eco-label" for="temperaturaDesejada">Temp. desejada (°C)</label>
										<input type="number" id="temperaturaDesejada" class="eco-input" value="32" min="20" step="0.5"></div>
									<div class="eco-form-group"><label class="eco-label" for="temperaturaInicial">Temp. média inicial (°C)</label>
										<input type="number" id="temperaturaInicial" class="eco-input" value="20" min="0" step="0.5"></div>
									<div class="eco-form-group"><label class="eco-label" for="tipoUtilizacao">Tipo de utilização</label>
										<select id="tipoUtilizacao" class="eco-select"><option value="privada">Privada</option><option value="coletiva">Coletiva</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="utilizacaoAnual">Utilização anual</label>
										<select id="utilizacaoAnual" class="eco-select"><option value="ano_inteiro">Ano inteiro</option><option value="verao">Verão</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="utilizacaoMensal">Utilização mensal</label>
										<select id="utilizacaoMensal" class="eco-select"><option value="finais_de_semana" selected>Finais de semana</option><option value="todos_os_dias">Todos os dias</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="localizacaoPiscina">Localização</label>
										<select id="localizacaoPiscina" class="eco-select"><option value="externa" selected>Externa</option><option value="interna">Interna</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="utilizacaoCapaTermica">Capa térmica</label>
										<select id="utilizacaoCapaTermica" class="eco-select"><option value="nao">Não</option><option value="sim">Sim</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="tanqueCompensacao">Tanque de compensação</label>
										<select id="tanqueCompensacao" class="eco-select"><option value="nao">Não</option><option value="sim">Sim</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="velocidadeVento">Velocidade do vento</label>
										<select id="velocidadeVento" class="eco-select"><option value="sem_vento">Sem vento</option><option value="fraco">Fraco (2.0 m/s)</option><option value="medio">Médio (4.0 m/s)</option><option value="forte">Forte (6.0 m/s)</option></select></div>
									<div class="eco-form-group"><label class="eco-label" for="reabastecimentoDiario">Reabastecimento (%)</label>
										<input type="number" id="reabastecimentoDiario" class="eco-input" value="0" min="0" max="100" step="1"></div>
								</div>
							</div>
						</div>

						<div class="dim-card">
							<div class="dim-card-head"><span class="dim-ic">💦</span><h3>Bordas &amp; dispositivos</h3></div>
							<div class="dim-card-b">
								<div class="eco-pool-parameters">
									<div class="eco-form-group"><label class="eco-label" for="comprimentoBordaInfinita">Borda infinita (cm)</label>
										<input type="number" id="comprimentoBordaInfinita" class="eco-input" value="0" min="0" step="0.1"></div>
									<div class="eco-form-group"><label class="eco-label" for="larguraCascata">Cascata (cm)</label>
										<input type="number" id="larguraCascata" class="eco-input" value="0" min="0" step="0.1"></div>
									<div class="eco-form-group eco-full"><label class="eco-label" for="dispositivoHidromassagem">Dispositivos de hidromassagem (un)</label>
										<input type="number" id="dispositivoHidromassagem" class="eco-input" value="0" min="0" step="1"></div>
								</div>
							</div>
						</div>
					</div>

					<div class="dim-col">
						<div class="dim-card dim-viz-card">
							<div class="dim-card-head">
								<h3>Visualização 3D</h3>
								<span class="dim-live"><span class="dot"></span> tempo real</span>
							</div>
							<div class="dim-stage" id="poolVizMount"></div>
							<div class="dim-legend" id="dimLegend"></div>
							<div class="dim-metrics">
								<div class="dim-metric"><div class="v" id="dimVol">—</div><div class="k">Volume</div></div>
								<div class="dim-metric"><div class="v" id="dimArea">—</div><div class="k">Área</div></div>
								<div class="dim-metric"><div class="v" id="dimDelta">—</div><div class="k">Diferença Temp.</div></div>
								<div class="dim-metric"><div class="v" id="dimTipo">—</div><div class="k">Classificação</div></div>
							</div>
							<div class="dim-viz-actions">
								<button class="eco-btn eco-btn-primary eco-btn-medium" id="btnCalcular">Ver resultados →</button>
							</div>
						</div>
					</div>
				</div>
			</div>`
	}

	// ---------------------------------------------------------------- eventos
	bindEvents(onNext) {
		this.renderAreas()
		this.refreshViz()

		document.querySelector('#state')?.addEventListener('change', async (e) => {
			const v = String(e.target.value || '')
			this.location.state = v
			this.location.city = ''
			this.location.state_city = ''
			const city = document.querySelector('#city')
			if (v) { city.disabled = true; city.innerHTML = '<option value="">Carregando...</option>'; await this.loadCities(v); city.disabled = false }
			else { city.disabled = true; city.innerHTML = '<option value="">Selecione a cidade</option>' }
		})

		document.querySelector('#city')?.addEventListener('change', async (e) => {
			this.location.city = String(e.target.value || '')
			if (this.location.state && this.location.city) {
				this.location.state_city = `${this.location.state}-${this.location.city}`
				await this.loadClimate(this.location.state_city)
			}
		})

		document.querySelector('#btnAddArea')?.addEventListener('click', () => this.addArea())

		const fields = ['tanqueCompensacao', 'tipoUtilizacao', 'utilizacaoAnual', 'utilizacaoMensal',
			'localizacaoPiscina', 'utilizacaoCapaTermica', 'velocidadeVento', 'reabastecimentoDiario',
			'temperaturaDesejada', 'temperaturaInicial', 'comprimentoBordaInfinita', 'larguraCascata', 'dispositivoHidromassagem']
		fields.forEach(f => document.querySelector('#' + f)?.addEventListener('input', (e) => {
			this.data[f] = e.target.value
			this.refreshViz()
		}))

		document.querySelector('#btnCalcular')?.addEventListener('click', () => this._proceed(onNext))

		this.loadStates()
	}

	_proceed(onNext) {
		if (!this.location.state || !this.location.city || !this.location.state_city) {
			showToast('Por favor, selecione estado e cidade.', 'warning'); return
		}
		if (this.areas.length === 0) { showToast('Adicione pelo menos uma área de piscina.', 'warning'); return }
		if (this.areas.some(a => !a.comprimento || !a.largura || !a.profundidade)) {
			showToast('Preencha todos os campos das áreas adicionadas.', 'warning'); return
		}
		if (parseFloat(this.data.temperaturaDesejada) <= parseFloat(this.data.temperaturaInicial)) {
			showToast('A temperatura desejada deve ser maior que a temperatura inicial.', 'warning'); return
		}
		this.data.areas = this.areas.map(a => ({
			comprimento: parseFloat(a.comprimento), largura: parseFloat(a.largura), profundidade: parseFloat(a.profundidade),
		}))
		onNext({ ...this.location }, { ...this.data })
	}
}
