import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function TwoFactorSettings({ user, twoFactor }) {
    const [isEnabled, setIsEnabled] = useState(user?.twoFactorEnabled || false);
    const [step, setStep] = useState('initial'); // initial, verify-password, scan-qr, verify-otp, success, view-backup-codes
    const [password, setPassword] = useState('');
    const [totpCode, setTotpCode] = useState('');
    const [secretData, setSecretData] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Sync state with user prop
    React.useEffect(() => {
        setIsEnabled(user?.twoFactorEnabled || false);
    }, [user]);

    const handleEnableClick = () => {
        setStep('verify-password');
        setError('');
        setPassword('');
    };

    const handlePasswordVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await twoFactor.enable({ password });
            if (data?.error) throw new Error(data.error.message);

            // data.data should contain { secret, uri, backupCodes }
            setSecretData(data.data);
            if (data.data.backupCodes) {
                setBackupCodes(data.data.backupCodes);
            }
            setStep('scan-qr');
        } catch (err) {
            setError(err.message || 'Incorrect password');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyTotp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await twoFactor.verifyTOTP({ code: totpCode });
            if (res?.error) throw new Error(res.error.message);

            setIsEnabled(true);
            setStep('success');
        } catch (err) {
            setError(err.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleDisableClick = () => {
        if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) return;
        setStep('verify-password-disable');
        setPassword('');
        setError('');
    };

    const handleDisableSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await twoFactor.disable({ password });
            if (res?.error) throw new Error(res.error.message);

            setIsEnabled(false);
            setStep('initial');
        } catch (err) {
            setError(err.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    if (isEnabled && step === 'initial') {
        return (
            <>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Two-Factor Authentication</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Your account is secured with 2FA. You need to enter a code from your authenticator app when you log in.
                </p>
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 border border-emerald-500/20 dark:border-transparent">
                            <span className="material-symbols-outlined text-[20px]">lock</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-50">Authenticator App</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Enabled</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDisableClick}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20 dark:border-transparent"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Disable'}
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (step === 'verify-password-disable') {
        return (
            <>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Disable Two-Factor Authentication</h4>
                <form onSubmit={handleDisableSubmit} className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Enter your password to confirm disabling 2FA.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Current Password"
                        className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 py-2 px-4 text-sm text-slate-900 dark:text-white focus:border-primary-start outline-none"
                        autoFocus
                    />
                    {error && <p className="text-rose-500 dark:text-rose-400 text-xs">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setStep('initial')} className="text-slate-500 dark:text-slate-400 text-xs hover:text-slate-900 dark:hover:text-white px-3 py-2">Cancel</button>
                        <button type="submit" disabled={!password || loading} className="bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:brightness-110 transition-all shadow-lg disabled:opacity-50">
                            {loading ? 'Disabling...' : 'Disable 2FA'}
                        </button>
                    </div>
                </form>
            </>
        );
    }

    return (
        <>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Two-Factor Authentication</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                Add an extra layer of security to your account by enabling 2FA. We'll send a code to your mobile device or email when you log in.
            </p>

            {step === 'initial' && !isEnabled && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">phonelink_lock</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-50">Authenticator App</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Not enabled</span>
                        </div>
                    </div>
                    <button
                        onClick={handleEnableClick}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        Enable
                    </button>
                </div>
            )}

            {step === 'verify-password' && (
                <form onSubmit={handlePasswordVerify} className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">Enter your password to continue setup.</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Current Password"
                        className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 py-2 px-4 text-sm text-slate-900 dark:text-white focus:border-primary-start outline-none"
                        autoFocus
                    />
                    {error && <p className="text-rose-500 dark:text-rose-400 text-xs">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setStep('initial')} className="text-slate-500 dark:text-slate-400 text-xs hover:text-slate-900 dark:hover:text-white px-3 py-2">Cancel</button>
                        <button type="submit" disabled={!password || loading} className="bg-gradient-to-r from-primary-start to-primary-end text-slate-900 text-xs font-bold px-4 py-2 rounded-xl hover:brightness-110 transition-all shadow-lg disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Next'}
                        </button>
                    </div>
                </form>
            )}

            {step === 'scan-qr' && secretData && (
                <form onSubmit={handleVerifyTotp} className="p-4 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-2 rounded-xl border border-slate-200 dark:border-transparent">
                            <QRCodeCanvas value={secretData.totpURI || secretData.uri || ''} size={160} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Scan Logic</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Scan the QR code with your authenticator app (Google Auth, Authy, etc.)</p>
                            <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 select-all border border-slate-200 dark:border-transparent">{secretData.secret}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="totp-code" className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Enter 6-digit Code</label>
                        <input
                            id="totp-code"
                            type="text"
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000 000"
                            className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 py-2 px-4 text-sm text-slate-900 dark:text-white text-center tracking-widest font-mono focus:border-primary-start outline-none"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-rose-500 dark:text-rose-400 text-xs text-center">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setStep('initial')} className="text-slate-500 dark:text-slate-400 text-xs hover:text-slate-900 dark:hover:text-white px-3 py-2">Cancel</button>
                        <button type="submit" disabled={totpCode.length !== 6 || loading} className="bg-gradient-to-r from-primary-start to-primary-end text-slate-900 text-xs font-bold px-4 py-2 rounded-xl hover:brightness-110 transition-all shadow-lg disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Activate 2FA'}
                        </button>
                    </div>
                </form>
            )}

            {step === 'success' && (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30">
                            <span className="material-symbols-outlined text-[28px]">check</span>
                        </div>
                        <h3 className="text-lg font-bold text-emerald-500 dark:text-emerald-400">2FA Enabled Successfully!</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Please save your backup codes in a secure place. You can use these to access your account if you lose your device.
                        </p>
                    </div>

                    {backupCodes.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="bg-slate-50 dark:bg-slate-800 p-2 rounded text-center font-mono text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5 select-all">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(backupCodes.join('\n'));
                                    // You might want to add a toast here, for now we can just change text momentarily if we had state
                                    alert('Backup codes copied to clipboard!');
                                }}
                                className="w-full flex items-center justify-center gap-2 text-primary-start dark:text-primary hover:underline text-sm font-bold"
                            >
                                <span className="material-symbols-outlined text-lg">content_copy</span>
                                Copy All Codes
                            </button>
                        </div>
                    ) : (
                        <p className="text-center text-sm text-slate-500 italic">No backup codes generated. This depends on provider configuration.</p>
                    )}

                    <div className="flex justify-center">
                        <button
                            onClick={() => setStep('initial')}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
