import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriorityBadge, StatusPill } from '@/components/StatusBadge';

describe('PriorityBadge', () => {
  it('renders the priority label', () => {
    render(<PriorityBadge priority="CRITICAL" />);
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });
});

describe('StatusPill', () => {
  it('renders a readable status with underscores replaced', () => {
    render(<StatusPill status="EN_ROUTE_TO_HOSPITAL" />);
    expect(screen.getByText('EN ROUTE TO HOSPITAL')).toBeInTheDocument();
  });
});
