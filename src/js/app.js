import logoEcopool from "../assets/images/logo-ecopool.png"
import { ScreenDimensionamento } from "./components/screen-dimensionamento.js"
import { StepResult } from "./components/step-result.js"
import { ApiService } from "./api.js"
import { createIcons, icons } from '../main.js'

/**
 * App — fluxo em 2 telas:
 *   Tela 1 (Dimensionamento): localização + piscina + visualização 3D ao vivo.
 *   Tela 2 (Resultados): bombas recomendadas + comparativos (StepResult).
 *
 * As duas telas coexistem no DOM (mostrar/ocultar), então o estado da Tela 1
 * é preservado ao voltar dos resultados. Um novo cálculo recria a Tela 1.
 */
export class App {
	constructor(containerSelector) {
		this.container = document.querySelector(containerSelector)
		this.apiService = new ApiService()
		this.screenDim = new ScreenDimensionamento(this.apiService)
		this.stepResult = null
		this.currentScreen = 1
	}

	renderHeader() {
		return `
			<div class="eco-logo">
				<p>Encontre a bomba de calor ideal para sua piscina.</p>
				<img src="${logoEcopool}" alt="Ecopool Logo">
			</div>`
	}

	renderStepper() {
		return `
			<div class="eco-stepper" role="list">
				<span class="eco-step is-on" data-step="1" role="listitem"><span class="n">1</span> Dimensionamento</span>
				<span class="eco-step-sep"></span>
				<span class="eco-step" data-step="2" role="listitem"><span class="n">2</span> Resultados</span>
			</div>`
	}

	render() {
		this.container.innerHTML = `
			<div class="eco-simulator">
				${this.renderHeader()}
				<div class="eco-page">
					${this.renderStepper()}
					<div id="screen1-mount"></div>
					<div id="screen2-mount" hidden></div>
				</div>
			</div>`
		this.currentScreen = 1
		this._mountScreen1()
		this._refreshIcons()
	}

	_mountScreen1() {
		const mount = document.querySelector('#screen1-mount')
		mount.innerHTML = this.screenDim.render()
		this.screenDim.bindEvents((location, pool) => this.goToResults(location, pool))
	}

	goToResults(locationData, poolData) {
		this.locationData = locationData
		this.poolData = poolData
		this.stepResult = new StepResult(locationData, poolData, this.apiService)

		const s2 = document.querySelector('#screen2-mount')
		s2.innerHTML = this.stepResult.render() // estado de carregamento
		this._switchScreen(2)

		this.stepResult.loadSimulationResults()
			.then(() => this._renderResults())
			.catch((error) => { console.error('Erro ao carregar resultados:', error); this._renderResults() })
	}

	_renderResults() {
		const s2 = document.querySelector('#screen2-mount')
		if (!s2) return
		s2.innerHTML = this.stepResult.render()
		this.stepResult.bindEvents(
			() => this.reset(),
			() => this._switchScreen(1),
		)
		this._refreshIcons()
	}

	reset() {
		this.screenDim = new ScreenDimensionamento(this.apiService)
		this.stepResult = null
		this.render()
	}

	_switchScreen(n) {
		this.currentScreen = n
		document.querySelector('#screen1-mount').hidden = n !== 1
		document.querySelector('#screen2-mount').hidden = n !== 2
		document.querySelectorAll('.eco-step').forEach(el =>
			el.classList.toggle('is-on', Number(el.dataset.step) === n))
		window.scrollTo({ top: 0, behavior: 'smooth' })
		this._refreshIcons()
	}

	_refreshIcons() {
		setTimeout(() => createIcons({ icons }), 0)
	}
}
