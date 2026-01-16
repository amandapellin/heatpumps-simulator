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
	renderCards (){
		return `
			<div class=" eco-badge eco-results-warm">
				<i data-lucide="thermometer-sun"></i>
				<p class="eco-result-text">Ideal para regiões mais quentes.</p>				
			</div>
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
			<div class="eco-badge eco-results-cold">
				<i data-lucide="thermometer-snowflake"></i>
				<p class="eco-result-text">Ideal para regiões mais frias.</p>				
			</div>
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
		`
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
							${this.renderCards()}
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
									<span class="eco-results-chart-item-tooltip">Economia em relação ao uso de Gás GLP</span>
									<i data-lucide="zap" class="eco-result-chart-icon"></i>
									<div>
										<p class="eco-result-text">Economia mensal média</p>
										<p class="eco-result-text-value">R$ 630,00 (66%)</p>
									</div>
								</div>
								<div class="eco-results-chart-item">
									<span class="eco-results-chart-item-tooltip">Economia em relação ao uso de Gás GLP</span>
									<i data-lucide="trending-down" class="eco-result-chart-icon"></i>
									<div>
										<p class="eco-result-text">Economia anual média</p>
										<p class="eco-result-text-value">R$ 7.560,00 (66%)</p>
									</div>
								</div>
							</div>
							<div class="eco-step-actions eco-step-actions-result">
								<button class="eco-btn eco-btn-tertiary eco-btn-small" id="btnMonthlyComparison">
									<i data-lucide="file-spreadsheet"></i> 
									Comparativo Mensal
								</button>
								<button class="eco-btn eco-btn-primary eco-btn-small" id="btnDownload">
									<i data-lucide="download-cloud"></i>
									Baixar Resultados
								</button>
							</div>
						</div>
						${this.renderTable()}
					</div>
					<div class="eco-results-footer">
						<h3 class="eco-footer-title">Interessado em adquirir uma bomba de calor?</h3>
                        <p class="eco-card-subtitle">Entre em contato com a revenda mais próxima e receba um orçamento personalizado.</p>
						<button class="eco-btn eco-btn-tertiary" id="btnContactRevenda">
							<i data-lucide="message-circle-more"></i>
							Contatar Revenda
						</button>
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
	renderTable(){
		return `
			<div class="eco-results-comparison-table">
				<h3 class="eco-results-chart-title">Comparativo Mensal de Custos de Operação</h3>
				<p class="eco-result-text">Análise detalhada dos custos mensais associados a diferentes métodos de aquecimento de piscinas.</p>
				<div class="eco-results-table-wrapper">
					<table class="eco-comparison-table">
						<thead>
							<tr>
								<th></th>
								<th colspan="2">ECOPOOL</th>
								<th colspan="2">Resistência</th>
								<th	colspan="2">GLP</th>
								<th colspan="2">Pellet</th>
							</tr>
							<tr>
								<th>Mês</th>
								<th>Consumo (kW)</th>
								<th>Custo</th>
								<th>Consumo (kW)</th>
								<th>Custo</th>
								<th>Consumo (kW)</th>
								<th>Custo</th>
								<th>Consumo (kW)</th>
								<th>Custo</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Janeiro</td>
								<td>150</td>
								<td>R$ 200,00</td>
								<td>500</td>
								<td>R$ 600,00</td>
								<td>300</td>
								<td>R$ 450,00</td>
								<td>250</td>
								<td>R$ 350,00</td>
							</tr>
							<tr>
								<td>Fevereiro</td>
								<td>140</td>
								<td>R$ 190,00</td>
								<td>480</td>
								<td>R$ 580,00</td>
								<td>290</td>
								<td>R$ 430,00</td>
								<td>240</td>
								<td>R$ 340,00</td>
							</tr>
							<tr>
							</tr>
						</tbody>
						<tfoot>
							<tr>
								<td><strong>Total Anual</strong></td>
								<td><strong>1.800 kW</strong></td>
								<td><strong>R$ 2.400,00</strong></td>
								<td><strong>6.000 kW</strong></td>
								<td><strong>R$ 7.200,00</strong></td>
								<td><strong>3.600 kW</strong></td>
								<td><strong>R$ 5.400,00</strong></td>
								<td><strong>3.000 kW</strong></td>
								<td><strong>R$ 4.200,00</strong></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

		`
	}
}