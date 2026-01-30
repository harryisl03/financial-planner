import React, { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

const translations = {
    en: {
        // Navigation
        'Home': 'Home',
        'Statistics': 'Statistics',
        'Budget': 'Budget',
        'Transactions': 'Transactions',
        'Settings': 'Settings',
        'Billing': 'Billing',
        'Overview': 'Overview',

        // Dashboard
        'Total Balance': 'Total Balance',
        'Income': 'Income',
        'Expense': 'Expense',
        'My Accounts': 'My Accounts',
        'Manage': 'Manage',
        'Spending This Month': 'Spending This Month',
        'This Month': 'This Month',
        'Last Month': 'Last Month',
        'Recent Transactions': 'Recent Transactions',
        'View All': 'View All',
        'Add Transaction': 'Add Transaction',
        'No Description': 'No Description',
        'Uncategorized': 'Uncategorized',
        'No recent transactions': 'No recent transactions',

        // Statistics
        'Statistics & Analytics': 'Statistics & Analytics',
        'Financial Health': 'Financial Health',
        'Detailed breakdown of your income and expenses.': 'Detailed breakdown of your income and expenses.',
        'Week': 'Week',
        'Month': 'Month',
        'Year': 'Year',
        'Total Income': 'Total Income',
        'Total Expenses': 'Total Expenses',
        'Net Savings': 'Net Savings',
        'Top Spending Categories': 'Top Spending Categories',
        'Balance Trend': 'Balance Trend',
        'Total Net Worth': 'Total Net Worth',
        'Download Report': 'Download Report',
        'Generating...': 'Generating...',
        'Search reports...': 'Search reports...',
        'No trend data available': 'No trend data available',
        'No spending data available': 'No spending data available',

        // Budget
        'Budget Overview': 'Budget Overview',
        'Monthly Spend': 'Monthly Spend',
        'Total Monthly Spend': 'Total Monthly Spend',
        'Category Breakdown': 'Category Breakdown',
        'Edit Budgets': 'Edit Budgets',
        'Monthly Limit': 'Monthly Limit',
        'Near Limit': 'Near Limit',
        'Exceeded': 'Exceeded',
        'Paid': 'Paid',
        'Manage Monthly Budgets': 'Manage Monthly Budgets',
        'Set monthly spending limits for your categories.': 'Set monthly spending limits for your categories.',
        'Not Set': 'Not Set',
        'Done': 'Done',
        'Edit Limit': 'Edit Limit',
        'Set Limit': 'Set Limit',
        'Remove Limit': 'Remove Limit',
        'No categories found.': 'No categories found.',
        'Failed to save budget. Please try again.': 'Failed to save budget. Please try again.',
        'Are you sure you want to remove this budget limit?': 'Are you sure you want to remove this budget limit?',

        // Transactions
        'Transaction Details': 'Transaction Details',
        'Description': 'Description',
        'Category': 'Category',
        'Date': 'Date',
        'Account': 'Account',
        'Main Account': 'Main Account',
        'Close': 'Close',
        'income': 'Income',
        'expense': 'Expense',

        // Settings
        'Settings & Account': 'Settings & Account',
        'Manage your personal information and preferences.': 'Manage your personal information and preferences.',
        'Preferences': 'Preferences',
        'Currency': 'Currency',
        'Language': 'Language',
        'Dark Mode': 'Dark Mode',
        'Connected Accounts': 'Connected Accounts',
        'Manage your synced bank accounts.': 'Manage your synced bank accounts.',
        'Link Bank': 'Link Bank',
        'Synced': 'Synced',
        'Sync Now': 'Sync Now',
        'Security': 'Security',
        'Full Name': 'Full Name',
        'Email Address': 'Email Address',
        'Phone Number': 'Phone Number',
        'Save Changes': 'Save Changes',
        'Change Password': 'Change Password',
        'Current Password': 'Current Password',
        'New Password': 'New Password',
        'Confirm New Password': 'Confirm New Password',
        'Update Password': 'Update Password',
        'Help & Support': 'Help & Support',
        'User': 'User'
    },
    id: {
        // Navigation
        'Home': 'Beranda',
        'Statistics': 'Statistik',
        'Budget': 'Anggaran',
        'Transactions': 'Transaksi',
        'Settings': 'Pengaturan',
        'Billing': 'Tagihan',
        'Overview': 'Ringkasan',

        // Dashboard
        'Total Balance': 'Total Saldo',
        'Income': 'Pemasukan',
        'Expense': 'Pengeluaran',
        'My Accounts': 'Akun Saya',
        'Manage': 'Kelola',
        'Spending This Month': 'Pengeluaran Bulan Ini',
        'This Month': 'Bulan Ini',
        'Last Month': 'Bulan Lalu',
        'Recent Transactions': 'Transaksi Terbaru',
        'View All': 'Lihat Semua',
        'Add Transaction': 'Tambah Transaksi',
        'No Description': 'Tanpa Deskripsi',
        'Uncategorized': 'Tanpa Kategori',
        'No recent transactions': 'Tidak ada transaksi terbaru',

        // Statistics
        'Statistics & Analytics': 'Statistik & Analitik',
        'Financial Health': 'Kesehatan Keuangan',
        'Detailed breakdown of your income and expenses.': 'Rincian lengkap pemasukan dan pengeluaran Anda.',
        'Week': 'Minggu',
        'Month': 'Bulan',
        'Year': 'Tahun',
        'Total Income': 'Total Pemasukan',
        'Total Expenses': 'Total Pengeluaran',
        'Net Savings': 'Tabungan Bersih',
        'Top Spending Categories': 'Kategori Pengeluaran Teratas',
        'Balance Trend': 'Tren Saldo',
        'Total Net Worth': 'Total Kekayaan Bersih',
        'Download Report': 'Unduh Laporan',
        'Generating...': 'Memproses...',
        'Search reports...': 'Cari laporan...',
        'No trend data available': 'Data tren tidak tersedia',
        'No spending data available': 'Data pengeluaran tidak tersedia',

        // Budget
        'Budget Overview': 'Ringkasan Anggaran',
        'Monthly Spend': 'Pengeluaran Bulanan',
        'Total Monthly Spend': 'Total Pengeluaran Bulanan',
        'Category Breakdown': 'Rincian Kategori',
        'Edit Budgets': 'Edit Anggaran',
        'Monthly Limit': 'Batas Bulanan',
        'Near Limit': 'Mendekati Batas',
        'Exceeded': 'Melebihi Batas',
        'Paid': 'Lunas',
        'Manage Monthly Budgets': 'Kelola Anggaran Bulanan',
        'Set monthly spending limits for your categories.': 'Tetapkan batas pengeluaran bulanan untuk kategori Anda.',
        'Not Set': 'Belum Diatur',
        'Done': 'Selesai',
        'Edit Limit': 'Edit Batas',
        'Set Limit': 'Atur Batas',
        'Remove Limit': 'Hapus Batas',
        'No categories found.': 'Tidak ada kategori ditemukan.',
        'Failed to save budget. Please try again.': 'Gagal menyimpan anggaran. Silakan coba lagi.',
        'Are you sure you want to remove this budget limit?': 'Apakah Anda yakin ingin menghapus batas anggaran ini?',

        // Transactions
        'Transaction Details': 'Detail Transaksi',
        'Description': 'Deskripsi',
        'Category': 'Kategori',
        'Date': 'Tanggal',
        'Account': 'Akun',
        'Main Account': 'Akun Utama',
        'Close': 'Tutup',
        'income': 'Pemasukan',
        'expense': 'Pengeluaran',

        // Settings
        'Settings & Account': 'Pengaturan & Akun',
        'Manage your personal information and preferences.': 'Kelola informasi pribadi dan preferensi Anda.',
        'Preferences': 'Preferensi',
        'Currency': 'Mata Uang',
        'Language': 'Bahasa',
        'Dark Mode': 'Mode Gelap',
        'Connected Accounts': 'Akun Terhubung',
        'Manage your synced bank accounts.': 'Kelola akun bank yang tersinkronisasi.',
        'Link Bank': 'Hubungkan Bank',
        'Synced': 'Tersinkron',
        'Sync Now': 'Sinkron Sekarang',
        'Security': 'Keamanan',
        'Full Name': 'Nama Lengkap',
        'Email Address': 'Alamat Email',
        'Phone Number': 'Nomor Telepon',
        'Save Changes': 'Simpan Perubahan',
        'Change Password': 'Ubah Kata Sandi',
        'Current Password': 'Kata Sandi Saat Ini',
        'New Password': 'Kata Sandi Baru',
        'Confirm New Password': 'Konfirmasi Kata Sandi Baru',
        'Update Password': 'Perbarui Kata Sandi',
        'Help & Support': 'Bantuan & Dukungan',
        'User': 'Pengguna'
    },
    es: {
        // Navigation
        'Home': 'Inicio',
        'Statistics': 'Estadísticas',
        'Budget': 'Presupuesto',
        'Transactions': 'Transacciones',
        'Settings': 'Ajustes',
        'Billing': 'Facturación',
        'Overview': 'Visión general',

        // Dashboard
        'Total Balance': 'Saldo total',
        'Income': 'Ingresos',
        'Expense': 'Gastos',
        'My Accounts': 'Mis Cuentas',
        'Manage': 'Administrar',
        'Spending This Month': 'Gastos este mes',
        'This Month': 'Este mes',
        'Last Month': 'Mes pasado',
        'Recent Transactions': 'Transacciones recientes',
        'View All': 'Ver todo',
        'Add Transaction': 'Agregar transacción',
        'No Description': 'Sin descripción',
        'Uncategorized': 'Sin categoría',
        'No recent transactions': 'No hay transacciones recientes',

        // Statistics
        'Statistics & Analytics': 'Estadísticas y análisis',
        'Financial Health': 'Salud financiera',
        'Detailed breakdown of your income and expenses.': 'Desglose detallado de tus ingresos y gastos.',
        'Week': 'Semana',
        'Month': 'Mes',
        'Year': 'Año',
        'Total Income': 'Ingresos totales',
        'Total Expenses': 'Gastos totales',
        'Net Savings': 'Ahorro neto',
        'Top Spending Categories': 'Categorías de mayor gasto',
        'Balance Trend': 'Tendencia del saldo',
        'Total Net Worth': 'Patrimonio neto total',
        'Download Report': 'Descargar informe',
        'Generating...': 'Generando...',
        'Search reports...': 'Buscar informes...',
        'No trend data available': 'Sin datos de tendencia',
        'No spending data available': 'Sin datos de gastos',

        // Budget
        'Budget Overview': 'Resumen del presupuesto',
        'Monthly Spend': 'Gasto mensual',
        'Total Monthly Spend': 'Gasto mensual total',
        'Category Breakdown': 'Desglose por categoría',
        'Edit Budgets': 'Editar presupuestos',
        'Monthly Limit': 'Límite mensual',
        'Near Limit': 'Cerca del límite',
        'Exceeded': 'Excedido',
        'Paid': 'Pagado',
        'Manage Monthly Budgets': 'Administrar presupuestos mensuales',
        'Set monthly spending limits for your categories.': 'Establece límites de gasto mensuales para tus categorías.',
        'Not Set': 'No establecido',
        'Done': 'Listo',
        'Edit Limit': 'Editar límite',
        'Set Limit': 'Establecer límite',
        'Remove Limit': 'Eliminar límite',
        'No categories found.': 'No se encontraron categorías.',
        'Failed to save budget. Please try again.': 'Error al guardar. Inténtalo de nuevo.',
        'Are you sure you want to remove this budget limit?': '¿Estás seguro de eliminar este límite?',

        // Transactions
        'Transaction Details': 'Detalles de transacción',
        'Description': 'Descripción',
        'Category': 'Categoría',
        'Date': 'Fecha',
        'Account': 'Cuenta',
        'Main Account': 'Cuenta principal',
        'Close': 'Cerrar',
        'income': 'Ingresos',
        'expense': 'Gastos',

        // Settings
        'Settings & Account': 'Configuración y cuenta',
        'Manage your personal information and preferences.': 'Administra tu información personal y preferencias.',
        'Preferences': 'Preferencias',
        'Currency': 'Moneda',
        'Language': 'Idioma',
        'Dark Mode': 'Modo oscuro',
        'Connected Accounts': 'Cuentas conectadas',
        'Manage your synced bank accounts.': 'Administra tus cuentas bancarias sincronizadas.',
        'Link Bank': 'Vincular banco',
        'Synced': 'Sincronizado',
        'Sync Now': 'Sincronizar ahora',
        'Security': 'Seguridad',
        'Full Name': 'Nombre completo',
        'Email Address': 'Correo electrónico',
        'Phone Number': 'Número de teléfono',
        'Save Changes': 'Guardar cambios',
        'Change Password': 'Cambiar contraseña',
        'Current Password': 'Contraseña actual',
        'New Password': 'Nueva contraseña',
        'Confirm New Password': 'Confirmar nueva contraseña',
        'Update Password': 'Actualizar contraseña',
        'Help & Support': 'Ayuda y soporte',
        'User': 'Usuario'
    },
    fr: {
        // Navigation
        'Home': 'Accueil',
        'Statistics': 'Statistiques',
        'Budget': 'Budget',
        'Transactions': 'Transactions',
        'Settings': 'Paramètres',
        'Billing': 'Facturation',
        'Overview': 'Aperçu',

        // Dashboard
        'Total Balance': 'Solde total',
        'Income': 'Revenu',
        'Expense': 'Dépense',
        'My Accounts': 'Mes Comptes',
        'Manage': 'Gérer',
        'Spending This Month': 'Dépenses ce mois',
        'This Month': 'Ce mois',
        'Last Month': 'Mois dernier',
        'Recent Transactions': 'Transactions récentes',
        'View All': 'Voir tout',
        'Add Transaction': 'Ajouter transaction',
        'No Description': 'Sans description',
        'Uncategorized': 'Non catégorisé',
        'No recent transactions': 'Aucune transaction récente',

        // Statistics
        'Statistics & Analytics': 'Statistiques et analyses',
        'Financial Health': 'Santé financière',
        'Detailed breakdown of your income and expenses.': 'Répartition détaillée de vos revenus et dépenses.',
        'Week': 'Semaine',
        'Month': 'Mois',
        'Year': 'Année',
        'Total Income': 'Revenu total',
        'Total Expenses': 'Dépenses totales',
        'Net Savings': 'Épargne nette',
        'Top Spending Categories': 'Catégories de dépenses principales',
        'Balance Trend': 'Tendance du solde',
        'Total Net Worth': 'Valeur nette totale',
        'Download Report': 'Télécharger le rapport',
        'Generating...': 'Génération...',
        'Search reports...': 'Rechercher des rapports...',
        'No trend data available': 'Aucune donnée de tendance',
        'No spending data available': 'Aucune donnée de dépenses',

        // Budget
        'Budget Overview': 'Aperçu du budget',
        'Monthly Spend': 'Dépenses mensuelles',
        'Total Monthly Spend': 'Dépenses mensuelles totales',
        'Category Breakdown': 'Répartition par catégorie',
        'Edit Budgets': 'Modifier les budgets',
        'Monthly Limit': 'Limite mensuelle',
        'Near Limit': 'Proche de la limite',
        'Exceeded': 'Dépassé',
        'Paid': 'Payé',
        'Manage Monthly Budgets': 'Gérer les budgets mensuels',
        'Set monthly spending limits for your categories.': 'Définissez des limites de dépenses pour vos catégories.',
        'Not Set': 'Non défini',
        'Done': 'Terminé',
        'Edit Limit': 'Modifier la limite',
        'Set Limit': 'Définir la limite',
        'Remove Limit': 'Supprimer la limite',
        'No categories found.': 'Aucune catégorie trouvée.',
        'Failed to save budget. Please try again.': 'Échec de sauvegarde. Veuillez réessayer.',
        'Are you sure you want to remove this budget limit?': 'Voulez-vous vraiment supprimer cette limite?',

        // Transactions
        'Transaction Details': 'Détails de la transaction',
        'Description': 'Description',
        'Category': 'Catégorie',
        'Date': 'Date',
        'Account': 'Compte',
        'Main Account': 'Compte principal',
        'Close': 'Fermer',
        'income': 'Revenu',
        'expense': 'Dépense',

        // Settings
        'Settings & Account': 'Paramètres et compte',
        'Manage your personal information and preferences.': 'Gérez vos informations personnelles et préférences.',
        'Preferences': 'Préférences',
        'Currency': 'Devise',
        'Language': 'Langue',
        'Dark Mode': 'Mode sombre',
        'Connected Accounts': 'Comptes connectés',
        'Manage your synced bank accounts.': 'Gérez vos comptes bancaires synchronisés.',
        'Link Bank': 'Lier banque',
        'Synced': 'Synchronisé',
        'Sync Now': 'Synchroniser',
        'Security': 'Sécurité',
        'Full Name': 'Nom complet',
        'Email Address': 'Adresse e-mail',
        'Phone Number': 'Numéro de téléphone',
        'Save Changes': 'Enregistrer',
        'Change Password': 'Changer le mot de passe',
        'Current Password': 'Mot de passe actuel',
        'New Password': 'Nouveau mot de passe',
        'Confirm New Password': 'Confirmer le nouveau mot de passe',
        'Update Password': 'Mettre à jour le mot de passe',
        'Help & Support': 'Aide et support',
        'User': 'Utilisateur'
    }
};

import { useUserPreferences, useUpdatePreferences } from '../hooks/useUser';
import { useAuth } from './AuthContext';

export function PreferencesProvider({ children }) {
    const { user } = useAuth();
    const [currency, setCurrency] = useState('USD');
    const [language, setLanguage] = useState('en');
    const [theme, setTheme] = useState('dark');

    const [isInitialized, setIsInitialized] = useState(false);

    // Fetch preferences from backend
    const { data: preferences } = useUserPreferences(!!user);
    const updatePreferencesMutation = useUpdatePreferences();

    // Sync local state with backend data when loaded (only once)
    // Sync local state with backend data when loaded
    useEffect(() => {
        if (preferences) {
            if (preferences.currency) {
                setCurrency(preferences.currency);
                localStorage.setItem('currency', preferences.currency);
            }
            if (preferences.language) {
                setLanguage(preferences.language);
                localStorage.setItem('language', preferences.language);
            }
            if (preferences.theme) {
                setTheme(preferences.theme);
                localStorage.setItem('theme', preferences.theme);
            }
            setIsInitialized(true);
        } else if (!user && !isInitialized) {
            // Only load from localStorage if NOT logged in (guest mode)
            // or if we haven't initialized yet.
            // If we are logged in but preferences request failed or is empty, we might want to keep defaults or local
            const savedCurrency = localStorage.getItem('currency');
            const savedLanguage = localStorage.getItem('language');
            const savedTheme = localStorage.getItem('theme');

            if (savedCurrency) setCurrency(savedCurrency);
            if (savedLanguage) setLanguage(savedLanguage);
            if (savedTheme) setTheme(savedTheme);
            else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    setTheme('dark');
                } else {
                    setTheme('light');
                }
            }
            setIsInitialized(true);
        }
    }, [preferences, user, isInitialized]);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Update backend when state changes (debounce could be added in real app)
    const handleSetCurrency = (newCurrency) => {
        setCurrency(newCurrency);
        localStorage.setItem('currency', newCurrency);
        if (user) {
            updatePreferencesMutation.mutate({ currency: newCurrency });
        }
    };

    const handleSetLanguage = (newLanguage) => {
        setLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
        if (user) {
            updatePreferencesMutation.mutate({ language: newLanguage });
        }
    };

    const handleSetTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (user) {
            updatePreferencesMutation.mutate({ theme: newTheme });
        }
    };

    const formatCurrency = (amount) => {
        // Handle potential string inputs or NaNs
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        const safeAmount = isNaN(numAmount) ? 0 : numAmount;

        return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'IDR' ? 0 : 2,
            maximumFractionDigits: currency === 'IDR' ? 0 : 2
        }).format(safeAmount);
    };

    const getCurrencySymbol = () => {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'IDR': 'Rp'
        };
        return symbols[currency] || '$';
    };

    const formatNumberWithSeparator = (value) => {
        // Format number with thousand separators based on locale
        if (!value && value !== 0) return '';
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
        if (isNaN(numValue)) return '';

        return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <PreferencesContext.Provider value={{
            currency,
            setCurrency: handleSetCurrency,
            language,
            setLanguage: handleSetLanguage,
            theme,
            setTheme: handleSetTheme,
            formatCurrency,
            getCurrencySymbol,
            formatNumberWithSeparator,
            t
        }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
}
