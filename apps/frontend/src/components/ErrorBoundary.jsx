import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-slate-800 p-8 rounded-2xl border border-rose-500/30 max-w-2xl w-full flex flex-col items-center gap-4 shadow-2xl">
                        <div className="size-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-rose-500 text-3xl">error</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                        <p className="text-slate-400">The application encountered an unexpected error.</p>

                        <div className="w-full bg-slate-950 p-4 rounded-xl overflow-x-auto text-left border border-white/5 font-mono text-xs text-rose-300 mt-2">
                            <p className="font-bold border-b border-white/10 pb-2 mb-2">{this.state.error?.toString()}</p>
                            <pre>{this.state.errorInfo?.componentStack}</pre>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
