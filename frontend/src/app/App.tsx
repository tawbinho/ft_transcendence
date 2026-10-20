import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { createQueryClient } from './queryClient';
import { router } from './router';

export function App() {
  const [queryClient] = useState(createQueryClient);
  // QueryClientProvider gives every component inside it access to one shared data cache. Components can then fetch data from the API, and the answers are stored and reused instead of being requested again.
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
