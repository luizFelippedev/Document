import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { useAuth } from '../../src/hooks/useAuth';
jest.mock('../../src/hooks/useAuth');
describe('Auth Integration Tests', () => {
  test('login form submits correctly', () => {
    const mockLogin = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
    render(<LoginForm />);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
