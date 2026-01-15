export class StepPool {
	constructor(apiService, locationData) {
		this.apiService = apiService
		this.locationData = locationData
		this.areas = []
		this.areaCounter = 0
		this.data = {
			areas: [],
			tanqueCompensacao: 'nao',
			tipoUtilizacao: 'privada',
			utilizacaoAnual: 'ano_inteiro',
            utilizacaoMensal: 'finais_de_semana',
            localizacaoPiscina: 'local_aberto',
            utilizacaoCapaTermica: 'nao',
            velocidadeVento: 'sem_vento',
            reabastecimentoDiario: 0,
            temperaturaDesejada: 32,
            temperaturaInicial: 20,
            comprimentoBordaInfinita: 0,
            larguraCascata: 0,
            dispositivoHidromassagem: 0
		};
  	}
	async loadClimateData() {
		try {
			console.log('Location Data recebido:', this.locationData)
			console.log('Buscando clima para state_city:', this.locationData.state_city)
			
			this.climateData = await this.apiService.getClimateData(this.locationData.state_city)
			console.log('Dados climáticos:', this.climateData)
		
			const tempInfo = document.querySelector('#tempInfo')
			if (tempInfo && this.climateData.temp_minima) {
				tempInfo.textContent = `Temperatura Ambiente média mais baixa do ano ${this.climateData.temp_minima}°C.`
			}
			const windInfo = document.querySelector('#velocidadeVento')
			if (windInfo && this.climateData.vel_vento) {
				if (this.climateData.vel_vento < 2.0) {
					windInfo.value = 'sem_vento'
				} else if (this.climateData.vel_vento < 4.0) {
					windInfo.value = 'fraco_2ms'
				} else if (this.climateData.vel_vento < 6.0) {
					windInfo.value = 'medio_4ms'
				} else if (this.climateData.vel_vento >= 6.0) {
					windInfo.value = 'forte_6ms'
				}
				else {
					windInfo.value = 'sem_vento'
				}
			}

		} catch (error) {
			console.error('Erro ao carregar dados climáticos:', error)
			const tempInfo = document.querySelector('#tempInfo')
			if (tempInfo) {
				tempInfo.textContent = 'Não foi possível carregar a temperatura da região'
			}
		}
	}
    addArea() {
        const areaId = ++this.areaCounter
        this.areas.push({
            id: areaId,
            comprimento: '',
            largura: '',
            profundidade: ''
        })
        this.renderAreas()
    }

    removeArea(areaId) {
        this.areas = this.areas.filter(area => area.id !== areaId)
        this.renderAreas()
    }

    renderAreas() {
        const container = document.querySelector('#poolAreasContainer')
        if (!container) return

        container.innerHTML = this.areas.map(area => `
            <div class="eco-area-card" data-area-id="${area.id}">
                <div class="eco-area-header">
                    <h3>Área ${area.id}</h3>
                    <button type="button" class="eco-btn-remove" data-area-id="${area.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                <div class="eco-area-fields">
                    <div class="eco-form-group">
                        <label class="eco-label" >Comprimento (m)</label>
                        <input type="number" class="eco-input" data-field="comprimento" data-area-id="${area.id}" 
                            value="${area.comprimento}" placeholder="Ex: 8" step="0.1" min="0">
                    </div>
                    <div class="eco-form-group">
                        <label class="eco-label">Largura (m)</label>
                        <input type="number" class="eco-input" data-field="largura" data-area-id="${area.id}" 
                            value="${area.largura}" placeholder="Ex: 4" step="0.1" min="0">
                    </div>
                    <div class="eco-form-group">
                        <label class="eco-label">Profundidade (m)</label>
                        <input type="number" class="eco-input" data-field="profundidade" data-area-id="${area.id}" 
                            value="${area.profundidade}" placeholder="Ex: 1.5" step="0.1" min="0">
                    </div>
                </div>
            </div>
        `).join('')

        this.bindAreaEvents()
    }
    bindAreaEvents() {
        document.querySelectorAll('.eco-btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const areaId = parseInt(e.currentTarget.dataset.areaId)
                this.removeArea(areaId)
            })
        })

        document.querySelectorAll('[data-area-id][data-field]').forEach(input => {
            input.addEventListener('input', (e) => {
                const areaId = parseInt(e.target.dataset.areaId)
                const field = e.target.dataset.field
                const area = this.areas.find(a => a.id === areaId)
                if (area) {
                    area[field] = e.target.value
                }
            })
        })
    }

    render() {
        return `
            <div class="eco-container">
                <div class="eco-card">
                    <div class="eco-header">
                        <div class="eco-card-icon">
                            <i data-lucide="waves-ladder"></i>
                        </div>
                        <h2 class="eco-card-title">Dados da Piscina</h2>
                        <p class="eco-card-subtitle">Forneça as informações detalhadas sobre sua piscina para um cálculo preciso.</p>
                    </div>
                    <div class="eco-pool-body">
						<div class="eco-pool-area">
							<div class="eco-pool-info">
								<i data-lucide="info"></i>
								<p class="eco-pool-info-text">Áreas com menos de 0.6 metros de profundidade serão consideradas prainhas.</p>
							</div>
							<div class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1);">
								<i data-lucide="lightbulb"></i>
								<div>
									<p class="eco-pool-info-text"><strong>Dica:</strong> Piscina com profundidades variadas?</p>
									<p class="eco-pool-info-text" style="margin-top: 0.25rem;">Adicione uma área separada para cada profundidade diferente (ex: parte rasa de 1m e parte funda de 2m).</p>
								</div>
                        	</div>
							<button type="button" class="eco-btn eco-btn-secondary eco-btn-small" id="btnAddArea">+ Adicionar Área</button>
							<div id="poolAreasContainer"></div>
						</div>

                        <div class="eco-separator"></div>
						<div class="eco-pool-info">
							<i data-lucide="thermometer-sun"></i>
							<p class="eco-pool-info-text" id="tempInfo"></p>
						</div>
						<div class="eco-pool-parameters">
							<div class="eco-form-group">
								<label class="eco-label" for="tanqueCompensacao">Tanque de Compensação*¹</label>
								<select id="tanqueCompensacao" class="eco-select">
									<option value="nao">Não</option>
									<option value="sim">Sim</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="tipoUtilizacao">Tipo de Utilização</label>
								<select id="tipoUtilizacao" class="eco-select">
									<option value="privada">Privada</option>
									<option value="coletiva">Coletiva</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="utilizacaoAnual">Utilização Anual</label>
								<select id="utilizacaoAnual" class="eco-select">
									<option value="ano_inteiro">Ano Inteiro</option>
									<option value="fora_inverno">Fora do Inverno</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="utilizacaoMensal">Utilização Mensal</label>
								<select id="utilizacaoMensal" class="eco-select">
									<option value="finais_de_semana" selected>Finais de Semana</option>
									<option value="todos_os_dias">Todos os Dias</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="localizacaoPiscina">Localização da Piscina</label>
								<select id="localizacaoPiscina" class="eco-select">
									<option value="local_fechado">Local Fechado</option>
									<option value="local_aberto">Local Aberto</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="utilizacaoCapaTermica">Utiliza Capa Térmica</label>
								<select id="utilizacaoCapaTermica" class="eco-select">
									<option value="nao">Não</option>
									<option value="sim">Sim</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label"for="velocidadeVento">Velocidade do Vento</label>
								<select id="velocidadeVento" class="eco-select">
									<option value="sem_vento">Sem Vento</option>
									<option value="fraco_2ms">Fraco 2.0m/s</option>
									<option value="medio_4ms">Médio 4.0m/s</option>
									<option value="forte_6ms">Forte 6.0m/s</option>
								</select>
							</div>

							<div class="eco-form-group">
								<label class="eco-label"for="reabastecimentoDiario">Reabastecimento Diário (%)*²</label>
								<input type="number" id="reabastecimentoDiario" class="eco-input" value="0" min="0" max="100" step="1">
							</div>

							<div class="eco-form-group">
								<label class="eco-label"for="temperaturaDesejada">Temperatura Desejada (°C)</label>
								<input type="number" id="temperaturaDesejada" class="eco-input" value="32" min="20" step="0.5">
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="temperaturaInicial">Temperatura Inicial (°C)</label>
								<input type="number" id="temperaturaInicial" class="eco-input" value="20" min="0" step="0.5">
							</div>

							<div class="eco-form-group">
								<label class="eco-label"for="comprimentoBordaInfinita">Comprimento Borda Infinita (cm)</label>
								<input type="number" id="comprimentoBordaInfinita" class="eco-input" value="0" min="0" step="0.1">
							</div>

							<div class="eco-form-group">
								<label class="eco-label" for="larguraCascata">Largura da Cascata (cm)</label>
								<input type="number" id="larguraCascata" class="eco-input" value="0" min="0" step="0.1">
							</div>

							<div class="eco-form-group eco-full">
								<label class="eco-label" for="dispositivoHidromassagem">Dispositivos de Hidromassagem (un)</label>
								<input type="number" id="dispositivoHidromassagem" class="eco-input" value="0" min="0" step="1">
							</div>

						</div>
						<div class="eco-info-note">
							<p class="eco-pool-info-text">*¹ Cocho da borda infinita.</p>
							<p class="eco-pool-info-text">*² Reabastecimento para manter o volume da piscina.</p>
						</div>
					</div>
					<div class="eco-step-actions eco-step-actions-double">
						<button class="eco-btn eco-btn-secondary eco-btn-medium" id="btnBackPool">Voltar</button>
						<button class="eco-btn eco-btn-primary eco-btn-medium" id="btnNextPool">Calcular</button>
					</div>
                </div>
            </div>
        `
    }

  	bindEvents(onNext, onBack) {

		this.loadClimateData()

        const btnAddArea = document.querySelector('#btnAddArea')
        const btnNext = document.querySelector('#btnNextPool')
        const btnBack = document.querySelector('#btnBackPool')

		btnAddArea?.addEventListener('click', () => {
        	this.addArea()
        })
        const fields = [
            'tanqueCompensacao', 'tipoUtilizacao', 'utilizacaoAnual', 'utilizacaoMensal',
            'localizacaoPiscina', 'utilizacaoCapaTermica', 'velocidadeVento',
            'reabastecimentoDiario', 'temperaturaDesejada', 'temperaturaInicial',
            'comprimentoBordaInfinita', 'larguraCascata', 'dispositivoHidromassagem'
        ]

        fields.forEach(field => {
            const input = document.querySelector(`#${field}`)
            input?.addEventListener('change', (e) => {
                this.data[field] = e.target.value
            })
        })

        btnBack?.addEventListener('click', () => {
            onBack()
        })

        btnNext?.addEventListener('click', () => {
            if (this.areas.length === 0) {
                alert('Por favor, adicione pelo menos uma área de piscina')
                return
            }

            const invalidArea = this.areas.find(area => 
                !area.comprimento || !area.largura || !area.profundidade
            )

            if (invalidArea) {
                alert('Por favor, preencha todos os campos das áreas adicionadas')
                return
            }

            if (parseFloat(this.data.temperaturaDesejada) <= parseFloat(this.data.temperaturaInicial)) {
                alert('A temperatura desejada deve ser maior que a temperatura inicial')
                return
            }

            this.data.areas = this.areas.map(area => ({
                comprimento: parseFloat(area.comprimento),
                largura: parseFloat(area.largura),
                profundidade: parseFloat(area.profundidade)
            }))

            onNext(this.data)
        })
  	}

  	getData() {
		return this.data;
  	}
}
