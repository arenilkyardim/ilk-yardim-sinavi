const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add questions
const questionsEndAnchor = `  { id: 50, question: "İlk yardımın tanımı nedir?", options: ["İlaçlı tedavi", "İlaçsız müdahale", "Ameliyat", "Hastanede yapılan bakım"], correct: 1, explanation: "İlk yardım; olay yerinde, tıbbi araç gereç aranmaksızın, mevcut imkanlarla yapılan ilaçsız müdahaledir." }\n];`;
const newQuestions = `  { id: 50, question: "İlk yardımın tanımı nedir?", options: ["İlaçlı tedavi", "İlaçsız müdahale", "Ameliyat", "Hastanede yapılan bakım"], correct: 1, explanation: "İlk yardım; olay yerinde, tıbbi araç gereç aranmaksızın, mevcut imkanlarla yapılan ilaçsız müdahaledir." },
  { id: 51, question: "Kısmi hava yolu tıkanıklığında hangisi görülür?", options: ["Kişi hiç öksürmez", "Nefes alamaz", "Morarma başlar ve öksürük zayıftır", "Kişi konuşabilir"], correct: 3, explanation: "Kısmi tıkanıklıkta hava yolu tam kapanmadığı için kişi az da olsa nefes alabilir ve konuşabilir. Öksürmeye teşvik edilmelidir." },
  { id: 52, question: "6 aylık bebekte tıkanıklıkta ilk müdahale başarısızsa sonraki adım nedir?", options: ["Karın basısı", "Göğüs basısı", "Tekrar öksürmesini söylemek", "Parmakla süpürmek"], correct: 1, explanation: "Bebeklerde sırta 5 vuruş yapıldıktan sonra cisim çıkmazsa hemen 5 kez göğüs basısı uygulanır." },
  { id: 53, question: "Bilinç bozukluklarında ilk yardımda hangisi yanlıştır?", options: ["Bilinç değerlendirilir", "112 aranır", "Yaşam bulguları değerlendirilir", "Bilinci kapalıya yarı oturur pozisyon verilir"], correct: 3, explanation: "Bilinci kapalı ve solunumu olan hastaya Koma (yan yatış) pozisyonu verilir, yarı oturur pozisyon değil." },
  { id: 54, question: "Termal (ısıya bağlı) yanıklarda ilk olarak yapılması gereken müdahale hangisidir?", options: ["Yanık bölgesi en az 20 dakika süreyle soğuk su altında tutulur", "Oluşan su dolu kesecikler patlatılır", "Yanığa yoğurt sürülür", "Yanık bölgesi hemen bandajla kapatılır"], correct: 0, explanation: "Isı yanıklarında ilk işlem yanığın derecesini azaltmak için bölgeyi tazyiksiz serin su altında 20 dakika tutmaktır." },
  { id: 55, question: "Aşağıdakilerden hangisi kas-iskelet sisteminde yer almaz?", options: ["Kemikler", "Eklemler", "Kaslar", "Kalp"], correct: 3, explanation: "Kalp, dolaşım sisteminin bir organıdır. Kas-iskelet sistemine kemikler, eklemler ve iskelet kasları dâhildir." },
  { id: 56, question: "Aşağıdaki taşıma yöntemlerinden hangisi bilinç açık, çocuklar ve zayıf yetişkinler için uygun bir yöntemdir?", options: ["Omuzdan taşıma", "Sürükleme yöntemi", "Kucakta taşıma (Önde beşik yöntemi)", "İtfaiyeci yöntemi"], correct: 2, explanation: "Hafif yaralıların ve çocukların bilinci açıksa, kısa mesafede kucakta taşıma yöntemi en uygun olanıdır." }
];`;

code = code.replace(questionsEndAnchor, newQuestions);

// 2. Add 'wheel' view state type
code = code.replace(
  `const [view, setView] = useState<'start' | 'menu' | 'group-select' | 'about' | 'contact' | 'quiz' | 'result' | 'scenarios' | 'guide' | 'scenario-play' | 'admin-login' | 'admin-dashboard'>('start');`,
  `const [view, setView] = useState<'start' | 'menu' | 'group-select' | 'about' | 'contact' | 'quiz' | 'result' | 'scenarios' | 'guide' | 'scenario-play' | 'admin-login' | 'admin-dashboard' | 'wheel'>('start');`
);

// 3. Add states and functions
const statesAnchor = `const [newQuestion, setNewQuestion] = useState<Partial<Question>>({ options: ['', '', '', ''], correct: 0 });`;

const wheelStatesAndFunctions = `const [newQuestion, setNewQuestion] = useState<Partial<Question>>({ options: ['', '', '', ''], correct: 0 });

  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  const [showWheelQuestion, setShowWheelQuestion] = useState(false);
  const [wheelQuestion, setWheelQuestion] = useState<Question | null>(null);
  const [wheelSelectedAnswer, setWheelSelectedAnswer] = useState<number | null>(null);
  const [isWheelAnswerCorrect, setIsWheelAnswerCorrect] = useState<boolean | null>(null);

  const WHEEL_SEGMENTS = [
    { label: 'Kolay Soru', color: '#10b981', action: 'question' },
    { label: 'Pas Hakkı', color: '#3b82f6', action: 'pass' },
    { label: 'Zor Soru', color: '#ef4444', action: 'question' },
    { label: 'Sağa Devret', color: '#8b5cf6', action: 'pass' },
    { label: 'Normal Soru', color: '#f59e0b', action: 'question' },
    { label: '15 Dk Mola', color: '#6366f1', action: 'break' },
    { label: 'İki Şık Ele', color: '#ec4899', action: 'joker' },
    { label: 'Sola Devret', color: '#14b8a6', action: 'pass' }
  ];

  const playCheerSound = () => {
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/crowds/crowd_cheering.ogg');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Ses çalınamadı:', e));
    } catch(e) {}
  };

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWheelResult(null);
    setShowWheelQuestion(false);
    setWheelSelectedAnswer(null);
    setIsWheelAnswerCorrect(null);

    const extraSpins = 5;
    const randomSegmentIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    // Calculate final rotation to land exactly in the middle of the selected segment.
    // CSS rotation goes clockwise.
    const targetAngle = (extraSpins * 360) + (360 - (randomSegmentIndex * segmentAngle) - (segmentAngle / 2));
    
    const newRotation = wheelRotation + targetAngle;
    setWheelRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const result = WHEEL_SEGMENTS[randomSegmentIndex];
      setWheelResult(result.label);
      if (result.action === 'question') {
        const randomQ = loadedQuestions[Math.floor(Math.random() * loadedQuestions.length)];
        setWheelQuestion(randomQ);
      } else {
        setWheelQuestion(null);
      }
    }, 5000);
  };

  const handleWheelAnswer = (optIndex: number) => {
    if (wheelSelectedAnswer !== null || !wheelQuestion) return;
    setWheelSelectedAnswer(optIndex);
    const correct = optIndex === wheelQuestion.correct;
    setIsWheelAnswerCorrect(correct);
    if (correct) {
      playSound('correct');
      playCheerSound();
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ffffff']
      });
    } else {
      playSound('wrong');
    }
  };`;

code = code.replace(statesAnchor, wheelStatesAndFunctions);

// 4. Add Wheel button to menu
const menuButtonAnchor = `<button onClick={() => setView('admin-login')} className={\`p-6 sm:p-8 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl \${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}\`}>`;
const newMenuButton = `<button onClick={() => setView('wheel')} className={\`p-6 sm:p-8 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl \${theme === 'dark' ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}\`}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Loader2 size={32} className="text-white" />
                  </div>
                  <span className="font-black text-white text-lg sm:text-xl text-center">Şans Çarkı</span>
                </button>
                <button onClick={() => setView('admin-login')} className={\`p-6 sm:p-8 rounded-[2rem] flex flex-col items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-xl \${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}\`}>`;

code = code.replace(menuButtonAnchor, newMenuButton);

// 5. Add Wheel View
const viewAnchor = `{view === 'admin-login' && (`;
const newView = `{view === 'wheel' && (
            <motion.div 
              key="wheel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center relative py-6"
            >
              <div className="w-full flex justify-between items-center mb-10 px-4">
                 <button onClick={() => setView('menu')} className={\`p-3 rounded-2xl transition-colors font-bold flex items-center gap-2 \${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-50 hover:bg-red-100 text-red-600'}\`}>
                   <ArrowLeft size={20} /> Ana Menü
                 </button>
                 <h2 className={\`text-2xl font-black uppercase tracking-widest \${theme === 'dark' ? 'text-white' : 'text-slate-900'}\`}>Sıradakİ Kursİyer!</h2>
                 <div className="w-10"></div>
              </div>

              <div className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] mt-4">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-900 z-20 shadow-lg" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                
                <motion.div 
                  className="w-full h-full rounded-full border-8 border-slate-900 shadow-2xl relative overflow-hidden"
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: 5, ease: [0.15, 0.85, 0.35, 1] }}
                  style={{
                    background: \`conic-gradient(\${WHEEL_SEGMENTS.map((s, i) => \`\${s.color} \${i * (360 / WHEEL_SEGMENTS.length)}deg \${(i + 1) * (360 / WHEEL_SEGMENTS.length)}deg\`).join(', ')})\`
                  }}
                >
                  {WHEEL_SEGMENTS.map((seg, i) => {
                    const angle = 360 / WHEEL_SEGMENTS.length;
                    const rotate = (i * angle) + (angle / 2);
                    return (
                      <div key={i} className="absolute w-full h-full flex justify-center pt-6 sm:pt-10" style={{ transform: \`rotate(\${rotate}deg)\` }}>
                        <span className="font-black text-white text-[12px] sm:text-[15px] uppercase tracking-wider" style={{ textShadow: '0px 2px 5px rgba(0,0,0,0.8)' }}>
                          {seg.label}
                        </span>
                      </div>
                    )
                  })}
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-slate-900 shadow-inner z-10 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  </div>
                </motion.div>
              </div>

              <button 
                onClick={spinWheel} 
                disabled={isSpinning}
                className={\`mt-16 px-14 py-6 rounded-full font-black text-2xl uppercase tracking-widest shadow-xl transition-all \${isSpinning ? 'bg-slate-300 text-slate-500 cursor-not-allowed scale-95' : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-red-200'}\`}
              >
                {isSpinning ? 'Çevriliyor...' : 'Çarkı Çevir!'}
              </button>

              <AnimatePresence>
                {wheelResult && !isSpinning && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] border-8 border-red-500 z-50 text-center w-[90%] max-w-lg"
                  >
                    <h3 className="text-3xl font-black text-slate-400 uppercase tracking-widest mb-4">ŞANSINA ÇIKAN:</h3>
                    <p className="text-4xl sm:text-5xl font-black text-slate-900 mb-10 uppercase leading-tight">{wheelResult}</p>
                    
                    {wheelQuestion && !showWheelQuestion && (
                      <button onClick={() => setShowWheelQuestion(true)} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl text-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 uppercase tracking-widest">
                        Soruyu Göster
                      </button>
                    )}
                    
                    {!wheelQuestion && (
                      <button onClick={() => setWheelResult(null)} className="w-full bg-slate-100 text-slate-800 font-black py-5 rounded-2xl text-xl hover:bg-slate-200 transition-colors uppercase tracking-widest">
                        Kapat
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showWheelQuestion && wheelQuestion && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-slate-900/95 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                  >
                    <div className="bg-white rounded-[2.5rem] p-6 sm:p-12 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-8">
                        <span className="font-black text-red-600 bg-red-100 px-4 py-2 rounded-xl text-sm uppercase tracking-widest border-2 border-red-200">{wheelResult}</span>
                        <button onClick={() => { setShowWheelQuestion(false); setWheelResult(null); }} className="p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"><XCircle size={28} /></button>
                      </div>
                      
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-10 leading-snug">
                        {wheelQuestion.question}
                      </h3>
                      
                      <div className="space-y-4">
                        {wheelQuestion.options.map((opt, i) => {
                          const isSelected = wheelSelectedAnswer === i;
                          const isCorrect = i === wheelQuestion.correct;
                          
                          // Joker: İki Şıkkı Ele mantığı
                          let isEliminated = false;
                          if (wheelResult === 'İki Şık Ele' && wheelSelectedAnswer === null) {
                             const wrongOptions = wheelQuestion.options.map((_, idx) => idx).filter(idx => idx !== wheelQuestion.correct);
                             // Eleme işlemi görsel amaçlı, rastgele 2 tanesini seçeceğiz.
                             // Sabit kalması için basit matematik.
                             if (wrongOptions.indexOf(i) === 0 || wrongOptions.indexOf(i) === 1) {
                               isEliminated = true;
                             }
                          }
                          
                          if (isEliminated) return null; // Şıkkı tamamen gizle
                          
                          let btnClass = "w-full p-5 sm:p-6 rounded-2xl border-4 text-left font-bold text-lg sm:text-xl transition-all ";
                          
                          if (wheelSelectedAnswer === null) {
                            btnClass += "border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:scale-[1.02] active:scale-[0.98]";
                          } else {
                            if (isCorrect) {
                              btnClass += "border-green-500 bg-green-100 text-green-800 shadow-lg shadow-green-100";
                            } else if (isSelected) {
                              btnClass += "border-red-500 bg-red-100 text-red-800 shadow-lg shadow-red-100";
                            } else {
                              btnClass += "border-slate-100 bg-slate-50 text-slate-400 opacity-50";
                            }
                          }

                          return (
                            <button 
                              key={i} 
                              onClick={() => handleWheelAnswer(i)}
                              disabled={wheelSelectedAnswer !== null}
                              className={btnClass}
                            >
                              <div className="flex gap-4 items-center">
                                <span className={\`w-10 h-10 flex items-center justify-center rounded-xl font-black \${wheelSelectedAnswer === null ? 'bg-slate-100 text-slate-500' : (isCorrect ? 'bg-green-200 text-green-900' : (isSelected ? 'bg-red-200 text-red-900' : 'bg-slate-100 text-slate-400'))}\`}>
                                  {String.fromCharCode(65+i)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {wheelSelectedAnswer !== null && (
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className={\`mt-10 p-8 rounded-[2rem] border-4 \${isWheelAnswerCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}\`}>
                          <div className="flex items-center gap-4 mb-4">
                            {isWheelAnswerCorrect ? <CheckCircle2 size={32} className="text-green-500"/> : <XCircle size={32} className="text-red-500"/>}
                            <p className="font-black text-2xl uppercase tracking-widest">{isWheelAnswerCorrect ? 'HARİKA! DOĞRU CEVAP!' : 'MAALESEF YANLIŞ CEVAP!'}</p>
                          </div>
                          <p className="font-bold text-lg leading-relaxed opacity-90">{wheelQuestion.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'admin-login' && (`;

code = code.replace(viewAnchor, newView);

fs.writeFileSync('src/App.tsx', code);
console.log('Wheel feature added successfully.');
