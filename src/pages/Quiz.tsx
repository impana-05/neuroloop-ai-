import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, CheckCircle2, XCircle, ArrowRight, Loader2, Sparkles, MessageSquare, BookOpen, Trash2 } from "lucide-react";
import { aiService } from "@/src/lib/ai";
import { cn } from "@/src/lib/utils";
import { useAuth } from "../lib/AuthContext";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useSearchParams, useNavigate } from "react-router-dom";
import { calculateNextReview } from "../lib/spacedRepetition";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  conceptId: string;
}

export default function Quiz() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contentId = searchParams.get("id");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [difficulty, setDifficulty] = useState("medium");
  const [showTeachBack, setShowTeachBack] = useState(false);
  const [teachBackAnswer, setTeachBackAnswer] = useState("");
  const [teachBackFeedback, setTeachBackFeedback] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeContent, setActiveContent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      if (!user) return;
      try {
        let content;
        if (contentId) {
          const docRef = doc(db, "contents", contentId);
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              content = { id: docSnap.id, ...docSnap.data() };
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, `contents/${contentId}`);
          }
        } else {
          try {
            const q = query(collection(db, "contents"), where("userId", "==", user.uid), where("deleted", "==", false));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              content = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.LIST, "contents");
          }
        }

        if (content) {
          setActiveContent(content);
          const generatedQuestions = await aiService.generateQuestions(content.concepts, difficulty);
          setQuestions(generatedQuestions.map((q: any, i: number) => ({ ...q, id: `q${i}` })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [user, difficulty, contentId]);

  const handleDeleteModule = async () => {
    if (!activeContent || isDeleting) return;
    setIsDeleting(true);
    try {
      const contentRef = doc(db, "contents", activeContent.id);
      await updateDoc(contentRef, { deleted: true });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting module:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const saveResults = async () => {
    if (!user || !activeContent) return;

    try {
      // Save Quiz Attempt
      try {
        await addDoc(collection(db, "quizAttempts"), {
          userId: user.uid,
          contentId: activeContent.id || "unknown",
          questions: questions.map((q, i) => ({
            questionId: q.id,
            correct: q.correctAnswer === (i === currentIndex ? selectedOption : ""), // Simplified for demo
            timeTaken: 10 // Mock
          })),
          score: (score / questions.length) * 100,
          timestamp: Date.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, "quizAttempts");
      }

      // Update User Stats & XP
      const userRef = doc(db, "users", user.uid);
      try {
        await updateDoc(userRef, {
          xp: increment(score * 100),
          "stats.totalQuizzes": increment(1),
          "stats.correctAnswers": increment(score)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }

      // Spaced Repetition Logic for each concept
      for (const q of questions) {
        const isCorrect = q.correctAnswer === (currentIndex === questions.indexOf(q) ? selectedOption : ""); // Simplified
        
        // Update or create performance doc
        const perfQuery = query(
          collection(db, "performance"), 
          where("userId", "==", user.uid), 
          where("topicId", "==", q.conceptId)
        );
        const perfSnap = await getDocs(perfQuery);
        
        if (!perfSnap.empty) {
          const perfDoc = perfSnap.docs[0];
          const data = perfDoc.data();
          
          // Use dynamic spaced repetition algorithm
          const srResult = calculateNextReview(
            isCorrect,
            data.accuracy || 0,
            data.attempts || 0,
            data.weakScore || 0
          );

          await updateDoc(doc(db, "performance", perfDoc.id), {
            attempts: srResult.attempts,
            accuracy: srResult.accuracy,
            lastReviewed: Date.now(),
            nextReviewDate: srResult.nextReviewDate,
            weakScore: srResult.weakScore,
            difficulty: difficulty
          });
        } else {
          // Initial review calculation
          const srResult = calculateNextReview(isCorrect, 0, 0, 0);

          await addDoc(collection(db, "performance"), {
            userId: user.uid,
            topicId: q.conceptId,
            difficulty: difficulty,
            accuracy: srResult.accuracy,
            attempts: srResult.attempts,
            weakScore: srResult.weakScore,
            lastReviewed: Date.now(),
            nextReviewDate: srResult.nextReviewDate
          });
        }
      }

    } catch (err) {
      console.error("Error saving results:", err);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      await saveResults();
      setShowTeachBack(true);
    }
  };

  const handleTeachBackSubmit = async () => {
    setIsEvaluating(true);
    try {
      const feedback = await aiService.evaluateTeachBack(teachBackAnswer, "Neural Networks");
      setTeachBackFeedback(feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
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
          <p className="text-2xl font-bold mb-2">Initializing Neural Loop</p>
          <p className="text-text-muted animate-pulse">Synchronizing conceptual nodes and generating adaptive modules...</p>
        </div>
      </div>
    );
  }

  if (showTeachBack) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/20">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Teach-Back Mode</h1>
          <p className="text-text-muted">To achieve true mastery, explain what you've learned in your own words. Our AI will evaluate your understanding.</p>
        </div>

        <div className="glass-panel p-8 space-y-6 relative overflow-hidden">
          <div className="pulse-ring" />
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">Explain "{activeContent?.title || "Neural Networks"}" to a peer:</h3>
            <button
              onClick={handleDeleteModule}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm font-bold disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Module
            </button>
          </div>
          <textarea
            value={teachBackAnswer}
            onChange={(e) => setTeachBackAnswer(e.target.value)}
            placeholder="Start typing your explanation here..."
            className="w-full h-48 bg-white/3 border border-border rounded-2xl p-6 outline-none focus:border-accent/50 transition-all resize-none text-text"
          />
          
          {teachBackFeedback ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-accent/10 border border-accent/20 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-accent uppercase tracking-widest text-xs">AI Evaluation</span>
                <span className="text-3xl font-bold">{teachBackFeedback.score}/100</span>
              </div>
              <p className="text-text leading-relaxed">{teachBackFeedback.feedback}</p>
              {teachBackFeedback.missedPoints.length > 0 && (
                <div className="pt-4 border-t border-accent/10">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Cognitive Gaps Identified:</p>
                  <ul className="space-y-2">
                    {teachBackFeedback.missedPoints.map((point: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <button
              disabled={teachBackAnswer.length < 20 || isEvaluating}
              onClick={handleTeachBackSubmit}
              className="w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-accent/20"
            >
              {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
              Evaluate My Understanding
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">No Questions Found</p>
          <p className="text-text-muted">We couldn't generate questions for this content. Please try again or upload a different document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-text-muted">
          <span>Module Progress: {currentIndex + 1} / {questions.length}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Difficulty: 
              <select 
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setIsLoading(true);
                  setCurrentIndex(0);
                  setScore(0);
                  setIsAnswered(false);
                  setSelectedOption(null);
                }}
                className="bg-white/5 border border-border rounded-lg px-2 py-1 text-accent focus:outline-none focus:border-accent/50 transition-all cursor-pointer"
              >
                <option value="easy" className="bg-bg">Easy</option>
                <option value="medium" className="bg-bg">Medium</option>
                <option value="hard" className="bg-bg">Hard</option>
              </select>
            </div>
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
          <h2 className="text-2xl md:text-3xl font-bold leading-tight relative z-10">
            {currentQuestion.text}
          </h2>

          {currentQuestion.hint && !isAnswered && (
            <div className="relative z-10">
              <details className="group">
                <summary className="text-xs font-bold text-accent/60 cursor-pointer hover:text-accent transition-colors list-none flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Need a neural nudge?
                </summary>
                <p className="mt-2 text-sm text-text-muted italic bg-white/3 p-3 rounded-lg border border-white/5">
                  {currentQuestion.hint}
                </p>
              </details>
            </div>
          )}

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
                Neural Insight
              </div>
              <p className="text-text-muted leading-relaxed text-sm">
                {currentQuestion.explanation}
              </p>
              <button
                onClick={handleNext}
                className="mt-4 w-full py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
              >
                {currentIndex === questions.length - 1 ? "Complete Neural Loop" : "Next Module"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
