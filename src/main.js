import './style.css'
import './css/components.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { Modal } from './js/components/Modal.js'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Simulador de Bombas de Calor</h1>
    <div class="card">
      <button id="btnOpenSimulator" type="button" class="btn btn-primary">
        Abrir Simulador
      </button>
    </div>
  </div>
`

const modal = new Modal('#app')
modal.render()

document.querySelector('#btnOpenSimulator').addEventListener('click', () => {
    modal.open()
})