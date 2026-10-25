'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="gp-ov">
            {/* wrapper carrega o max-w-* do chamador; .gp-dlg tem max-width próprio que o sobrescreveria */}
            <div className={`w-full ${maxWidth} flex max-h-full`}>
                <div
                    className="gp-dlg"
                    style={{ maxWidth: 'none', flex: '1 1 auto', minWidth: 0 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={title}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
                        <h2 className="gp-h2" style={{ margin: 0, fontSize: 21 }}>{title}</h2>
                        <button type="button" onClick={onClose} aria-label="Fechar" className="gp-ib" style={{ width: 40, height: 40 }}>
                            <X size={18} weight="bold" />
                        </button>
                    </div>

                    <div style={{ overflowY: 'auto' }}>{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
}
