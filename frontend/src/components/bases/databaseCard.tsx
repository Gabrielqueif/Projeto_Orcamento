import Link from 'next/dist/client/link';
import * as React from 'react';

type DatabaseCardProps = {
  title: string;
  description: string;
  id?: string;
}

export default function DatabaseCard({ title, description, id }: DatabaseCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-xl h-full md:w-1/3 max-w-sm flex flex-col justify-between">
      <div className="mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-slate-700">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="space-y-4">
        <Link href={`/bases/${id}`}>
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition">
            ver detalhes
          </button>
        </Link>
      </div>
    </div>
  );
}