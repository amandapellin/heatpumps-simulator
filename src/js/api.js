export class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    }

    async getStates() {
        const response = await fetch(`${this.baseUrl}/cities/ufs`);
        if (!response.ok) {
            throw new Error('Erro ao buscar estados');
        }
        return await response.json();
    }

    async getCities(uf) {
        if (!uf || typeof uf !== 'string') {
            throw new Error('Estado inválido');
        }
        const response = await fetch(`${this.baseUrl}/cities/uf/${uf}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar cidades');
        }
        return await response.json();
    }

    async getClimateData(uf_cidade) {
        if (!uf_cidade) {
            throw new Error('Estado e cidade são obrigatórios.');
        }
        const encodedUfCidade = encodeURIComponent(uf_cidade);
        const response = await fetch(`${this.baseUrl}/cities/climate/${encodedUfCidade}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados climáticos');
        }
        return await response.json();
    }

    /**
     * Executar simulação de bomba de calor
     * @param {Object} simulationData - Dados completos da simulação
     * @returns {Promise<Object>} Resultados da simulação
     */
    async runSimulation(simulationData) {
        try {
            const response = await fetch(`${this.baseUrl}/simulation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(simulationData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao executar simulação');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na simulação:', error);
            throw error;
        }
    }

    /**
     * Obter todas as bombas de calor
     * @returns {Promise<Object>} Lista de bombas
     */
    async getHeatPumps() {
        const response = await fetch(`${this.baseUrl}/heat-pumps`);
        if (!response.ok) {
            throw new Error('Erro ao buscar bombas de calor');
        }
        return await response.json();
    }

    /**
     * Obter bomba por ID
     * @param {number} id - ID da bomba
     * @returns {Promise<Object>} Dados da bomba
     */
    async getHeatPumpById(id) {
        if (!id) {
            throw new Error('ID da bomba é obrigatório');
        }
        const response = await fetch(`${this.baseUrl}/heat-pumps/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar bomba de calor');
        }
        return await response.json();
    }

    async downloadReport(data) {
        const response = await fetch(`${this.baseUrl}/simulation/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erro ao gerar relatório PDF');
        }

        return await response.blob();
    }
}