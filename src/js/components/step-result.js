import Chart from 'chart.js/auto'

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
				tipoUtilizacao: this.poolData.tipoUtilizacao || 'residencial',
				utilizacaoAnual: this.poolData.utilizacaoAnual || 'ano_inteiro',
				utilizacaoMensal: this.poolData.utilizacaoMensal || 'finais_de_semana',
				localizacaoPiscina: this.poolData.localizacaoPiscina || 'externa',
				utilizacaoCapaTermica: this.poolData.utilizacaoCapaTermica || 'nao',
				velocidadeVento: this.poolData.velocidadeVento || 'medio',
				reabastecimentoDiario: parseFloat(this.poolData.reabastecimentoDiario || 0),
				temperaturaDesejada: parseFloat(this.poolData.temperaturaDesejada || 32),
				temperaturaInicial: parseFloat(this.poolData.temperaturaInicial || 20),
				comprimentoBordaInfinita: parseFloat(this.poolData.comprimentoBordaInfinita || 0),
				larguraCascata: parseFloat(this.poolData.larguraCascata || 0),
				dispositivoHidromassagem: parseInt(this.poolData.dispositivoHidromassagem || 0)
			}

			console.log('Enviando dados para simulação:', simulationData)

			const response = await this.apiService.runSimulation(simulationData)

			if (response.success) {
				this.results = response.data
				console.log('Resultados da simulação:', this.results)
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

	renderCards (){
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

		const pumpHot = this.results.recommendedPumpHot
		const pumpCold = this.results.recommendedPumpCold
		const combinations = this.results.pumpCombinations || []
		const comparison = this.results.comparison

		const fmtBRL = (v) => v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'

		const heatPumpAnnual = comparison?.heatPumpHot?.annual ?? 0
		const eletricaAnnual = comparison?.eletrica?.annual ?? 0
		const economiaPercent = (eletricaAnnual > 0 && heatPumpAnnual > 0 && heatPumpAnnual < eletricaAnnual)
			? Math.round(((eletricaAnnual - heatPumpAnnual) / eletricaAnnual) * 100)
			: null
			
		const heatingTimes = this.results.heatingTimes || {}

		const fmtKwh = (v) => v > 0 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ' kWh' : '--'
		const hotKwh  = this.results?.comparison?.heatPumpHot?.firstHeatingKwh ?? 0
		const coldKwh = this.results?.comparison?.heatPumpCold?.firstHeatingKwh ?? 0
		const hotCost  = this.results?.comparison?.heatPumpHot?.firstHeatingCost ?? 0
		const coldCost = this.results?.comparison?.heatPumpCold?.firstHeatingCost ?? 0

		const fmtTime = (hours) => {
			if (hours == null) return 'N/A'
			const h = Math.floor(hours)
			const m = Math.round((hours - h) * 60)
			if (m === 0) return `${h} horas`
			return `${h}h ${m}min`
		}

		if (combinations && combinations.hot && combinations.cold) {
			const comboHot  = combinations.hot
			const comboCold = combinations.cold
			const renderComboCard = (combo, climateLabel, climateClass, icon) => `
				<div class="eco-results-card">
					<div class="eco-results-layout">
						<div class="eco-results-img-container">
							<img class="eco-results-img" src="${combo.pump.img_url || 'https://via.placeholder.com/150'}" alt="${combo.pump.modelo}">
						</div>
						<div class="eco-results-info">
							<h3 class="eco-result-pump-model">${combo.quantity}× ${combo.pump.modelo}</h3>
							<div class="eco-badge ${climateClass}" style="margin-bottom: 0.5rem;">
								<i data-lucide="${icon}"></i>
								<p class="eco-result-text">${climateLabel} — ${combo.quantity} unidades / Capacidade: ${combo.totalBtu.toLocaleString('pt-BR')} BTU/h</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="clock-4"></i>
								<p class="eco-result-text"><strong>Tempo de aquecimento:</strong> ${fmtTime(combo.heatingTime)}</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="leaf"></i>
								<p class="eco-result-text"><strong>Economia de energia:</strong> Até ${economiaPercent}% comparado a aquecedores elétricos.</p>
							</div>
						</div>
					</div>
				</div>
			`
			return `
				${renderComboCard(comboHot,  'Clima quente', 'eco-results-warm', 'thermometer-sun')}
				${renderComboCard(comboCold, 'Clima frio',   'eco-results-cold', 'thermometer-snowflake')}
			`
		}

		let html = ''

		if (pumpHot) {
			html += `
				<div class="eco-results-card">
					<div class="eco-results-layout">
						<div class="eco-results-img-container">
							<img class="eco-results-img" src="${pumpHot.img_url || 'https://via.placeholder.com/150'}" alt="${pumpHot.modelo}">
						</div>
						<div class="eco-results-info">
							<h3 class="eco-result-pump-model">${pumpHot.modelo}</h3>
							<div class="eco-badge eco-results-warm">
								<i data-lucide="thermometer-sun"></i>
								<p class="eco-result-text">Ideal para regiões mais quentes.</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="clock-4"></i>
								<p class="eco-result-text"><strong>Tempo de Aquecimento:</strong> ${fmtTime(heatingTimes.hot)}</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="plug"></i>
								<p class="eco-result-text"><strong>Consumo estimado do primeiro aquecimento:</strong> ${fmtKwh(hotKwh)}</p>
								<p class="eco-result-text"><strong>Custo estimado do primeiro aquecimento:</strong> ${fmtBRL(hotCost)}</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="leaf"></i>
								<p class="eco-result-text"><strong>Economia de energia:</strong> Até ${economiaPercent}% comparado a aquecedores elétricos.</p>
							</div>
						</div>
					</div>
				</div>
			`
		}

		if (pumpCold) {
			html += `
				<div class="eco-results-card">
					<div class="eco-results-layout">
						<div class="eco-results-img-container">
							<img class="eco-results-img" src="${pumpCold.img_url || 'https://via.placeholder.com/150'}" alt="${pumpCold.modelo}">
						</div>
						<div class="eco-results-info">
							<h3 class="eco-result-pump-model">${pumpCold.modelo}</h3>
							<div class="eco-badge eco-results-cold">
								<i data-lucide="thermometer-snowflake"></i>
								<p class="eco-result-text">Ideal para regiões mais frias.</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="clock-4"></i>
								<p class="eco-result-text"><strong>Tempo de Aquecimento:</strong> ${fmtTime(heatingTimes.cold)}</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="plug"></i>
								<p class="eco-result-text"><strong>Consumo estimado do primeiro aquecimento:</strong> ${fmtKwh(coldKwh)}</p>
								<p class="eco-result-text"><strong>Custo estimado do primeiro aquecimento:</strong> ${fmtBRL(coldCost)}</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1); margin-bottom: 0;">
								<i data-lucide="leaf"></i>
								<p class="eco-result-text"><strong>Economia de energia:</strong> Até ${economiaPercent}% comparado a aquecedores elétricos.</p>
							</div>
						</div>
					</div>
				</div>
			`
		}

		return html
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
								<p class="eco-result-text"> A capacidade de aquecimento necessária para elevar a temperatura da água de <strong>${this.poolData.temperaturaInicial || 20}°C</strong> para <strong>${this.poolData.temperaturaDesejada || 32}°C</strong> em <strong>60 horas</strong> é de: <strong>${this.results?.heatLoss?.requiredPumpEnergy ? Math.round(this.results.heatLoss.requiredPumpEnergy / 1.055).toLocaleString('pt-BR') + ' BTU/h' : '--'}</strong></p>
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

		setTimeout(() => {
        	this.renderChart()
    	}, 100)
	}

	renderChart(overrideOptions = {}) {
		const canvas = document.querySelector('#costComparisonChart')
		if (!canvas || !this.results) return

		const ctx = canvas.getContext('2d')
		const { comparison } = this.results

		if (this.chart) {
			this.chart.destroy()
		}

		const pumpHotLabel = this.results.recommendedPumpHot ? `${this.results.recommendedPumpHot.modelo}` : 'Bomba de Calor ECOPOOL'
		const pumpColdLabel = this.results.recommendedPumpCold ? `${this.results.recommendedPumpCold.modelo}` : 'Bomba de Calor ECOPOOL'
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
				labels: [pumpHotLabel, pumpColdLabel, 'Resistência', 'Gás Natural', 'Pellet'],
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

		if (this.monthlyChart) {
			this.monthlyChart.destroy()
		}

		const monthLabels = (comparison.monthNames || [
			'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
			'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
		]).map(name => name.toUpperCase())

		const pumpHot = this.results.recommendedPumpHot
		const pumpCold = this.results.recommendedPumpCold
		const pumpHotLabel = pumpHot ? `${pumpHot.modelo}` : 'Bomba de Calor ECOPOOL'
		const pumpColdLabel = pumpCold ? `${pumpCold.modelo}` : 'Bomba de Calor ECOPOOL'

		this.monthlyChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: monthLabels,
				datasets: [
					{
						label: pumpHotLabel,
						data: comparison.heatPumpHot.monthlyBreakdown,
						borderColor: '#1a3a8a',
						borderWidth: 2.5,
						pointRadius: 0,
						pointHoverRadius: 5,
						tension: 0.4,
						fill: false
					},
					{
						label: pumpColdLabel,
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

		await new Promise(resolve => setTimeout(resolve, 600))

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

	renderTable() {
		if (!this.results || !this.results.comparison) {
			return ''
		}

		const { comparison } = this.results
		const months = comparison.monthNames || [
			'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
			'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
		]

		const pumpHotLabel = this.results.recommendedPumpHot ? `${this.results.recommendedPumpHot.modelo}` : 'Bomba de Calor ECOPOOL'
		const pumpColdLabel = this.results.recommendedPumpCold ? `${this.results.recommendedPumpCold.modelo}` : 'Bomba de Calor ECOPOOL'

		const fmt = (value) => {
			if (value == null || isNaN(value)) return '-'
			return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
		}

		const fmtCurrency = (value) => {
			if (value == null || isNaN(value)) return '-'
			return `R$ ${fmt(value)}`
		}

		const sumArray = (arr) => (arr || []).reduce((a, b) => a + b, 0)

		let tbodyRows = ''
		for (let i = 0; i < 12; i++) {
			tbodyRows += `
				<tr>
					<td>${months[i]}</td>
					<td>${fmt(comparison.heatPumpHot.consumption[i])}</td>
					<td>${fmtCurrency(comparison.heatPumpHot.monthlyBreakdown[i])}</td>
					<td>${fmt(comparison.heatPumpCold.consumption[i])}</td>
					<td>${fmtCurrency(comparison.heatPumpCold.monthlyBreakdown[i])}</td>
					<td>${fmt(comparison.eletrica.consumption[i])}</td>
					<td>${fmtCurrency(comparison.eletrica.monthlyBreakdown[i])}</td>
					<td>${fmt(comparison.gn.consumption[i])}</td>
					<td>${fmtCurrency(comparison.gn.monthlyBreakdown[i])}</td>
					<td>${fmt(comparison.pellet.consumption[i])}</td>
					<td>${fmtCurrency(comparison.pellet.monthlyBreakdown[i])}</td>
				</tr>
			`
		}

		return `
			<div class="eco-results-comparison-table" style="display: none;">
				<h3 class="eco-results-chart-title">Comparativo Mensal de Custos de Operação</h3>
				<p class="eco-result-text">Análise detalhada dos custos mensais associados a diferentes métodos de aquecimento de piscinas.</p>
				<div class="eco-results-table-wrapper">
					<table class="eco-comparison-table">
						<thead>
							<tr>
								<th></th>
								<th colspan="2">${pumpHotLabel}</th>
								<th colspan="2">${pumpColdLabel}</th>
								<th colspan="2">Resistência</th>
								<th colspan="2">Gás Natural</th>
								<th colspan="2">Pellet</th>
							</tr>
							<tr>
								<th>Mês</th>
								<th>Consumo (kWh)</th>
								<th>Custo</th>
								<th>Consumo (kWh)</th>
								<th>Custo</th>
								<th>Consumo (kWh)</th>
								<th>Custo</th>
								<th>Consumo (m³)</th>
								<th>Custo</th>
								<th>Consumo (kg)</th>
								<th>Custo</th>
							</tr>
						</thead>
						<tbody>
							${tbodyRows}
						</tbody>
						<tfoot>
							<tr>
								<td><strong>Total Anual</strong></td>
								<td><strong>${fmt(sumArray(comparison.heatPumpHot.consumption))} kWh</strong></td>
								<td><strong>${fmtCurrency(comparison.heatPumpHot.annual)}</strong></td>
								<td><strong>${fmt(sumArray(comparison.heatPumpCold.consumption))} kWh</strong></td>
								<td><strong>${fmtCurrency(comparison.heatPumpCold.annual)}</strong></td>
								<td><strong>${fmt(sumArray(comparison.eletrica.consumption))} kWh</strong></td>
								<td><strong>${fmtCurrency(comparison.eletrica.annual)}</strong></td>
								<td><strong>${fmt(sumArray(comparison.gn.consumption))} m³</strong></td>
								<td><strong>${fmtCurrency(comparison.gn.annual)}</strong></td>
								<td><strong>${fmt(sumArray(comparison.pellet.consumption))} kg</strong></td>
								<td><strong>${fmtCurrency(comparison.pellet.annual)}</strong></td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		`
	}
}