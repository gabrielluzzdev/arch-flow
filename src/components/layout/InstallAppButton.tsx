import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallAppButton() {
  const { installed, canPrompt, isIos, promptInstall } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (installed || (!canPrompt && !isIos)) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (canPrompt ? promptInstall() : setShowIosHelp(true))}
        className="hidden sm:inline-flex"
      >
        <Download className="h-4 w-4" strokeWidth={1.5} />
        <span className="hidden md:inline">Instalar app</span>
      </Button>
      <Modal
        open={showIosHelp}
        onClose={() => setShowIosHelp(false)}
        title="Instalar no iPhone/iPad"
        description="O Safari não instala automaticamente — siga os passos abaixo."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
          <li>
            Toque no ícone de Compartilhar <span className="text-muted-foreground">(o quadrado com a seta para cima)</span> na barra do Safari.
          </li>
          <li>Escolha "Adicionar à Tela de Início".</li>
          <li>Toque em "Adicionar" no canto superior direito.</li>
        </ol>
      </Modal>
    </>
  );
}
