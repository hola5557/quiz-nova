import React, { useState, useRef } from 'react';
import { AppStep, Difficulty, QuestionType, QuizConfig, QuizData, UploadedFile } from './types';
import { generateQuiz, generateExplainerVideo } from './services/geminiService';
import { Button, Card, Label, SelectCard, Toggle, Modal, cn } from './components/UI';
import { QuizPlayer } from './components/QuizPlayer';
import { VoiceAssistant } from './components/VoiceAssistant';
import { Upload, FileText, Image as ImageIcon, Zap, Brain, Layers, Loader2, Sparkles, BookOpen, Timer, Trophy, PlayCircle, Film, Mic, Video } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [config, setConfig] = useState<QuizConfig>({
    difficulty: Difficulty.MEDIUM,
    questionCount: 5,
    questionType: QuestionType.MCQ,
    enableTimer: false,
    secondsPerQuestion: 30
  });
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoLoadingMsg, setVideoLoadingMsg] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');

  // Voice State
  const [showVoice, setShowVoice] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // remove data url prefix for API
        const base64Data = base64String.split(',')[1];
        setUploadedFile({
          name: file.name,
          type: file.type,
          data: base64Data
        });
        setTextInput(''); // clear text if file is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setStep(AppStep.LOADING);
    const msgs = [
        "Consulting the Star Atlas...",
        "Warming up the warp drive...",
        "Decoding ancient alien scripts...",
        "Synthesizing quiz matter...",
        "Almost there, space explorer..."
    ];
    let msgIdx = 0;
    setLoadingMsg(msgs[0]);
    // Faster interval for faster generation feel
    const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % msgs.length;
        setLoadingMsg(msgs[msgIdx]);
    }, 1200);

    try {
      const data = await generateQuiz(textInput, uploadedFile ? { data: uploadedFile.data, type: uploadedFile.type } : null, config);
      setQuizData(data);
      clearInterval(interval);
      setStep(AppStep.PLAYING);
    } catch (error) {
      clearInterval(interval);
      alert("Failed to generate quiz. Please check your content and try again.");
      setStep(AppStep.CONFIG);
    }
  };

  const resetApp = () => {
    setStep(AppStep.UPLOAD);
    setQuizData(null);
    setUploadedFile(null);
    setTextInput('');
  };

  const handleGenerateVideo = async () => {
    // API Key Check for Veo
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        try {
            await window.aistudio.openSelectKey();
        } catch (e) {
            console.error("Key selection failed or cancelled", e);
            return;
        }
    }

    setGeneratingVideo(true);
    setVideoUrl(null); // Reset previous video

    const msgs = [
        "Initializing Veo AI video engine...",
        "Dreaming up the scene...",
        "Rendering 3D assets...",
        "Composing smooth transitions...",
        "Polishing the neon glow...",
        "Finalizing video export..."
    ];
    let msgIdx = 0;
    setVideoLoadingMsg(msgs[0]);
    const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % msgs.length;
        setVideoLoadingMsg(msgs[msgIdx]);
    }, 5000);

    try {
        const url = await generateExplainerVideo(videoPrompt);
        setVideoUrl(url);
    } catch (e) {
        console.error(e);
        alert("Failed to generate video. Please try again later.");
    } finally {
        clearInterval(interval);
        setGeneratingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-fuchsia-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-600/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant isOpen={showVoice} onClose={() => setShowVoice(false)} />

      {/* Video Generation Modal */}
      <Modal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)}>
         <div className="w-full flex flex-col items-center justify-center p-6 min-h-[400px]">
            {!videoUrl && !generatingVideo ? (
                <div className="w-full max-w-md animate-fade-in text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 rounded-full bg-slate-800 border border-white/10 shadow-xl">
                            <Video className="w-8 h-8 text-fuchsia-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Create AI Video</h3>
                    <p className="text-slate-400 mb-6">Describe the video you want Veo to generate.</p>
                    
                    <div className="mb-6">
                        <textarea 
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            placeholder="e.g. A futuristic robot explaining quantum physics in a neon lab..."
                            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 resize-none text-sm"
                        />
                    </div>

                    <Button onClick={handleGenerateVideo} className="w-full">
                        Generate Video <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            ) : generatingVideo ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-fuchsia-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
                        <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Generating Video</h3>
                    <p className="text-slate-400 text-sm max-w-md animate-pulse">{videoLoadingMsg}</p>
                    <p className="text-xs text-slate-600 mt-4">Powered by Veo. This may take a minute.</p>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center">
                    <h3 className="text-xl font-bold text-white mb-4">Your AI Video</h3>
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl mb-4">
                        <video 
                            src={videoUrl || ''} 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain" 
                            onError={() => alert("Video playback failed. The link may have expired.")}
                        />
                    </div>
                    <Button onClick={() => { setVideoUrl(null); setGeneratingVideo(false); }} variant="secondary">
                        Create Another
                    </Button>
                </div>
            )}
         </div>
      </Modal>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 max-w-4xl">
        
        {/* Header */}
        {step !== AppStep.PLAYING && (
          <header className="text-center mb-16 animate-fade-in-down relative">
             <div className="absolute top-0 right-0 md:right-4 hidden md:flex items-center gap-3">
                <Button variant="glass" size="sm" onClick={() => setShowVoice(!showVoice)} className="text-xs backdrop-blur-md gap-2">
                    <Mic className="w-4 h-4 text-fuchsia-400" /> Live Chat
                </Button>
                <Button variant="glass" size="sm" onClick={() => setShowVideoModal(true)} className="text-xs backdrop-blur-md">
                    <Film className="w-4 h-4" /> AI Video
                </Button>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400">
                QuizNova AI
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-6">
              Transform any text, document, or image into an interactive, AI-powered quiz journey. 🚀✨
            </p>
            
            <div className="md:hidden flex justify-center gap-3 mb-6">
                 <Button variant="glass" size="sm" onClick={() => setShowVoice(!showVoice)} className="text-xs">
                    <Mic className="w-4 h-4 text-fuchsia-400" />
                </Button>
                 <Button variant="glass" size="sm" onClick={() => setShowVideoModal(true)} className="text-xs">
                    <Film className="w-4 h-4" />
                </Button>
            </div>
          </header>
        )}

        {/* Step 1: Upload */}
        {step === AppStep.UPLOAD && (
          <div className="animate-fade-in-up">
            <Card className="border-t border-t-cyan-500/50 shadow-[0_0_40px_rgba(8,145,178,0.15)]">
              <div className="mb-6 flex items-center gap-3 text-cyan-400">
                <Upload className="w-6 h-6" />
                <h2 className="text-2xl font-bold">1. Upload Content</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label>Paste Text Content</Label>
                  <textarea
                    value={textInput}
                    onChange={(e) => {
                        setTextInput(e.target.value);
                        if(e.target.value) setUploadedFile(null);
                    }}
                    placeholder="Paste an article, notes, or any text here to generate a quiz from..."
                    className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all resize-none"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-900 text-slate-500 uppercase">Or upload file</span>
                  </div>
                </div>

                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 group",
                        uploadedFile 
                            ? "border-green-500 bg-green-500/10" 
                            : "border-slate-700 hover:border-fuchsia-500 hover:bg-slate-800/50"
                    )}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleFileUpload}
                    />
                    {uploadedFile ? (
                        <div className="flex flex-col items-center text-green-400">
                            <FileText className="w-12 h-12 mb-2" />
                            <p className="font-bold">{uploadedFile.name}</p>
                            <p className="text-sm opacity-80">Ready to analyze</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-fuchsia-400 transition-colors">
                            <div className="flex gap-4 mb-3">
                                <FileText className="w-8 h-8" />
                                <ImageIcon className="w-8 h-8" />
                            </div>
                            <p className="font-medium">Click to upload PDF, Text, or Image</p>
                            <p className="text-xs mt-1 opacity-60">Supports PDF, PNG, JPG, TXT</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    disabled={!textInput && !uploadedFile}
                    onClick={() => setStep(AppStep.CONFIG)}
                    size="lg"
                  >
                    Next Step <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Config */}
        {step === AppStep.CONFIG && (
            <div className="animate-fade-in-up">
                <Card className="border-t border-t-fuchsia-500/50 shadow-[0_0_40px_rgba(217,70,239,0.15)]">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-fuchsia-400">
                            <Zap className="w-6 h-6" />
                            <h2 className="text-2xl font-bold">2. Configure Quiz</h2>
                        </div>
                        <button onClick={() => setStep(AppStep.UPLOAD)} className="text-sm text-slate-500 hover:text-white transition-colors">
                            ← Back
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Difficulty */}
                        <div>
                            <Label>Difficulty Level</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.VERY_HARD].map((diff) => (
                                    <SelectCard
                                        key={diff}
                                        title={diff}
                                        selected={config.difficulty === diff}
                                        onClick={() => setConfig({...config, difficulty: diff})}
                                        icon={<Brain className="w-6 h-6" />}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Question Count */}
                        <div>
                             <div className="flex justify-between items-end mb-2">
                                <Label className="mb-0">Number of Questions</Label>
                                <span className="text-2xl font-bold text-fuchsia-400 font-mono">{config.questionCount}</span>
                             </div>
                             <input 
                                type="range" 
                                min="3" 
                                max="20" 
                                value={config.questionCount}
                                onChange={(e) => setConfig({...config, questionCount: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 hover:accent-fuchsia-400"
                             />
                             <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                                <span>3</span>
                                <span>20</span>
                             </div>
                        </div>

                         {/* Question Type */}
                        <div>
                            <Label>Question Type</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.SHORT_ANSWER, QuestionType.FILL_IN_BLANK].map((t) => (
                                    <SelectCard
                                        key={t}
                                        title={t}
                                        selected={config.questionType === t}
                                        onClick={() => setConfig({...config, questionType: t})}
                                        icon={<Layers className="w-5 h-5" />}
                                    />
                                ))}
                            </div>
                        </div>

                         {/* Challenge Mode */}
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-white/5">
                            <Label className="mb-4 text-fuchsia-300 flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Challenge Options
                            </Label>
                            <Toggle 
                                checked={config.enableTimer} 
                                onChange={(val) => setConfig({...config, enableTimer: val})}
                                label="Enable Timer Mode (Speed Run)"
                            />
                            {config.enableTimer && (
                                <div className="mt-4 animate-fade-in">
                                     <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm text-slate-400">Seconds per Question</span>
                                        <span className="text-lg font-bold text-white font-mono">{config.secondsPerQuestion}s</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="120" 
                                        step="5"
                                        value={config.secondsPerQuestion}
                                        onChange={(e) => setConfig({...config, secondsPerQuestion: parseInt(e.target.value)})}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-6">
                            <Button 
                                onClick={handleGenerate}
                                size="lg"
                                className="w-full text-lg shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                            >
                                Launch Quiz 🚀
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* Loading */}
        {step === AppStep.LOADING && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 rounded-full animate-ping"></div>
                    <Loader2 className="w-16 h-16 text-cyan-400 animate-spin relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Generating Quiz</h3>
                <p className="text-slate-400 animate-pulse">{loadingMsg}</p>
            </div>
        )}

        {/* Quiz & Results */}
        {(step === AppStep.PLAYING || step === AppStep.RESULTS) && quizData && (
             <div className="animate-fade-in-up">
                {step === AppStep.PLAYING && (
                    <div className="mb-8 p-6 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2 text-fuchsia-400 font-bold uppercase tracking-wider text-sm">
                            <BookOpen className="w-4 h-4" /> AI Summary
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{quizData.title}</h2>
                        <p className="text-slate-300 leading-relaxed">{quizData.summary}</p>
                        
                        {/* In-game tools */}
                        <div className="flex gap-2 mt-4 border-t border-white/5 pt-4">
                           <Button variant="glass" size="sm" onClick={() => setShowVoice(true)} className="text-xs">
                             <Mic className="w-3 h-3 mr-1" /> Ask Assistant
                           </Button>
                        </div>
                    </div>
                )}
                
                <QuizPlayer quiz={quizData} onRestart={resetApp} config={config} />
             </div>
        )}

      </div>
    </div>
  );
};

export default App;