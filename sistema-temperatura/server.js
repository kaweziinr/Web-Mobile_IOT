const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Inicialização do Firebase Admin SDK
const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(bodyParser.json());
app.use(express.static('public'));

// Função para obter início e fim do dia em UTC-3
function getStartAndEndOfDayUTC3(date) {
    // Ajusta para UTC-3 (equivalente a subtrair 3 horas)
    const startOfDay = new Date(date.getTime() - 3 * 60 * 60 * 1000); // 3 horas a menos
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date.getTime() - 3 * 60 * 60 * 1000); // 3 horas a menos
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
}

// Endpoint para verificar dados em um intervalo de data e hora
app.post('/verificar', async (req, res) => {
    let { dataHora, hora } = req.body;

    console.log("Data recebida:", dataHora);
    console.log("Hora recebida:", hora);

    const date = new Date(dataHora);
    const { startOfDay, endOfDay } = getStartAndEndOfDayUTC3(date);

    console.log("Intervalo de consulta (UTC-3):", {
        inicio: startOfDay.toISOString(),
        fim: endOfDay.toISOString()
    });

    try {
        // Consulta para buscar documentos em um intervalo de data e hora
        const snapshot = await db.collection('SensorData')
            .where('date', '>=', startOfDay.toISOString())
            .where('date', '<=', endOfDay.toISOString())
            .get();

        if (snapshot.empty) {
            console.log("Nenhum dado encontrado para a data e hora selecionadas.");
            return res.status(404).json({ message: 'Nenhum dado encontrado para a data e hora selecionadas.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const item = doc.data();
            console.log("Documento encontrado:", item);

            // Extrai a data e hora do documento e ajusta para UTC-3
            const docDate = new Date(item.date).toISOString().split('T')[0]; // Data no formato 'YYYY-MM-DD'
            const docHour = item.time; // Presumindo que 'time' está no formato 'HH:mm:ss'

            // Extrai a data e hora do input
            const inputDate = new Date(dataHora).toISOString().split('T')[0]; // Data no formato 'YYYY-MM-DD'
            const inputHour = hora; // Já está no formato 'HH:mm:ss'

            // Verifica se a data e hora do documento correspondem à data e hora recebidas
            if (docDate === inputDate && docHour === inputHour) {
                item.date = item.date || '';
                item.time = item.time || '';
                item.temp = item.temp || '';
                item.hmd = item.hmd || '';

                data.push(item);
            }
        });

        if (data.length === 0) {
            console.log("Nenhum dado encontrado para a hora especificada.");
            return res.status(404).json({ message: 'Nenhum dado encontrado para a hora especificada.' });
        }

        console.log("Dados retornados:", data);
        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para ver todos os dados da coleção 'SensorData'
app.get('/ver-todos', async (req, res) => {
    try {
        const snapshot = await db.collection('SensorData')
            .orderBy('date')
            .get();

        if (snapshot.empty) {
            console.log("Nenhum dado encontrado.");
            return res.status(404).json({ message: 'Nenhum dado encontrado.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const item = doc.data();
            console.log("Documento encontrado:", item);

            item.date = item.date || '';
            item.time = item.time || '';
            item.temp = item.temp || '';
            item.hmd = item.hmd || '';

            data.push(item);
        });

        console.log("Dados retornados:", data);
        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar todos os dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
