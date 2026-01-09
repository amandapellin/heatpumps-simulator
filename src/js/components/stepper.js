export class Stepper {
    constructor(container){
        this.container = container;
        this.currentStep = 1;
        this.steps = [
            { number: 1, title: "Dados do Local" },
            { number: 2, title: "Dados da Piscina" },
            { number: 3, title: "Resultados" }
        ]
    }

    render(){
        const stepsHtml = this.steps.map(step => `
            <div class="eco-step ${step.number === this.currentStep ? 'eco-active' : ''}" data-step="${step.number}">
                <div class="eco-step-circle">${step.number}</div>
                <div class="eco-step-label">${step.title}</div>
                ${step.number < this.steps.length ? '<div class="eco-step-line"></div>' : ''}
            </div> 
        `).join('')
        return `<div class="eco-stepper"> ${stepsHtml}</div>`
    }

    goToStep(stepNumber){
        this.currentStep = stepNumber
        this.update()
    }
    update(){
        const stepperElement = this.container.querySelector('.eco-stepper')
        if(stepperElement){
            stepperElement.outerHTML = this.render().replace(/<div class="eco-stepper">|<\/div>$/g, '')
        }
    }
}