import { Stepper } from "./components/stepper.js";
import logoEcopool from "../assets/images/logo-ecopool.png";

export class App{
    
    constructor(containerSelector){
        this.container = document.querySelector(containerSelector);
        this.currentStep = 1;
        this.locationData = null;
        this.poolData = null;

        this.stepper = new Stepper(this.container);
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
                        ${this.stepper.render()}
                    </div>
                    <div class="eco-content"></div>
                </div>
            </div>
        `
    }
}