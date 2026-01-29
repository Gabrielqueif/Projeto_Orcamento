import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input', () => {
    it('renders input with default props', () => {
        render(<Input placeholder="Type here" />)
        const input = screen.getByPlaceholderText(/type here/i)
        expect(input).toBeInTheDocument()
    })

    it('accepts type attribute', () => {
        render(<Input type="password" placeholder="Password" />)
        const input = screen.getByPlaceholderText(/password/i)
        expect(input).toHaveAttribute('type', 'password')
    })

    it('disabled state', () => {
        render(<Input disabled placeholder="Disabled" />)
        const input = screen.getByPlaceholderText(/disabled/i)
        expect(input).toBeDisabled()
    })
})
