/**
 * Migration Script
 * Updates 2025 URSSAF declarations with CORRECTED amounts
 * FORCE REWRITE of 2025 data
 */

async function runMigration2025() {
    console.log('Running migration: REWRITE 2025 data (Corrected)');

    // Full 2025 dataset based on user's latest correction
    const fullData2025 = [
        { month: 1, year: 2025, amount: 0, paidAmount: 0 },
        { month: 2, year: 2025, amount: 0, paidAmount: 0 },
        { month: 3, year: 2025, amount: 0, paidAmount: 0 },
        { month: 4, year: 2025, amount: 500.00, paidAmount: 64.00 },   // Avril
        { month: 5, year: 2025, amount: 800.00, paidAmount: 101.00 },  // Mai
        { month: 6, year: 2025, amount: 2001.00, paidAmount: 252.00 }, // Juin
        { month: 7, year: 2025, amount: 2500.00, paidAmount: 316.00 }, // Juillet
        { month: 8, year: 2025, amount: 1000.00, paidAmount: 126.00 }, // Août
        { month: 9, year: 2025, amount: 0, paidAmount: 0 },            // Septembre (absent -> 0)
        { month: 10, year: 2025, amount: 2200.00, paidAmount: 277.00 },// Octobre
        { month: 11, year: 2025, amount: 0, paidAmount: 0 },           // Novembre (absent -> 0)
        { month: 12, year: 2025, amount: 0, paidAmount: 0 }            // Décembre
    ];

    try {
        const declarations = await Storage.get(Storage.KEYS.URSSAF);
        let updatedCount = 0;
        let createdCount = 0;

        for (const data of fullData2025) {
            const decl = declarations.find(d => d.month === data.month && d.year === data.year);

            if (decl) {
                // Update existing
                const currentPaid = decl.paidAmount !== undefined ? decl.paidAmount : -1;
                const currentAmount = decl.amount !== undefined ? decl.amount : -1;

                if (currentPaid !== data.paidAmount || currentAmount !== data.amount) {
                    await Storage.update(Storage.KEYS.URSSAF, decl.id, {
                        paidAmount: data.paidAmount,
                        amount: data.amount
                    });
                    console.log(`Updated ${data.month}/${data.year}: Declared ${data.amount}, Paid ${data.paidAmount}`);
                    updatedCount++;
                }
            } else {
                // Create missing only if it's not a 0/0 entry that we don't care about?
                // User said "met le quand meme" (put it anyway). So we create even 0 entries.
                await Storage.add(Storage.KEYS.URSSAF, {
                    month: data.month,
                    year: data.year,
                    amount: data.amount,
                    paidAmount: data.paidAmount,
                    declaredAt: new Date(2025, data.month - 1, 15).toISOString()
                });
                console.log(`Created ${data.month}/${data.year}: Declared ${data.amount}, Paid ${data.paidAmount}`);
                createdCount++;
            }
        }

        if (updatedCount > 0 || createdCount > 0) {
            const msg = `Correction 2025: ${createdCount} créés, ${updatedCount} modifiés.`;
            console.log(msg);
            if (window.App && window.App.showToast) {
                App.showToast(msg, 'success');
            }
            // Refresh view
            if (window.UrssafModule) {
                UrssafModule.render();
            }
        } else {
            console.log('Migration 2025: Données déjà correctes.');
        }

    } catch (e) {
        console.error('Migration failed:', e);
    }
}

// Run when window loads or Firebase is ready
window.addEventListener('load', () => {
    if (window.isFirebaseReady) {
        runMigration2025();
    } else {
        window.addEventListener('firebaseReady', runMigration2025);
        // Fallback
        setTimeout(runMigration2025, 2000);
    }
});
