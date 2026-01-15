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
			estimatedCost: estimatedCost.toFixed(2),
			comparison: {
				heatPump: {
					monthly: 200,
					annual: 2400
				},
				glp: {
					monthly: 450,
					annual: 5400
				},
				pellet: {
					monthly: 350,
					annual: 4200
				}
        	}
		}
  	}
	render() {
		return `
			<div class="eco-container">
				<div class="eco-card">
					<div class="eco-header">
                        <div class="eco-card-icon">
                            <i data-lucide="circle-check-big"></i>
                        </div>
                        <h2 class="eco-card-title">Resultados</h2>
                        <p class="eco-card-subtitle">Com base nos dados informados, estas são as melhores opções para atender às suas necessidades.</p>
                    </div>
					<div class="eco-results-body">
						<div class="eco-results-list">
							<div class="eco-results-card">
								<div class="eco-results-layout">
									<div class="eco-results-img-container">
										<img class="eco-results-img" src="https://via.placeholder.com/150" alt="Bomba de Calor Modelo A">
									</div>
									<div class="eco-results-info">
										<h3 class="eco-result-pump-model">Bomba de Calor Modelo A</h3>
										<p class="eco-result-text">Descrição breve do modelo A, destacando suas características principais e benefícios.</p>
										<div class="eco-results-grid">
											<div>
												<p class="eco-result-text"><strong>Potência:</strong> 10 kW</p>
												<p class="eco-result-text"><strong>Quantidade necessária:</strong> 1</p>
											</div>
											<div>
												<p class="eco-result-text"><strong>Custo mensal estimado:</strong> R$ 200,00</p>
												<p class="eco-result-text"><strong>Custo anual estimado:</strong> R$ 2.400,00</p>
											</div>
										</div>
										<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
											<i data-lucide="clock-4"></i>
											<p class="eco-result-text"><strong>Tempo de Aquecimento:</strong> 4 horas</p>
										</div>
										<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
											<i data-lucide="leaf"></i>
											<p class="eco-result-text"><strong>Economia de energia:</strong> Até 70% comparado a aquecedores elétricos.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="eco-results-chart">
							<div class="eco-results-chart-header">
								<div class="eco-results-header-icon">
									<i data-lucide="trending-down"></i>
								</div>
								<div>
									<h3 class="eco-results-chart-title">Comparativo de Custos</h3>
									<p class="eco-result-text">Análise comparativa entre diferentes métodos de aquecimento de piscinas.</p>
								</div>
							</div>
							<div class="eco-results-chart-wrapper">
								<canvas id="costComparisonChart"></canvas>
							</div>
							<div class="eco-results-chart-info">
								<div class="eco-results-chart-item">
									<i data-lucide="zap"></i>
									<div>
										<p class="eco-result-text"></p>
										<p class="eco-result-text-value"></p>
									</div>
								</div>
								<div class="eco-results-chart-item">
									<i data-lucide="trending-down"></i>
									<div>
										<p class="eco-result-text"></p>
										<p class="eco-result-text-value"></p>
									</div>
								</div>
							</div>
						</div>
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
		setTimeout(() => {
        	this.renderChart()
    	}, 100)
	}

	renderChart() {
		const canvas = document.querySelector('#costComparisonChart')
		if (!canvas || !this.results || typeof Chart === 'undefined') return

		const ctx = canvas.getContext('2d')
		const { comparison } = this.results

		if (this.chart) {
		this.chart.destroy()
		}

		this.chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: ['Bomba de Calor', 'Aquecedor GLP', 'Aquecedor Pellet'],
			datasets: [
			{
				label: 'Custo Anual',
				data: [comparison.heatPump.annual, comparison.glp.annual, comparison.pellet.annual],
				backgroundColor: '#00353B',
				borderRadius: 4,
				barPercentage: 0.7,
				categoryPercentage: 0.8
			},
			{
				label: 'Custo Mensal',
				data: [comparison.heatPump.monthly, comparison.glp.monthly, comparison.pellet.monthly],
				backgroundColor: '#7CB342',
				borderRadius: 4,
				barPercentage: 0.7,
				categoryPercentage: 0.8
			}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: '#00353B',
				titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 14, weight: '600' },
				bodyFont: { family: "'DM Sans', sans-serif", size: 13 },
				padding: 12,
				cornerRadius: 8,
				callbacks: {
				label: (context) => `${context.dataset.label}: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
				}
			}
			},
			scales: {
			x: {
				grid: { display: false },
				ticks: {
				font: { family: "'DM Sans', sans-serif", size: 12 },
				color: '#666666'
				}
			},
			y: {
				beginAtZero: true,
				grid: { color: '#E5E5E5' },
				ticks: {
				font: { family: "'DM Sans', sans-serif", size: 11 },
				color: '#666666',
				callback: (value) => value >= 1000 ? `${value / 1000}k` : value
				}
			}
			}
		}
		})
  	}
}