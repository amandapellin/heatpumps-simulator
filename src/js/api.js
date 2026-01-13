export class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'http://localhost:3000/api';
    }

    async getStates() {
        const response = await fetch(`${this.baseUrl}/ufs`);
        if (!response.ok) {
            throw new Error('Erro ao buscar estados');
        }
        return await response.json();
    }

    async getCities(uf) {
        if (!uf || typeof uf !== 'string') {
            throw new Error('Estado inválido');
        }
        const response = await fetch(`${this.baseUrl}/cities/${uf}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar cidades');
        }
        return await response.json();
    }

    async getClimateData(uf_cidade) {
        if (!uf_cidade) {
            throw new Error('Estado e cidade são obrigatórios.');
        }
        const response = await fetch(`${this.baseUrl}/cities/${uf_cidade}/climate`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados climáticos');
        }
        return await response.json();
    }
}