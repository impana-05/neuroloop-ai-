import React, { useState } from "react";
import { motion } from "motion/react";
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { contentProcessor } from "@/src/lib/contentProcessor";
import { aiService } from "@/src/lib/ai";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../lib/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

import { useNavigate } from "react-router-dom";

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsProcessing(true);
    setError(null);
    try {
      setStatus("Extracting text from PDF...");
      const text = await contentProcessor.extractFromPdf(file);
      
      setStatus("Analyzing content and generating concepts...");
      const concepts = await aiService.generateConcepts(text);
      
      setStatus("Saving to database...");
      try {
        await addDoc(collection(db, "contents"), {
          userId: user.uid,
          title: file.name.replace(/\.[^/.]+$/, ""),
          rawText: text,
          concepts: concepts.map((c: any, i: number) => ({ ...c, id: `c${i}` })),
          deleted: false,
          createdAt: Date.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "contents");
      }

      setSuccess(true);
      setStatus("Content processed successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to process content. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Initialize Neural Path</h1>
        <p className="text-text-muted">Transform your static materials into an intelligent learning loop.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="pulse-ring" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[300px]">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform">
              <UploadIcon className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">
              {file ? file.name : "Select PDF Document"}
            </h3>
            <p className="text-text-muted text-center mb-8 max-w-xs text-sm">
              Upload your educational materials to synchronize them with your cognitive model.
            </p>
            
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.txt"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-border rounded-xl font-bold cursor-pointer transition-all text-sm"
            >
              Browse Files
            </label>
          </div>
        </div>

        {/* Status Area */}
        <div className="glass-panel p-8 flex flex-col justify-center relative overflow-hidden">
          {isProcessing ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-accent animate-spin" />
                <div className="absolute inset-0 blur-xl bg-accent/20 rounded-full" />
              </div>
              <div>
                <p className="text-xl font-bold mb-2">{status}</p>
                <p className="text-text-muted text-sm animate-pulse">Neural mapping in progress...</p>
              </div>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center border border-success/20">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold mb-2">Synchronization Complete</p>
                <p className="text-text-muted text-sm mb-8">Your content has been structured into conceptual nodes.</p>
              </div>
              <button 
                onClick={() => navigate("/library")}
                className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all shadow-xl shadow-accent/20"
              >
                Start Learning Loop
              </button>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-500 mb-2">Neural Link Failed</p>
                <p className="text-text-muted text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-accent font-bold hover:underline"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                <FileText className="w-8 h-8 text-text-muted" />
              </div>
              <p className="text-text-muted text-sm">Select a neural source to begin the synchronization process.</p>
              <button
                disabled={!file}
                onClick={handleUpload}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all",
                  file ? "bg-accent hover:bg-accent/90 text-white shadow-xl shadow-accent/20" : "bg-white/5 text-text-muted cursor-not-allowed border border-border"
                )}
              >
                Synchronize Content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
