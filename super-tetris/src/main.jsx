/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — main entry point
   ═══════════════════════════════════════════════════════════════════
   Mount le composant App sur #root.
   Wrappé dans un ErrorBoundary pour qu'aucune exception React ne
   white-screen le jeu.
   ═══════════════════════════════════════════════════════════════════ */

class STErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ST] ErrorBoundary caught:", error, info && info.componentStack);
  }
  handleReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.update().catch(()=>{}));
        });
      }
    } catch (_) {}
    window.location.reload();
  };
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#0b1238",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Nunito', sans-serif",
        textAlign: "center",
        color: "#fff",
        zIndex: 9999,
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          background: "linear-gradient(180deg, #ef4444, #b91c1c)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          fontSize: 40,
        }}>⚠️</div>
        <h1 style={{
          fontFamily: "'Lilita One', cursive",
          fontSize: 28,
          marginBottom: 8,
        }}>Oups, un souci technique</h1>
        <p style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.7)",
          maxWidth: 340,
          marginBottom: 24,
          lineHeight: 1.5,
        }}>
          Le jeu a rencontré une erreur inattendue. Recharge pour continuer.
        </p>
        <button
          onClick={this.handleReload}
          className="btn-3d"
          style={{ minWidth: 200 }}
        >Recharger</button>
        {this.state.error && (
          <pre style={{
            marginTop: 24,
            maxWidth: 340,
            padding: 12,
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,210,63,0.4)",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 11,
            color: "#fbbf24",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            overflow: "auto",
          }}>
            {String(this.state.error.message || this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}

(function () {
  const container = document.getElementById("root");
  if (!container) {
    console.error("[ST] #root not found");
    return;
  }
  const root = ReactDOM.createRoot(container);
  root.render(
    <STErrorBoundary>
      <window.App />
    </STErrorBoundary>
  );
})();
