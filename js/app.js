/**
 * Application principale - Dashboard Artisan
 * Avec support Firebase et gestion de modes (Admin/Visiteur)
 */

const App = {
    currentMode: null, // 'admin' ou 'visitor'
    ADMIN_PASSWORD: 'root',

    /**
     * Initialise l'application
     */
    async init() {
        // Initialiser Firebase
        if (typeof initFirebase === 'function') {
            initFirebase();
        }

        // Configurer la sélection de mode
        this.setupModeSelection();
    },

    /**
     * Configure la sélection de mode
     */
    setupModeSelection() {
        const modeSelection = document.getElementById('mode-selection');
        const modeAdmin = document.getElementById('mode-admin');
        const modeVisitor = document.getElementById('mode-visitor');
        const passwordModal = document.getElementById('password-modal');
        const passwordInput = document.getElementById('admin-password');
        const passwordSubmit = document.getElementById('password-submit');
        const passwordCancel = document.getElementById('password-cancel');
        const passwordError = document.getElementById('password-error');
        const modeCards = document.querySelector('.mode-cards');

        // Clic sur mode Admin
        modeAdmin?.addEventListener('click', () => {
            modeCards?.classList.add('hidden');
            passwordModal?.classList.remove('hidden');
            passwordInput?.focus();
        });

        // Clic sur mode Visiteur
        modeVisitor?.addEventListener('click', () => {
            this.enterMode('visitor');
        });

        // Annuler mot de passe
        passwordCancel?.addEventListener('click', () => {
            passwordModal?.classList.add('hidden');
            modeCards?.classList.remove('hidden');
            if (passwordInput) passwordInput.value = '';
            passwordError?.classList.add('hidden');
        });

        // Valider mot de passe
        passwordSubmit?.addEventListener('click', () => {
            if (passwordInput) this.validatePassword(passwordInput.value);
        });

        // Enter sur le champ mot de passe
        passwordInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validatePassword(passwordInput.value);
            }
        });
    },

    /**
     * Valide le mot de passe admin
     */
    validatePassword(password) {
        const passwordError = document.getElementById('password-error');
        const passwordInput = document.getElementById('admin-password');

        if (password === this.ADMIN_PASSWORD) {
            this.enterMode('admin');
        } else {
            passwordError?.classList.remove('hidden');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();

                // Animation shake
                passwordInput.style.animation = 'shake 0.3s';
                setTimeout(() => passwordInput.style.animation = '', 300);
            }
        }
    },

    /**
     * Entre dans un mode
     */
    enterMode(mode) {
        this.currentMode = mode;

        // Cacher l'écran de sélection
        document.getElementById('mode-selection').classList.add('hidden');

        // Afficher l'app
        document.getElementById('app-container').classList.remove('hidden');

        // Appliquer le mode visiteur si nécessaire
        if (mode === 'visitor') {
            document.body.classList.add('visitor-mode');
        } else {
            document.body.classList.remove('visitor-mode');
        }

        // Mettre à jour l'affichage du mode
        const modeDisplay = document.getElementById('mode-display');
        if (modeDisplay) {
            modeDisplay.textContent = mode === 'admin' ? 'Mode: Roulem 👤' : 'Mode: Visiteur 👁️';
        }

        // Configurer la navigation et les modules
        this.setupNavigation();
        this.setupLogout();
        this.setupBackup();

        // Initialiser les modules
        UrssafModule.init();
        FacturesModule.init();
        if (mode === 'admin') {
            SignatureModule.init();
        }

        // Chart.js rend les graphiques quand le container est encore invisible (display:none).
        // On force un resize après que le navigateur a redessiné pour corriger les dimensions.
        requestAnimationFrame(() => {
            window.dispatchEvent(new Event('resize'));
        });
    },

    /**
     * Configure le bouton de déconnexion
     */
    setupLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    /**
     * Configure le bouton de sauvegarde
     */
    setupBackup() {
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.backupData();
            });
        }
    },

    /**
     * Exporte les données en JSON
     */
    async backupData() {
        try {
            const urssaf = await Storage.get(Storage.KEYS.URSSAF);
            const factures = await Storage.get(Storage.KEYS.FACTURES);

            const exportData = {
                urssaf: urssaf,
                factures: factures,
                exportDate: new Date().toISOString(),
                version: '1.2.0'
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "artisan_backup_" + new Date().toISOString().slice(0, 10) + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            this.showToast('Sauvegarde téléchargée avec succès', 'success');
        } catch (e) {
            console.error(e);
            this.showToast('Erreur lors de la sauvegarde', 'error');
        }
    },

    /**
     * Déconnexion - retour à l'écran de sélection
     */
    logout() {
        // Réinitialiser l'état
        this.currentMode = null;
        document.body.classList.remove('visitor-mode');

        // Cacher l'app
        document.getElementById('app-container').classList.add('hidden');

        // Afficher l'écran de sélection
        const modeSelection = document.getElementById('mode-selection');
        modeSelection.classList.remove('hidden');

        // Réinitialiser le modal mot de passe
        const passwordModal = document.getElementById('password-modal');
        const modeCards = document.querySelector('.mode-cards');
        const passwordInput = document.getElementById('admin-password');
        const passwordError = document.getElementById('password-error');

        passwordModal.classList.add('hidden');
        modeCards.classList.remove('hidden');
        passwordInput.value = '';
        passwordError.classList.add('hidden');

        // Réinitialiser la navigation à Factures
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === 'factures') {
                item.classList.add('active');
            }
        });
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            if (section.id === 'factures') {
                section.classList.add('active');
            }
        });
    },

    /**
     * Configure la navigation sidebar et mobile
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
        const sections = document.querySelectorAll('.section');

        // Fonction pour changer de section
        const switchSection = (targetSection) => {
            // En mode visiteur, ne pas permettre l'accès à signature
            if (this.currentMode === 'visitor' && targetSection === 'signature') {
                return;
            }

            // Mise à jour navigation desktop
            navItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector(`.nav-item[data-section="${targetSection}"]`)?.classList.add('active');

            // Mise à jour navigation mobile
            mobileNavItems.forEach(nav => nav.classList.remove('active'));
            document.querySelector(`.mobile-nav-item[data-section="${targetSection}"]`)?.classList.add('active');

            // Mise à jour sections
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });

            // Scroll vers le haut
            window.scrollTo(0, 0);
        };

        // Desktop sidebar
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                switchSection(item.dataset.section);
            });
        });

        // Mobile bottom nav
        mobileNavItems.forEach(item => {
            item.addEventListener('click', () => {
                switchSection(item.dataset.section);
            });
        });
    },

    /**
     * Affiche une notification toast
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '•'}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Animation d'entrée
        setTimeout(() => toast.classList.add('show'), 10);

        // Suppression après 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => App.init());

// Export
window.App = App;
