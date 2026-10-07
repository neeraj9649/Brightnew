import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the public Bright Wings landing page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Your next journey/i);
  expect(screen.getAllByText(/Join/i).length).toBeGreaterThan(0);
});
