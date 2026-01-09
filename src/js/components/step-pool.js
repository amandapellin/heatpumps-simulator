export class StepPool {
  constructor() {
    this.data = {
      length: '',
      width: '',
      depth: '',
      hasHeating: false
    }
  }

  render() {
    return `
      <div class="eco-step-content" data-step="2">
        <h2>Dados da Piscina</h2>
        <div class="eco-form-group">
          <label for="poolLength">Comprimento (m)</label>
          <input type="number" id="poolLength" class="eco-input" placeholder="Ex: 8" step="0.1">
        </div>
        <div class="eco-form-group">
          <label for="poolWidth">Largura (m)</label>
          <input type="number" id="poolWidth" class="eco-input" placeholder="Ex: 4" step="0.1">
        </div>
        <div class="eco-form-group">
          <label for="poolDepth">Profundidade média (m)</label>
          <input type="number" id="poolDepth" class="eco-input" placeholder="Ex: 1.5" step="0.1">
        </div>
        <div class="eco-form-group">
          <label>
            <input type="checkbox" id="poolHeating">
            A piscina possui aquecimento?
          </label>
        </div>
        <div class="eco-actions">
          <button class="eco-btn eco-btn-secondary" id="btnBackPool">
            Voltar
          </button>
          <button class="eco-btn eco-btn-primary" id="btnNextPool">
            Calcular
          </button>
        </div>
      </div>
    `
  }

  bindEvents(onNext, onBack) {
    const btnNext = document.querySelector('#btnNextPool')
    const btnBack = document.querySelector('#btnBackPool')
    const lengthInput = document.querySelector('#poolLength')
    const widthInput = document.querySelector('#poolWidth')
    const depthInput = document.querySelector('#poolDepth')
    const heatingCheck = document.querySelector('#poolHeating')

    lengthInput?.addEventListener('input', (e) => {
      this.data.length = e.target.value
    })

    widthInput?.addEventListener('input', (e) => {
      this.data.width = e.target.value
    })

    depthInput?.addEventListener('input', (e) => {
      this.data.depth = e.target.value
    })

    heatingCheck?.addEventListener('change', (e) => {
      this.data.hasHeating = e.target.checked
    })

    btnBack?.addEventListener('click', () => {
      onBack()
    })

    btnNext?.addEventListener('click', () => {
      if (this.data.length && this.data.width && this.data.depth) {
        onNext(this.data)
      } else {
        alert('Por favor, preencha todas as dimensões da piscina')
      }
    })
  }

  getData() {
    return this.data
  }
}