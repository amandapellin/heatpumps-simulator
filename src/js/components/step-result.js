import Chart from 'chart.js/auto'

// Divisor kJ/h -> BTU/h. Espelha App\Utils\Constants::KJ_TO_BTU no backend.
const KJ_TO_BTU = 1.055

// Tempo-base do primeiro aquecimento (horas). Espelha
// App\Utils\Constants::HEATING_TIME_BASE no backend.
const HEATING_TIME_BASE_HOURS = 60

export class StepResult {
	constructor(locationData, poolData, apiService) {
    	this.locationData = locationData
    	this.poolData = poolData
		this.apiService = apiService
    	this.results = null
    	this.isChartVisible = false
		this.isLoading = true
		this.error = null
  	}


	async loadSimulationResults() {
		try {
			this.isLoading = true
			this.error = null

			const simulationData = {
				uf_cidade: this.locationData.state_city,
				areas: this.poolData.areas,
				tanqueCompensacao: this.poolData.tanqueCompensacao || 'nao',
				tipoUtilizacao: this.poolData.tipoUtilizacao || 'privada',
				utilizacaoAnual: this.poolData.utilizacaoAnual || 'ano_inteiro',
				utilizacaoMensal: this.poolData.utilizacaoMensal || 'finais_de_semana',
				localizacaoPiscina: this.poolData.localizacaoPiscina || 'externa',
				utilizacaoCapaTermica: this.poolData.utilizacaoCapaTermica || 'nao',
				velocidadeVento: this.poolData.velocidadeVento || 'sem_vento',
				reabastecimentoDiario: parseFloat(this.poolData.reabastecimentoDiario || 0),
				temperaturaDesejada: parseFloat(this.poolData.temperaturaDesejada || 32),
				temperaturaInicial: parseFloat(this.poolData.temperaturaInicial || 20),
				comprimentoBordaInfinita: parseFloat(this.poolData.comprimentoBordaInfinita || 0),
				larguraCascata: parseFloat(this.poolData.larguraCascata || 0),
				dispositivoHidromassagem: parseInt(this.poolData.dispositivoHidromassagem || 0)
			}

			const response = await this.apiService.runSimulation(simulationData)

			if (response.success) {
				this.results = response.data
			} else {
				throw new Error(response.error || 'Erro ao processar simulação')
			}

			this.isLoading = false
		} catch (error) {
			console.error('Erro ao carregar resultados:', error)
			this.error = error.message
			this.isLoading = false
			throw error
		}
	}
	// Rótulo de uma combinação de bombas. Omite o prefixo "N× " quando é 1 unidade.
	_comboLabel(combo) {
		if (!combo) return null
		const prefix = combo.quantity > 1 ? `${combo.quantity}× ` : ''
		return `${prefix}${combo.pump.modelo}`
	}

	_getPumpLabels() {
		const combinations = this.results?.pumpCombinations
		const hasCombinations = combinations?.hot && combinations?.cold

		const hotLabel = hasCombinations
			? this._comboLabel(combinations.hot)
			: (this.results?.recommendedPumpHot?.modelo ?? 'Bomba ECOPOOL (quente)')

		const coldLabel = hasCombinations
			? this._comboLabel(combinations.cold)
			: (this.results?.recommendedPumpCold?.modelo ?? 'Bomba ECOPOOL (fria)')

		return { hotLabel, coldLabel }
	}
	renderPumpCard({ imgUrl, modelo, badgeClass, badgeIcon, badgeLabel, heatingTime, kwh, cost, economiaPercent, fmtTime, fmtKwh, fmtBRL }) {
		return `
			<div class="eco-results-card">
				<div class="eco-results-header">
					<div class="eco-results-img-container">
						<img class="eco-results-img" src="${imgUrl}" alt="${modelo}">
					</div>
					<div class="eco-results-info">
						<h3 class="eco-result-pump-model">${modelo}</h3>
						<div class="eco-badge ${badgeClass}">
							<i data-lucide="${badgeIcon}"></i>
							<p class="eco-result-text">${badgeLabel}</p>
						</div>
					</div>
				</div>
				<div class="eco-results-card-body">
					<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
						<i data-lucide="clock-4"></i>
						<p class="eco-result-text"><strong>Tempo de Aquecimento:</strong> ${fmtTime(heatingTime)}</p>
					</div>
					<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
						<i data-lucide="plug"></i>
						<p class="eco-result-text"><strong>Consumo estimado do primeiro aquecimento:</strong> ${fmtKwh(kwh)}</p>
						<p class="eco-result-text"><strong>Custo estimado do primeiro aquecimento:</strong> <span style="white-space: nowrap">${fmtBRL(cost)}</span></p>
					</div>
					${economiaPercent !== null ? `
					<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
						<i data-lucide="leaf"></i>
						<p class="eco-result-text"><strong>Economia de energia:</strong> Até ${economiaPercent}% comparado a aquecedores elétricos.</p>
					</div>` : ''}
				</div>
			</div>
		`
	}

	renderCards() {
		if (this.isLoading) {
			return `
				<div class="eco-loading" style="text-align: center; padding: 3rem;">
					<i data-lucide="loader-circle" style="width: 48px; height: 48px; animation: spin 1s linear infinite;"></i>
					<p style="margin-top: 1rem; font-size: 1.1rem; color: var(--gray-dark);">
						Calculando a melhor bomba de calor para sua piscina...
					</p>
				</div>
			`
		}

		if (this.error) {
			return `
				<div class="eco-error" style="text-align: center; padding: 3rem; background: #FEF2F2; border-radius: 8px; border-left: 4px solid #EF4444;">
					<i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #EF4444;"></i>
					<p style="margin-top: 1rem; font-size: 1.1rem; color: #991B1B;">
						<strong>Erro:</strong> ${this.error}
					</p>
					<button class="eco-btn eco-btn-primary" id="btnRetrySimulation" style="margin-top: 1rem;">
						Tentar Novamente
					</button>
				</div>
			`
		}

		if (!this.results) {
			return `
				<div class="eco-info" style="text-align: center; padding: 3rem;">
					<i data-lucide="info" style="width: 48px; height: 48px; color: var(--blue-primary);"></i>
					<p style="margin-top: 1rem;">Nenhuma bomba adequada encontrada para os parâmetros informados.</p>
				</div>
			`
		}

		const pumpHot       = this.results.recommendedPumpHot
		const pumpCold      = this.results.recommendedPumpCold
		const combinations  = this.results.pumpCombinations || []
		const comparison    = this.results.comparison
		const heatingTimes  = this.results.heatingTimes || {}

		const fmtBRL  = (v) => v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'
		const fmtKwh  = (v) => v > 0 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' kWh' : '--'
		const fmtTime = (hours) => {
			if (hours == null) return 'N/A'
			const h = Math.floor(hours)
			const m = Math.round((hours - h) * 60)
			return m === 0 ? `${h} horas` : `${h}h ${m}min`
		}

		const eletricaAnnual  = comparison?.eletrica?.annual      ?? 0
		const heatPumpHotAnnual  = comparison?.heatPumpHot?.annual  ?? 0
		const heatPumpColdAnnual = comparison?.heatPumpCold?.annual ?? 0

		const calcEconomia = (annual) =>
			(eletricaAnnual > 0 && annual > 0 && annual < eletricaAnnual)
				? Math.round(((eletricaAnnual - annual) / eletricaAnnual) * 100)
				: null

		const economiaPercentHot  = calcEconomia(heatPumpHotAnnual)
		const economiaPercentCold = calcEconomia(heatPumpColdAnnual)

		const hotKwh   = comparison?.heatPumpHot?.firstHeatingKwh   ?? 0
		const coldKwh  = comparison?.heatPumpCold?.firstHeatingKwh  ?? 0
		const hotCost  = comparison?.heatPumpHot?.firstHeatingCost  ?? 0
		const coldCost = comparison?.heatPumpCold?.firstHeatingCost ?? 0

		const commonArgs = { fmtTime, fmtKwh, fmtBRL }

		if (combinations?.hot && combinations?.cold) {
			return `
				${this.renderPumpCard({ imgUrl: combinations.hot.pump.img_url,  modelo: this._comboLabel(combinations.hot),  badgeClass: 'eco-results-warm', badgeIcon: 'thermometer-sun',       badgeLabel: 'Ideal para regiões mais quentes.', heatingTime: combinations.hot.heatingTime,  kwh: hotKwh,  cost: hotCost,  economiaPercent: economiaPercentHot,  ...commonArgs })}
				${this.renderPumpCard({ imgUrl: combinations.cold.pump.img_url, modelo: this._comboLabel(combinations.cold), badgeClass: 'eco-results-cold', badgeIcon: 'thermometer-snowflake', badgeLabel: 'Ideal para regiões mais frias.',   heatingTime: combinations.cold.heatingTime, kwh: coldKwh, cost: coldCost, economiaPercent: economiaPercentCold, ...commonArgs })}
			`
		}

		return `
			${pumpHot  ? this.renderPumpCard({ imgUrl: pumpHot.img_url,  modelo: pumpHot.modelo,  badgeClass: 'eco-results-warm', badgeIcon: 'thermometer-sun',       badgeLabel: 'Ideal para regiões mais quentes.', heatingTime: heatingTimes.hot,  kwh: hotKwh,  cost: hotCost,  economiaPercent: economiaPercentHot,  ...commonArgs }) : ''}
			${pumpCold ? this.renderPumpCard({ imgUrl: pumpCold.img_url, modelo: pumpCold.modelo, badgeClass: 'eco-results-cold', badgeIcon: 'thermometer-snowflake', badgeLabel: 'Ideal para regiões mais frias.',   heatingTime: heatingTimes.cold, kwh: coldKwh, cost: coldCost, economiaPercent: economiaPercentCold, ...commonArgs }) : ''}
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
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1);">
								<i data-lucide="info"></i>
								<p class="eco-result-text"> A capacidade de aquecimento necessária para elevar a temperatura da água de <strong>${this.poolData.temperaturaInicial || 20}°C</strong> para <strong>${this.poolData.temperaturaDesejada || 32}°C</strong> em <strong>${HEATING_TIME_BASE_HOURS} horas</strong> é de: <strong>${this.results?.heatLoss?.requiredPumpEnergy ? Math.round(this.results.heatLoss.requiredPumpEnergy / KJ_TO_BTU).toLocaleString('pt-BR') + ' BTU/h' : '--'}</strong></p>
							</div>
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
								<div style="position: relative; height: 300px; width: 100%;">
									<canvas id="costComparisonChart"></canvas>
								</div>
							</div>
							<div class="eco-results-chart-wrapper" id="monthlyChartSection" style="display: none;">
								<h4 style="font-size: 1.125rem; font-weight: 600; color: var(--verde-escuro); margin-bottom: 1rem;">
									Custos Mensais por Sistema
								</h4>
								<div style="position: relative; height: 350px; width: 100%;">
									<canvas id="monthlyComparisonChart"></canvas>
								</div>
							</div>
							<div class="eco-results-chart-info">
								${this.renderSavings()}
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
					</div>
					<div class="eco-step-actions eco-step-actions-back">
						<button class="eco-btn eco-btn-secondary eco-btn-medium" id="btnBackPool">Voltar</button>
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

	bindEvents(onReset, onBack) {
		const btnBack = document.querySelector('#btnBackPool')
		const btnDownload = document.querySelector('#btnDownload')
		const btnMonthlyComparison = document.querySelector('#btnMonthlyComparison')

		btnBack?.addEventListener('click', () => {
			onBack()
		})

		btnDownload?.addEventListener('click', async () => {
			await this.handleDownloadPdf(btnDownload)
		})

		btnMonthlyComparison?.addEventListener('click', () => {
			this.isChartVisible = !this.isChartVisible
			const chartSection = document.querySelector('#monthlyChartSection')
			if (chartSection) {
				chartSection.style.display = this.isChartVisible ? 'block' : 'none'
			}
			if (this.isChartVisible && !this.monthlyChart) {
				this.renderMonthlyChart()
			}
		})

		// Aguarda o próximo frame para garantir que o canvas tenha dimensões computadas.
		requestAnimationFrame(() => this.renderChart())
	}

	renderChart(overrideOptions = {}) {
		const canvas = document.querySelector('#costComparisonChart')
		if (!canvas || !this.results) return

		const ctx = canvas.getContext('2d')
		const { comparison } = this.results
		const { hotLabel, coldLabel } = this._getPumpLabels() 

		if (this.chart) {
			this.chart.destroy()
		}


		const annualData = [
			comparison.heatPumpHot.annual,
			comparison.heatPumpCold.annual,
			comparison.eletrica.annual,
			comparison.gn.annual,
			comparison.pellet.annual,
		]

		const monthlyAvgData = annualData.map(v => parseFloat((v / 12).toFixed(2)))
		this.chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: [hotLabel, coldLabel, 'Resistência', 'Gás Natural', 'Pellet'],
				datasets: [
					{
						label: 'Custo Anual',
						data: annualData,
						backgroundColor: '#00353B',
						borderRadius: 4,
						barPercentage: 0.7,
						categoryPercentage: 0.8
					},
					{
						label: 'Custo Mensal',
						data: monthlyAvgData,
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
				},
				...overrideOptions
			}
		})
	}

	renderSavings() {
		if (!this.results || !this.results.comparison) {
			return `
				<div class="eco-results-chart-item">
					<i data-lucide="zap" class="eco-result-chart-icon"></i>
					<div>
						<p class="eco-result-text">Economia mensal média</p>
						<p class="eco-result-text-value">--</p>
					</div>
				</div>
				<div class="eco-results-chart-item">
					<i data-lucide="trending-down" class="eco-result-chart-icon"></i>
					<div>
						<p class="eco-result-text">Economia anual média</p>
						<p class="eco-result-text-value">--</p>
					</div>
				</div>
			`
		}

		const comp = this.results.comparison
		const gnSavings = comp.gn.savings || 0
		const gnAnnual = comp.gn.annual || 1
		const savingsPercent = Math.round((gnSavings / gnAnnual) * 100)
		const monthlySavings = gnSavings / 12

		const fmtBRL = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

		return `
			<div class="eco-results-chart-item">
				<span class="eco-results-chart-item-tooltip">Economia em relação ao uso de Gás Natural</span>
				<i data-lucide="zap" class="eco-result-chart-icon"></i>
				<div>
					<p class="eco-result-text">Economia mensal média</p>
					<p class="eco-result-text-value">R$ ${fmtBRL(monthlySavings)} (${savingsPercent}%)</p>
				</div>
			</div>
			<div class="eco-results-chart-item">
				<span class="eco-results-chart-item-tooltip">Economia em relação ao uso de Gás Natural</span>
				<i data-lucide="trending-down" class="eco-result-chart-icon"></i>
				<div>
					<p class="eco-result-text">Economia anual</p>
					<p class="eco-result-text-value">R$ ${fmtBRL(gnSavings)} (${savingsPercent}%)</p>
				</div>
			</div>
		`
	}

	renderMonthlyChart(overrideOptions = {}) {
		const canvas = document.querySelector('#monthlyComparisonChart')
		if (!canvas || !this.results) return

		const ctx = canvas.getContext('2d')
		const { comparison } = this.results
		const { hotLabel, coldLabel } = this._getPumpLabels() 

		if (this.monthlyChart) {
			this.monthlyChart.destroy()
		}

		const monthLabels = (comparison.monthNames || [
			'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
			'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
		]).map(name => name.toUpperCase())

		const pumpHot = this.results.recommendedPumpHot
		const pumpCold = this.results.recommendedPumpCold


		this.monthlyChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: monthLabels,
				datasets: [
					{
						label: hotLabel,
						data: comparison.heatPumpHot.monthlyBreakdown,
						borderColor: '#1a3a8a',
						borderWidth: 2.5,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.4,
						fill: false
					},
					{
						label: coldLabel,
						data: comparison.heatPumpCold.monthlyBreakdown,
						borderColor: '#0288D1',
						borderWidth: 2.5,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.4,
						borderDash: [6, 3],
						fill: false
					},
					{
						label: 'Elétrico',
						data: comparison.eletrica.monthlyBreakdown,
						borderColor: '#C62828',
						borderWidth: 2.5,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.4,
						fill: false
					},
					{
						label: 'Gás Natural',
						data: comparison.gn.monthlyBreakdown,
						borderColor: '#7B1FA2',
						borderWidth: 2.5,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.4,
						fill: false
					},
					{
						label: 'Pellet',
						data: comparison.pellet.monthlyBreakdown,
						borderColor: '#F9A825',
						borderWidth: 2.5,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.4,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						display: true,
						position: 'top',
						align: 'center',
						labels: {
							font: { family: "'Host Grotesk', sans-serif", size: 12 },
							padding: 20,
							usePointStyle: false,
							boxWidth: 30,
							boxHeight: 12
						}
					},
					tooltip: {
						backgroundColor: '#00353B',
						titleFont: { family: "'Host Grotesk', sans-serif", size: 14, weight: '600' },
						bodyFont: { family: "'Host Grotesk', sans-serif", size: 13 },
						padding: 12,
						cornerRadius: 8,
						callbacks: {
							label: (context) =>
								`${context.dataset.label}: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
						}
					}
				},
				scales: {
					x: {
						grid: { display: false },
						ticks: {
							font: { family: "'Host Grotesk', sans-serif", size: 10 },
							color: '#999999',
							maxRotation: 45,
							minRotation: 45
						}
					},
					y: {
						beginAtZero: true,
						grid: { color: '#F0F0F0' },
						ticks: {
							font: { family: "'Host Grotesk', sans-serif", size: 11 },
							color: '#999999',
							callback: (value) => value.toLocaleString('pt-BR')
						}
					}
				},
				...overrideOptions
			}
		})
	}

	async handleDownloadPdf(btnDownload) {
		const originalHTML = btnDownload.innerHTML
		btnDownload.disabled = true
		btnDownload.innerHTML = '<i data-lucide="loader-circle"></i> Gerando PDF...'

		try {
			const { barChartImg, lineChartImg } = await this._captureChartImages()

			const data = {
				simulationData: this.results,
				locationData: this.locationData,
				poolData: this.poolData,
				barChartImg,
				lineChartImg
			}

			const blob = await this.apiService.downloadReport(data)

			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'relatorio-bomba-de-calor.pdf'
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Erro ao gerar PDF:', error)
			alert('Erro ao gerar o relatório PDF. Tente novamente.')
		} finally {
			btnDownload.disabled = false
			btnDownload.innerHTML = originalHTML
		}
	}

	async _captureChartImages() {
		const section = document.querySelector('#monthlyChartSection')
		const wasHidden = !this.isChartVisible

		if (wasHidden && section) {
			section.style.position = 'fixed'
			section.style.left = '0'
			section.style.top = '0'
			section.style.width = '900px'
			section.style.opacity = '0'
			section.style.pointerEvents = 'none'
			section.style.zIndex = '-1'
			section.style.display = 'block'
		}

		// Capturar com animacao desativada e alta resolucao
		const hiResOptions = { devicePixelRatio: 3, animation: false }
		this.renderChart(hiResOptions)
		this.renderMonthlyChart(hiResOptions)

		// Aguarda dois frames para o Chart.js terminar resize+repaint em hi-res
		// (animation: false já elimina a necessidade de espera arbitrária).
		await new Promise(resolve =>
			requestAnimationFrame(() => requestAnimationFrame(resolve))
		)

		const barChartImg = this.chart?.toBase64Image('image/png', 1) || null
		const lineChartImg = this.monthlyChart?.toBase64Image('image/png', 1) || null

		// Restaurar graficos na resolucao normal da tela
		this.renderChart()
		if (wasHidden) {
			if (this.monthlyChart) {
				this.monthlyChart.destroy()
				this.monthlyChart = null
			}
			section.style.position = ''
			section.style.left = ''
			section.style.top = ''
			section.style.width = ''
			section.style.opacity = ''
			section.style.pointerEvents = ''
			section.style.zIndex = ''
			section.style.display = 'none'
		} else {
			this.renderMonthlyChart()
		}

		return { barChartImg, lineChartImg }
	}

}
