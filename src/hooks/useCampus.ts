import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CAMPUS_STORAGE_KEY,
  DEFAULT_CAMPUS,
  getCampusConfig,
  isCampusId,
  type CampusConfig,
  type CampusId,
} from "../utils/campuses";

const readStoredCampus = (): CampusId => {
  if (typeof window === "undefined") return DEFAULT_CAMPUS;
  try {
    const stored = window.localStorage.getItem(CAMPUS_STORAGE_KEY);
    return isCampusId(stored) ? stored : DEFAULT_CAMPUS;
  } catch {
    return DEFAULT_CAMPUS;
  }
};

export const useCampus = (): {
  campus: CampusId;
  setCampus: (id: CampusId) => void;
  config: CampusConfig;
  isKinshasa: boolean;
  isMontreal: boolean;
} => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campus, setCampusState] = useState<CampusId>(() => {
    const fromQuery = searchParams.get("campus");
    if (isCampusId(fromQuery)) return fromQuery;
    return readStoredCampus();
  });

  useEffect(() => {
    const fromQuery = searchParams.get("campus");
    if (isCampusId(fromQuery) && fromQuery !== campus) {
      setCampusState(fromQuery);
    }
  }, [searchParams, campus]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CAMPUS_STORAGE_KEY, campus);
    } catch {
      // ignore storage failures
    }
  }, [campus]);

  const setCampus = useCallback(
    (id: CampusId) => {
      setCampusState(id);
      const next = new URLSearchParams(searchParams);
      next.set("campus", id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const config = useMemo(() => getCampusConfig(campus), [campus]);

  return {
    campus,
    setCampus,
    config,
    isKinshasa: campus === "kinshasa",
    isMontreal: campus === "montreal",
  };
};
