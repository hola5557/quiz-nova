
import React, { useState, useEffect, useRef } from 'react';
import { QuizData, QuizQuestion, QuestionType, QuizConfig, LeaderboardEntry, Difficulty } from '../types';
import { Button, Card, cn, Badge } from './UI';
import { CheckCircle, XCircle, Trophy, ArrowRight, RefreshCcw, Sparkles, Timer, Coins, Crown, Star, Zap, Flame, Target, Award, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizPlayerProps {
  quiz: QuizData;
  config: QuizConfig;
  onRestart: () => void;
}

interface FloatingFeedback {
  id: number;
  text: string;
  type: 'score' | 'streak' | 'combo';
  x?: number;
  y?: number;
}

interface Achievement {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, config, onRestart }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.enableTimer ? config.secondsPerQuestion : 0);
  const [timerActive, setTimerActive] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FloatingFeedback[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  
  // Track stats for achievements
  const [fastestAnswer, setFastestAnswer] = useState<number>(Infinity);
  
  // Animation States
  const [scoreBump, setScoreBump] = useState(false);
  const [coinsBump, setCoinsBump] = useState(false);
  const [streakBump, setStreakBump] = useState(false);

  // Trigger animations on value changes
  useEffect(() => {
    if (score > 0) {
        setScoreBump(true);
        const t = setTimeout(() => setScoreBump(false), 300);
        return () => clearTimeout(t);
    }
  }, [score]);

  useEffect(() => {
    if (coins > 0) {
        setCoinsBump(true);
        const t = setTimeout(() => setCoinsBump(false), 300);
        return () => clearTimeout(t);
    }
  }, [coins]);

  useEffect(() => {
    if (streak > 0) {
        setStreakBump(true);
        const t = setTimeout(() => setStreakBump(false), 300);
        return () => clearTimeout(t);
    }
  }, [streak]);

  // Update max streak
  useEffect(() => {
      if (streak > maxStreak) setMaxStreak(streak);
  }, [streak, maxStreak]);

  // Generate Leaderboard when quiz finishes
  useEffect(() => {
    if (quizFinished) {
        // Pool of catchy names
        const names = [
            "QuantumDrifter", "NebulaNinja", "VoidWalker", "StarGazer", 
            "CosmicPioneer", "GalacticAce", "AstroSurfer", "LunarLegend", 
            "OrbitOwl", "SolarFlare", "WarpSpeed"
        ];
        
        // Randomly select 3-4 names
        const selectedNames = names.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // Generate bots with scores relative to user
        const bots: LeaderboardEntry[] = selectedNames.map(name => {
            // Random score variance: -300 to +300 relative to user coins
            // But ensure at least one is higher if user did poorly, or lower if user did great
            const variance = Math.floor(Math.random() * 600) - 300; 
            const botScore = Math.max(50, coins + variance); 
            return { 
                name, 
                score: botScore, 
                avatar: ["👾", "👽", "🤖", "👨‍🚀", "🛸", "☄️"][Math.floor(Math.random() * 6)] 
            };
        });

        const userEntry = { name: "Captain You", score: coins, avatar: "🦸", isUser: true };
        const finalBoard = [...bots, userEntry].sort((a, b) => b.score - a.score);
        setLeaderboardData(finalBoard);
    }
  }, [quizFinished, coins]);


  // Gamification Constants
  const DIFFICULTY_MULTIPLIER = {
      [Difficulty.EASY]: 1,
      [Difficulty.MEDIUM]: 1.5,
      [Difficulty.HARD]: 2,
      [Difficulty.VERY_HARD]: 3
  };

  const currentQ = quiz.questions[currentIdx];
  const progress = ((currentIdx) / quiz.questions.length) * 100;

  // Timer Effect
  useEffect(() => {
    if (!config.enableTimer || !timerActive || showResult || quizFinished) return;

    const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                clearInterval(timer);
                handleTimeRunOut();
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, showResult, quizFinished, config.enableTimer, currentIdx]);

  // Reset Timer on new question
  useEffect(() => {
    if (config.enableTimer) {
        setTimeLeft(config.secondsPerQuestion);
        setTimerActive(true);
    }
  }, [currentIdx, config.enableTimer, config.secondsPerQuestion]);

  // Confetti effect for finishing
  useEffect(() => {
    if (quizFinished) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [quizFinished]);

  const addFeedback = (text: string, type: 'score' | 'streak' | 'combo') => {
      const id = Date.now() + Math.random();
      setFeedbackList(prev => [...prev, { id, text, type }]);
      setTimeout(() => {
          setFeedbackList(prev => prev.filter(item => item.id !== id));
      }, 1000);
  };

  const handleTimeRunOut = () => {
      setStreak(0);
      setShowResult(true);
      addFeedback("Time's Up!", 'streak');
  };

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    const isCorrect = selectedAnswer.toLowerCase().trim() === currentQ.correctAnswer.toLowerCase().trim();
    setTimerActive(false);

    if (isCorrect) {
      setScore(s => s + 1);
      
      // Calculate time taken
      const timeTaken = config.enableTimer ? config.secondsPerQuestion - timeLeft : 0;
      if (timeTaken < fastestAnswer) setFastestAnswer(timeTaken);

      // Calculate Coins
      const basePoints = 100;
      const diffMult = DIFFICULTY_MULTIPLIER[config.difficulty] || 1;
      const timeBonus = config.enableTimer ? timeLeft * 2 : 0;
      const streakBonus = Math.min(streak * 0.1, 0.5); // Max 50% bonus
      
      const earnedCoins = Math.round((basePoints * diffMult + timeBonus) * (1 + streakBonus));
      
      setCoins(c => c + earnedCoins);
      const newStreak = streak + 1;
      setStreak(newStreak);
      
      // Feedback
      addFeedback(`+${earnedCoins} Coins`, 'score');
      if (newStreak > 1) addFeedback(`${newStreak} Streak! 🔥`, 'streak');
      if (config.enableTimer && timeTaken < 3) addFeedback("Speedy! ⚡", 'combo');

      if (newStreak > 1 || earnedCoins > 150) {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.8 }
          });
      }
    } else {
      setStreak(0);
      addFeedback("Missed!", 'streak');
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(curr => curr + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      setQuizFinished(true);
    }
  };

  const getRank = (percentage: number) => {
      if (percentage === 100) return { title: "Galactic Overlord", icon: <Crown className="w-6 h-6 text-yellow-400" />, color: "text-yellow-400" };
      if (percentage >= 80) return { title: "Star Voyager", icon: <Star className="w-6 h-6 text-fuchsia-400" />, color: "text-fuchsia-400" };
      if (percentage >= 50) return { title: "Space Cadet", icon: <Zap className="w-6 h-6 text-cyan-400" />, color: "text-cyan-400" };
      return { title: "Rocket Rookie", icon: <Timer className="w-6 h-6 text-slate-400" />, color: "text-slate-400" };
  };

  const getAchievements = (finalScore: number, totalQuestions: number, maxStreakVal: number): Achievement[] => {
      const achievements: Achievement[] = [];
      const percentage = (finalScore / totalQuestions) * 100;

      if (percentage === 100) {
          achievements.push({
              id: 'perfectionist', title: 'Perfectionist', 
              icon: <Target className="w-5 h-5" />, 
              description: 'Answered every question correctly!',
              color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-500/50'
          });
      }
      
      if (maxStreakVal >= 5) {
          achievements.push({
              id: 'unstoppable', title: 'Unstoppable',
              icon: <Flame className="w-5 h-5" />,
              description: `Reached a streak of ${maxStreakVal}!`,
              color: 'text-orange-400 bg-orange-400/10 border-orange-500/50'
          });
      }

      if (config.enableTimer && fastestAnswer < 5) {
          achievements.push({
              id: 'speedster', title: 'Speed Demon',
              icon: <Zap className="w-5 h-5" />,
              description: 'Answered a question in under 5 seconds!',
              color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/50'
          });
      }

      if (percentage >= 50 && percentage < 100) {
           achievements.push({
              id: 'knowledgeable', title: 'Knowledge Seeker',
              icon: <Award className="w-5 h-5" />,
              description: 'Passed the quiz with good standing.',
              color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/50'
          });
      }
      
      return achievements;
  };

  if (quizFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const rank = getRank(percentage);
    const earnedAchievements = getAchievements(score, quiz.questions.length, maxStreak);

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-scale-in pb-12">
        <div className="mb-6 relative animate-float">
            <div className="absolute inset-0 bg-fuchsia-500 blur-[60px] opacity-40 rounded-full"></div>
            <Trophy className="w-24 h-24 text-yellow-400 relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-2">Mission Complete!</h2>
        <div className="flex items-center gap-2 justify-center mb-8">
            {rank.icon}
            <span className={cn("text-xl font-bold", rank.color)}>{rank.title}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8">
            <Card className="flex flex-col items-center bg-slate-800/80 p-4 transform hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" hover={true}>
                <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">Score</span>
                <span className="text-2xl font-bold text-white">{score}/{quiz.questions.length}</span>
            </Card>
            <Card className="flex flex-col items-center bg-slate-800/80 p-4 transform hover:scale-105 transition-transform duration-300 delay-75 hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]" hover={true}>
                <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">Coins</span>
                <span className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {coins}
                </span>
            </Card>
            <Card className="flex flex-col items-center bg-slate-800/80 p-4 transform hover:scale-105 transition-transform duration-300 delay-150 hover:shadow-[0_0_20px_rgba(232,121,249,0.2)]" hover={true}>
                <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">Best Streak</span>
                <span className="text-2xl font-bold text-fuchsia-400 flex items-center gap-1">
                    <Flame className="w-4 h-4" /> {maxStreak}
                </span>
            </Card>
        </div>

        {/* Achievements Section */}
        {earnedAchievements.length > 0 && (
             <div className="w-full max-w-lg mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-2 mb-3 px-2">
                    <Award className="w-5 h-5 text-fuchsia-400" />
                    <h3 className="font-bold text-slate-200">Badges Earned</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {earnedAchievements.map((ach) => (
                        <div key={ach.id} className={cn("flex items-start gap-3 p-3 rounded-xl border bg-slate-900/50 hover:scale-[1.02] transition-transform", ach.color)}>
                            <div className="p-2 rounded-full bg-slate-900/30 shrink-0">
                                {ach.icon}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-slate-100">{ach.title}</p>
                                <p className="text-xs text-slate-400 leading-tight mt-1">{ach.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Leaderboard */}
        <div className="w-full max-w-lg mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-4 bg-slate-800/80 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" /> Galactic Leaderboard
                    </h3>
                    <span className="text-xs text-slate-500">Global Rank</span>
                </div>
                <div>
                    {leaderboardData.map((entry, idx) => (
                        <div 
                            key={idx}
                            className={cn(
                                "flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors",
                                entry.isUser ? "bg-fuchsia-500/10" : ""
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className={cn(
                                    "w-6 text-center font-bold",
                                    idx === 0 ? "text-yellow-400" : 
                                    idx === 1 ? "text-slate-300" :
                                    idx === 2 ? "text-amber-600" : "text-slate-500"
                                )}>#{idx + 1}</span>
                                <span className="text-xl animate-float" style={{ animationDelay: `${idx * 0.5}s` }}>{entry.avatar}</span>
                                <span className={cn("font-medium", entry.isUser ? "text-fuchsia-300" : "text-slate-300")}>
                                    {entry.name} {entry.isUser && "(You)"}
                                </span>
                            </div>
                            <span className="font-mono text-yellow-500">{entry.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <Button onClick={onRestart} size="lg">
          <RefreshCcw className="w-5 h-5" /> Play Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      {/* Floating Feedback Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {feedbackList.map((fb) => (
              <div 
                key={fb.id}
                className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 text-2xl font-bold animate-float-up-fade text-shadow-lg whitespace-nowrap",
                    fb.type === 'score' ? "text-yellow-400" :
                    fb.type === 'streak' ? "text-fuchsia-400 text-3xl" : "text-cyan-400"
                )}
                style={{ top: '40%' }} // Start slightly above center
              >
                  {fb.text}
              </div>
          ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-300">
                Question {currentIdx + 1}
            </h2>
            <span className="text-slate-400 text-sm">of {quiz.questions.length}</span>
        </div>
        
        <div className="flex items-center gap-3">
             {/* Timer */}
             {config.enableTimer && (
                <div className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full border overflow-hidden relative transition-colors",
                    timeLeft <= 5 ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" : "bg-slate-800/50 border-white/10 text-cyan-400"
                )}>
                    <Timer className="w-4 h-4" />
                    <span className="font-mono font-bold w-6 text-center">{timeLeft}s</span>
                </div>
            )}

            {/* Score */}
            <div className={cn(
                "flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full border border-white/10 overflow-hidden relative transition-all duration-300",
                scoreBump && "animate-score-bump border-fuchsia-500/50 bg-fuchsia-900/20"
            )}>
                <Trophy className={cn("w-4 h-4 transition-colors", scoreBump ? "text-fuchsia-400" : "text-yellow-400")} />
                <span className="font-mono font-bold text-white relative z-10">{score}</span>
            </div>

            {/* Coins */}
             <div className={cn(
                 "flex items-center gap-1 bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-500/30 overflow-hidden relative transition-all duration-300",
                 coinsBump && "animate-score-bump border-yellow-400 bg-yellow-900/40"
             )}>
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-mono font-bold text-yellow-400 relative z-10">{coins}</span>
            </div>

            {/* Streak */}
            {streak > 1 && (
                <div className={cn(
                    "hidden md:flex items-center gap-1 bg-fuchsia-500/20 px-3 py-1 rounded-full border border-fuchsia-500/50 transition-all",
                    streakBump && "animate-score-bump",
                    streak > 4 && "animate-shake bg-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.3)]"
                )}>
                    <Flame className={cn("w-4 h-4", streak > 4 ? "text-orange-400" : "text-fuchsia-300")} />
                    <span className={cn("font-bold", streak > 4 ? "text-orange-200" : "text-fuchsia-300")}>
                        {streak} {streak > 4 ? "ON FIRE!" : "Streak"}
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
        >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse"></div>
        </div>
      </div>

      {/* Question Card */}
      {/* Key is important to trigger re-animation on question change */}
      <Card key={currentIdx} className="mb-8 relative overflow-hidden group animate-scale-in" hover={false}>
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-fuchsia-500"></div>
        <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
          {currentQ.question}
        </h3>
        {currentQ.type === 'fill_in' && (
             <p className="mt-4 text-sm text-slate-400 italic">Type your answer below</p>
        )}
      </Card>

      {/* Options Area */}
      <div className="space-y-4 mb-8">
        {/* Multiple Choice & True/False */}
        {(currentQ.type === 'mcq' || currentQ.type === 'true_false') && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {currentQ.options?.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQ.correctAnswer;
                
                let btnStyle = "bg-slate-800/50 hover:bg-slate-700 text-slate-200 border-white/5";
                
                if (showResult) {
                    if (isCorrect) btnStyle = "bg-green-500/20 border-green-500 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                    else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-100 opacity-60";
                    else btnStyle = "opacity-40 grayscale";
                } else if (isSelected) {
                    btnStyle = "bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]";
                }

                return (
                    <button
                        key={`${currentIdx}-${idx}`}
                        onClick={() => handleAnswer(option)}
                        disabled={showResult}
                        style={{ animationDelay: `${idx * 100}ms` }}
                        className={cn(
                            "p-4 rounded-xl border text-left transition-all duration-300 relative transform active:scale-[0.98] animate-fade-in-up opacity-0 group overflow-hidden",
                            !showResult && "hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/30",
                            btnStyle
                        )}
                    >
                        <span className="flex items-center justify-between transition-transform duration-300 group-hover:translate-x-1">
                            <span>{option}</span>
                            {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-400 animate-pop" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                        </span>
                        {!showResult && !isSelected && (
                             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        )}
                    </button>
                );
             })}
           </div>
        )}

        {/* Short Answer / Fill in blank */}
        {(currentQ.type === 'short' || currentQ.type === 'fill_in') && (
            <div className="relative animate-fade-in-up">
                <input 
                    type="text" 
                    value={selectedAnswer}
                    onChange={(e) => handleAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Type your answer here..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                />
                 {showResult && (
                    <div className="mt-4 p-4 rounded-xl bg-green-900/20 border border-green-500/30 animate-fade-in flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-green-300 text-sm font-bold uppercase mb-1">Correct Answer</p>
                            <p className="text-white font-medium">{currentQ.correctAnswer}</p>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className="mb-8 animate-fade-in-up">
            <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 rounded-xl p-4 shadow-[0_0_20px_rgba(217,70,239,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-24 h-24 text-fuchsia-500" />
                </div>
                <div className="flex items-center gap-2 mb-2 text-fuchsia-300 font-bold uppercase text-sm relative z-10">
                    <Sparkles className="w-4 h-4" /> Explanation
                </div>
                <p className="text-slate-200 relative z-10">{currentQ.explanation}</p>
            </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer} size="lg">
                Submit Answer
            </Button>
        ) : (
            <Button onClick={handleNext} size="lg" className="group">
                {currentIdx < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        )}
      </div>
    </div>
  );
};
