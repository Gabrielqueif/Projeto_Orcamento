import Link from 'next/link';

type DatabaseCardProps = {
  title: string;
  description: string;
  id?: string;
  children?: React.ReactNode;
};

export default function DatabaseCard({ title, description, id, children }: DatabaseCardProps) {
  return (
    <div className="bg-white rounded-lg p-5 md:p-6 shadow-md border border-slate-100 h-full flex flex-col justify-between hover:shadow-lg transition-shadow">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-slate-700">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
        {children}
      </div>
      <div className="space-y-4">
        <Link
          href={`/bases/${id}`}
          className="block w-full text-center bg-brand-primary text-white py-2 px-4 rounded hover:bg-brand-navy transition"
        >
          ver detalhes
        </Link>
      </div>
    </div>
  );
}
