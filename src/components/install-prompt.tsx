"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let promptEvent: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function subscribePrompt(onStoreChange: () => void) {
  promptListeners.add(onStoreChange);
  return () => {
    promptListeners.delete(onStoreChange);
  };
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    promptEvent = event as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener());
  });
}

function getPromptSnapshot() {
  return promptEvent;
}

function subscribeStandalone(onStoreChange: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getStandaloneSnapshot() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function useClientReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function InstallPrompt() {
  const ready = useClientReady();
  const deferred = useSyncExternalStore(
    subscribePrompt,
    getPromptSnapshot,
    () => null,
  );
  const standalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    () => true,
  );
  const [closed, setClosed] = useState(false);

  if (!ready || standalone || closed) {
    return null;
  }
  if (sessionStorage.getItem("pb-install-closed") === "1") {
    return null;
  }

  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!deferred && !ios) {
    return null;
  }

  async function install() {
    if (!deferred) {
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setClosed(true);
    }
    promptEvent = null;
    promptListeners.forEach((listener) => listener());
  }

  function close() {
    sessionStorage.setItem("pb-install-closed", "1");
    setClosed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t border-border bg-card px-4 py-3 md:bottom-0">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">Install this app</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ios && !deferred
              ? "On iPhone, open Share and choose Add to Home Screen."
              : `Add ${APP_NAME} to this device for quicker access.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {deferred ? (
            <Button type="button" className="min-h-11 px-4" onClick={() => void install()}>
              Install
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-4"
            onClick={close}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
