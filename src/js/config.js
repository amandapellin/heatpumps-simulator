// Configurações compartilhadas do frontend.

// TODO: SUBSTITUIR pelo número/link oficial do representante ou da Ecologic antes
// de publicar. Formato wa.me: apenas dígitos, com código do país (55 = Brasil).
// Ex.: https://wa.me/5511999999999
export const WHATSAPP_URL =
	'https://wa.me/5500000000000?text=' +
	encodeURIComponent('Olá! Gostaria de falar sobre o dimensionamento de bombas de calor para piscina.')

// Piscinas com volume total de água acima deste limite (litros) não são
// dimensionadas pelo simulador — espelha App\Utils\Constants::POOL_MAX_VOLUME_M3.
export const MAX_POOL_VOLUME_LITERS = 150000
