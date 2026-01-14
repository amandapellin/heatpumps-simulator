export class StepResult {
	constructor(locationData, poolData) {
    	this.locationData = locationData
    	this.poolData = poolData
    	this.results = this.calculateResults()
  	}

  	calculateResults() {
    	const volume = parseFloat(this.poolData.length) * parseFloat(this.poolData.width) * parseFloat(this.poolData.depth)
    	const recommendedPower = volume * 0.5
    	const estimatedCost = recommendedPower * 1500

		return {
			volume: volume.toFixed(2),
			recommendedPower: recommendedPower.toFixed(2),
			estimatedCost: estimatedCost.toFixed(2)
		}
  	}

	render() {
		return `
			<div class="eco-container">
				<div class="eco-card">
					<div class="eco-header">
                        <div class="eco-card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big-icon lucide-circle-check-big">
								<path d="M21.801 10A10 10 0 1 1 17 3.335"/>
								<path d="m9 11 3 3L22 4"/>
							</svg>
                        </div>
                        <h2 class="eco-card-title">Resultados</h2>
                        <p class="eco-card-subtitle">Com base nos dados informados, estas são as melhores opções para atender às suas necessidades.</p>
                    </div>
					<div class="eco-results-body">
						<p><strong>Volume da Piscina:</strong> ${this.results.volume} m³</p>
						<p><strong>Potência Recomendada da Bomba de Calor:</strong> ${this.results.recommendedPower} kW</p>
						<p><strong>Custo Estimado da Bomba de Calor:</strong> R$ ${this.results.estimatedCost}</p>
						<div class="eco-results-list">
							<div class="eco-results-card">
								<div class="eco-results-img">
									<img src="https://via.placeholder.com/150" alt="Bomba de Calor Modelo A">
								</div>
								<div class="eco-results-info">
									<h3>Bomba de Calor Modelo A</h3>
									<div class="eco-results-grid">
										<div class="eco-result-item">
											<p><strong>Potência:</strong> 10 kW</p>
										</div>
										<div class="eco-result-item">
											<p><strong>Quantidade necessária:</strong> 1</p>
										</div>
										<div class="eco-result-item">
											<p><strong>Custo mensal estimado:</strong> R$ 200,00</p>
										</div>
										<div class="eco-result-item">
											<p><strong>Custo anual estimado:</strong> R$ 2.400,00</p>
										</div>
									</div>
									<div class="eco-results-notes">
										<p><strong>Tempo de Aquecimento:</strong> 4 horas</p>
									</div>
									<div class="eco-results-notes">
										<p><strong>Economia de energia:</strong> Até 70% comparado a aquecedores elétricos.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="eco-actions">
					</div>
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