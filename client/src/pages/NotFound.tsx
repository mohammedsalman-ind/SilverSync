import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <main style={{ maxWidth: '480px', margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
      <Card title="404 - Page Not Found">
        <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
          The page or healthcare resource you are looking for does not exist or has been moved.
        </p>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant="primary">Return to Home</Button>
        </Link>
      </Card>
    </main>
  );
};
