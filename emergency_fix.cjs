const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const anchorStart = "{view === 'admin-dashboard' && (";
const anchorEnd = "        </AnimatePresence>";

const parts = code.split(anchorStart);
const beforePart = parts[0];
const subParts = parts[1].split(anchorEnd);

// Assume everything before the first </AnimatePresence> in subParts is the old dashboard.
const afterPart = anchorEnd + subParts.slice(1).join(anchorEnd);

const newDashboardUI = `{view === 'admin-dashboard' && (
            <motion.div 
              key="admin-dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 sm:p-10 w-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <button onClick={() => setView('menu')} className={\`p-3 rounded-2xl transition-colors font-bold flex items-center gap-2 \${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-50 hover:bg-red-100 text-red-600'}\`}>
                  <ArrowLeft size={20} /> Ana Menü
                </button>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                   <button onClick={() => setAdminTab('scores')} className={\`px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${adminTab === 'scores' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}\`}>Sonuçlar</button>
                   <button onClick={() => setAdminTab('questions')} className={\`px-6 py-2.5 rounded-xl font-bold text-sm transition-all \${adminTab === 'questions' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}\`}>Soru Bankası</button>
                </div>
              </div>

              {adminTab === 'scores' && (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                  {scoresList.length === 0 ? <p className="text-slate-500 font-medium text-center py-10">Kayıtlı sınav sonucu bulunmamaktadır.</p> : scoresList.slice().reverse().map((s, i) => (
                    <div key={i} className={\`p-5 sm:p-6 rounded-3xl border-2 shadow-sm \${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}\`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={\`font-black text-xl \${theme === 'dark' ? 'text-white' : 'text-slate-900'}\`}>{s.name}</span>
                        <span className="font-black px-3 py-1 rounded-xl bg-red-50 text-red-600 text-sm tracking-widest uppercase">{s.score} / {s.totalQuestions} Doğru</span>
                      </div>
                      <span className="text-xs text-slate-400 font-bold mb-4 block">{new Date(s.date).toLocaleString('tr-TR')} • Mod: {s.mode}</span>
                      
                      {s.wrongAnswers && s.wrongAnswers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-red-100">
                          <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2"><XCircle size={16}/> Yanlış Bilinen Sorular</p>
                          <ul className="space-y-2">
                            {s.wrongAnswers.map((w, idx) => (
                              <li key={idx} className="bg-red-50 p-3 rounded-xl text-red-900 font-bold text-sm leading-snug">
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'questions' && (
                <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 pb-20">
                  <div className={\`p-6 sm:p-8 rounded-3xl border-2 shadow-lg \${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}\`}>
                    <h3 className="text-2xl font-black mb-6 text-slate-800">{newQuestion.id ? '✏️ Soruyu Düzenle' : '+ Yeni Soru Ekle'}</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Soru Metnİ</label>
                        <textarea placeholder="Sorunun kendisini buraya yazın..." value={newQuestion.question || ''} onChange={e=>setNewQuestion({...newQuestion, question: e.target.value})} className="w-full p-4 rounded-2xl border-2 bg-slate-50 outline-none focus:border-red-500 font-bold text-slate-800 min-h-[4rem]" />
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Şıklar (Doğru Onay Kutusunu Seçİn)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {newQuestion.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border-2 pl-4 focus-within:border-red-400 transition-colors">
                              <input type="radio" name="correctOption" checked={newQuestion.correct === oIdx} onChange={() => setNewQuestion({...newQuestion, correct: oIdx})} className="w-6 h-6 accent-red-500 cursor-pointer" />
                              <input type="text" placeholder={\`\${String.fromCharCode(65+oIdx)} Şıkkı\`} value={opt} onChange={e=>{const nopts=[...newQuestion.options]; nopts[oIdx]=e.target.value; setNewQuestion({...newQuestion, options: nopts})}} className="w-full bg-transparent outline-none text-base font-bold text-slate-800" />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Açıklama (Yanlış Cevaplandığında Gösterİlecek)</label>
                        <textarea placeholder="Neden bu cevap doğru? Açıklaması..." value={newQuestion.explanation || ''} onChange={e=>setNewQuestion({...newQuestion, explanation: e.target.value})} className="w-full p-4 rounded-2xl border-2 bg-slate-50 outline-none focus:border-red-500 font-bold text-slate-800 min-h-[4rem]" />
                      </div>

                      <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
                        <button onClick={handleSaveQuestion} className="bg-red-600 shadow-xl shadow-red-200 text-white font-black px-8 py-4 rounded-2xl hover:bg-red-700 transition-all text-lg flex-1 sm:flex-none">Sisteme Kaydet</button>
                        {newQuestion.id && <button onClick={()=>setNewQuestion({ options: ['', '', '', ''], correct: 0, question: '', explanation: '' })} className="bg-slate-200 text-slate-600 font-black px-8 py-4 rounded-2xl hover:bg-slate-300 transition-all text-lg flex-1 sm:flex-none">İptal</button>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Soru Bankasındakİ Mevcut Sorular ({adminQuestions.length})</h3>
                    {adminQuestions.map((q, i) => (
                      <div key={q.id} className="p-6 rounded-3xl border-2 shadow-sm bg-white flex flex-col sm:flex-row gap-5 items-start justify-between group hover:border-red-300 transition-colors">
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-base sm:text-lg leading-snug mb-3">{i+1}. {q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {q.options.map((opt, oId) => (
                               <div key={oId} className={\`text-xs font-bold p-2 rounded-lg \${oId === q.correct ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-100'}\`}>
                                 {String.fromCharCode(65+oId)}) {opt}
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                          <button onClick={() => { setNewQuestion(q); document.querySelector('.max-h-\\[65vh\\]')?.scrollTo({top:0, behavior:'smooth'}); }} className="flex-1 px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Düzenle</button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="flex-1 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">SİL</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
`;

const finalCode = beforePart + newDashboardUI + afterPart;
fs.writeFileSync('src/App.tsx', finalCode);
console.log('Emergency fix applied successfully.');
