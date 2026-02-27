# Dashboard Artisan

Application web de gestion pour artisan avec 3 modules :

## 🛠️ Fonctionnalités

### 📋 URSSAF
- Déclarations mensuelles avec montants
- Historique et statistiques annuelles
- Graphique d'évolution des déclarations

### 📄 Factures
- Suivi des factures envoyées
- Filtrage par mois/année/statut
- Statut payé/en attente
- Graphiques de facturation mensuelle et répartition

### ✍️ Signature de Contrats
- Upload de PDF
- Extraction automatique du montant ("pour la somme globale et forfaitaire de...")
- Positionnement de signature par glisser-déposer
- Signature sauvegardée pour réutilisation
- Téléchargement du PDF signé

## 🚀 Installation

```bash
# Cloner le repo
git clone https://github.com/votre-username/artisan-dashboard.git

# Lancer le serveur
cd artisan-dashboard
npx serve . -l 3456
```

Ouvrir http://localhost:3456

## 📦 Technologies

- HTML5, CSS3, JavaScript ES6+
- [Chart.js](https://www.chartjs.org/) - Graphiques
- [PDF.js](https://mozilla.github.io/pdf.js/) - Affichage PDF
- [PDF-lib](https://pdf-lib.js.org/) - Modification PDF
- localStorage - Persistance données

## 🔒 Confidentialité

- Données stockées localement uniquement
- Meta `noindex, nofollow` pour éviter le référencement
