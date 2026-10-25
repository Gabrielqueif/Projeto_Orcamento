import Link from 'next/link';

type DatabaseCardProps = {
  title: string;
  description: string;
  id?: string;
  fonte?: string;
  children?: React.ReactNode;
};

export default function DatabaseCard({ title, description, id, fonte, children }: DatabaseCardProps) {
  const sigla = (fonte ?? title).slice(0, 2).toUpperCase();
  const seinfra = fonte === 'SEINFRA';
  return (
    <article className="gp-card gp-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          aria-hidden="true"
          style={{ width: 48, height: 48, borderRadius: 14, background: seinfra ? '#e0f5f7' : '#E6F6D0', color: seinfra ? '#00626b' : '#3F6604', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
        >
          {sigla}
        </span>
        <div style={{ flex: '1 1 auto' }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h3>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#475569' }}>{description}</p>
        </div>
      </div>
      {children}
      <Link href={`/bases/${id}`} className="gp-btn gp-bd" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
        ver detalhes
      </Link>
    </article>
  );
}
