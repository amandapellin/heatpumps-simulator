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

		this.apiService = new ApiService('http://localhost:3000/api')
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
				const stepResult = new StepResult(this.locationData, this.poolData)
				return stepResult.render()
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
				const stepResult = new StepResult(this.locationData, this.poolData)
				stepResult.bindEvents(() => {
					this.currentStep = 1
					this.locationData = null
					this.poolData = null
					this.render()
				}, () => {
					this.goToPreviousStep()
				})
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
