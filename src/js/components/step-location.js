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
            this.states = await this.apiService.getStates()
            console.log('Estados recebidos:', this.states)
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
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    async loadCities(state) {
        console.log('State recebido:', state, typeof state)
        try {
            this.cities = await this.apiService.getCities(state)
            const citySelect = document.querySelector('#city')
            if (citySelect) {
                citySelect.innerHTML = '<option value="">Selecione a cidade</option>' + 
                    this.cities.map(city => {
                        const cityName = typeof city === 'object' ? city.cidade : String(city)
                        return `<option value="${cityName}">${cityName}</option>`
                    }).join('')
            }
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
            alert('Não foi possível carregar as cidades. Tente novamente mais tarde.')
        }
    }
    
    render() {
        return `
            <div class="eco-container">
                <div class="eco-card">
                    <div class="eco-header">
                        <div class="eco-card-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-icon lucide-map-pin">
                                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
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
            console.log('State selecionado:', stateValue, typeof stateValue)

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

        citySelect?.addEventListener('change', (e) => {
            this.data.city = String(e.target.value || '')
            if (this.data.state && this.data.city) {
                this.data.state_city = `${this.data.state}-${this.data.city}`
                console.log('state_city criado:', this.data.state_city)
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