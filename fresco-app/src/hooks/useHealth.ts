/**
 * Fresco — Health hook
 * Cheap, public, and allowed to fail quietly: Profile shows "unknown" rather
 * than blocking on a server that is temporarily unreachable.
 */

import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../services/system";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
