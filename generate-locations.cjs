const fs = require('fs');
const path = require('path');

// Get locations from --- https://www.inegi.org.mx/app/ageeml/

// --- CONFIGURACIÓN ---
// Coloca el archivo CSV que descargaste del INEGI en la raíz de tu proyecto.
const csvFileName = 'AGEEML_20251021629312.csv'; // <-- ¡IMPORTANTE! Cambia esto por el nombre exacto de tu archivo.
const outputFilePath = path.join(__dirname, 'src', 'data', 'mexico-locations.js');
const csvFilePath = path.join(__dirname, csvFileName);

// Nombres de las columnas en el archivo CSV del INEGI.
const STATE_COLUMN_NAME = 'NOM_ENT';
const MUNICIPALITY_COLUMN_NAME = 'NOM_MUN';
// --- FIN DE CONFIGURACIÓN ---

console.log('🚀 Iniciando la generación del archivo de ubicaciones...');

if (!fs.existsSync(csvFilePath)) {
    console.error(`\n❌ ¡Error! No se encontró el archivo CSV en la ruta: ${csvFilePath}`);
    console.error(`   Asegúrate de que el archivo "${csvFileName}" esté en la raíz de tu proyecto.`);
    process.exit(1); // Termina el script si el archivo no existe.
}

try {
    // Leemos el contenido del archivo CSV. El INEGI suele usar codificación 'latin1' para acentos y 'ñ'.
    const csvData = fs.readFileSync(csvFilePath, 'latin1');
    const lines = csvData.split('\n');

    if (lines.length < 2) {
        throw new Error("El archivo CSV está vacío o no tiene encabezados.");
    }

    // Obtenemos los encabezados y encontramos los índices de nuestras columnas.
    const headers = lines[0].trim().split(',');
    const stateIndex = headers.indexOf(STATE_COLUMN_NAME);
    const municipalityIndex = headers.indexOf(MUNICIPALITY_COLUMN_NAME);

    if (stateIndex === -1 || municipalityIndex === -1) {
        throw new Error(`No se encontraron las columnas requeridas ('${STATE_COLUMN_NAME}', '${MUNICIPALITY_COLUMN_NAME}') en el archivo CSV.`);
    }

    console.log('✅ Encabezados encontrados. Procesando datos...');

    const locations = {};

    // Empezamos desde la línea 1 para saltar los encabezados.
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');

        // --- CORRECCIÓN DEFINITIVA PARA ACENTOS Y COMILLAS ---
        // 1. Obtenemos el valor crudo de la columna.
        let rawStateName = parts[stateIndex] || '';
        let rawMunicipalityName = parts[municipalityIndex] || '';

        // 2. Limpiamos las comillas que rodean el texto.
        rawStateName = rawStateName.replace(/^"|"$/g, '');
        rawMunicipalityName = rawMunicipalityName.replace(/^"|"$/g, '');

        // 3. Convertimos de 'latin1' a 'utf8' para manejar acentos correctamente.
        const stateName = Buffer.from(rawStateName, 'latin1').toString('utf8');
        const municipalityName = Buffer.from(rawMunicipalityName, 'latin1').toString('utf8');

        if (stateName && municipalityName) {
            // Si el estado no existe en nuestro objeto, lo creamos.
            if (!locations[stateName]) {
                locations[stateName] = new Set(); // Usamos un Set para evitar municipios duplicados automáticamente.
            }
            // Agregamos el municipio al Set del estado correspondiente.
            locations[stateName].add(municipalityName);
        }
    }

    // Convertimos el objeto de Sets a la estructura de array que necesitamos.
    const mexicoStatesArray = Object.keys(locations).sort((a, b) => a.localeCompare(b, 'es')).map(stateName => ({
        nombre: stateName,
        // Convertimos el Set de municipios a un array y lo ordenamos alfabéticamente
        // usando localeCompare para respetar los acentos en español.
        municipios: Array.from(locations[stateName]).sort((a, b) => a.localeCompare(b, 'es'))
    }));

    // Creamos el contenido final del archivo JS.
    const fileContent = `/**
 * Lista de estados y municipios de México.
 * Este archivo es generado automáticamente por el script 'generate-locations.js'.
 * No editar manualmente.
 *
 * Actualizado el: ${new Date().toISOString()}
 * Fuente: INEGI (https://www.inegi.org.mx/app/ageeml/)
 */
export const mexicoStates = ${JSON.stringify(mexicoStatesArray, null, 2)};
`;

    // Escribimos el archivo final.
    // --- CORRECCIÓN ---
    // Aseguramos que el archivo de salida se escriba con codificación UTF-8,
    // que es el estándar para la web y preserva correctamente los acentos.
    fs.writeFileSync(outputFilePath, fileContent, { encoding: 'utf8' });

    console.log(`\n🎉 ¡Éxito! Archivo de ubicaciones guardado en: ${outputFilePath}`);
    console.log(`   Se procesaron ${mexicoStatesArray.length} estados.`);

} catch (error) {
    console.error('\n❌ Ocurrió un error durante la generación del archivo:', error);
}