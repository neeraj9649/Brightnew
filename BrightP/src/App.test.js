import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the public Bright Wings home page', () => {
  render(<App />);
  expect(screen.getByText("Travel & Tourism")).toBeInTheDocument();
});
