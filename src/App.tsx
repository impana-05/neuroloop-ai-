import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense, memo } from "react";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Revision from "./pages/Revision";
import Upload from "./pages/Upload";
import Quiz from "./pages/Quiz";
import Analytics from "./pages/Analytics";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { Loader2 } from "lucide-react";

// Lazy load Spline for better initial performance
const Spline = lazy(() => import("@splinetool/react-spline"));

// Memoize background to prevent unnecessary re-renders
const Background = memo(() => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <div className="absolute inset-0 bg-[#0a0a0a] -z-30" />
      <div className="absolute inset-0 -z-20">
        <Suspense fallback={<div className="w-full h-full bg-[#0a0a0a]" />}>
          <Spline 
            scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode" 
            className="w-full h-full"
          />
        </Suspense>
      </div>
      <div className="absolute inset-0 bg-black/40 -z-10" />
    </div>
  );
});

Background.displayName = "Background";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Background />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        
        <Route
          path="/dashboard"
          element={
            user ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        <Route
          path="/revision"
          element={
            user ? (
              <Layout>
                <Revision />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        <Route
          path="/library"
          element={
            user ? (
              <Layout>
                <Library />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        <Route
          path="/upload"
          element={
            user ? (
              <Layout>
                <Upload />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        <Route
          path="/quiz"
          element={
            user ? (
              <Layout>
                <Quiz />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        
        <Route
          path="/analytics"
          element={
            user ? (
              <Layout>
                <Analytics />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
