import React, { useEffect, useState } from "react";

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault(); // Prevent auto-popup
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA Installed");
    }

    // Hide box after install or dismiss
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-box">
      <div className="pwa-install-title">📱 Install Ajay Café App</div>
      <div className="pwa-install-sub">
        Get a faster, app-like experience. Works offline too!
      </div>

      <div className="pwa-install-actions">
        <button className="pwa-cancel-btn" onClick={() => setVisible(false)}>
          Not now
        </button>

        <button className="pwa-install-btn" onClick={installPWA}>
          Install
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
