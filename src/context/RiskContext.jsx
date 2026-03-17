import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback, useRef } from 'react';
import { API_ENDPOINTS, apiRequest, getAuthToken } from '../config/api';
import { computeRiskScore, getRiskLevel } from '../utils/risk';

const RiskContext = createContext(null);

function normalizeRisk(input) {
  // If score is explicitly set (e.g., from mitigation plan), use it and don't recalculate
  // This prevents normalizeRisk from overwriting residual scores
  let score = input.score;
  
  // Only compute score if it's not explicitly set and possibility/impact exist
  if (score === undefined || score === null || score === 0) {
    const hasPossibility = (input.possibility || input.possibilityType || input.likelihood) && 
                          (input.possibility || input.possibilityType || input.likelihood) !== 0;
    const hasImpact = (input.impactLevel || input.impact) && 
                      (input.impactLevel || input.impact) !== 0;
    
    score = (hasPossibility && hasImpact) ? computeRiskScore(input) : 0;
  }
  
  // Ensure score is a number
  score = Number(score) || 0;
  
  const lvl = getRiskLevel(score);
  return {
    ...input,
    score,
    level: lvl?.label ?? null,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'set': {
      return action.payload || [];
    }
    case 'add': {
      return [normalizeRisk(action.payload), ...state];
    }
    case 'remove': {
      return state.filter((r) => r.id !== action.payload);
    }
    case 'update': {
      return state.map((r) => {
        if (r.id !== action.payload.id) return r;
        return normalizeRisk({ ...r, ...action.payload });
      });
    }
    default:
      return state;
  }
}

export function RiskProvider({ children }) {
  const [risks, dispatch] = useReducer(reducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use refs to avoid stale closures in useCallback
  const setIsLoadingRef = useRef(setIsLoading);
  const setErrorRef = useRef(setError);
  const dispatchRef = useRef(dispatch);

  // Keep refs in sync with current setters
  useEffect(() => {
    setIsLoadingRef.current = setIsLoading;
    setErrorRef.current = setError;
    dispatchRef.current = dispatch;
  }, [setIsLoading, setError, dispatch]);

  // Fetch risks from API
  // Using refs for setters to avoid dependency issues while keeping function stable
  const fetchRisks = useCallback(async (forceRefresh = false, sortBy = 'highest-risk') => {
    // Check if user is authenticated before fetching
    const token = getAuthToken();
    if (!token) {
      setIsLoadingRef.current(false);
      dispatchRef.current({ type: 'set', payload: [] });
      return;
    }

    try {
      setIsLoadingRef.current(true);
      setErrorRef.current(null);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Build URL with sorting and pagination parameters
      // limit=500 covers most organisations; increase if needed
      const url = new URL(API_ENDPOINTS.risks.getAll, window.location.origin);
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('limit', '500');
      
      // When forceRefresh=true, tell the server to bypass its cache and return fresh data
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }
      // Always add a timestamp so the browser never serves a cached response
      url.searchParams.set('_t', Date.now().toString());

      const data = await apiRequest(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store', // Always bypass browser cache — server-side cache handles performance
      });
      
      clearTimeout(timeoutId);
      const normalizedRisks = (data.risks || []).map(normalizeRisk);
      dispatchRef.current({ type: 'set', payload: normalizedRisks });
    } catch (err) {
      // Handle different error types
      if (err.name === 'AbortError') {
        setErrorRef.current('Request timeout. Please check your connection.');
      } else if (err.message?.includes('fetch')) {
        setErrorRef.current('Unable to connect to server. Please check if the backend is running.');
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setErrorRef.current('Session expired. Please login again.');
        // Clear token if unauthorized
        localStorage.removeItem('minlt:auth:token');
      } else {
        setErrorRef.current(err.message || 'Failed to fetch risks');
      }
      
      dispatchRef.current({ type: 'set', payload: [] });
    } finally {
      setIsLoadingRef.current(false);
    }
  }, []); // Empty deps - function is stable, uses refs for current state setters

  // Track if initial fetch has been done to prevent multiple calls
  const hasInitialFetch = useRef(false);

  // Initial fetch on mount
  // Always force refresh on initial page load to get fresh data from database
  // This ensures browser refresh (Ctrl+R) always gets latest data
  useEffect(() => {
    // Only fetch once on initial mount
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true;
      fetchRisks(true, 'highest-risk');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount, fetchRisks is stable

  // Listen for login/logout events to refresh risks
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Listen for token changes (login/logout)
      if (e.key === 'minlt:auth:token' || e.key === null) {
        // Token was added (login) or removed (logout)
        // Small delay to ensure token is set/removed
        setTimeout(() => {
          fetchRisks(true, 'highest-risk');
        }, 100);
      }
    };

    // Listen for custom login event
    const handleLogin = () => {
      setTimeout(() => {
        fetchRisks(true, 'highest-risk');
      }, 100);
    };

    // Listen for custom logout event
    const handleLogout = () => {
      // Clear risks immediately on logout
      dispatch({ type: 'set', payload: [] });
      setIsLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-login', handleLogin);
    window.addEventListener('user-logout', handleLogout);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-login', handleLogin);
      window.removeEventListener('user-logout', handleLogout);
    };
  }, [fetchRisks]);

  const api = useMemo(() => {
    return {
      risks,
      isLoading,
      error,
      addRisk: async (riskData) => {
        const controller = new AbortController();
        try {
          const response = await apiRequest(API_ENDPOINTS.risks.create, {
            method: 'POST',
            body: JSON.stringify(riskData),
            signal: controller.signal,
          });
          
          // Refresh risks from API immediately after create
          await fetchRisks(true, 'highest-risk');
          
          return response;
        } catch (err) {
          if (err.name === 'AbortError') {
            return; // Request was cancelled
          }
          throw err;
        }
      },
      updateRisk: async (riskData) => {
        const controller = new AbortController();
        try {
          if (!riskData.id) {
            throw new Error('Risk ID is required for update');
          }

          // Optimistic update: reflect change in UI immediately
          dispatch({ type: 'update', payload: riskData });

          await apiRequest(API_ENDPOINTS.risks.update(riskData.id), {
            method: 'PUT',
            body: JSON.stringify(riskData),
            signal: controller.signal,
          });

          // Sync with server to get canonical data (scores, derived fields, etc.)
          await fetchRisks(true, 'highest-risk');
        } catch (err) {
          if (err.name === 'AbortError') {
            return; // Request was cancelled
          }
          // On error, re-fetch to restore correct state
          await fetchRisks(true, 'highest-risk');
          throw err;
        }
      },
      removeRisk: async (riskId) => {
        const controller = new AbortController();
        try {
          // Optimistic removal: remove from UI instantly before API responds
          dispatch({ type: 'remove', payload: riskId });

          await apiRequest(API_ENDPOINTS.risks.delete(riskId), {
            method: 'DELETE',
            signal: controller.signal,
          });

          // Sync with server to confirm deletion and refresh totals
          await fetchRisks(true, 'highest-risk');
        } catch (err) {
          if (err.name === 'AbortError') {
            return; // Request was cancelled
          }
          // On error, re-fetch to restore correct state
          await fetchRisks(true, 'highest-risk');
          throw err;
        }
      },
      refreshRisks: async (sortBy = 'highest-risk') => {
        await fetchRisks(true, sortBy);
      },
      fetchRisks: fetchRisks, // Expose fetchRisks
    };
  }, [risks, isLoading, error, fetchRisks]);

  return <RiskContext.Provider value={api}>{children}</RiskContext.Provider>;
}

export function useRisks() {
  const ctx = useContext(RiskContext);
  if (!ctx) throw new Error('useRisks must be used within a RiskProvider');
  return ctx;
}
