export class StepLocation {
    constructor(apiService){
        this.apiService = apiService
        this.data = {
            state:'',
            city: ''
        }
        this.states = []
        this.cities = []
    }
    
    async loadStates() {
        try {
            const response = await this.apiService.getStates()
            this.states = response.data || response // Extrair data da resposta
            const stateSelect = document.querySelector('#state')
            if (stateSelect) {
                stateSelect.innerHTML = '<option value="">Selecione o estado</option>' +
                    this.states.map(state => {
                        const stateCode = typeof state === 'object' ? state.uf : String(state)
                        const stateName = typeof state === 'object' ? state.uf_name : String(state)
                        const stateNameFormatted = this.capitalizeWords(stateName)
                        return `<option value="${stateCode}">${stateNameFormatted}</option>`
                    }).join('')
            }
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
            alert('Não foi possível carregar os estados. Tente novamente mais tarde.')
        }
    }

    capitalizeWords(str) {
        const prepositions = ['do', 'da', 'dos', 'das', 'de', 'di', 'du', 'e', 'a', 'o']
        
        return str.toLowerCase().split(' ').map((word, index) => {
            if (index === 0) {
                return word.charAt(0).toUpperCase() + word.slice(1)
            }
            if (prepositions.includes(word)) {
                return word
            }
            return word.charAt(0).toUpperCase() + word.slice(1)
        }).join(' ')
    }

    async loadCities(state) {
        try {
            const response = await this.apiService.getCities(state)
            this.cities = response.data || response // Extrair data da resposta
            const citySelect = document.querySelector('#city')
            if (citySelect) {
                citySelect.innerHTML = '<option value="">Selecione a cidade</option>' +
                    this.cities.map(city => {
                        const cityName = typeof city === 'object' ? city.cidade : String(city)
                        const cityNameFormatted = this.capitalizeWords(cityName)
                        return `<option value="${cityNameFormatted}">${cityNameFormatted}</option>`
                    }).join('')
            }
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
            alert('Não foi possível carregar as cidades. Tente novamente mais tarde.')
        }
    }
    async loadClimateData(state_city) {
        try {
            const response = await this.apiService.getClimateData(state_city)
            this.climateData = response.data || response // Extrair data da resposta
            const ventoInfo = document.querySelector('#velocidadeVento')
            if (ventoInfo && this.climateData.vel_vento) {
                ventoInfo.textContent = `Velocidade do Vento Média Anual: ${this.climateData.vel_vento} Metros por Segundo.`
            }
            const altitudeInfo = document.querySelector('#altitude')
            if (altitudeInfo && this.climateData.altitude) {
                altitudeInfo.textContent = `Altitude em relação ao nível do mar: ${this.climateData.altitude} Metros.`
            }
            const umidadeInfo = document.querySelector('#umidadeRelativa')
            if (umidadeInfo && this.climateData.umidade_rel_media) {
                const umidadePercent = parseFloat(this.climateData.umidade_rel_media * 100).toFixed(2)
                umidadeInfo.textContent = `Umidade Relativa: ${umidadePercent}%`
            }
            return this.climateData
        } catch (error) {
            console.error('Erro ao carregar dados climáticos:', error);
            alert('Não foi possível carregar os dados climáticos. Tente novamente mais tarde.')
        }
    }
    showLocationInfo() {
        const infoContainer = document.querySelector('#locationInfo')
        if (infoContainer) {
            infoContainer.style.display = 'flex'
            infoContainer.style.animation = 'fadeIn 0.3s ease-in'
        }
        const infoText = infoContainer?.querySelector('#umidadeRelativa')
        if (infoText) {
            infoText.style.marginBottom = '8px'
        }
    }

    hideLocationInfo() {
        const infoContainer = document.querySelector('#locationInfo')
        if (infoContainer) {
            infoContainer.style.display = 'none'
        }
    }
    
    render() {
        return `
            <div class="eco-container">
                <div class="eco-card">
                    <div class="eco-header">
                        <div class="eco-card-icon">
                            <i data-lucide="map-pin"></i>
                        </div>
                        <h2 class="eco-card-title">Localização da Piscina</h2>
                        <p class="eco-card-subtitle">Informe o estado e a cidade onde sua piscina está localizada para calcularmos as condições climáticas ideais.</p>
                    </div>
                    <div class="eco-location-form">
                        <div class="eco-form-group">
                            <label class="eco-label" for="state">Estado</label>
                            <select class="eco-select" id="state" name="state">
                                <option value="">Selecione o estado</option>
                            </select>
                        </div>
                        <div class="eco-form-group">
                            <label class="eco-label" for="city">Cidade</label>
                            <select class="eco-select" id="city" name="city" disabled>
                                <option value="">Selecione a cidade</option>
                            </select>
                        </div>
                        <div id="locationInfo" class="eco-pool-info" style="border-left-color: var(--green-triplob); background: rgba(175, 227, 39, 0.1);">
                            <i data-lucide="info"></i>
                            <div>
                            <p class="eco-pool-info-text" id="velocidadeVento"></p>
                            <p class="eco-pool-info-text" id="altitude"></p>
                            <p class="eco-pool-info-text" id="umidadeRelativa"></p>
                            <p class="eco-pool-info-text" style="font-weight: bold;">Os dados da cidade escolhida foram estimados por semelhança e podem não refletir com precisão as condições climáticas reais.</p>
                            </div>
                        </div>                      
                    </div>
                    <div class="eco-step-actions">
                        <button class="eco-btn eco-btn-primary" id="btnNextLocation">Próximo</button>
                    </div>
                </div>
            </div>
        `
    }
    
    bindEvents(onNext) {
        const btnNext = document.querySelector('#btnNextLocation')
        const stateSelect = document.querySelector('#state')
        const citySelect = document.querySelector('#city')

        stateSelect?.addEventListener('change', async (e) => {
            const stateValue = String(e.target.value || '')

            this.data.state = stateValue
            this.data.city = ''
            this.data.state_city = ''

            if (stateValue && stateValue !== '') {
                citySelect.disabled = true
                citySelect.innerHTML = '<option value="">Carregando...</option>'
                await this.loadCities(stateValue)
                citySelect.disabled = false
            } else {
                citySelect.disabled = true
                citySelect.innerHTML = '<option value="">Selecione a cidade</option>'
            }
        })

        citySelect?.addEventListener('change', async (e) => {
            this.data.city = String(e.target.value || '')
            if (this.data.state && this.data.city) {
                this.data.state_city = `${this.data.state}-${this.data.city}`
                await this.loadClimateData(this.data.state_city)
                this.showLocationInfo()
            } else {
                this.hideLocationInfo()
            }
        })

        btnNext?.addEventListener('click', () => {
            if (this.data.state && this.data.city && this.data.state_city) {
                onNext(this.data)
            } else {
                alert('Por favor, selecione estado e cidade')
            }
        })

        this.loadStates()
    }

    getData() {
        return this.data
    }
}