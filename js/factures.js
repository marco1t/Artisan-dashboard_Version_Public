/**
 * Factures Module - Gestion des factures
 * Avec toggle graphique Statuts / Clients
 */

const FacturesModule = {
    lineChart: null,
    pieChart: null,
    currentChartView: 'clients', // 'status' ou 'clients'
    selectedYear: 2025, // Année sélectionnée par défaut
    statViewMode2025: 'net', // 'net' ou 'total' pour le mode 2025

    /**
     * Initialise le module Factures
     */
    init() {
        this.form = document.getElementById('facture-form');
        // this.numeroInput = document.getElementById('facture-numero'); // Removed
        this.clientInput = document.getElementById('facture-client');
        this.montantInput = document.getElementById('facture-montant');
        this.dateInput = document.getElementById('facture-date');
        this.descriptionInput = document.getElementById('facture-description');
        this.tableBody = document.querySelector('#facture-table tbody');
        this.emptyMessage = document.getElementById('facture-empty');

        // Filtres
        this.filterMonth = document.getElementById('facture-filter-month');
        this.filterStatus = document.getElementById('facture-filter-status');

        // Toggle Année
        this.yearToggle = document.getElementById('facture-year-toggle');
        this.statsYearDisplay = document.getElementById('facture-stats-year');

        // Stats
        this.totalDisplay = document.getElementById('facture-total');
        this.netDisplay = document.getElementById('facture-net');
        this.paidDisplay = document.getElementById('facture-paid');
        this.pendingDisplay = document.getElementById('facture-pending');
        this.statsToggleBtn = document.getElementById('facture-stats-toggle');

        // Toggle graphique
        this.chartToggle = document.getElementById('chart-toggle');
        this.pieChartTitle = document.getElementById('pie-chart-title');

        this.setDefaultDate();

        // Initialiser de base sur le mois actuel pour l'année en cours
        if (this.selectedYear === new Date().getFullYear() && this.filterMonth) {
            this.filterMonth.value = (new Date().getMonth() + 1).toString();
        }

        this.bindEvents();
        this.render();
    },

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
    },

    bindEvents() {
        this.form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addFacture();
        });

        this.filterMonth?.addEventListener('change', () => this.render());
        this.filterStatus?.addEventListener('change', () => this.render());

        // Gestion du toggle année
        if (this.yearToggle) {
            const circles = this.yearToggle.querySelectorAll('.year-circle');
            circles.forEach(circle => {
                circle.addEventListener('click', () => {
                    // Update selection
                    this.selectedYear = parseInt(circle.dataset.year);

                    // Update UI circles
                    circles.forEach(c => c.classList.remove('active'));
                    circle.classList.add('active');

                    // Update Stats Title
                    if (this.statsYearDisplay) {
                        this.statsYearDisplay.textContent = this.selectedYear;
                    }

                    // Reset du mois pour afficher l'année complète lors d'un changement
                    if (this.filterMonth) {
                        this.filterMonth.value = "";
                    }

                    // Refresh data
                    this.render();
                });
            });
        }

        // Toggle graphique
        if (this.chartToggle) {
            const buttons = this.chartToggle.querySelectorAll('.chart-toggle-btn');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentChartView = btn.dataset.view;

                    // Mettre à jour le titre
                    if (this.pieChartTitle) {
                        this.pieChartTitle.textContent = this.currentChartView === 'status'
                            ? '💰 Répartition paiements'
                            : '👥 Facturations par client';
                    }

                    this.updatePieChart();
                });
            });
        }

        // Click sur le bouton toggle pour stat détails
        if (this.statsToggleBtn) {
            this.statsToggleBtn.addEventListener('click', () => {
                this.toggleDetailsView();
            });
        }
    },

    async addFacture() {
        // Génération automatique d'un ID temporaire ou séquentiel si besoin, 
        // ou simplement "AUTO" car l'affichage utilise le compteur dynamique.
        const numero = "FAC-" + Date.now().toString().slice(-6);
        const client = this.clientInput.value.trim();
        const montant = parseFloat(this.montantInput.value);
        const date = this.dateInput.value;
        const description = this.descriptionInput.value.trim();

        if (!client || isNaN(montant) || !date) {
            App.showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        await Storage.add(Storage.KEYS.FACTURES, {
            numero,
            client,
            montant,
            date,
            description,
            status: 'pending'
        });

        if (this.form) this.form.reset();
        this.setDefaultDate();
        await this.render();
        App?.showToast?.('Facture ajoutée avec succès', 'success');
    },

    async updateStatus(id, status) {
        await Storage.update(Storage.KEYS.FACTURES, id, { status });
        await this.render();
        App.showToast(`Facture marquée comme ${status === 'paid' ? 'payée' : 'en attente'}`, 'success');
    },

    async deleteFacture(id) {
        if (confirm('Supprimer cette facture ?')) {
            await Storage.delete(Storage.KEYS.FACTURES, id);
            await this.render();
            App.showToast('Facture supprimée', 'success');
        }
    },

    async render() {
        let allFactures = await Storage.get(Storage.KEYS.FACTURES);

        // --- PRE-CALCUL DES INDEXES (N°1, N°2...) ---
        // On trie toutes les factures par date pour avoir l'ordre chronologique correct
        const sortedAllFactures = [...allFactures].sort((a, b) => new Date(a.date) - new Date(b.date));
        const clientCounts = {};
        const factureIndexes = {};

        sortedAllFactures.forEach(f => {
            const clientName = f.client.trim();
            // On ignore les virtuelles si jamais elles sont persistées
            if (!f.isVirtual) {
                if (!clientCounts[clientName]) clientCounts[clientName] = 0;
                clientCounts[clientName]++;
                factureIndexes[f.id] = clientCounts[clientName];
            }
        });

        // --- LOGIQUE METIER SPECIALE ---
        // (Ancienne logique SEO supprimée pour la version publique)

        // Filtrer par année sélectionnée
        let yearFactures = allFactures.filter(f => {
            const date = new Date(f.date);
            return date.getFullYear() === this.selectedYear;
        });

        this.currentYearFactures = yearFactures;

        // Filtrer pour le tableau
        let tableFactures = [...yearFactures];
        const filterMonth = this.filterMonth.value;
        const filterStatus = this.filterStatus.value;

        if (filterMonth) {
            tableFactures = tableFactures.filter(f => {
                const date = new Date(f.date);
                return (date.getMonth() + 1) === parseInt(filterMonth);
            });
        }

        if (filterStatus) {
            tableFactures = tableFactures.filter(f => f.status === filterStatus);
        }

        // Trier par date décroissante
        tableFactures.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (this.tableBody) this.tableBody.innerHTML = '';

        if (tableFactures.length === 0) {
            if (this.emptyMessage) this.emptyMessage.style.display = 'block';
            const tableElement = document.getElementById('facture-table');
            if (tableElement) tableElement.style.display = 'none';
        } else {
            if (this.emptyMessage) this.emptyMessage.style.display = 'none';
            const tableElement = document.getElementById('facture-table');
            if (tableElement) tableElement.style.display = 'table';

            // NOTE: On a déjà calculé factureIndexes plus haut.

            tableFactures.forEach(facture => {
                const row = document.createElement('tr');
                const date = new Date(facture.date);
                const statusClass = facture.status === 'paid' ? 'status-paid' : 'status-pending';
                const statusText = facture.status === 'paid' ? 'Payée' : 'En attente';
                const toggleStatus = facture.status === 'paid' ? 'pending' : 'paid';
                const toggleText = facture.status === 'paid' ? 'En attente' : 'Payée';

                // Gestion affichage N° Facture
                let numeroDisplay;
                if (facture.isVirtual) {
                    // C'est déjà formaté dans l'objet : "N°9 (Retenue)"
                    numeroDisplay = `<strong>${facture.numero}</strong>`;
                } else {
                    const clientIndex = factureIndexes[facture.id] || '?';
                    numeroDisplay = `N°${clientIndex}`;
                }

                // Actions (Désactivées pour virtuel)
                let actionsHtml = '';
                if (!facture.isVirtual) {
                    actionsHtml = `
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-success" onclick="FacturesModule.updateStatus('${facture.id}', '${toggleStatus}')">
                                ${toggleText}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="FacturesModule.deleteFacture('${facture.id}')">
                                Supprimer
                            </button>
                        </div>
                    `;
                } else {
                    actionsHtml = `<span style="color:var(--text-muted); font-size:0.8rem; font-style:italic;">Automatique</span>`;
                }

                row.innerHTML = `
                    <td><strong>${numeroDisplay}</strong></td>
                    <td>${facture.client}</td>
                    <td><strong>${this.formatCurrency(facture.montant)}</strong></td>
                    <td class="hide-mobile">${date.toLocaleDateString('fr-FR')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="admin-only">${actionsHtml}</td>
                `;
                if (this.tableBody) this.tableBody.appendChild(row);
            });
        }

        await this.updateStats(yearFactures);
        this.renderChart(yearFactures);
    },

    toggleDetailsView() {
        const statsCard = this.totalDisplay?.closest('.stats-card');
        if (!statsCard) return;

        let detailsPanel = statsCard.querySelector('.calc-details-panel');

        if (!detailsPanel) {
            detailsPanel = document.createElement('div');
            detailsPanel.className = 'calc-details-panel';
            detailsPanel.style.marginTop = '20px';
            detailsPanel.style.padding = '15px';
            detailsPanel.style.background = 'rgba(255, 255, 255, 0.05)';
            detailsPanel.style.borderRadius = '12px';
            detailsPanel.style.textAlign = 'left';
            detailsPanel.style.fontSize = '0.9rem';
            detailsPanel.style.lineHeight = '1.6';
            statsCard.appendChild(detailsPanel);
        }

        if (detailsPanel.style.display === 'none' || !detailsPanel.style.display) {
            if (this.rawHtmlCalculationDetail) {
                detailsPanel.innerHTML = this.rawHtmlCalculationDetail;
            }
            detailsPanel.style.display = 'block';
            if (this.statsToggleBtn) this.statsToggleBtn.innerHTML = '<span>🔙 Masquer le détail</span>';
        } else {
            detailsPanel.style.display = 'none';
            if (this.statsToggleBtn) {
                this.statsToggleBtn.innerHTML = this.selectedYear === 2025
                    ? '<span>🔎 Voir le détail du calcul</span>'
                    : '<span>🔎 Voir les détails</span>';
            }
        }
    },

    async updateStats(factures) {
        // Appliquer le filtre mensuel sur les statistiques
        const filterMonthVal = this.filterMonth ? this.filterMonth.value : "";
        let relevantFactures = factures;

        if (filterMonthVal) {
            const filterMonthInt = parseInt(filterMonthVal);
            relevantFactures = factures.filter(f => new Date(f.date).getMonth() + 1 === filterMonthInt);
        }

        const totalRaw = relevantFactures.reduce((sum, f) => sum + f.montant, 0);
        const totalVirtual = relevantFactures.filter(f => f.isVirtual).reduce((sum, f) => sum + f.montant, 0);
        const totalReal = totalRaw - totalVirtual;

        // Le Total affiché = uniquement le vrai brut global (incluant les retenues) car il doit être logiquement supérieur au bénéfice net
        const total = totalRaw;

        const paid = relevantFactures.filter(f => f.status === 'paid' && !f.isVirtual).reduce((sum, f) => sum + f.montant, 0);

        // Pending = toutes les factures en attente (sans les retenues virtuelles, qui apparaitront en détail)
        const pending = relevantFactures.filter(f => f.status === 'pending' && !f.isVirtual).reduce((sum, f) => sum + f.montant, 0);

        // Calcul du BÉNÉFICE NET
        const urssafDeclarations = await Storage.get(Storage.KEYS.URSSAF);
        let yearUrssaf = urssafDeclarations.filter(d => d.year === this.selectedYear);
        if (filterMonthVal) {
            yearUrssaf = yearUrssaf.filter(d => parseInt(d.month) === parseInt(filterMonthVal));
        }
        const totalUrssafPaid = yearUrssaf.reduce((sum, d) => sum + (d.paidAmount || 0), 0);

        // Déductions Spécifiques
        // 1. Assurance Décennale
        let decennaleDeduction = 0;
        let decennaleMonths = 10;

        if (this.selectedYear === 2025) {
            decennaleDeduction = filterMonthVal ? (5257.28 / 10) : 5257.28;
            decennaleMonths = filterMonthVal ? 1 : 10;
        } else if (this.selectedYear === 2026) {
            const currentMonth = new Date().getMonth() + 1;
            if (filterMonthVal) {
                const monthInt = parseInt(filterMonthVal);
                decennaleMonths = (monthInt <= 10) ? 1 : 0;
            } else {
                decennaleMonths = Math.min(currentMonth, 10);
            }
            decennaleDeduction = 525.73 * decennaleMonths;
        }

        // Bénéfice Net (Calcul basé sur TOUT facturé brut)
        let netBenefit = totalRaw - totalUrssafPaid - decennaleDeduction;

        if (this.totalDisplay) {
            this.totalDisplay.textContent = this.formatCurrency(total);
        }
        if (this.netDisplay) {
            this.netDisplay.textContent = this.formatCurrency(netBenefit);
        }
        if (this.paidDisplay) {
            this.paidDisplay.textContent = this.formatCurrency(paid);
        }

        if (this.pendingDisplay) {
            this.pendingDisplay.textContent = this.formatCurrency(pending);
            const pendingItem = this.pendingDisplay.parentElement;
            if (pendingItem) {
                let virtualDetails = pendingItem.querySelector('.virtual-details-pending');
                if (virtualDetails) {
                    virtualDetails.style.display = 'none';
                }
            }
        }

        const statsCard = this.totalDisplay?.closest('.stats-card');
        const facturesSection = document.getElementById('factures');

        if (statsCard) {
            const totalItem = this.totalDisplay.parentElement;
            const netItem = this.netDisplay.parentElement;
            const paidItem = this.paidDisplay.parentElement;
            const pendingItem = this.pendingDisplay.parentElement;

            // Masquer d'office le panneau de détails au chargement/changement d'année
            const detailsPanel = statsCard.querySelector('.calc-details-panel');
            if (detailsPanel) {
                detailsPanel.style.display = 'none';
            }

            if (this.selectedYear === 2025) {
                this.rawHtmlCalculationDetail = `
                    <div style="margin-bottom: 8px;"><strong>Total Facturé :</strong> ${this.formatCurrency(totalRaw)}</div>
                    <div style="margin-bottom: 8px; color: var(--accent-danger);"><strong>- URSSAF Payé :</strong> ${this.formatCurrency(totalUrssafPaid)}</div>
                    <div style="margin-bottom: 8px; color: var(--accent-danger);"><strong>- Frais pro. :</strong> ${this.formatCurrency(decennaleDeduction)}</div>
                    <hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;">
                    <div style="color: var(--accent-success); font-size: 1.1rem;"><strong>= Bénéfice Net :</strong> ${this.formatCurrency(netBenefit)}</div>
                `;

                if (facturesSection) facturesSection.classList.add('layout-2025');

                statsCard.classList.add('single-stat-mode');
                statsCard.style.cursor = 'default';

                if (paidItem) paidItem.style.display = 'none';
                if (pendingItem) pendingItem.style.display = 'none';

                if (this.statsToggleBtn) {
                    this.statsToggleBtn.style.display = 'flex';
                    this.statsToggleBtn.innerHTML = '<span>🔎 Voir le détail du calcul</span>';
                }

                if (netItem) netItem.style.display = 'flex';
                if (totalItem) totalItem.style.display = 'none';

                if (this.currentChartView !== 'clients') {
                    this.currentChartView = 'clients';
                }

                if (this.chartToggle) {
                    this.chartToggle.style.display = 'none';
                }

                if (this.pieChartTitle) this.pieChartTitle.textContent = '👥 Facturations par client';

            } else {
                const periodLengthText = filterMonthVal ? "1 mois" : `${decennaleMonths} mois`;
                const titleDetail = filterMonthVal ? `Détail du mois ${filterMonthVal.padStart(2, '0')}/${this.selectedYear}` : `Détail de l'année ${this.selectedYear}`;

                this.rawHtmlCalculationDetail = `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Revenus Générés - ${titleDetail}</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Factures classiques acquises :</span>
                            <strong>${this.formatCurrency(totalReal)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; color: rgba(239, 68, 68, 0.9);">
                            <span>+ Retenues importées (Garanties) :</span>
                            <strong>${this.formatCurrency(totalVirtual)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                            <span>= Total Brut Facturé :</span>
                            <span style="color: var(--text-primary);">${this.formatCurrency(totalRaw)}</span>
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                        <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Déductions & Bénéfice</div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: var(--accent-warning);">
                            <span>- URSSAF Payé :</span>
                            <strong>${this.formatCurrency(totalUrssafPaid)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; color: var(--accent-warning);">
                            <span>- Décennale (${decennaleMonths} mois x 525,73€) :</span>
                            <strong>${this.formatCurrency(decennaleDeduction)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.15rem; color: var(--accent-success); border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                            <span>= Bénéfice Net :</span>
                            <span>${this.formatCurrency(netBenefit)}</span>
                        </div>
                    </div>
                `;

                if (facturesSection) facturesSection.classList.remove('layout-2025');

                statsCard.classList.remove('single-stat-mode');
                statsCard.style.cursor = 'default';

                if (this.statsToggleBtn) {
                    this.statsToggleBtn.style.display = 'flex';
                    this.statsToggleBtn.innerHTML = '<span>🔎 Voir les détails</span>';
                }

                if (totalItem) totalItem.style.display = 'flex';
                if (netItem) netItem.style.display = 'flex';
                if (paidItem) paidItem.style.display = 'flex';
                if (pendingItem) pendingItem.style.display = 'flex';

                if (this.chartToggle) {
                    this.chartToggle.style.display = 'flex';
                }

                if (this.pieChartTitle) {
                    this.pieChartTitle.textContent = this.currentChartView === 'status'
                        ? '💰 Répartition paiements'
                        : '👥 Facturations par client';
                }

                const btnClients = this.chartToggle.querySelector('[data-view="clients"]');
                const btnStatus = this.chartToggle.querySelector('[data-view="status"]');
                if (btnClients && btnStatus) {
                    if (this.currentChartView === 'status') {
                        btnClients.classList.remove('active');
                        btnStatus.classList.add('active');
                    } else {
                        btnStatus.classList.remove('active');
                        btnClients.classList.add('active');
                    }
                }
            }
        }

        this.updatePieChart();
    },

    updatePieChart() {
        let factures = this.currentYearFactures || [];
        const filterMonthVal = this.filterMonth ? this.filterMonth.value : "";
        if (filterMonthVal) {
            const filterMonthInt = parseInt(filterMonthVal);
            factures = factures.filter(f => new Date(f.date).getMonth() + 1 === filterMonthInt);
        }

        if (this.currentChartView === 'status') {
            const paid = factures.filter(f => f.status === 'paid' && !f.isVirtual).reduce((sum, f) => sum + f.montant, 0);
            const pending = factures.filter(f => f.status === 'pending' && !f.isVirtual).reduce((sum, f) => sum + f.montant, 0);
            const retenues = factures.filter(f => f.isVirtual).reduce((sum, f) => sum + f.montant, 0);
            this.renderStatusPieChart(paid, pending, retenues);
        } else {
            this.renderClientsPieChart(factures);
        }
    },

    renderChart(factures) {
        const ctx = document.getElementById('facture-chart');
        if (!ctx) return;

        const currentYear = this.selectedYear;
        const monthlyData = new Array(12).fill(0);
        const monthlyPaid = new Array(12).fill(0);
        const monthlyRetenues = new Array(12).fill(0);

        factures.forEach(f => {
            const date = new Date(f.date);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth();
                if (f.isVirtual) {
                    monthlyRetenues[month] += f.montant;
                } else {
                    monthlyData[month] += f.montant;
                }

                if (f.status === 'paid' && !f.isVirtual) {
                    monthlyPaid[month] += f.montant;
                }
            }
        });

        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        if (this.lineChart) this.lineChart.destroy();

        const datasets = [
            {
                label: 'Total facturé',
                data: monthlyData,
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 0,
                borderRadius: 8,
                order: 2
            },
            {
                label: 'Payé',
                data: monthlyPaid,
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 0,
                borderRadius: 8,
                hidden: this.selectedYear === 2025,
                order: 3
            },
            {
                label: 'Retenues',
                data: monthlyRetenues,
                backgroundColor: 'rgba(239, 68, 68, 0.85)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 0,
                borderRadius: 8,
                hidden: this.selectedYear === 2025,
                order: 4
            }
        ];

        this.lineChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: datasets
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
                            label: (ctx) => ' ' + ctx.dataset.label + ' : ' + this.formatCurrency(ctx.raw)
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
                            callback: (v) => v + ' €'
                        }
                    }
                }
            }
        });
    },

    renderStatusPieChart(paid, pending, retenues = 0) {
        const ctx = document.getElementById('facture-pie-chart');
        if (!ctx) return;

        if (this.pieChart) this.pieChart.destroy();

        const labels = ['Payé', 'En attente'];
        const data = [paid, pending];
        const bgColors = ['rgba(16, 185, 129, 0.9)', 'rgba(245, 158, 11, 0.9)'];
        const borderColors = ['rgba(11, 14, 20, 1)', 'rgba(11, 14, 20, 1)'];

        if (retenues > 0) {
            labels.push('Retenues');
            data.push(retenues);
            bgColors.push('rgba(239, 68, 68, 0.9)');
            borderColors.push('rgba(11, 14, 20, 1)');
        }

        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 4,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                layout: { padding: 10 },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            padding: 20,
                            font: { size: 13, family: "'Inter', sans-serif" }
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
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                                return ` ${ctx.label}: ${this.formatCurrency(ctx.raw)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    renderClientsPieChart(factures) {
        const ctx = document.getElementById('facture-pie-chart');
        if (!ctx) return;

        // Grouper par client
        const clientTotals = {};
        factures.forEach(f => {
            const clientName = f.client || 'Inconnu';
            if (!clientTotals[clientName]) {
                clientTotals[clientName] = 0;
            }
            clientTotals[clientName] += f.montant;
        });

        // Trier par montant décroissant
        const sortedClients = Object.entries(clientTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Max 10 clients

        const labels = sortedClients.map(c => c[0]);
        const data = sortedClients.map(c => c[1]);

        // Couleurs variées
        const colors = [
            'rgba(99, 102, 241, 0.8)',
            'rgba(34, 211, 238, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(20, 184, 166, 0.8)'
        ];

        if (this.pieChart) this.pieChart.destroy();

        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderColor: 'rgba(11, 14, 20, 1)',
                    borderWidth: 4,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                layout: { padding: 10 },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.9)',
                            padding: 20,
                            font: { size: 13, family: "'Inter', sans-serif" }
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
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                                return ` ${ctx.label}: ${this.formatCurrency(ctx.raw)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    }
};

window.FacturesModule = FacturesModule;
