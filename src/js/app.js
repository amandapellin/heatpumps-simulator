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
    this.stepLocation = new StepLocation(this.apiService)
  }

  render(){
    this.container.innerHTML = `
      <div class="eco-simulator">
        <div class="eco-logo">
          <p>Encontre a bomba de calor ideal para sua piscina.</p>
            <img src="${logoEcopool}" alt="Ecopool Logo">
        </div>
        ${this.stepLocation.render()}
      </div>
    `
    this.stepLocation.bindEvents((data) => {
      this.locationData = data
        console.log('Dados de localização:', data)
    })
  }
}
