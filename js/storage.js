/**
 * Mock Storage Module for Portfolio (Public Version)
 * All Firebase logic is disconnected. Data is hardcoded.
 */

const mockData = {
    urssaf_declarations: [
        { id: 'u25_1', month: 1, year: 2025, amount: 4200, paidAmount: 924, createdAt: '2025-01-15T12:00:00.000Z' },
        { id: 'u25_2', month: 2, year: 2025, amount: 5800, paidAmount: 1276, createdAt: '2025-02-15T12:00:00.000Z' },
        { id: 'u25_3', month: 3, year: 2025, amount: 3900, paidAmount: 858, createdAt: '2025-03-15T12:00:00.000Z' },
        { id: 'u25_4', month: 4, year: 2025, amount: 6200, paidAmount: 1364, createdAt: '2025-04-15T12:00:00.000Z' },
        { id: 'u25_5', month: 5, year: 2025, amount: 4800, paidAmount: 1056, createdAt: '2025-05-15T12:00:00.000Z' },
        { id: 'u25_6', month: 6, year: 2025, amount: 7100, paidAmount: 1562, createdAt: '2025-06-15T12:00:00.000Z' },
        { id: 'u25_7', month: 7, year: 2025, amount: 5500, paidAmount: 1210, createdAt: '2025-07-15T12:00:00.000Z' },
        { id: 'u25_8', month: 8, year: 2025, amount: 4100, paidAmount: 902, createdAt: '2025-08-15T12:00:00.000Z' },
        { id: 'u25_9', month: 9, year: 2025, amount: 6800, paidAmount: 1496, createdAt: '2025-09-15T12:00:00.000Z' },
        { id: 'u25_10', month: 10, year: 2025, amount: 5200, paidAmount: 1144, createdAt: '2025-10-15T12:00:00.000Z' },
        { id: 'u25_11', month: 11, year: 2025, amount: 7400, paidAmount: 1628, createdAt: '2025-11-15T12:00:00.000Z' },
        { id: 'u25_12', month: 12, year: 2025, amount: 6100, paidAmount: 1342, createdAt: '2025-12-15T12:00:00.000Z' },
        { id: 'u26_1', month: 1, year: 2026, amount: 5300, paidAmount: 1166, createdAt: '2026-01-15T12:00:00.000Z' },
        { id: 'u26_2', month: 2, year: 2026, amount: 4700, paidAmount: 1034, createdAt: '2026-02-15T12:00:00.000Z' },
        { id: 'u26_3', month: 3, year: 2026, amount: 6000, paidAmount: 1320, createdAt: '2026-03-15T12:00:00.000Z' }
    ],

    factures: [
        // 2025
        { id: 'f25_1', number: 'F2025001', client: 'Boutique Dupont', montant: 4200, date: '2025-01-10T00:00:00.000Z', status: 'paid', description: 'Travaux peinture', createdAt: '2025-01-10T00:00:00.000Z' },
        { id: 'f25_2', number: 'F2025002', client: 'Maison Martin', montant: 5800, date: '2025-02-08T00:00:00.000Z', status: 'paid', description: 'Rénovation salle de bain', createdAt: '2025-02-08T00:00:00.000Z' },
        { id: 'f25_3', number: 'F2025003', client: 'Résidence Leclerc', montant: 3900, date: '2025-03-14T00:00:00.000Z', status: 'paid', description: 'Isolation toiture', createdAt: '2025-03-14T00:00:00.000Z' },
        { id: 'f25_4', number: 'F2025004', client: 'Boutique Dupont', montant: 6200, date: '2025-04-03T00:00:00.000Z', status: 'paid', description: 'Carrelage cuisine', createdAt: '2025-04-03T00:00:00.000Z' },
        { id: 'f25_5', number: 'F2025005', client: 'SCI Horizon', montant: 4800, date: '2025-05-20T00:00:00.000Z', status: 'paid', description: 'Travaux façade', createdAt: '2025-05-20T00:00:00.000Z' },
        { id: 'f25_6', number: 'F2025006', client: 'M. Bernard', montant: 7100, date: '2025-06-11T00:00:00.000Z', status: 'paid', description: 'Rénovation complète', createdAt: '2025-06-11T00:00:00.000Z' },
        { id: 'f25_7', number: 'F2025007', client: 'Maison Martin', montant: 5500, date: '2025-07-05T00:00:00.000Z', status: 'paid', description: 'Plomberie', createdAt: '2025-07-05T00:00:00.000Z' },
        { id: 'f25_8', number: 'F2025008', client: 'SCI Horizon', montant: 4100, date: '2025-08-18T00:00:00.000Z', status: 'paid', description: 'Pose parquet', createdAt: '2025-08-18T00:00:00.000Z' },
        { id: 'f25_9', number: 'F2025009', client: 'Résidence Leclerc', montant: 6800, date: '2025-09-09T00:00:00.000Z', status: 'paid', description: 'Électricité', createdAt: '2025-09-09T00:00:00.000Z' },
        { id: 'f25_10', number: 'F2025010', client: 'M. Bernard', montant: 5200, date: '2025-10-22T00:00:00.000Z', status: 'paid', description: 'Menuiserie', createdAt: '2025-10-22T00:00:00.000Z' },
        { id: 'f25_11', number: 'F2025011', client: 'Boutique Dupont', montant: 7400, date: '2025-11-07T00:00:00.000Z', status: 'paid', description: 'Réfection toiture', createdAt: '2025-11-07T00:00:00.000Z' },
        { id: 'f25_12', number: 'F2025012', client: 'SCI Horizon', montant: 6100, date: '2025-12-15T00:00:00.000Z', status: 'paid', description: 'Clôture chantier', createdAt: '2025-12-15T00:00:00.000Z' },
        // 2026
        { id: 'f26_1', number: 'F2026001', client: 'Maison Martin', montant: 5300, date: '2026-01-12T00:00:00.000Z', status: 'paid', description: 'Ravalement', createdAt: '2026-01-12T00:00:00.000Z' },
        { id: 'f26_2', number: 'F2026002', client: 'Résidence Leclerc', montant: 4700, date: '2026-02-05T00:00:00.000Z', status: 'paid', description: 'Isolation thermique', createdAt: '2026-02-05T00:00:00.000Z' },
        { id: 'f26_3', number: 'F2026003', client: 'SCI Horizon', montant: 6000, date: '2026-03-01T00:00:00.000Z', status: 'pending', description: 'Terrasse bois', createdAt: '2026-03-01T00:00:00.000Z' }
    ],

    signature_settings: []
};

function initFirebase() {
    window.dispatchEvent(new Event('firebaseReady'));
}

const Storage = {
    KEYS: {
        URSSAF: 'urssaf_declarations',
        FACTURES: 'factures',
        SIGNATURE: 'signature_settings'
    },

    async get(key) {
        return mockData[key] || [];
    },

    async add(key, item) {
        console.warn('Mode Portfolio : Ajout désactivé.');
        return { ...item, id: 'mock_new_id', createdAt: new Date().toISOString() };
    },

    async update(key, id, updates) {
        console.warn('Mode Portfolio : Modification désactivée.');
        return { id, ...updates };
    },

    async delete(key, id) {
        console.warn('Mode Portfolio : Suppression désactivée.');
        return true;
    },

    onSnapshot(key, callback) {
        callback(mockData[key] || []);
        return () => { };
    }
};

window.Storage = Storage;
