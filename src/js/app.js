import { Stepper } from "./components/stepper.js"
import logoEcopool from "../assets/images/logo-ecopool.png"
import { StepLocation } from "./components/step-location.js"
import { ApiService } from "./api.js"
export class App{
    
    constructor(containerSelector){
        this.container = document.querySelector(containerSelector)
        this.currentStep = 1
        this.locationData = null
        this.poolData = null

        this.apiService = new ApiService('http://localhost/api')
        this.stepper = new Stepper(this.container)
        this.stepLocation = new StepLocation(this.apiService)
    }

    render(){
        this.container.innerHTML = `
            <div class="eco-simulator">
                <div class="eco-logo">
                    <p>Encontre a bomba de calor ideal para sua piscina.</p>
                    <img src="${logoEcopool}" alt="Ecopool Logo">
                </div>
                <div class="eco-card">
                    <div class="eco-header">
                        <h1>Simulador de Bombas de Calor</h1>
                        ${this.stepper.render()}
                    </div>
                    <div class="eco-separator"></div>
                    <div class="eco-content">
                        ${this.stepLocation.render()}
                    </div>
                </div>
            </div>
        `
        this.stepLocation.bindEvents((data) => {
            this.locationData = data
            console.log('Dados de localização:', data)
        })
    }
}
/*import { Stepper } from './components/Stepper.js'
import { StepLocation } from './components/StepLocation.js'
import { StepPool } from './components/StepPool.js'
import { StepResult } from './components/StepResult.js'

export class App {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector)
    this.currentStep = 1
    this.locationData = null
    this.poolData = null
    
    this.stepper = new Stepper(this.container)
    this.stepLocation = new StepLocation()
    this.stepPool = new StepPool()
  }

  render() {
    this.container.innerHTML = `
      <div class="eco-simulator">
        <div class="eco-card">
          <div class="eco-header">
            <p>Dimensionamento de Bombas de Calor Trocador ECOPOOL.</p>
            <h1>Ecologic</h1>
          </div>
          ${this.stepper.render()}
          <div class="eco-content">
            ${this.renderCurrentStep()}
          </div>
        </div>
      </div>
    `
    
    this.bindCurrentStepEvents()
  }

  renderCurrentStep() {
    switch(this.currentStep) {
      case 1:
        return this.stepLocation.render()
      case 2:
        return this.stepPool.render()
      case 3:
        const stepResult = new StepResult(this.locationData, this.poolData)
        return stepResult.render()
      default:
        return ''
    }
  }

  bindCurrentStepEvents() {
    switch(this.currentStep) {
      case 1:
        this.stepLocation.bindEvents((data) => {
          this.locationData = data
          this.goToStep(2)
        })
        break
      case 2:
        this.stepPool.bindEvents(
          (data) => {
            this.poolData = data
            this.goToStep(3)
          },
          () => this.goToStep(1)
        )
        break
      case 3:
        const stepResult = new StepResult(this.locationData, this.poolData)
        stepResult.bindEvents(() => this.restart())
        break
    }
  }

  goToStep(stepNumber) {
    this.currentStep = stepNumber
    this.stepper.currentStep = stepNumber
    
    // Atualiza o conteúdo
    const contentContainer = this.container.querySelector('.eco-content')
    if (contentContainer) {
      contentContainer.innerHTML = this.renderCurrentStep()
    }
    
    // Atualiza o stepper
    this.stepper.update()
    
    // Religa os eventos do novo step
    this.bindCurrentStepEvents()
  }

  restart() {
    this.currentStep = 1
    this.locationData = null
    this.poolData = null
    this.stepLocation = new StepLocation()
    this.stepPool = new StepPool()
    this.render()
  }
}*/