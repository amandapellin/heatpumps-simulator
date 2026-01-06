export class Modal {
    constructor(targetSelector){
        this.target = document.querySelector(targetSelector)
    }
    render(){
        const modalHTML = `
            <div class="modal fade" id="formModal" tabindex="-1" aria-labelledby="formModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                    <div class="modal-content">
                    <button type="button" class="btn-close position-absolute top-0 end-0 m-3" style="z-index: 1055;" data-bs-dismiss="modal" aria-label="Close"></button>
                    <div class="modal-header border-0 justify-content-center pb-0">
                        <h1 class="modal-title fs-5 text-center w-100" id="formModalLabel">Simulador de Bombas de Calor para Piscinas</h1>
                    </div>
                    <div class="modal-body" id="stepperContainer">
                        
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btnPrevious">Anterior</button>
                        <button type="button" class="btn btn-primary" id="btnNext">Próximo</button>
                    </div>
                    </div>
                </div>
            </div>
        `
        this.target.insertAdjacentHTML('beforeend', modalHTML)
        this.modalElement = document.getElementById('formModal')
        this.stepper = new Stepper('#stepperContainer')
        this.stepper.render()
        this.addEventListeners()
    }
    addEventListeners(){
        const btnNext = this.getElementById('btnNext')
        const btnPrevious = this.getElementById('btnPrevious')

        btnNext.addEventListener('click', () => {
            this.stepper.nextStep()
        })

        btnPrevious.addEventListener('click', () => {
            this.stepper.previousStep()
        })

        document.addEventListener('stepChanged', (e) => {
            this.updateButtons(e.detail)
        })
    }

    updateButtons(stepInfo){
        const btnNext = this.getElementById('btnNext')
        const btnPrevious = this.getElementById('btnPrevious')
        btnPrevious.disabled = stepInfo.current === 0
        btnNext.textContent = stepInfo.isLast ? 'Fechar' : 'Próximo'
    }
    open(){
        const modal = new bootstrap.Modal(this.modalElement)
        modal.show()
    }
    close(){
        const modal = bootstrap.Modal.getInstance(this.modalElement)
        modal.hide()
    }
}