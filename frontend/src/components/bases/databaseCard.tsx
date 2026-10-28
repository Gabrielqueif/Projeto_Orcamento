import Link from 'next/link';

type DatabaseCardProps = {
  title: string;
  description: string;
  id?: string;
  fonte?: string;
  /** Selo ao lado do título, mostrado só no mobile (ex.: quantidade de variantes). */
  badge?: React.ReactNode;
  children?: React.ReactNode;
};

export default function DatabaseCard({ title, description, id, fonte, badge, children }: DatabaseCardProps) {
  const sigla = (fonte ?? title).slice(0, 2).toUpperCase();
  const seinfra = fonte === 'SEINFRA';
  return (
    <article className="gp-card gp-pad gp-4a-dbcard" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          aria-hidden="true"
          style={{ width: 48, height: 48, flex: '0 0 48px', borderRadius: 14, background: seinfra ? '#e0f5f7' : '#E6F6D0', color: seinfra ? '#00626b' : '#3F6604', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}
        >
          {sigla}
        </span>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h3>
          <p style={{ margin: '2px 0 0', fontSize: 14, color: '#475569' }}>{description}</p>
        </div>
        {badge && (
          <div className="gp-only-m">
            <span className={`gp-bg ${seinfra ? 'gp-te' : 'gp-ok'}`}>{badge}</span>
          </div>
        )}
      </div>
      {children}
      <Link href={`/bases/${id}`} className="gp-btn gp-bd" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
        ver detalhes
      </Link>
    </article>
  );
}
