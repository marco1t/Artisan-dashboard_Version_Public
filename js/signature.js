/**
 * Signature Module - Signature automatique de contrats PDF
 */

const SignatureModule = {
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    pdfBytes: null,
    signatureImage: null,
    // Position fixe pour les contrats (page 9)
    SIGNATURE_PAGE: 9,
    // Position par défaut en pixels (ajustable)
    DEFAULT_POSITION: { x: 350, y: 680 },
    signaturePosition: { x: 350, y: 680 },
    signatureSize: 120,
    scale: 1,
    savedSignature: null, // Signature sauvegardée pour réutilisation

    /**
     * Initialise le module Signature
     */
    init() {
        // Configurer pdf.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Éléments DOM
        this.pdfUploadZone = document.getElementById('pdf-upload-zone');
        this.pdfInput = document.getElementById('pdf-input');
        this.pdfInfo = document.getElementById('pdf-info');
        this.pdfFileName = this.pdfInfo.querySelector('.file-name');
        this.removePdfBtn = document.getElementById('remove-pdf');
        this.contractAmount = document.getElementById('contract-amount');
        this.amountValue = this.contractAmount.querySelector('.amount-value');

        this.signatureUploadZone = document.getElementById('signature-upload-zone');
        this.signatureInput = document.getElementById('signature-input');
        this.signaturePreview = document.getElementById('signature-preview');
        this.signatureImg = document.getElementById('signature-img');
        this.removeSignatureBtn = document.getElementById('remove-signature');
        this.signatureSizeInput = document.getElementById('signature-size');
        this.signatureSizeValue = document.getElementById('signature-size-value');

        this.pdfContainer = document.getElementById('pdf-container');
        this.pdfCanvas = document.getElementById('pdf-canvas');
        this.pdfPlaceholder = document.getElementById('pdf-placeholder');
        this.signatureDraggable = document.getElementById('signature-draggable');
        this.draggableSignature = document.getElementById('draggable-signature');

        this.prevPageBtn = document.getElementById('prev-page');
        this.nextPageBtn = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');

        this.signPdfBtn = document.getElementById('sign-pdf');

        this.bindEvents();

        // Charger la signature par défaut
        this.loadDefaultSignature();
    },

    /**
     * Charge la signature par défaut (signature.png)
     */
    async loadDefaultSignature() {
        try {
            const response = await fetch('assets/signature.png');
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.signatureImage = e.target.result;

                    // Afficher la préview
                    this.signatureImg.src = this.signatureImage;
                    this.signaturePreview.classList.remove('hidden');
                    this.signatureUploadZone.style.display = 'none';

                    // Configurer la signature draggable
                    this.draggableSignature.src = this.signatureImage;
                    this.draggableSignature.style.width = `${this.signatureSize}px`;

                    this.updateSignButton();
                    console.log('Signature par défaut chargée');
                };
                reader.readAsDataURL(blob);
            }
        } catch (error) {
            console.log('Pas de signature par défaut trouvée, utilisateur doit en charger une');
        }
    },

    /**
     * Attache les événements
     */
    bindEvents() {
        // Upload PDF
        this.pdfUploadZone.addEventListener('click', () => this.pdfInput.click());
        this.pdfInput.addEventListener('change', (e) => this.handlePdfUpload(e));
        this.setupDragDrop(this.pdfUploadZone, this.pdfInput);
        this.removePdfBtn.addEventListener('click', () => this.removePdf());

        // Upload Signature
        this.signatureUploadZone.addEventListener('click', () => this.signatureInput.click());
        this.signatureInput.addEventListener('change', (e) => this.handleSignatureUpload(e));
        this.setupDragDrop(this.signatureUploadZone, this.signatureInput);
        this.removeSignatureBtn.addEventListener('click', () => this.removeSignature());

        // Taille signature
        this.signatureSizeInput.addEventListener('input', (e) => {
            this.signatureSize = parseInt(e.target.value);
            this.signatureSizeValue.textContent = `${this.signatureSize}px`;
            if (this.signatureImage) {
                this.draggableSignature.style.width = `${this.signatureSize}px`;
            }
        });

        // Navigation pages
        this.prevPageBtn.addEventListener('click', () => this.changePage(-1));
        this.nextPageBtn.addEventListener('click', () => this.changePage(1));

        // Signature draggable
        this.setupSignatureDrag();

        // Signer le PDF
        this.signPdfBtn.addEventListener('click', () => this.signAndDownload());
    },

    /**
     * Configure le drag & drop pour une zone d'upload
     */
    setupDragDrop(zone, input) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.add('drag-over'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.remove('drag-over'));
        });

        zone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                input.dispatchEvent(new Event('change'));
            }
        });
    },

    /**
     * Gère l'upload du PDF
     */
    async handlePdfUpload(e) {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            App.showToast('Veuillez sélectionner un fichier PDF', 'error');
            return;
        }

        try {
            // Garder les bytes originaux pour pdf-lib (signature)
            this.pdfBytes = await file.arrayBuffer();
            // Créer une copie pour pdf.js (affichage) car il détache l'ArrayBuffer
            const pdfBytesForViewer = this.pdfBytes.slice(0);
            this.pdfDoc = await pdfjsLib.getDocument({ data: pdfBytesForViewer }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;

            // Afficher info fichier
            this.pdfFileName.textContent = file.name;
            this.pdfInfo.classList.remove('hidden');
            this.pdfUploadZone.style.display = 'none';
            this.pdfPlaceholder.style.display = 'none';

            // Aller directement à la page de signature si elle existe
            if (this.totalPages >= this.SIGNATURE_PAGE) {
                this.currentPage = this.SIGNATURE_PAGE;
            }

            // Rendre la page
            await this.renderPage();

            // Extraire le montant
            await this.extractAmount();

            // Si une signature est déjà chargée, l'afficher sur le PDF
            if (this.signatureImage) {
                this.signatureDraggable.classList.remove('hidden');
                this.draggableSignature.src = this.signatureImage;
                this.draggableSignature.style.width = `${this.signatureSize}px`;
                // Position par défaut
                this.signaturePosition = {
                    x: (this.pdfCanvas.width / 2) - (this.signatureSize / 2),
                    y: this.pdfCanvas.height - 150
                };
                this.updateSignaturePosition();
            } else {
                // Charger la signature sauvegardée si disponible
                this.loadSavedSignature();
            }

            // Activer le bouton de signature si la signature est chargée
            this.updateSignButton();

            App.showToast('PDF chargé avec succès', 'success');
        } catch (error) {
            console.error('Erreur chargement PDF:', error);
            App.showToast('Erreur lors du chargement du PDF', 'error');
        }
    },

    /**
     * Rend la page courante du PDF
     */
    async renderPage() {
        if (!this.pdfDoc) return;

        const page = await this.pdfDoc.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: 1.5 });

        this.scale = viewport.scale;
        this.pdfCanvas.width = viewport.width;
        this.pdfCanvas.height = viewport.height;

        const context = this.pdfCanvas.getContext('2d');
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Mettre à jour la navigation
        this.pageInfo.textContent = `Page ${this.currentPage} / ${this.totalPages}`;
        this.prevPageBtn.disabled = this.currentPage <= 1;
        this.nextPageBtn.disabled = this.currentPage >= this.totalPages;
    },

    /**
     * Change de page
     */
    async changePage(delta) {
        const newPage = this.currentPage + delta;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            await this.renderPage();
        }
    },

    /**
     * Extrait le montant du contrat
     */
    async extractAmount() {
        if (!this.pdfDoc) return;

        let fullText = '';

        // Extraire le texte de toutes les pages
        for (let i = 1; i <= this.totalPages; i++) {
            const page = await this.pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
        }

        // Pattern principal : "pour la somme globale et forfaitaire de X €"
        const patterns = [
            /pour\s+la\s+somme\s+globale\s+et\s+forfaitaire\s+de\s+([\d\s.,]+)\s*(?:€|euros?|EUR)?/gi,
            /somme\s+globale\s+et\s+forfaitaire\s*(?:de|:)?\s*([\d\s.,]+)\s*(?:€|euros?)?/gi,
            /montant\s+(?:total|global|forfaitaire)\s*(?:de|:)?\s*([\d\s.,]+)\s*(?:€|euros?)?/gi
        ];

        let foundAmount = null;

        for (const pattern of patterns) {
            const matches = fullText.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    // Nettoyer et parser le montant
                    const amountStr = match[1].replace(/\s/g, '').replace(',', '.');
                    const amount = parseFloat(amountStr);
                    if (!isNaN(amount) && amount > 0) {
                        foundAmount = amount;
                        break;
                    }
                }
            }
            if (foundAmount) break;
        }

        if (foundAmount) {
            this.amountValue.textContent = this.formatCurrency(foundAmount);
            this.contractAmount.classList.remove('hidden');
        } else {
            this.contractAmount.classList.add('hidden');
        }
    },

    /**
     * Supprime le PDF chargé
     */
    removePdf() {
        this.pdfDoc = null;
        this.pdfBytes = null;
        this.currentPage = 1;
        this.totalPages = 0;

        this.pdfInput.value = '';
        this.pdfInfo.classList.add('hidden');
        this.pdfUploadZone.style.display = 'block';
        this.pdfPlaceholder.style.display = 'block';
        this.contractAmount.classList.add('hidden');

        const context = this.pdfCanvas.getContext('2d');
        context.clearRect(0, 0, this.pdfCanvas.width, this.pdfCanvas.height);
        this.pdfCanvas.width = 0;
        this.pdfCanvas.height = 0;

        this.signatureDraggable.classList.add('hidden');
        this.updateSignButton();
    },

    /**
     * Gère l'upload de la signature
     */
    async handleSignatureUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            App.showToast('Veuillez sélectionner une image', 'error');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.signatureImage = event.target.result;

                // Afficher la préview
                this.signatureImg.src = this.signatureImage;
                this.signaturePreview.classList.remove('hidden');
                this.signatureUploadZone.style.display = 'none';

                // Configurer la signature draggable
                this.draggableSignature.src = this.signatureImage;
                this.draggableSignature.style.width = `${this.signatureSize}px`;

                if (this.pdfDoc) {
                    this.signatureDraggable.classList.remove('hidden');
                    // Position initiale au centre en bas
                    this.signaturePosition = {
                        x: (this.pdfCanvas.width / 2) - (this.signatureSize / 2),
                        y: this.pdfCanvas.height - 150
                    };
                    this.updateSignaturePosition();
                }

                this.updateSignButton();

                // Sauvegarder la signature pour réutilisation
                this.saveSignature();

                App.showToast('Signature chargée et sauvegardée', 'success');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Erreur chargement signature:', error);
            App.showToast('Erreur lors du chargement de la signature', 'error');
        }
    },

    /**
     * Supprime la signature
     */
    removeSignature() {
        this.signatureImage = null;
        this.signatureInput.value = '';
        this.signaturePreview.classList.add('hidden');
        this.signatureUploadZone.style.display = 'block';
        this.signatureDraggable.classList.add('hidden');
        this.updateSignButton();
    },

    /**
     * Configure le drag de la signature sur le PDF
     */
    setupSignatureDrag() {
        let isDragging = false;
        let startX, startY;

        this.signatureDraggable.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - this.signaturePosition.x;
            startY = e.clientY - this.signaturePosition.y;
            this.signatureDraggable.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const containerRect = this.pdfContainer.getBoundingClientRect();
            let x = e.clientX - startX;
            let y = e.clientY - startY;

            // Limiter aux bordures du canvas
            x = Math.max(0, Math.min(x, this.pdfCanvas.width - this.signatureSize));
            y = Math.max(0, Math.min(y, this.pdfCanvas.height - this.signatureDraggable.offsetHeight));

            this.signaturePosition = { x, y };
            this.updateSignaturePosition();
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.signatureDraggable.style.cursor = 'move';
        });

        // Support tactile
        this.signatureDraggable.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            isDragging = true;
            startX = touch.clientX - this.signaturePosition.x;
            startY = touch.clientY - this.signaturePosition.y;
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];

            let x = touch.clientX - startX;
            let y = touch.clientY - startY;

            x = Math.max(0, Math.min(x, this.pdfCanvas.width - this.signatureSize));
            y = Math.max(0, Math.min(y, this.pdfCanvas.height - this.signatureDraggable.offsetHeight));

            this.signaturePosition = { x, y };
            this.updateSignaturePosition();
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    },

    /**
     * Met à jour la position visuelle de la signature
     */
    updateSignaturePosition() {
        this.signatureDraggable.style.left = `${this.signaturePosition.x}px`;
        this.signatureDraggable.style.top = `${this.signaturePosition.y}px`;
    },

    /**
     * Met à jour l'état du bouton de signature
     */
    updateSignButton() {
        this.signPdfBtn.disabled = !(this.pdfDoc && this.signatureImage);
    },

    /**
     * Signe le PDF et le télécharge
     */
    async signAndDownload() {
        if (!this.pdfDoc || !this.signatureImage) {
            App.showToast('PDF et signature requis', 'error');
            return;
        }

        if (!this.pdfBytes) {
            App.showToast('Erreur: PDF non chargé correctement', 'error');
            return;
        }

        try {
            App.showToast('Signature en cours...', 'success');

            // Charger le PDF avec pdf-lib
            const pdfLibDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
            const pages = pdfLibDoc.getPages();

            if (this.currentPage > pages.length) {
                App.showToast('Page invalide', 'error');
                return;
            }

            const targetPage = pages[this.currentPage - 1];

            // Dimensions de la page PDF
            const pageHeight = targetPage.getHeight();
            const pageWidth = targetPage.getWidth();

            // Vérifier que le canvas a des dimensions
            const canvasWidth = this.pdfCanvas.width || 1;
            const canvasHeight = this.pdfCanvas.height || 1;

            // Calculer le ratio entre le canvas et la page PDF réelle
            const scaleX = pageWidth / canvasWidth;
            const scaleY = pageHeight / canvasHeight;

            // Position par défaut si non définie
            const posX = this.signaturePosition?.x || 100;
            const posY = this.signaturePosition?.y || 100;

            // Position en coordonnées PDF (y inversé)
            const pdfX = posX * scaleX;
            const pdfY = pageHeight - (posY * scaleY) - (this.signatureSize * scaleY);

            // Charger l'image de signature
            let signatureImageEmbed;
            const signatureBytes = await fetch(this.signatureImage).then(r => r.arrayBuffer());

            // Essayer PNG d'abord, puis JPG si ça échoue
            try {
                signatureImageEmbed = await pdfLibDoc.embedPng(signatureBytes);
            } catch (pngError) {
                console.log('PNG embedding failed, trying JPG...', pngError);
                try {
                    signatureImageEmbed = await pdfLibDoc.embedJpg(signatureBytes);
                } catch (jpgError) {
                    console.error('Both PNG and JPG embedding failed:', jpgError);
                    App.showToast('Format image non supporté', 'error');
                    return;
                }
            }

            // Calculer les dimensions de la signature
            const sigWidth = this.signatureSize * scaleX;
            const sigHeight = (signatureImageEmbed.height / signatureImageEmbed.width) * sigWidth;

            // Incruster la signature
            targetPage.drawImage(signatureImageEmbed, {
                x: pdfX,
                y: pdfY,
                width: sigWidth,
                height: sigHeight
            });

            // Sauvegarder le PDF
            const signedPdfBytes = await pdfLibDoc.save();

            // Télécharger
            const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'contrat_signe.pdf';
            link.click();
            URL.revokeObjectURL(url);

            App.showToast('PDF signé téléchargé !', 'success');
        } catch (error) {
            console.error('Erreur signature PDF:', error);
            App.showToast('Erreur: ' + (error.message || 'Signature impossible'), 'error');
        }
    },

    /**
     * Sauvegarde la signature pour réutilisation future
     */
    saveSignature() {
        if (this.signatureImage) {
            localStorage.setItem('artisan_saved_signature', this.signatureImage);
            localStorage.setItem('artisan_signature_size', this.signatureSize.toString());
        }
    },

    /**
     * Charge la signature sauvegardée
     */
    loadSavedSignature() {
        const savedSig = localStorage.getItem('artisan_saved_signature');
        const savedSize = localStorage.getItem('artisan_signature_size');

        if (savedSig && !this.signatureImage) {
            this.signatureImage = savedSig;
            if (savedSize) {
                this.signatureSize = parseInt(savedSize);
                this.signatureSizeInput.value = this.signatureSize;
                this.signatureSizeValue.textContent = `${this.signatureSize}px`;
            }

            // Afficher la préview
            this.signatureImg.src = this.signatureImage;
            this.signaturePreview.classList.remove('hidden');
            this.signatureUploadZone.style.display = 'none';

            // Configurer la signature draggable
            this.draggableSignature.src = this.signatureImage;
            this.draggableSignature.style.width = `${this.signatureSize}px`;

            if (this.pdfDoc) {
                this.signatureDraggable.classList.remove('hidden');
                // Utiliser la position par défaut fixe
                this.signaturePosition = { ...this.DEFAULT_POSITION };
                this.updateSignaturePosition();
            }

            this.updateSignButton();
            App.showToast('Signature précédente chargée automatiquement', 'success');
        }
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
window.SignatureModule = SignatureModule;
