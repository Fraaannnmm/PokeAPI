const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultContainer = document.getElementById("resultContainer");

// URL de la API
const BASE_URL = "https://pokeapi.co/api/v2/pokemon";

/**
 *
 * @param {string} query
 */
async function getPokemon(query) {
	resultContainer.innerHTML = '<p class="msg-loading">Cargando...</p>';

	try {
		const queryLimpio = query.toLowerCase().trim();
		const url = `${BASE_URL}/${queryLimpio}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(
				`El Pokémon "${query}" no existe o no pudo ser encontrado.`,
			);
		}

		const data = await response.json();

		renderPokemon(data);
	} catch (error) {
		resultContainer.innerHTML = `<p class="msg-error">${error.message}</p>`;
	}
}

/**
 * @param {object} p
 */
function renderPokemon(p) {
	const tiposHtml = p.types
		.map((t) => `<span class="type-badge">${t.type.name}</span>`)
		.join("");

	const tresStats = p.stats.slice(0, 3);
	const statsHtml = tresStats
		.map(
			(s) => `
        <p>
            <strong>${s.stat.name}:</strong> 
            <span>${s.base_stat}</span>
        </p>
    `,
		)
		.join("");

	const cardHtml = `
        <div class="card">
            <img src="${p.sprites.front_default}" alt="Imagen de ${p.name}">
            <h2>#${p.id} ${p.name}</h2>
            <div class="types">
                ${tiposHtml}
            </div>
            <div class="stats">
                ${statsHtml}
            </div>
        </div>
    `;

	resultContainer.innerHTML = cardHtml;
}

searchBtn.addEventListener("click", () => {
	const query = searchInput.value;
	if (query !== "") {
		getPokemon(query);
	}
});

searchInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		const query = searchInput.value;
		if (query !== "") {
			getPokemon(query);
		}
	}
});
