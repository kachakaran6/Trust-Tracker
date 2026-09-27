import { useState, useEffect, useCallback } from "react";
import { groupService } from "../services/groupService";
import { Group } from "../types";

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupService.getMyGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = async (name: string, description?: string) => {
    const newGroup = await groupService.createGroup(name, description);
    await loadGroups();
    return newGroup;
  };

  const joinGroup = async (code: string) => {
    const res = await groupService.joinGroup(code);
    await loadGroups();
    return res;
  };

  return {
    groups,
    loading,
    error,
    loadGroups,
    createGroup,
    joinGroup,
  };
};
