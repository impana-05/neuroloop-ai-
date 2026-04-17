import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, CheckCircle2, XCircle, ArrowRight, Loader2, Sparkles, TrendingUp, Target, RotateCcw } from "lucide-react";
import { aiService } from "@/src/lib/ai";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../lib/AuthContext";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useNavigate, Link } from "react-router-dom";
import { calculateNextReview } from "../lib/spacedRepetition";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  conceptId: string;
  hint: string;
}

export default function Revision() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [weakTopicsFound, setWeakTopicsFound] = useState<any[]>([]);
  const [previousAccuracy, setPreviousAccuracy] = useState(0);

  useEffect(() => {
    const startRevision = async () => {
      if (!user) return;
      try {
        // 1. Fetch performance data to find weak topics
        const perfQuery = query(collection(db, "performance"), where("userId", "==", user.uid));
        const perfSnap = await getDocs(perfQuery);
        
        if (perfSnap.empty) {
          setIsLoading(false);
          return;
        }

        const perfData = perfSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Calculate average previous accuracy for final summary
        const avgAcc = perfData.reduce((acc, curr: any) => acc + (curr.accuracy || 0), 0) / perfData.length;
        setPreviousAccuracy(avgAcc);

        // Identify weak topics (sort by weakScore descending)
        const sortedWeak = [...perfData].sort((a: any, b: any) => (b.weakScore || 0) - (a.weakScore || 0)).slice(0, 5);
        
        // 2. To get descriptions, we need to fetch contents
        const contentsQuery = query(collection(db, "contents"), where("userId", "==", user.uid), where("deleted", "==", false));
        const contentsSnap = await getDocs(contentsQuery);
        const allConcepts: any[] = [];
        contentsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.concepts) {
            allConcepts.push(...data.concepts);
          }
        });

        // Match weak performance IDs to full concept data
        const weakTopicsWithContext = sortedWeak.map((pw: any) => {
          const fullConcept = allConcepts.find(c => c.id === pw.topicId) || { title: pw.topicId, description: "Review of " + pw.topicId };
          return {
            ...fullConcept,
            weakScore: pw.weakScore,
            accuracy: pw.accuracy
          };
        });

        setWeakTopicsFound(weakTopicsWithContext);

        // 3. Generate Revision Questions
        const generatedQuestions = await aiService.generateRevisionQuestions(weakTopicsWithContext);
        setQuestions(generatedQuestions.map((q: any, i: number) => ({ ...q, id: `rev_q${i}` })));

      } catch (err) {
        console.error("Revision Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    startRevision();
  }, [user]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      await saveRevisionResults();
      setSessionComplete(true);
    }
  };

  const saveRevisionResults = async () => {
    if (!user) return;
    try {
      // Update User Stats & XP
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        xp: increment(score * 150), // Bonus XP for revision
        "stats.totalQuizzes": increment(1),
        "stats.correctAnswers": increment(score)
      });

      // Update performance for each topic in the revision
      for (const q of questions) {
        const isCorrect = q.correctAnswer === (currentIndex === questions.indexOf(q) ? selectedOption : ""); // Simplified
        const perfQuery = query(
          collection(db, "performance"), 
          where("userId", "==", user.uid), 
          where("topicId", "==", q.conceptId)
        );
        const perfSnap = await getDocs(perfQuery);
        
        if (!perfSnap.empty) {
          const perfDoc = perfSnap.docs[0];
          const data = perfDoc.data();
          const srResult = calculateNextReview(isCorrect, data.accuracy || 0, data.attempts || 0, data.weakScore || 0);
          await updateDoc(doc(db, "performance", perfDoc.id), {
            attempts: srResult.attempts,
            accuracy: srResult.accuracy,
            lastReviewed: Date.now(),
            nextReviewDate: srResult.nextReviewDate,
            weakScore: srResult.weakScore
          });
        }
      }
    } catch (err) {
      console.error("Error saving revision results:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-accent animate-spin" />
          <div className="absolute inset-0 blur-2xl bg-accent/20 rounded-full" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Initializing Smart Revision</p>
          <p className="text-text-muted animate-pulse">Scanning cognitive weak points and curating custom review modules...</p>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const currentAccuracy = (score / questions.length) * 100;
    const improvement = currentAccuracy - previousAccuracy;

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-success/20">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Revision Complete</h1>
          <p className="text-text-muted">Great job! You've strengthened your neural connections in your weakest areas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Session Accuracy</p>
            <p className="text-4xl font-bold text-accent">{Math.round(currentAccuracy)}%</p>
          </div>
          <div className="glass-panel p-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Neural Improvement</p>
            <p className="text-4xl font-bold text-success">
              {improvement > 0 ? `+${Math.round(improvement)}%` : `${Math.round(improvement)}%`}
            </p>
          </div>
        </div>

        <div className="glass-panel p-8">
          <h3 className="text-xl font-bold mb-6">Weak Topics Improved:</h3>
          <div className="space-y-4">
            {weakTopicsFound.map((topic, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{topic.title}</span>
                </div>
                <div className="text-xs font-bold text-success">Reinforced</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/dashboard" className="flex-1 py-4 bg-white/5 border border-border rounded-2xl font-bold text-center hover:bg-white/10 transition-all">
            Back to Dashboard
          </Link>
          <button onClick={() => window.location.reload()} className="flex-1 py-4 bg-accent text-white rounded-2xl font-bold hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Start Another Session
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Neural Strength Sufficient</p>
          <p className="text-text-muted mb-8 max-w-sm mx-auto">No critical weak points detected. Continue your regular learning loops to build more data.</p>
          <Link to="/dashboard" className="px-8 py-3 bg-accent text-white font-bold rounded-xl shadow-lg">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-text-muted">
          <span>Revision Loop: {currentIndex + 1} / {questions.length}</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent">
            <Sparkles className="w-3 h-3" />
            Weak Area Focus
          </div>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            className="h-full bg-accent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-panel p-8 md:p-12 space-y-10 relative overflow-hidden"
        >
          <div className="pulse-ring" />
          <div className="flex items-center justify-between mb-2">
            <div className="px-3 py-1 bg-white/5 border border-border rounded-lg text-[10px] uppercase tracking-tighter font-bold text-text-muted">
              Topic: {weakTopicsFound.find(t => t.id === currentQuestion.conceptId)?.title || "Weak Point"}
            </div>
            <div className="text-[10px] uppercase font-bold text-accent">Mode: Smart Revision</div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold leading-tight relative z-10">
            {currentQuestion.text}
          </h2>

          <div className="relative z-10">
            <details className="group" open={!isAnswered}>
              <summary className="text-xs font-bold text-accent/60 cursor-pointer hover:text-accent transition-colors list-none flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Revision Hint
              </summary>
              <p className="mt-2 text-sm text-text-muted italic bg-white/3 p-4 rounded-xl border border-white/5">
                {currentQuestion.hint}
              </p>
            </details>
          </div>

          <div className="grid grid-cols-1 gap-4 relative z-10">
            {currentQuestion.options.map((option) => {
              const isCorrect = option === currentQuestion.correctAnswer;
              const isSelected = option === selectedOption;
              
              return (
                <button
                  key={option}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(option)}
                  className={cn(
                    "p-6 rounded-2xl border text-left transition-all flex items-center justify-between group relative overflow-hidden",
                    !isAnswered && "border-border bg-white/3 hover:border-accent/50 hover:bg-accent/5",
                    isAnswered && isCorrect && "border-success bg-success/10",
                    isAnswered && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                    isAnswered && !isSelected && !isCorrect && "border-border opacity-30"
                  )}
                >
                  <span className="font-medium relative z-10">{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-success relative z-10" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500 relative z-10" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-white/3 border border-border rounded-2xl space-y-4 relative z-10"
            >
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-widest">
                <Brain className="w-4 h-4" />
                Clear Explanation
              </div>
              <p className="text-text-muted leading-relaxed text-sm">
                {currentQuestion.explanation}
              </p>
              <button
                onClick={handleNext}
                className="mt-4 w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
              >
                {currentIndex === questions.length - 1 ? "Complete Revision" : "Next Topic"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
