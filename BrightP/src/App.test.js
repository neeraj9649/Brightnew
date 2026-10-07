import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the public Bright Wings home page', () => {
  render(<App />);
  expect(screen.getAllByText("Travel & Tourism").length).toBeGreaterThan(0);
});
