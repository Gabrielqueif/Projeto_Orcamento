"use client";

import { useEffect, useState } from "react";

/** QR do link de convite, para o mestre apontar a câmera do celular. */
export function QrConvite({ valor }: { valor: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    import("qrcode")
      .then((m) => m.toDataURL(valor, { margin: 1, width: 220 }))
      .then((url) => ativo && setSrc(url))
      .catch(() => ativo && setSrc(null));
    return () => {
      ativo = false;
    };
  }, [valor]);

  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="QR code do convite" width={220} height={220} style={{ alignSelf: "center" }} /> : null;
}
