import { render, screen } from '@testing-library/react';
import { TopHeader } from './TopHeader';

describe('TopHeader', () => {
  it('renders without crashing', () => {
    render(<TopHeader />);
    expect(screen.getByText('Construction Form Generator Dashboard')).toBeInTheDocument();
  });

  it('displays the current date and time', () => {
    render(<TopHeader />);
    expect(screen.getByText(/Logged in as:/)).toBeInTheDocument();
  });
});