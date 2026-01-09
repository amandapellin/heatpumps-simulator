export class StepResult {
  constructor(locationData, poolData) {
    this.locationData = locationData
    this.poolData = poolData
    this.results = this.calculateResults()
  }

  calculateResults() {
    const volume = parseFloat(this.poolData.length) * 
                   parseFloat(this.poolData.width) * 
                   parseFloat(this.poolData.depth)
    
    // Cálculo simplificado - ajuste conforme sua necessidade
    const recommendedPower = volume * 0.5 // kW
    const estimatedCost = recommendedPower * 1500 // R$

    return {
      volume: volume.toFixed(2),
      recommendedPower: recommendedPower.toFixed(2),
      estimatedCost: estimatedCost.toFixed(2)
    }
  }

  render() {
    return `
      <div class="eco-step-content" data-step="3">
        <h2>Resultados do Dimensionamento</h2>
        <div class="eco-results">
          <div class="eco-result-item">
            <span class="eco-result-label">Localização:</span>
            <span class="eco-result-value">${this.locationData.city} - ${this.locationData.state}</span>
          </div>
          <div class="eco-result-item">
            <span class="eco-result-label">Volume da Piscina:</span>
            <span class="eco-result-value">${this.results.volume} m³</span>
          </div>
          <div class="eco-result-item">
            <span class="eco-result-label">Potência Recomendada:</span>
            <span class="eco-result-value">${this.results.recommendedPower} kW</span>
          </div>
          <div class="eco-result-item">
            <span class="eco-result-label">Custo Estimado:</span>
            <span class="eco-result-value">R$ ${this.results.estimatedCost}</span>
          </div>
        </div>
        <div class="eco-actions">
          <button class="eco-btn eco-btn-secondary" id="btnRestart">
            Fazer Nova Simulação
          </button>
          <button class="eco-btn eco-btn-primary" id="btnDownload">
            Baixar Relatório
          </button>
        </div>
      </div>
    `
  }

  bindEvents(onRestart) {
    const btnRestart = document.querySelector('#btnRestart')
    const btnDownload = document.querySelector('#btnDownload')

    btnRestart?.addEventListener('click', () => {
      onRestart()
    })

    btnDownload?.addEventListener('click', () => {
      alert('Funcionalidade de download em desenvolvimento')
    })
  }
}