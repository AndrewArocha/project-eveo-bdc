import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Receipt, CheckCircle2, Globe, Building2, CreditCard, Landmark, Loader2, AlertCircle } from 'lucide-react';
import GlobalLoader from '../../components/UI/GlobalLoader';

type CheckoutStep = 'overview' | 'gateway' | 'confirmation' | 'awaiting' | 'success';

export default function PayrollCheckout() {
    const location = useLocation();
    const navigate = useNavigate();

    const employee = location.state?.employee || { name: 'Unknown Agent', role: 'Staff', owed: 0, baseAccrued: 0, commissions: 0, currency: 'USD', route: 'Standard ACH' };

    const [payBase, setPayBase] = useState(true);
    const [payCommission, setPayCommission] = useState(true);

    const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('overview');
    const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Payload states for the confirmation step
    const [payeeEmail, setPayeeEmail] = useState(employee.name.toLowerCase().replace(' ', '.') + '@dealership.com');
    const [pseBank, setPseBank] = useState('Bancolombia');
    const [documentId, setDocumentId] = useState('');

    const baseToPay = payBase ? employee.baseAccrued : 0;
    const commsToPay = payCommission ? employee.commissions : 0;
    const totalPayment = baseToPay + commsToPay;

    const formatCurrency = (amount: number) => {
        if (employee.currency === 'COP') {
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const handleSelectGateway = (gateway: string) => {
        setSelectedGateway(gateway);
        setCheckoutStep('confirmation');
    };

    const handleInitiateTransfer = () => {
        setIsProcessing(true);

        // Simulate the API call to build the Checkout Session payload
        // e.g., axios.post('/api/pse/create-session', { bank: pseBank, amount: totalPayment })
        setTimeout(() => {
            setIsProcessing(false);
            setCheckoutStep('awaiting');
            // In production: window.open(response.data.checkoutUrl, '_blank');
        }, 2000);
    };

    const simulateWebhookSuccess = () => {
        setCheckoutStep('success');
        setTimeout(() => navigate('/app/account'), 2500);
    };

    const handleBack = () => {
        if (checkoutStep === 'awaiting') setCheckoutStep('confirmation');
        else if (checkoutStep === 'confirmation') setCheckoutStep('gateway');
        else if (checkoutStep === 'gateway') setCheckoutStep('overview');
        else navigate('/app/account');
    };

    const glassCardClasses = `backdrop-blur-xl bg-white/40 dark:bg-[#0a0f16]/40 border border-white/50 dark:border-white/10 shadow-xl rounded-3xl relative overflow-hidden p-8`;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-full w-full max-w-3xl mx-auto px-4 sm:px-8 py-10 relative">

            {/* 🌟 GLOBAL LOADER OVERLAY */}
            {isProcessing && <GlobalLoader text={`Handshaking with ${selectedGateway}...`} />}

            <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 outline-none cursor-pointer"
            >
                <ArrowLeft size={16} />
                {checkoutStep === 'overview' ? 'Back to Payroll Ledger' : 'Back'}
            </button>

            {checkoutStep === 'success' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Disbursement Sent</h2>
                    <p className="text-gray-500">{formatCurrency(totalPayment)} has been routed to {employee.name} via {selectedGateway}.</p>
                    <p className="text-xs font-bold text-gray-400 mt-8 animate-pulse">Redirecting to ledger...</p>
                </motion.div>
            )}

            {checkoutStep === 'awaiting' && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${glassCardClasses} flex flex-col items-center justify-center py-16 text-center`}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="mb-6">
                        <Loader2 size={48} className="text-orange-500" />
                    </motion.div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Awaiting Payment Confirmation</h2>
                    <p className="text-gray-500 mb-8 max-w-md">
                        Please complete the transaction in the securely opened {selectedGateway} window. We are actively listening for the success webhook.
                    </p>

                    <button
                        onClick={simulateWebhookSuccess}
                        className="px-6 py-2 bg-gray-100 dark:bg-white/10 hover:bg-emerald-500/20 text-gray-900 dark:text-white hover:text-emerald-500 border border-gray-200 dark:border-white/10 hover:border-emerald-500/50 text-sm font-bold rounded-xl transition-all outline-none cursor-pointer"
                    >
                        [Demo] Simulate Success Webhook
                    </button>
                </motion.div>
            )}

            {/* 🌟 NEW: CONFIRMATION / PAYLOAD STEP */}
            {checkoutStep === 'confirmation' && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={glassCardClasses}>
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-gray-900 dark:text-white shadow-inner border border-gray-200 dark:border-white/10">
                            {selectedGateway === 'Stripe' && <CreditCard size={28} />}
                            {selectedGateway === 'PayPal' && <Globe size={28} />}
                            {selectedGateway === 'PSE' && <Landmark size={28} />}
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Confirm {selectedGateway} Details</h1>
                        <p className="text-gray-500 mt-1">Verify transfer payload before redirecting.</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 border border-gray-200 dark:border-white/10 mb-8 space-y-4">

                        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-white/10">
                            <span className="text-sm font-bold text-gray-500">Transfer Amount</span>
                            <span className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(totalPayment)}</span>
                        </div>

                        {selectedGateway === 'Stripe' && (
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-bold text-gray-500">Destination Account</span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">**** **** 4092</span>
                            </div>
                        )}

                        {selectedGateway === 'PayPal' && (
                            <div className="flex flex-col gap-2 pt-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Payee PayPal Email</label>
                                <input
                                    type="email"
                                    value={payeeEmail}
                                    onChange={(e) => setPayeeEmail(e.target.value)}
                                    className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                />
                            </div>
                        )}

                        {selectedGateway === 'PSE' && (
                            <div className="flex flex-col gap-4 pt-2">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Financial Institution</label>
                                    <select
                                        value={pseBank}
                                        onChange={(e) => setPseBank(e.target.value)}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-orange-500 appearance-none cursor-pointer"
                                    >
                                        <option>Bancolombia</option>
                                        <option>Nequi</option>
                                        <option>Davivienda</option>
                                        <option>Banco de Bogotá</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Document ID (CC/NIT)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter recipient ID"
                                        value={documentId}
                                        onChange={(e) => setDocumentId(e.target.value)}
                                        className="w-full bg-white dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-6 text-left">
                        <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            <strong className="text-gray-900 dark:text-white block mb-1">Irreversible Action</strong> 
                            Please ensure destination details exactly match the employee's verified ID. Discrepancies may lock funds for up to 5 business days.
                        </p>
                    </div>

                    <button
                        onClick={handleInitiateTransfer}
                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] outline-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Initiate Transfer
                    </button>
                </motion.div>
            )}

            {checkoutStep === 'gateway' && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={glassCardClasses}>
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Select Payment Method</h1>
                        <p className="text-gray-500 mt-1">Processing {formatCurrency(totalPayment)} to {employee.name}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button onClick={() => handleSelectGateway('Stripe')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[#635BFF]/10 border border-[#635BFF]/30 hover:bg-[#635BFF]/20 text-[#635BFF] transition-all cursor-pointer outline-none">
                            <CreditCard size={32} />
                            <span className="font-bold">Stripe</span>
                        </button>
                        <button onClick={() => handleSelectGateway('PayPal')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[#00457C]/10 border border-[#00457C]/30 hover:bg-[#00457C]/20 text-[#0079C1] dark:text-[#00457C] transition-all cursor-pointer outline-none">
                            <Globe size={32} />
                            <span className="font-bold">PayPal</span>
                        </button>
                        <button onClick={() => handleSelectGateway('PSE')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-600 transition-all cursor-pointer outline-none">
                            <Landmark size={32} />
                            <span className="font-bold">PSE</span>
                        </button>
                    </div>
                </motion.div>
            )}

            {checkoutStep === 'overview' && (
                <div className={glassCardClasses}>
                    <div className="absolute top-0 left-0 w-full h-[30%] bg-linear-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/10">
                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Issue Payment</h1>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">{employee.name} • {employee.role}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <button onClick={() => setPayBase(!payBase)} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left outline-none cursor-pointer ${payBase ? 'bg-blue-500/10 border-blue-500/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${payBase ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><Building2 size={18} /></div>
                                    <div><h3 className={`font-bold ${payBase ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>Base Salary (Pro-rated)</h3><p className="text-xs text-gray-500">Based on completed shifts</p></div>
                                </div>
                                <div className={`text-xl font-black ${payBase ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{formatCurrency(employee.baseAccrued)}</div>
                            </button>

                            <button onClick={() => setPayCommission(!payCommission)} className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left outline-none cursor-pointer ${payCommission ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/50 dark:bg-black/20 border-gray-200 dark:border-white/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${payCommission ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}><Receipt size={18} /></div>
                                    <div><h3 className={`font-bold ${payCommission ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>Accrued Commissions</h3><p className="text-xs text-gray-500">Performance bonuses & flats</p></div>
                                </div>
                                <div className={`text-xl font-black ${payCommission ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>{formatCurrency(employee.commissions)}</div>
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-black/40 rounded-2xl p-6 border border-gray-200 dark:border-white/5 mb-8">
                            <div className="flex justify-between items-end mb-4">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Disbursement</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white">{formatCurrency(totalPayment)}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setCheckoutStep('gateway')}
                            disabled={totalPayment === 0}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] outline-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Select Payment Method
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}