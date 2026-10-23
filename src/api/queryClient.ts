import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      // Don't hammer the server on 4xx; do retry flaky networks once or twice.
      retry: (count, error) => {
        if (axios.isAxiosError(error) && error.response && error.response.status < 500) return false;
        return count < 2;
      },
    },
  },
});
