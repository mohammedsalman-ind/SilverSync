import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Login } from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';
import '../i18n';

expect.extend(toHaveNoViolations);

describe('Login Page Accessibility and Rendering Tests', () => {
  it('renders login form with accessible labels and input fields', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('has zero accessibility violations according to axe', async () => {
    let containerElement: HTMLElement;
    await act(async () => {
      const { container } = render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      );
      containerElement = container;
    });

    const results = await axe(containerElement!);
    expect(results).toHaveNoViolations();
  });
});
