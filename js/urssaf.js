/**
 * URSSAF Module - Gestion des déclarations URSSAF
 * Version avec sélecteur d'année par cercles (2025/2026 uniquement)
 */

const UrssafModule = {
    monthNames: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    chart: null,
    selectedYear: 2025, // Année par défaut

    /**
     * Initialise le module URSSAF
     */
    init() {
        this.form = document.getElementById('urssaf-form');
        this.monthSelect = document.getElementById('urssaf-month');
        this.yearInput = document.getElementById('urssaf-year');
        this.amountInput = document.getElementById('urssaf-amount');
        this.paidAmountInput = document.getElementById('urssaf-paid-amount');
        this.tableBody = document.querySelector('#urssaf-table tbody');
        this.emptyMessage = document.getElementById('urssaf-empty');
        this.totalDisplay = document.getElementById('urssaf-total');
        this.totalPaidDisplay = document.getElementById('urssaf-total-paid');
        this.countDisplay = document.getElementById('urssaf-count');
        this.yearDisplay = document.getElementById('urssaf-year-display');
        this.summaryYear = document.getElementById('urssaf-summary-year');
        this.formYearDisplay = document.getElementById('form-year-display');
        this.yearToggle = document.getElementById('year-toggle');

        this.bindEvents();
        this.render();
    },

    /**
     * Attache les événements
     */
    bindEvents() {
        // Formulaire de soumission
        this.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addDeclaration();
        });

        // Gestion des cercles d'année
        if (this.yearToggle) {
            const circles = this.yearToggle.querySelectorAll('.year-circle');
            circles.forEach(circle => {
                circle.addEventListener('click', () => {
                    // Mettre à jour l'année sélectionnée
                    this.selectedYear = parseInt(circle.dataset.year);

                    // Mettre à jour l'apparence des cercles
                    circles.forEach(c => c.classList.remove('active'));
                    circle.classList.add('active');

                    // Mettre à jour le formulaire
                    this.yearInput.value = this.selectedYear;
                    this.formYearDisplay.textContent = this.selectedYear;

                    // Rafraîchir l'affichage
                    this.render();
                });
            });
        }
    },

    /**
     * Ajoute une nouvelle déclaration
     */
    async addDeclaration() {
        const month = parseInt(this.monthSelect.value);
        const year = this.selectedYear;
        const amount = parseFloat(this.amountInput.value);
        const paidAmount = parseFloat(this.paidAmountInput.value);

        if (!month || isNaN(amount) || isNaN(paidAmount)) {
            App.showToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        // Vérifier si une déclaration existe déjà pour ce mois/année
        const declarations = await Storage.get(Storage.KEYS.URSSAF);
        const exists = declarations.find(d => d.month === month && d.year === year);

        if (exists) {
            App.showToast('Une déclaration existe déjà pour ce mois', 'warning');
            return;
        }

        await Storage.add(Storage.KEYS.URSSAF, {
            month,
            year,
            amount,
            paidAmount,
            declaredAt: new Date().toISOString()
        });

        this.form.reset();
        await this.render();
        App.showToast('Déclaration ajoutée avec succès', 'success');
    },

    /**
     * Supprime une déclaration
     * @param {string} id - ID de la déclaration
     */
    async deleteDeclaration(id) {
        if (confirm('Supprimer cette déclaration ?')) {
            await Storage.delete(Storage.KEYS.URSSAF, id);
            await this.render();
            App.showToast('Déclaration supprimée', 'success');
        }
    },

    /**
     * Affiche les déclarations dans le tableau (filtrées par année sélectionnée)
     */
    async render() {
        const allDeclarations = await Storage.get(Storage.KEYS.URSSAF);

        // Filtrer par année sélectionnée
        const declarations = allDeclarations.filter(d => d.year === this.selectedYear);

        // Trier par mois décroissant
        declarations.sort((a, b) => b.month - a.month);

        this.tableBody.innerHTML = '';

        // Mettre à jour les affichages d'année
        if (this.yearDisplay) this.yearDisplay.textContent = this.selectedYear;
        if (this.summaryYear) this.summaryYear.textContent = this.selectedYear;

        if (declarations.length === 0) {
            if (this.emptyMessage) this.emptyMessage.style.display = 'block';
            const tableElement = document.getElementById('urssaf-table');
            if (tableElement) tableElement.style.display = 'none';
        } else {
            if (this.emptyMessage) this.emptyMessage.style.display = 'none';
            const tableElement = document.getElementById('urssaf-table');
            if (tableElement) tableElement.style.display = 'table';

            declarations.forEach(decl => {
                const row = document.createElement('tr');
                const declDate = new Date(decl.declaredAt || decl.createdAt);

                row.innerHTML = `
                    <td>${this.monthNames[decl.month - 1]}</td>
                    <td class="hide-mobile">${decl.year}</td>
                    <td><strong>${this.formatCurrency(decl.amount)}</strong></td>
                    <td><strong class="text-success">${this.formatCurrency(decl.paidAmount || 0)}</strong></td>
                    <td class="hide-mobile">${declDate.toLocaleDateString('fr-FR')}</td>
                    <td class="admin-only">
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-danger" onclick="UrssafModule.deleteDeclaration('${decl.id}')">
                                Supprimer
                            </button>
                        </div>
                    </td>
                `;
                if (this.tableBody) this.tableBody.appendChild(row);
            });
        }

        await this.updateStats(allDeclarations);
    },

    /**
     * Met à jour les statistiques
     */
    async updateStats(allDeclarations) {
        const yearDeclarations = allDeclarations.filter(d => d.year === this.selectedYear);

        const total = yearDeclarations.reduce((sum, d) => sum + d.amount, 0);
        const totalPaid = yearDeclarations.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
        const count = yearDeclarations.length;

        if (this.totalDisplay) this.totalDisplay.textContent = this.formatCurrency(total);
        if (this.totalPaidDisplay) {
            this.totalPaidDisplay.textContent = this.formatCurrency(totalPaid);
            // Colorier en vert si tout est payé ou plus
            if (totalPaid >= total && total > 0) {
                this.totalPaidDisplay.classList.add('text-success');
            } else {
                this.totalPaidDisplay.classList.remove('text-success');
            }
        }
        if (this.countDisplay) this.countDisplay.textContent = `${count}/12`;

        // Mettre à jour le graphique
        this.renderChart(yearDeclarations);
    },

    /**
     * Affiche le graphique des déclarations
     */
    async renderChart(declarations) {
        const ctx = document.getElementById('urssaf-chart');
        if (!ctx) return;

        // Récupérer les factures pour le calcul du total facturé
        const factures = await Storage.get(Storage.KEYS.FACTURES);
        const monthlyInvoiced = new Array(12).fill(0);

        factures.forEach(f => {
            const date = new Date(f.date);
            if (date.getFullYear() === this.selectedYear) {
                monthlyInvoiced[date.getMonth()] += f.montant;
            }
        });

        const monthlyData = new Array(12).fill(0);
        const monthlyPaidData = new Array(12).fill(0);

        declarations.forEach(d => {
            monthlyData[d.month - 1] = d.amount;
            monthlyPaidData[d.month - 1] = d.paidAmount || 0;
        });

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.monthNames,
                datasets: [
                    {
                        label: 'Total Facturé',
                        data: monthlyInvoiced,
                        backgroundColor: 'rgba(59, 130, 246, 0.85)', // Blue
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 0,
                        borderRadius: 8
                    },
                    {
                        label: 'Déclaré',
                        data: monthlyData,
                        backgroundColor: 'rgba(139, 92, 246, 0.85)', // Purple
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 0,
                        borderRadius: 8
                    },
                    {
                        label: 'Payé',
                        data: monthlyPaidData,
                        backgroundColor: 'rgba(16, 185, 129, 0.85)', // Emerald/Green
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 0,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            font: { size: 14, family: "'Inter', sans-serif", weight: '600' },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        titleFont: { size: 14, family: "'Inter', sans-serif" },
                        bodyFont: { size: 14, family: "'Inter', sans-serif" },
                        padding: 16,
                        cornerRadius: 12,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => ` ${context.dataset.label} : ${this.formatCurrency(context.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 13, family: "'Inter', sans-serif" } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: { size: 13, family: "'Inter', sans-serif" },
                            callback: (value) => value + ' €'
                        }
                    }
                }
            }
        });
    },

    /**
     * Formate un nombre en devise
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
};

// Export pour utilisation globale
window.UrssafModule = UrssafModule;
