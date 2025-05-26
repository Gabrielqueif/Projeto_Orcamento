'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
    const pathname = usePathname()

    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gray-800">Home</span>
                        </Link>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                        <Link 
                            href="/composicoes" 
                            className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                                pathname === '/composicoes' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            Composições
                        </Link>
                        <Link 
                            href="/insumos" 
                            className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                                pathname === '/insumos' 
                                    ? 'border-blue-500 text-blue-600' 
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            Insumos
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}