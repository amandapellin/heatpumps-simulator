export class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || 'http://localhost/api';
    }

    async getStates() {
        const response = await fetch(`${this.baseUrl}/states`);
        if (!response.ok) {
            throw new Error('Erro ao buscar estados');
        }
        return await response.json();
    }

    async getCities(stateId) {
        const response = await fetch(`${this.baseUrl}/cities?state_id=${stateId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar cidades');
        }
        return await response.json();
    }
}