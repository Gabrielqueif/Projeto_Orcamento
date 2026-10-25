'use client'

import { useState } from 'react'

export default function PasswordField() {
    const [ver, setVer] = useState(false)
    return (
        <div className="gp-affix">
            <input
                id="password"
                name="password"
                type={ver ? 'text' : 'password'}
                required
                autoComplete="current-password"
                style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, paddingLeft: 14 }}
            />
            <button
                type="button"
                aria-pressed={ver}
                aria-controls="password"
                onClick={() => setVer(!ver)}
                style={{ minHeight: 44, padding: '0 14px', border: 0, background: 'transparent', color: '#007a85', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
            >
                {ver ? 'Ocultar' : 'Mostrar'}
            </button>
        </div>
    )
}
