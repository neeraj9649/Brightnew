import React from 'react';
import { Badge, Card } from '../ui';

export const catalogueGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
  gap: 18,
};

export default function WebsiteCatalogueCard({ image, title, details, published, featured, children }) {
  return (
    <Card pad={false}>
      <div style={{ height: 150, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0', background: 'var(--pt-paper)' }}>
        <img src={image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <span style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 6 }}>
          {featured && <Badge tone="gold">Featured</Badge>}
          <Badge tone={published ? 'green' : ''}>{published ? 'Published' : 'Hidden'}</Badge>
        </span>
      </div>
      <div style={{ padding: 16 }}>
        <strong style={{ fontSize: 16, color: 'var(--pt-navy)' }}>{title}</strong>
        {details && <div className="pt-tiny" style={{ marginTop: 6 }}>{details}</div>}
        <div className="pt-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>{children}</div>
      </div>
    </Card>
  );
}
