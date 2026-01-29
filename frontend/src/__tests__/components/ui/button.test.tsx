import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
    it('renders button with default props', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('inline-flex') // default class
    })

    it('renders destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>)
        const button = screen.getByRole('button', { name: /delete/i })
        expect(button).toHaveClass('bg-destructive')
    })

    it('renders as a child slot', () => {
        render(
            <Button asChild>
                <a href="/login">Login</a>
            </Button>
        )
        const link = screen.getByRole('link', { name: /login/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveClass('bg-primary') // inherits default button styling
    })
})
