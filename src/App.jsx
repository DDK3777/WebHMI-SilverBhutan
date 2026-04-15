import { useEffect, useState } from 'react';
import HmiDashboard from './components/HmiDashboard';
import LoginPage from './components/LoginPage';
import { useHmiController } from './hooks/useHmiController';
import {
  fetchAppUserProfile,
  getCurrentSession,
  onAuthStateChange,
  supabase
} from './lib/supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [isDemoAccess, setIsDemoAccess] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const isAuthorized = Boolean(session) || isDemoAccess;
  const {
    hmiState,
    connectionStatus,
    trendRows,
    activityMessage,
    publishPumpCommand,
    activeTrendMetric,
    activeTrendSeries,
    openTrend,
    closeTrend
  } = useHmiController(isAuthorized);

  useEffect(() => {
    let mounted = true;

    getCurrentSession().then(({ session: currentSession }) => {
      if (!mounted) {
        return;
      }

      setSession(currentSession);
      setAuthReady(true);
    });

    const { data } = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setIsDemoAccess(false);
      }
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setUserProfile(null);
      return;
    }

    let mounted = true;

    fetchAppUserProfile(session.user.id).then(({ data }) => {
      if (!mounted) {
        return;
      }

      setUserProfile(data);
    });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  if (!authReady && supabase) {
    return <div className="auth-loading">Checking login session...</div>;
  }

  if (!session && !isDemoAccess) {
    return <LoginPage onDemoAccess={() => setIsDemoAccess(true)} />;
  }

  const normalizedRole = (userProfile?.role || '').toLowerCase();
  const controlsEnabled =
    isDemoAccess || normalizedRole === 'admin' || normalizedRole === 'engineer';

  return (
    <HmiDashboard
      hmiState={hmiState}
      connectionStatus={connectionStatus}
      trendRows={trendRows}
      activityMessage={activityMessage}
      publishPumpCommand={publishPumpCommand}
      isDemoAccess={isDemoAccess}
      userRole={userProfile?.role}
      controlsEnabled={controlsEnabled}
      onOpenTrend={openTrend}
      activeTrendMetric={activeTrendMetric}
      activeTrendSeries={activeTrendSeries}
      onCloseTrend={closeTrend}
      onLogout={() => setIsDemoAccess(false)}
    />
  );
}
