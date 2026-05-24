import useSWR from "swr";
import { axios } from "../../api/index";
import { DEFAULT_SWR_OPTIONS } from "@/lib/swrConfig";

export function useMegaschaakTeamDetails(expandedTeamId: number | null) {
  return useSWR<unknown>(
    expandedTeamId ? `megaschaak/team/${expandedTeamId}/details` : null,
    async () => {
      if (expandedTeamId == null) return null;
      const response = await axios.get(
        `/megaschaak/team/${expandedTeamId}/details`,
      );
      return response.data;
    },
    DEFAULT_SWR_OPTIONS,
  );
}
