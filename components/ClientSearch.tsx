'use client';

import { useState } from 'react';
import SearchForm from './SearchForm';
import ResultsList from './ResultsList';

export default function ClientSearch() {
  const [offers, setOffers] = useState<any[]>([]);
  return (
    <div>
      <SearchForm onResults={setOffers} />
      <ResultsList offers={offers as any} />
    </div>
  );
}

