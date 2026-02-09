import logoEcopool from "../assets/images/logo-ecopool.png"
import { StepLocation } from "./components/step-location.js"
import { StepPool } from "./components/step-pool.js"
import { StepResult } from "./components/step-result.js"
import { ApiService } from "./api.js"
import { createIcons, icons } from '../main.js'
export class App{
		
	constructor(containerSelector){
		this.container = document.querySelector(containerSelector)
		this.currentStep = 1
		this.locationData = null
		this.poolData = null

		this.apiService = new ApiService() // Usa variável de ambiente automaticamente
		this.stepLocation = new StepLocation(this.apiService)
		this.stepPool = null
	}

	renderHeader() {
		return `
			<div class="eco-logo">
				<p>Encontre a bomba de calor ideal para sua piscina.</p>
				<img src="${logoEcopool}" alt="Ecopool Logo">
			</div>
		`
	}

	renderStep() {
		switch(this.currentStep) {
			case 1:
				return this.stepLocation.render()
			case 2:
				this.stepPool = new StepPool(this.apiService, this.locationData)
				return this.stepPool.render()
			case 3:
				// Criar instância do StepResult com apiService
				this.stepResult = new StepResult(this.locationData, this.poolData, this.apiService)

				// Carregar resultados da simulação assincronamente
				this.stepResult.loadSimulationResults()
					.then(() => {
						// Re-renderizar após carregar dados
						const container = document.querySelector('.eco-container')
						if (container) {
							container.innerHTML = this.stepResult.render()
							this.stepResult.bindEvents(() => {
								this.currentStep = 1
								this.locationData = null
								this.poolData = null
								this.render()
							}, () => {
								this.goToPreviousStep()
							})
							// Re-criar ícones após re-renderizar
							setTimeout(() => {
								createIcons({icons})
							}, 0)
						}
					})
					.catch(error => {
						console.error('Erro ao carregar resultados:', error)
						// Re-renderizar para mostrar erro
						const container = document.querySelector('.eco-container')
						if (container) {
							container.innerHTML = this.stepResult.render()
							this.stepResult.bindEvents(() => {
								this.currentStep = 1
								this.locationData = null
								this.poolData = null
								this.render()
							}, () => {
								this.goToPreviousStep()
							})
							setTimeout(() => {
								createIcons({icons})
							}, 0)
						}
					})

				// Retorna renderização inicial (loading)
				return this.stepResult.render()
			default:
				return this.stepLocation.render()
		}
	}

	render(){
		this.container.innerHTML = `
			<div class="eco-simulator">
				${this.renderHeader()}
				${this.renderStep()}
			</div>
		`
		this.bindCurrentStepEvents()
		setTimeout(() => {
        	createIcons({icons})
    	}, 0)
	}

	bindCurrentStepEvents() {
		switch(this.currentStep) {
			case 1:
				this.stepLocation.bindEvents((data) => {
					this.locationData = data
					console.log('Dados de localização:', data)
					this.goToNextStep()
				})
				break
			
			case 2:
				this.stepPool.bindEvents(
					(data) => {
						this.poolData = data
						console.log('Dados da piscina:', data)
						this.goToNextStep()
					},
					() => {
						this.goToPreviousStep()
					}
				)
				break
			
			case 3:
				// StepResult já foi criado em renderStep(), apenas bind dos eventos
				if (this.stepResult) {
					this.stepResult.bindEvents(() => {
						this.currentStep = 1
						this.locationData = null
						this.poolData = null
						this.render()
					}, () => {
						this.goToPreviousStep()
					})
				}
				break
		}
	}

	goToNextStep() {
		if (this.currentStep < 3) {
			this.currentStep++
			this.render()
		}
	}

	goToPreviousStep() {
		if (this.currentStep > 1) {
			this.currentStep--
			this.render()
		}
	}
}
