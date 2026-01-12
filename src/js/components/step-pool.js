export class StepPool {
	constructor() {
		this.data = {
		length: "",
		width: "",
		depth: "",
		hasHeating: false,
		};
  	}

	render() {
		return `
			<div class="eco-pool-container">
				<div class="eco-pool-card">
					<div class="eco-pool-header">
						<div class="eco-pool-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves-ladder-icon lucide-waves-ladder">
							<path d="M19 5a2 2 0 0 0-2 2v11"/>
							<path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
							<path d="M7 13h10"/>
							<path d="M7 9h10"/>
							<path d="M9 5a2 2 0 0 0-2 2v11"/>
						</svg>
						</div>
						<h2 class="eco-pool-title">Dados da Piscina</h2>
						<p class="eco-pool-subtitle">Forneça as informações detalhadas sobre sua piscina para um cálculo preciso.</p>
					</div>
					<div class="eco-pool-form">
						<p class="eco-pool-info-text">Áreas com menos de 0.6 metros de profundidade serão consideradas prainhas.</p>
						<button class="eco-btn eco-btn-secondary" id="btnAddArea"> Adicionar Área </button>
						
						<div class="eco-form-group">
							<label for="poolLength">Comprimento (m)</label>
							<input type="number" id="poolLength" class="eco-input" placeholder="Ex: 8" step="0.1">
						</div>
						<div class="eco-form-group">
							<label for="poolWidth">Largura (m)</label>
							<input type="number" id="poolWidth" class="eco-input" placeholder="Ex: 4" step="0.1">
						</div>
						<div class="eco-form-group">
							<label for="poolDepth">Profundidade média (m)</label>
							<input type="number" id="poolDepth" class="eco-input" placeholder="Ex: 1.5" step="0.1">
						</div>
						<div class="eco-form-group">
							<label>
								<input type="checkbox" id="poolHeating">
								A piscina possui aquecimento?
							</label>
						</div>
						<div class="eco-actions">
							<button class="eco-btn eco-btn-secondary" id="btnBackPool">
								Voltar
							</button>
							<button class="eco-btn eco-btn-primary" id="btnNextPool">
								Calcular
							</button>
						</div>
					</div>
				</div>
			</div>
		`;
	}

  bindEvents(onNext, onBack) {
	const btnNext = document.querySelector("#btnNextPool");
	const btnBack = document.querySelector("#btnBackPool");
	const lengthInput = document.querySelector("#poolLength");
	const widthInput = document.querySelector("#poolWidth");
	const depthInput = document.querySelector("#poolDepth");
	const heatingCheck = document.querySelector("#poolHeating");

	lengthInput?.addEventListener("input", (e) => {
	  this.data.length = e.target.value;
	});

	widthInput?.addEventListener("input", (e) => {
	  this.data.width = e.target.value;
	});

	depthInput?.addEventListener("input", (e) => {
	  this.data.depth = e.target.value;
	});

	heatingCheck?.addEventListener("change", (e) => {
	  this.data.hasHeating = e.target.checked;
	});

	btnBack?.addEventListener("click", () => {
	  onBack();
	});

	btnNext?.addEventListener("click", () => {
	  if (this.data.length && this.data.width && this.data.depth) {
		onNext(this.data);
	  } else {
		alert("Por favor, preencha todas as dimensões da piscina");
	  }
	});
  }

  getData() {
	return this.data;
  }
}
