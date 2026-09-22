import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
  }>;
}

const installedStorageKey = "lecturer-locator-installed";

function checkIfStandalone() {
  const browserStandalone =
    window.matchMedia("(display-mode: standalone)").matches;

  const iosStandalone =
    "standalone" in window &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone;

  return browserStandalone || iosStandalone === true;
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(
    () => checkIfStandalone() || localStorage.getItem(installedStorageKey) === "true"
  );
  useEffect(() => {
    const markInstalled = () => {
      localStorage.setItem(installedStorageKey, "true");
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    setIsInstalled((current) => current || checkIfStandalone());

    const handleBeforeInstallPrompt = (event: Event) => {
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", markInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem(installedStorageKey, "true");
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  return {
    installPrompt,
    installApp,
    isInstalled,
  };
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}