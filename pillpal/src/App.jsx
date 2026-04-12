import React, { useMemo, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import { queryClientInstance } from "@/lib/query-clients";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

import PageNotFound from "@/lib/PageNotFound";
import AppShell from "@/components/AppShell";

import Reminders from "@/pages/Reminders";
import History from "@/pages/History";
import Device from "@/pages/Device";
import Profile from "@/pages/Profile";

const FullScreenSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const RequireAuth = ({ children }) => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) return <FullScreenSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

const LoginPage = () => {
  const { toast } = useToast();
  const nav = useNavigate();
  const { login, isLoadingAuth, isAuthenticated, authError } = useAuth();

  const [phone, setPhone] = useState("");

  // If already logged in, go to home
  if (isAuthenticated) return <Navigate to="/" replace />;

  const canSubmit = useMemo(() => phone.trim().length > 0 && !isLoadingAuth, [phone, isLoadingAuth]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const id = await login(phone);
    if (id) {
      toast({ title: "Signed in", description: "Welcome to PillPal." });
      nav("/", { replace: true });
    } else {
      toast({
        title: "Sign in failed",
        description: authError || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-6">
        <div className="mb-6">
          <div className="text-3xl font-semibold tracking-tight">PillPal</div>
          <div className="mt-2 text-lg text-slate-600">
            Manage reminders and connect your smart pill bottle.
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-lg font-medium text-slate-900">Phone number</label>
            <Input
              className="h-12 text-lg"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 18015551234"
              autoComplete="tel"
              inputMode="tel"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-lg" disabled={!canSubmit}>
            {isLoadingAuth ? "Loading..." : "Continue"}
          </Button>

          {authError ? <div className="text-base text-red-600">{String(authError)}</div> : null}
        </form>
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  return (
    <RequireAuth>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Reminders />} />
          <Route path="/history" element={<History />} />
          <Route path="/device" element={<Device />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </RequireAuth>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;