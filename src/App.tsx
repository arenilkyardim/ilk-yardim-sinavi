/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Award, Timer, ArrowLeft, HeartPulse, GraduationCap, Instagram, Phone, Globe, MapPin, Info, BookOpen, MessageCircle, Share2, Facebook, Youtube, Volume2, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import confetti from 'canvas-confetti';
interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ScenarioStep {
  text: string;
  options: { text: string; nextStep: number | 'success' | 'fail'; feedback: string }[];
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  steps: Record<number, ScenarioStep>;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Mutfakta Boğulma Vakası",
    description: "Arkadaşınız yemek yerken aniden ellerini boğazına götürüyor ve konuşamıyor.",
    steps: {
      1: {
        text: "Arkadaşınızın yanına gittiniz. Öksüremiyor, konuşamıyor ve elleriyle boğazını tutuyor. İlk olarak ne yaparsınız?",
        options: [
          { text: "Hemen sırtına vurmaya başlarım", nextStep: 2, feedback: "Doğru, tam tıkanıklık belirtileri var. İlk müdahale sırt vuruşudur." },
          { text: "Su içirmeye çalışırım", nextStep: 'fail', feedback: "HATA! Tam tıkanıklıkta sıvı verilmez, soluk borusuna kaçabilir." },
          { text: "Öksürmesini söylerim", nextStep: 'fail', feedback: "HATA! Tam tıkanıklıkta kişi öksüremez. Müdahale gecikmemeli." }
        ]
      },
      2: {
        text: "5 kez sırtına (iki kürek kemiği arasına) vurdunuz ancak cisim çıkmadı. Arkadaşınız hala morarıyor. Şimdi ne yaparsınız?",
        options: [
          { text: "Heimlich manevrası uygularım", nextStep: 3, feedback: "DOĞRU! 5 sırt vuruşundan sonuç alınamazsa 5 karın basısı (Heimlich) uygulanır." },
          { text: "Ağzına parmağımı sokup cismi ararım", nextStep: 'fail', feedback: "HATA! Cisim daha derine kaçabilir, körlemesine parmak sokulmaz." }
        ]
      },
      3: {
        text: "Heimlich manevrası yaparken arkadaşınız aniden bilincini kaybetti ve kollarınıza yığıldı. Ne yaparsınız?",
        options: [
          { text: "Sert bir zemine yatırıp 112'yi aratırım ve TYD başlarım", nextStep: 'success', feedback: "MÜKEMMEL! Bilinç kaybı olduğunda hemen temel yaşam desteğine geçilmelidir." },
          { text: "Sarsarak uyandırmaya çalışırım", nextStep: 'fail', feedback: "HATA! Zaman kaybediyorsunuz, bilinçsiz hastada solunum kontrolü ve TYD şarttır." }
        ]
      }
    }
  },
  {
    id: 2,
    title: "Trafik Kazası Müdahalesi",
    description: "Yolda bir kaza gördünüz, araçtan dumanlar çıkıyor ve içeride bir yaralı var.",
    steps: {
      1: {
        text: "Olay yerine ulaştınız. Araçtan dumanlar yükseliyor. İlk önceliğiniz nedir?",
        options: [
          { text: "Hemen yaralıyı kucaklayıp çıkarırım", nextStep: 'fail', feedback: "HATA! Önce kendi güvenliğinizi ve çevre güvenliğini sağlamalısınız." },
          { text: "Kendi güvenliğimi sağlar, reflektör koyar ve kontağı kapatırım", nextStep: 2, feedback: "DOĞRU! Önce güvenlik (Koruma)." }
        ]
      },
      2: {
        text: "Güvenliği sağladınız. Yaralının yanına gittiniz. Bilinci kapalı ama solunumu var. Araçta yangın riski devam ediyor. Ne yaparsınız?",
        options: [
          { text: "Rentek manevrası ile omuriliği koruyarak çıkarırım", nextStep: 3, feedback: "DOĞRU! Yangın/patlama riski varsa Rentek manevrası ile tahliye şarttır." },
          { text: "Ambulans gelene kadar beklerim", nextStep: 'fail', feedback: "HATA! Yangın riski varken beklemek hayati tehlike yaratır." }
        ]
      },
      3: {
        text: "Yaralıyı güvenli alana çıkardınız. 112'ye haber verildi. Yaralının bacağında fışkırır tarzda açık kırmızı kanama var. Ne yaparsınız?",
        options: [
          { text: "Yara üzerine temiz bezle sertçe bastırırım", nextStep: 'success', feedback: "TEBRİKLER! Atardamar kanamasında ilk adım direkt baskıdır." },
          { text: "Yaraya tütün/kül basarım", nextStep: 'fail', feedback: "HATA! Enfeksiyon riskini artırır ve tıbbi müdahaleyi zorlaştırır." }
        ]
      }
    }
  },
  {
    id: 3,
    title: "Bebeklerde Tam Tıkanıklık",
    description: "10 aylık bir bebeğin oyun oynarken aniden nefesi kesiliyor ve morarıyor.",
    steps: {
      1: {
        text: "Bebeğin morardığını ve ses çıkaramadığını gördünüz. İlk hamleniz nedir?",
        options: [
          { text: "Bebeği kolumun üzerine yüzüstü yatırıp sırtına vururum", nextStep: 2, feedback: "DOĞRU! Bebeklerde ilk adım 5 kez sırt vuruşudur." },
          { text: "Bebeği ayaklarından tutup sallarım", nextStep: 'fail', feedback: "HATA! Bu yöntem tehlikelidir ve kafa içi kanamaya yol açabilir." }
        ]
      },
      2: {
        text: "Sırt vuruşundan sonuç alamadınız. Şimdi ne yapmalısınız?",
        options: [
          { text: "Bebeği sırtüstü çevirip göğüs kemiğine bası uygularım", nextStep: 'success', feedback: "TEBRİKLER! Bebeklerde 5 sırt vuruşu sonrası 5 göğüs basısı uygulanır." },
          { text: "Heimlich manevrası (karın basısı) yaparım", nextStep: 'fail', feedback: "HATA! Bebeklerde karın organları hassas olduğu için karın basısı yapılmaz." }
        ]
      }
    }
  },
  {
    id: 4,
    title: "Elektrik Çarpması",
    description: "Evde bir yakınınızın prize dokunup elektrik akımına kapıldığını gördünüz.",
    steps: {
      1: {
        text: "Yakınınız hala akıma kapılı halde duruyor. Ne yaparsınız?",
        options: [
          { text: "Hemen kolundan tutup çekerim", nextStep: 'fail', feedback: "HATA! Siz de akıma kapılırsınız." },
          { text: "Sigortayı kapatırım veya yalıtkan bir cisimle ayırırım", nextStep: 2, feedback: "DOĞRU! Önce akımı kesmek hayati önem taşır." }
        ]
      },
      2: {
        text: "Akımı kestiniz. Yakınınız yerde hareketsiz yatıyor. İlk kontrolünüz ne olur?",
        options: [
          { text: "Bilincini ve solunumunu kontrol ederim", nextStep: 'success', feedback: "MÜKEMMEL! ABC kontrolü her zaman ilk adımdır." },
          { text: "Hemen su içiririm", nextStep: 'fail', feedback: "HATA! Bilinci kapalı hastaya asla sıvı verilmez." }
        ]
      }
    }
  }
];

const GUIDE_ITEMS = [
  { title: "Temel Yaşam Desteği", content: "Yetişkinlerde 30 kalp masajı, 2 suni solunum uygulanır. Bası derinliği 5 cm olmalıdır.", icon: <HeartPulse size={20} /> },
  { title: "Kanamalar", content: "Yara üzerine temiz bezle direkt baskı uygulanır. Durmazsa ikinci bez konur. Turnike son çaredir.", icon: <Info size={20} /> },
  { title: "Yanıklar", content: "Isı yanıklarında bölge en az 20 dakika tazyiksiz su altında tutulur. Yoğurt/diş macunu sürülmez.", icon: <Info size={20} /> },
  { title: "Kırıklar", content: "Kırık bölge hareket ettirilmez, bulunduğu şekilde tespit edilir (sabitlenir).", icon: <Info size={20} /> }
];

const QUESTIONS: Question[] = [
  { id: 1, question: "Yetişkinlerde temel yaşam desteği uygulanırken göğüs kemiği kaç cm aşağı inecek şekilde bası uygulanır?", options: ["3 cm", "5 cm", "7 cm", "10 cm"], correct: 1, explanation: "Yetişkinlerde göğüs kemiği 5 cm aşağı inecek şekilde bası uygulanmalıdır. 3 cm yetersizdir, 7 cm ve üzeri ise kaburga kırıklarına ve iç organ hasarına yol açabilir." },
  { id: 2, question: "Bebeklerde (0-1 yaş) tam tıkanıklık durumunda (Heimlich Manevrası) nereye vuru yapılır?", options: ["Sırtın ortasına, kürek kemikleri arasına", "Göğüs kafesinin altına", "Karına sertçe", "Omuz başına"], correct: 0, explanation: "Bebeklerde Heimlich manevrası için bebek kol üzerine yüzüstü yatırılır ve sırtın ortasına, kürek kemikleri arasına 5 kez vuru yapılır." },
  { id: 3, question: "Burun kanamasında yapılması gereken ilk yardım hangisidir?", options: ["Baş geriye atılır", "Burun deliklerine pamuk tıkanır", "Baş hafifçe öne eğilir, burun kanatları 5 dk sıkılır", "Sırt üstü yatırılır"], correct: 2, explanation: "Burun kanamasında baş hafifçe öne eğilmeli ve burun kanatları 5 dakika boyunca sıkılmalıdır. Başın geriye atılması kanın yutağa akmasına neden olabilir." },
  { id: 4, question: "Kimyasal madde yanıklarında ilk yardımda ne yapılmalıdır?", options: ["Yoğurt sürülmelidir", "Bölge en az 20 dk tazyiksiz bol su ile yıkanmalıdır", "Hemen sargı beziyle kapatılmalıdır", "Diş macunu sürülmelidir"], correct: 1, explanation: "Kimyasal yanıklarda bölge en az 20 dakika boyunca tazyiksiz bol su ile yıkanarak kimyasalın uzaklaştırılması sağlanmalıdır." },
  { id: 5, question: "Kan şekeri düşüklüğü belirtileri gösteren bilinci açık bir hastaya ne verilmelidir?", options: ["Tuzlu ayran", "Sadece su", "Şekerli su veya meyve suyu", "Hiçbir şey verilmez"], correct: 2, explanation: "Bilinci açık hastada kan şekerini hızla yükseltmek için şekerli su veya meyve suyu verilmelidir." },
  { id: 6, question: "Kaza yerinde ilk aşama nedir?", options: ["Güvenlik/Koruma", "Bildirme", "Kurtarma", "Tedavi"], correct: 0, explanation: "İlk yardımın temel aşamaları Koruma, Bildirme, Kurtarma şeklindedir. Güvenliği sağlamak (Koruma) ilk adımdır." },
  { id: 7, question: "Bak-Dinle-Hisset süresi ne kadardır?", options: ["5 saniye", "10 saniye", "15 saniye", "20 saniye"], correct: 1, explanation: "Hastanın solunumu olup olmadığını anlamak için yapılan Bak-Dinle-Hisset yöntemi 10 saniye boyunca uygulanmalıdır." },
  { id: 8, question: "Yetişkinlerde kalp masajı/suni solunum oranı nedir?", options: ["15/2", "30/2", "30/5", "15/5"], correct: 1, explanation: "Yetişkinlerde temel yaşam desteği 30 kalp masajı ve 2 suni solunum (30/2) şeklinde uygulanır." },
  { id: 9, question: "Çocuklarda temel yaşam desteğine kaç kurtarıcı solukla başlanır?", options: ["1", "2", "5", "10"], correct: 2, explanation: "Bebek ve çocuklarda temel yaşam desteğine 5 kurtarıcı soluk verilerek başlanır." },
  { id: 10, question: "Koma pozisyonu hangi durumda verilir?", options: ["Bilinci açık, solunumu yok", "Bilinci kapalı, solunumu var", "Bilinci kapalı, solunumu yok", "Bilinci açık, solunumu var"], correct: 1, explanation: "Koma pozisyonu, bilinci kapalı ancak solunumu olan hastalara, dilin geriye kaçmasını veya kusmuğun akciğere gitmesini önlemek için verilir." },
  { id: 11, question: "Sara krizinde ne yapılmaz?", options: ["Ağız açılmaya çalışılmaz", "Sert cisim ısırttırılmaz", "Kilitlenen çene zorlanmaz", "Hepsi"], correct: 3, explanation: "Sara krizinde hastanın ağzı açılmaya çalışılmaz, kilitlenen çene zorlanmaz ve sert cisim ısırttırılmaz. Sadece etraftaki tehlikeler uzaklaştırılır." },
  { id: 12, question: "Akrep sokmasında ne yapılır?", options: ["Sıcak uygulama", "Soğuk uygulama", "Yara emilir", "Yara kesilir"], correct: 1, explanation: "Akrep sokmasında bölgeye soğuk uygulama yapılarak zehrin yayılması yavaşlatılır. Yara asla emilmez veya kesilmez." },
  { id: 13, question: "Donmalarda ne yapılmaz?", options: ["Sıcak suyla yıkanmaz", "Karla ovulmaz", "Hemen ısıtılmaz", "Hepsi"], correct: 3, explanation: "Donan bölge asla karla ovulmaz, sıcak suya sokulmaz veya hemen ısıtılmaz. Oda sıcaklığında yavaşça ısınması sağlanır." },
  { id: 14, question: "Hayvan ısırmalarında yara nasıl yıkanır?", options: ["Alkolle", "Sabunlu suyla 5 dk", "Tuzlu suyla", "Yıkanmaz"], correct: 1, explanation: "Hayvan ısırmalarında yara sabunlu suyla en az 5 dakika boyunca yıkanarak enfeksiyon riski azaltılmalıdır." },
  { id: 15, question: "Kırıklarda ilk yardımın temel kuralı nedir?", options: ["Kırık yerine oturtulur", "Hareketsizlik sağlanır (Tespit)", "Sıcak uygulama yapılır", "Masaj yapılır"], correct: 1, explanation: "Kırıklarda en önemli kural kırık bölgenin hareket etmesini engellemek (tespit etmek) ve hastayı sarsmadan sevk etmektir." },
  { id: 16, question: "Sıcak çarpmasında hasta nereye alınır?", options: ["Güneşe", "Serin ve havadar yer", "Sıcak su altına", "Kapalı dar alan"], correct: 1, explanation: "Sıcak çarpmasında hasta hemen serin ve havadar bir yere alınmalı, giysileri gevşetilmelidir." },
  { id: 17, question: "Zehirlenmelerde genel kural nedir?", options: ["Kusturulur", "Kusturulmaz (İstisnalar hariç)", "Bol yemek yedirilir", "Yoğurt yedirilir"], correct: 1, explanation: "Zehirlenmelerde (özellikle yakıcı madde içilmişse) hasta asla kusturulmaz, çünkü madde yemek borusuna ikinci kez zarar verebilir." },
  { id: 18, question: "Göze yabancı cisim kaçtığında ne yapılır?", options: ["Göz ovulur", "Bol suyla yıkanır", "Cımbızla çıkarılır", "Kapatılmaz"], correct: 1, explanation: "Göze yabancı cisim kaçtığında göz ovulmamalı, bol suyla yıkanmalıdır. Çıkmıyorsa doktora gidilmelidir." },
  { id: 19, question: "Kulağa böcek kaçtığında ne yapılmalıdır?", options: ["Işık tutulur", "Yağ damlatılır", "Doktora gidilir", "Kulak çöpüyle çıkarılır"], correct: 2, explanation: "Kulağa böcek kaçtığında ışık tutulmaz veya bir şey sokulmaz. Hemen doktora gidilmelidir." },
  { id: 20, question: "Turnike hangi durumda uygulanır?", options: ["Küçük kesiklerde", "Uzuv kopması/Durdurulamayan kanama", "Burun kanamasında", "Kılcal damar kanamasında"], correct: 1, explanation: "Turnike sadece uzuv kopması gibi durdurulamayan büyük kanamalarda veya çok sayıda yaralının olduğu durumlarda son çare olarak uygulanır." },
  { id: 21, question: "Şok pozisyonu nasıldır?", options: ["Hasta oturtulur", "Ayaklar 30 cm yukarı kaldırılır", "Yüz üstü yatırılır", "Baş aşağı sarkıtılır"], correct: 1, explanation: "Şok pozisyonunda hasta sırt üstü yatırılır ve ayakları 30 cm yukarı kaldırılarak hayati organlara kan gitmesi sağlanır." },
  { id: 22, question: "Rentek manevrası ne için kullanılır?", options: ["Boğulmalarda", "Araçtan çıkarma", "Kırık tespitinde", "Zehirlenmede"], correct: 1, explanation: "Rentek manevrası, yaralıyı araçtan omuriliğine zarar vermeden çıkarmak için kullanılan özel bir tekniktir." },
  { id: 23, question: "İlk yardımın ABC'si - A nedir?", options: ["Solunum", "Dolaşım", "Havayolu açıklığı", "Bilinc kontrolü"], correct: 2, explanation: "A (Airway): Havayolu açıklığının sağlanmasıdır (Baş-Çene pozisyonu)." },
  { id: 24, question: "İlk yardımın ABC'si - B nedir?", options: ["Solunum", "Dolaşım", "Havayolu", "Sindirimi"], correct: 0, explanation: "B (Breathing): Solunumun kontrol edilmesidir (Bak-Dinle-Hisset)." },
  { id: 25, question: "İlk yardımın ABC'si - C nedir?", options: ["Solunum", "Dolaşım", "Havayolu", "Sinir sistemi"], correct: 1, explanation: "C (Circulation): Dolaşımın sağlanmasıdır (Kalp masajı)." },
  { id: 26, question: "112 aranırken ne söylenmelidir?", options: ["Olay yeri adresi", "Hasta sayısı", "Durum özeti", "Hepsi"], correct: 3, explanation: "112 aranırken adres, hasta sayısı, durum özeti ve arayanın numarası gibi tüm bilgiler net bir şekilde verilmelidir." },
  { id: 27, question: "Delici göğüs yaralanmasında pozisyon?", options: ["Sırt üstü", "Yarı oturuş", "Yüz üstü", "Şok pozisyonu"], correct: 1, explanation: "Delici göğüs yaralanmasında hastanın daha rahat nefes alabilmesi için yarı oturuş pozisyonu verilir." },
  { id: 28, question: "Delici karın yaralanmasında organlar dışarıdaysa?", options: ["İçeri itilir", "Islak bezle örtülür", "Kuru bezle bastırılır", "Yıkanır"], correct: 1, explanation: "Dışarı çıkan organlar asla içeri itilmez. Üzeri temiz ve nemli (ıslak) bir bezle örtülerek korunur." },
  { id: 29, question: "Baş yaralanmalarında kaç saat gözlem yapılır?", options: ["2 saat", "6 saat", "24 saat", "48 saat"], correct: 2, explanation: "Baş yaralanmalarında beyin kanaması riski nedeniyle hasta 24 saat boyunca gözlem altında tutulmalıdır." },
  { id: 30, question: "Elektrik çarpmasında ilk ne yapılır?", options: ["Su dökülür", "Akım kesilir", "Elle çekilir", "Suni solunum yapılır"], correct: 1, explanation: "Elektrik çarpmasında yaralıya dokunmadan önce mutlaka elektrik akımı kesilmelidir." },
  { id: 31, question: "İkinci derece yanık belirtisi nedir?", options: ["Kızarıklık", "Bül (Su toplanması)", "Kömürleşme", "Ağrısızlık"], correct: 1, explanation: "İkinci derece yanıklarda deride kızarıklığın yanı sıra içi su dolu kabarcıklar (bül) oluşur." },
  { id: 32, question: "Üçüncü derece yanık özelliği nedir?", options: ["Çok ağrılıdır", "Sinir harabiyeti/Ağrısızlık", "Sadece kızarıklık", "Hafif yanık"], correct: 1, explanation: "Üçüncederece yanıklarda deri tabakalarının tamamı ve sinirler zarar gördüğü için ağrı hissedilmeyebilir." },
  { id: 33, question: "Kanamayı durdurmak için ilk yöntem?", options: ["Turnike", "Direkt baskı", "Sıcak uygulama", "Uzvu aşağı sarkıtma"], correct: 1, explanation: "Kanamayı durdurmak için ilk yapılması gereken yaranın üzerine temiz bir bezle direkt baskı uygulamaktır." },
  { id: 34, question: "İç kanama belirtisi nedir?", options: ["Yavaş nabız", "Hızlı zayıf nabız, soğuk terleme", "Yüksek tansiyon", "Kızarmış yüz"], correct: 1, explanation: "İç kanamada nabız hızlı ve zayıftır, hasta soğuk terler ve huzursuzdur." },
  { id: 35, question: "Kalp spazmı ağrısı ne kadar sürer?", options: ["1-2 dk", "5-10 dk", "1 saat", "Tüm gün"], correct: 1, explanation: "Kalp spazmı (Angina Pectoris) ağrısı genellikle 5-10 dakika sürer ve dinlenmekle geçer." },
  { id: 36, question: "Kalp krizi ağrısı özelliği?", options: ["Dinlenmekle geçer", "Dinlenmekle geçmez", "Sadece kolda olur", "Nefes alınca geçer"], correct: 1, explanation: "Kalp krizi ağrısı şiddetlidir, dinlenmekle geçmez ve genellikle 20 dakikadan uzun sürer." },
  { id: 37, question: "Boğulmalarda ilk yardım?", options: ["Sırtına vurulur", "Su dışına çıkarma, solunum kontrolü", "Kusturulur", "Ters çevrilir"], correct: 1, explanation: "Boğulmalarda yaralı sudan çıkarıldıktan sonra hemen solunum kontrolü yapılmalı ve gerekirse temel yaşam desteğine başlanmalıdır." },
  { id: 38, question: "Kedi tırmalamasında risk nedir?", options: ["Kuduz/Tetanos", "Grip", "Kızamık", "Zatürre"], correct: 0, explanation: "Kedi ve köpek tırmalamaları/ısırmaları kuduz ve tetanos riski taşıdığı için mutlaka tıbbi yardım alınmalıdır." },
  { id: 39, question: "Deniz canlıları sokmasında ne yapılır?", options: ["Soğuk uygulama", "Sıcak uygulama (Toksin için)", "Sirke dökülür", "Yara kesilir"], correct: 1, explanation: "Deniz canlılarının (deniz anası vb.) toksinleri protein yapıda olduğu için sıcak uygulama (sıcak su) toksini etkisiz hale getirebilir." },
  { id: 40, question: "İlk yardımcıda bulunması gereken özellik?", options: ["Panik yapmalı", "Sakin/Hızlı/Kendine güvenen", "Doktor olmalı", "Çok konuşmalı"], correct: 1, explanation: "İlk yardımcı her zaman sakin kalmalı, hızlı karar verebilmeli ve çevresindekileri organize edebilmelidir." },
  { id: 41, question: "Olay yerinde hasta taşıma kuralı?", options: ["Hızlıca koşturulur", "En az hareket", "Sırtlanarak taşınır", "Sürüklenir"], correct: 1, explanation: "Yaralı taşınırken omurga düzlemi korunmalı ve mümkün olan en az hareketle taşıma gerçekleştirilmelidir." },
  { id: 42, question: "Kaşık tekniği kaç kişiyle yapılır?", options: ["1", "2", "3", "5"], correct: 2, explanation: "Kaşık tekniği, yaralıyı yerden kaldırmak için en az 3 ilk yardımcı tarafından uygulanır." },
  { id: 43, question: "Sedye ile taşıma kuralı?", options: ["Ayaklar gidiş yönünde", "Baş gidiş yönünde", "Yan yatırılarak", "Baş aşağıda"], correct: 1, explanation: "Sedye ile taşımada yaralının başı gidiş yönünde olmalı, böylece ilk yardımcı hastanın yüzünü görebilmelidir." },
  { id: 44, question: "Kanamalarda baskı noktası - Kasık nereyi etkiler?", options: ["Kol", "Bacak", "Baş", "Boyun"], correct: 1, explanation: "Kasık üzerindeki baskı noktası, bacak bölgesindeki kanamaları kontrol etmek için kullanılır." },
  { id: 45, question: "Köprücük kemiği arkası baskı noktası nereyi etkiler?", options: ["Ayak", "Kol", "Karın", "Yüz"], correct: 1, explanation: "Köprücük kemiği arkasındaki baskı noktası, kol bölgesindeki kanamaları durdurmak için kullanılır." },
  { id: 46, question: "Şeker koması belirtisi nedir?", options: ["Aseton kokusu", "Çiçek kokusu", "Ter kokusu", "Koku olmaz"], correct: 0, explanation: "Şeker komasında (hiperglisemi) hastanın nefesinde aseton kokusu benzeri bir koku duyulabilir." },
  { id: 47, question: "Kısmi tıkanıklıkta ne yapılır?", options: ["Heimlich yapılır", "Öksürmeye teşvik edilir", "Sırtına vurulur", "Su içirilir"], correct: 1, explanation: "Kısmi tıkanıklıkta (hasta öksürebiliyor ve konuşabiliyorsa) hastaya dokunulmaz, sadece öksürmeye teşvik edilir." },
  { id: 48, question: "Bebeklerde kalp masajı nereye yapılır?", options: ["Karın üstüne", "İki meme başı ortasının altına", "Omuz arasına", "Boğaza"], correct: 1, explanation: "Bebeklerde kalp masajı, iki meme başı arasındaki hayali çizginin hemen altına, iki parmakla yapılır." },
  { id: 49, question: "Çocuklarda kalp masajı nasıl yapılır?", options: ["Sadece parmakla", "Vücut yapısına göre tek veya çift elle", "Sadece çift elle", "Yapılmaz"], correct: 1, explanation: "Çocuklarda kalp masajı, çocuğun vücut yapısına göre tek elle veya çift elle göğüs kemiği 5 cm inecek şekilde yapılır." },
  { id: 50, question: "İlk yardımın tanımı nedir?", options: ["İlaçlı tedavi", "İlaçsız müdahale", "Ameliyat", "Hastanede yapılan bakım"], correct: 1, explanation: "İlk yardım; olay yerinde, tıbbi araç gereç aranmaksızın, mevcut imkanlarla yapılan ilaçsız müdahaledir." }
];

const TIME_PER_QUESTION = 30;
const TIME_ATTACK_LIMIT = 15;

export default function App() {
  const [view, setView] = useState<'start' | 'menu' | 'group-select' | 'about' | 'contact' | 'quiz' | 'result' | 'scenarios' | 'guide' | 'scenario-play' | 'admin-login' | 'admin-dashboard' | 'wheel'>('start');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [quizMode, setQuizMode] = useState<'normal' | 'time-attack' | 'perfect' | 'marathon'>('normal');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [scenarioStep, setScenarioStep] = useState(1);
  const [scenarioFeedback, setScenarioFeedback] = useState<{ text: string; type: 'success' | 'fail' | 'info' } | null>(null);
  
  const [studentName, setStudentName] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [wrongIds, setWrongIds] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [adminPin, setAdminPin] = useState('');
  const [scoresList, setScoresList] = useState<any[]>([]);
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>(QUESTIONS);
  const [adminTab, setAdminTab] = useState<'scores' | 'questions'>('scores');
  const [adminQuestions, setAdminQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({ options: ['', '', '', ''], correct: 0 });

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
  };

  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setLoadedQuestions(data);
        } else {
          fetch('/api/questions?pin=2007', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(QUESTIONS) });
        }
      }).catch(e => console.log('Questions fetch error'));
  }, []);

  const playSound = (type: 'correct' | 'wrong') => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch(e) {}
  };

  const shuffleQuestions = (questions: Question[]) => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startQuiz = (group: 1 | 2 | 'marathon', mode: typeof quizMode = 'normal') => {
    setQuizMode(mode);
    let selectedQuestions: Question[] = [];
    
    if (group === 'marathon') {
      selectedQuestions = loadedQuestions;
    } else {
      const startIndex = (group - 1) * 25;
      selectedQuestions = loadedQuestions.slice(startIndex, startIndex + 25);
    }

    setActiveQuestions(shuffleQuestions(selectedQuestions));
    setCurrentStep(0);
    setScore(0);
    setWrongIds([]);
    setAnswers({});
    setIsAnswered(false);
    setTimeLeft(mode === 'time-attack' ? TIME_ATTACK_LIMIT : TIME_PER_QUESTION);
    setView('quiz');
  };

  const handleAnswer = useCallback((index: number | null) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const currentQ = activeQuestions[currentStep];
    const isCorrect = index !== null && index === currentQ.correct;
    
    let newScore = score;
    let newWrongs = [...wrongIds];
    let newAnswers = { ...answers };

    if (index !== null) {
      newAnswers[currentQ.id] = index;
      setAnswers(newAnswers);
    }

    if (isCorrect) {
      playSound('correct');
      newScore += 1;
      setScore(newScore);
    } else {
      playSound('wrong');
      newWrongs.push(currentQ.id);
      setWrongIds(newWrongs);
      
      if (quizMode === 'perfect') {
        setTimeout(() => {
          setView('result');
        }, 2000);
        return;
      }
    }
  }, [currentStep, isAnswered, score, wrongIds, answers, activeQuestions, quizMode]);

  const finishQuiz = async () => {
    setIsQuizFinished(true);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ffffff']
    });

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          score: score,
          wrongAnswers: activeQuestions.filter(q => wrongIds.includes(q.id)).map(q => q.question),
          totalQuestions: activeQuestions.length,
          mode: quizMode
        })
      });
    } catch(e) { console.error('Failed to save score', e); }

    setTimeout(() => {
      setView('result');
      setIsQuizFinished(false);
    }, 2500);
  };

  useEffect(() => {
    if (view !== 'quiz' || isAnswered) return;
    if (timeLeft === 0) {
      handleAnswer(null);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, view, isAnswered, handleAnswer]);

  const nextQuestion = () => {
    setCurrentStep(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(quizMode === 'time-attack' ? TIME_ATTACK_LIMIT : TIME_PER_QUESTION);
  };

  const startScenario = (scenario: Scenario) => {
    setActiveScenario(scenario);
    setScenarioStep(1);
    setScenarioFeedback(null);
    setView('scenario-play');
  };

  const handleScenarioOption = (option: ScenarioStep['options'][0]) => {
    setScenarioFeedback({ text: option.feedback, type: option.nextStep === 'fail' ? 'fail' : option.nextStep === 'success' ? 'success' : 'info' });
    
    if (option.nextStep === 'success' || option.nextStep === 'fail') {
      // End of scenario logic handled in UI
    } else {
      setTimeout(() => {
        setScenarioStep(option.nextStep as number);
        setScenarioFeedback(null);
      }, 2500);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loginAdmin = async () => {
    try {
      const res = await fetch(`/api/scores?pin=${adminPin}`);
      if (res.ok) {
        const data = await res.json();
        setScoresList(data);
        const qRes = await fetch('/api/questions');
        if (qRes.ok) {
           const qData = await qRes.json();
           setAdminQuestions(qData && qData.length > 0 ? qData : QUESTIONS);
        } else {
           setAdminQuestions(QUESTIONS);
        }
        setView('admin-dashboard');
      } else {
        alert("Hatalı şifre!");
      }
    } catch (e) {
      alert("Hata oluştu.");
    }
  };

  
  const handleSaveQuestion = async () => {
    if(!newQuestion.question || newQuestion.options?.some(o=>!o)) return alert("Lütfen tüm alanları doldurun");
    const updated = [...adminQuestions];
    if(newQuestion.id) {
       const idx = updated.findIndex(q=>q.id === newQuestion.id);
       updated[idx] = newQuestion as Question;
    } else {
       updated.push({ ...newQuestion, id: Date.now() } as Question);
    }
    setAdminQuestions(updated);
    setLoadedQuestions(updated);
    try {
      await fetch(`/api/questions?pin=${adminPin}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updated)});
      setNewQuestion({ options: ['', '', '', ''], correct: 0, question: '', explanation: '' });
      alert("Soru başarıyla kaydedildi!");
    } catch(e) { alert("Kaydetme hatası"); }
  };
  
  const handleDeleteQuestion = async (id: number) => {
    if(!confirm("Soryu silmek istediğinize emin misiniz?")) return;
    const updated = adminQuestions.filter(q=>q.id !== id);
    setAdminQuestions(updated);
    setLoadedQuestions(updated);
    await fetch(`/api/questions?pin=${adminPin}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updated)});
  };

  const handleWhatsAppShare = () => {
    const text = `Merhaba, ben ${studentName}. Solunum İlk Yardım Eğitim Merkezi sınavını ${score}/${activeQuestions.length} doğru ile tamamladım!`;
    const url = `https://wa.me/905405722007?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const speak = async (text: string) => {
    if (isSpeaking) return;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API anahtarı bulunamadı.");
      return;
    }

    setIsSpeaking(true);
    try {
      const aiInstance = new GoogleGenAI({ apiKey });
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lütfen şu metni profesyonel ve net bir şekilde Türkçe seslendir: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const audioContext = new AudioContextClass({ sampleRate: 24000 });
        
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 16-bit PCM verisini Float32'ye dönüştürme
        const numSamples = Math.floor(len / 2);
        const float32Data = new Float32Array(numSamples);
        const dataView = new DataView(bytes.buffer);
        
        for (let i = 0; i < numSamples; i++) {
          // Little-endian olarak 16-bit signed integer oku
          const sample = dataView.getInt16(i * 2, true);
          // -1.0 ile 1.0 arasına normalize et
          float32Data[i] = sample / 32768;
        }

        const audioBuffer = audioContext.createBuffer(1, numSamples, 24000);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsSpeaking(false);
          audioContext.close();
        };
        source.start(0);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Hatası:", error);
      setIsSpeaking(false);
    }
  };

  const resetQuiz = () => {
    setView('start');
    setStudentName('');
    setCurrentStep(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(TIME_PER_QUESTION);
    setWrongIds([]);
    setAnswers({});
    setIsQuizFinished(false);
  };

  const goBack = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    resetQuiz();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <button 
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-yellow-400' : 'bg-white border-slate-100 text-slate-400'}`}
        aria-label={theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Kurumsal Header */}
      <header className="w-full max-w-lg mb-10 text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-4">
                <div className="bg-red-600 p-3 rounded-2xl shadow-xl shadow-red-200 ring-4 ring-red-50" aria-hidden="true">
              <HeartPulse className="text-white" size={32} />
            </div>
            <div className="text-left">
              <h1 id="main-title" className={`text-3xl sm:text-3xl sm:text-4xl font-black tracking-tighter leading-none uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Solunum <span className="text-red-600">İlk Yardım</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <GraduationCap size={16} className="text-slate-500" aria-hidden="true" />
                <p className="text-slate-500 text-xs sm:text-sm font-black uppercase tracking-[0.25em]">Eğitim Merkezi</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://www.instagram.com/solunumiem/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-3 rounded-2xl shadow-lg border border-slate-50 text-red-600 hover:scale-110 transition-all active:scale-95"
              aria-label="Instagram Profilimiz"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="https://www.facebook.com/Solunumiem/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-3 rounded-2xl shadow-lg border border-slate-50 text-blue-600 hover:scale-110 transition-all active:scale-95"
              aria-label="Facebook Sayfamız"
            >
              <Facebook size={20} />
            </a>
            <a 
              href="https://www.youtube.com/@solunumilkyardm6965" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white p-3 rounded-2xl shadow-lg border border-slate-50 text-red-700 hover:scale-110 transition-all active:scale-95"
              aria-label="YouTube Kanalımız"
            >
              <Youtube size={20} />
            </a>
          </div>
        </motion.div>
      </header>

      <main className={`w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden border relative transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-red-900/10' : 'bg-white border-slate-100'}`} role="main">
        
        <AnimatePresence mode="wait">
          {view === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 sm:p-16 text-center"
              role="region"
              aria-labelledby="main-title"
            >
              <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-red-50'}`} aria-hidden="true">
                <Award className="text-red-500" size={56} />
                <div className={`absolute -bottom-2 -right-2 p-2 rounded-xl shadow-lg border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                  <GraduationCap className="text-slate-500" size={20} />
                </div>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black mb-4 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hoş Geldiniz</h2>
              <p className={`mb-12 font-medium leading-relaxed px-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Bilginizi ölçmek ve ilk yardım becerilerinizi tazelemek için hazırlanan profesyonel eğitim platformuna başlayabilirsiniz.
              </p>
              
              <div className="space-y-5">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    aria-label="Adınız Soyadınız"
                    aria-required="true"
                    className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 outline-none transition-all font-bold shadow-sm text-lg focus-visible:ring-red-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500' : 'bg-white border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-50'}`}
                  />
                </div>
                
                <button
                  onClick={() => studentName.trim() && setView('menu')}
                  disabled={!studentName.trim()}
                  aria-label="Devam Et"
                  className="w-full bg-red-600 text-white py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl hover:bg-red-700 transition-all shadow-2xl shadow-red-200 disabled:opacity-50 disabled:shadow-none active:scale-95 flex items-center justify-center gap-3 focus-visible:ring-4 focus-visible:ring-red-200 outline-none"
                >
                  Devam Et <ChevronRight size={24} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Bizi Takip Edin</p>
                <div className="flex justify-center gap-6">
                  <a href="https://www.instagram.com/solunumiem/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-600 transition-colors flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-red-50 transition-colors">
                      <Instagram size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Instagram</span>
                  </a>
                  <a href="https://www.facebook.com/Solunumiem/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                      <Facebook size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Facebook</span>
                  </a>
                  <a href="https://www.youtube.com/@solunumilkyardm6965" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-700 transition-colors flex flex-col items-center gap-2 group">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-red-50 transition-colors">
                      <Youtube size={20} />
                    </div>
                    <span className="text-[10px] font-bold">YouTube</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="mb-10">
                <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-2">Hoş Geldin,</p>
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{studentName}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setView('group-select')}
                  className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-6 hover:border-red-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                >
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <BookOpen size={28} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sınav Modları</p>
                    <p className="text-slate-500 text-sm font-medium">Zamana karşı veya hatasız sınav</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300 group-hover:text-red-500" size={24} />
                </button>

                <button
                  onClick={() => setView('scenarios')}
                  className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-6 hover:border-red-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                >
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MessageCircle size={28} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>İnteraktif Senaryolar</p>
                    <p className="text-slate-500 text-sm font-medium">Adım adım gerçekçi vakalar</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300 group-hover:text-blue-500" size={24} />
                </button>

                <button
                  onClick={() => setView('guide')}
                  className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-6 hover:border-red-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                >
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Info size={28} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hızlı Rehber</p>
                    <p className="text-slate-500 text-sm font-medium">Acil durum el kitabı</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-300 group-hover:text-green-500" size={24} />
                </button>

                <button
                  onClick={() => setView('wheel')}
                  className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-6 hover:border-red-500 hover:shadow-xl transition-all group shadow-md shadow-purple-200 ${theme === 'dark' ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-700' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-purple-100'}`}
                >
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-inner">
                    <Loader2 size={28} className="group-hover:animate-spin" />
                  </div>
                  <div className="text-left">
                    <p className={`font-black text-xl ${theme === 'dark' ? 'text-white' : 'text-purple-900'}`}>Şans Çarkı</p>
                    <p className="text-purple-500 text-sm font-bold">Sınıf içi interaktif yarışma</p>
                  </div>
                  <ChevronRight className="ml-auto text-purple-300 group-hover:text-purple-600" size={24} />
                </button>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <button
                    onClick={() => setView('about')}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 hover:border-red-500 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <Info size={20} className="text-slate-400" />
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Hakkımızda</span>
                  </button>
                  <button
                    onClick={() => setView('contact')}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 hover:border-red-500 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <Phone size={20} className="text-slate-400" />
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>İletişim</span>
                  </button>
                  <button
                    onClick={() => setView('admin-login')}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 hover:border-red-500 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <Award size={20} className="text-slate-400" />
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Eğitmen Paneli</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setView('start')}
                className="mt-10 w-full text-slate-400 font-black text-xs uppercase tracking-widest hover:text-red-600 transition-colors"
              >
                İsim Değiştir
              </button>
            </motion.div>
          )}

          {view === 'group-select' && (
            <motion.div 
              key="group-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('menu')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sınav Modu Seçin</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => startQuiz(1, 'normal')}
                    className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left hover:border-red-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-red-600 font-black text-xs uppercase tracking-widest">Normal Mod</p>
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-bold">25 Soru</span>
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Grup 1: Temel Eğitim</h3>
                    <p className="text-slate-500 text-sm font-medium">Her soru için 30 saniye süre.</p>
                  </button>

                  <button
                    onClick={() => startQuiz(1, 'time-attack')}
                    className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left hover:border-orange-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-orange-600 font-black text-xs uppercase tracking-widest">Zamana Karşı</p>
                      <Timer size={16} className="text-orange-500" />
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hızlı Cevap</h3>
                    <p className="text-slate-500 text-sm font-medium">Her soru için sadece 15 saniye!</p>
                  </button>

                  <button
                    onClick={() => startQuiz(1, 'perfect')}
                    className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left hover:border-purple-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-purple-600 font-black text-xs uppercase tracking-widest">Hatasız Mod</p>
                      <Award size={16} className="text-purple-500" />
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sıfır Hata</h3>
                    <p className="text-slate-500 text-sm font-medium">Tek bir yanlışta sınav biter.</p>
                  </button>

                  <button
                    onClick={() => startQuiz('marathon', 'normal')}
                    className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left hover:border-blue-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-blue-600 font-black text-xs uppercase tracking-widest">Maraton</p>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold">50 Soru</span>
                    </div>
                    <h3 className={`text-xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tüm Soru Bankası</h3>
                    <p className="text-slate-500 text-sm font-medium">Tüm konuları kapsayan uzun sınav.</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'scenarios' && (
            <motion.div 
              key="scenarios"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('menu')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>İnteraktif Senaryolar</h2>
              </div>

              <div className="space-y-4">
                {SCENARIOS.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => startScenario(scenario)}
                    className={`w-full p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-left hover:border-blue-500 hover:shadow-xl transition-all group ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                  >
                    <h3 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{scenario.title}</h3>
                    <p className="text-slate-500 text-sm font-medium">{scenario.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'scenario-play' && activeScenario && (
            <motion.div 
              key="scenario-play"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('scenarios')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activeScenario.title}</h2>
              </div>

              <div className="space-y-8">
                <div className={`p-8 rounded-[2rem] border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                  <p className="text-lg font-bold leading-relaxed">
                    {activeScenario.steps[scenarioStep].text}
                  </p>
                </div>

                <div className="space-y-3">
                  {activeScenario.steps[scenarioStep].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleScenarioOption(option)}
                      disabled={!!scenarioFeedback}
                      className={`w-full p-5 rounded-2xl border-2 text-left font-bold transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500' : 'bg-white border-slate-100 text-slate-700 hover:border-blue-500 hover:bg-blue-50'}`}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {scenarioFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-2xl border-2 flex items-start gap-4 ${scenarioFeedback.type === 'success' ? 'bg-green-50 border-green-100 text-green-900' : scenarioFeedback.type === 'fail' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}
                    >
                      {scenarioFeedback.type === 'success' ? <CheckCircle2 className="shrink-0" /> : scenarioFeedback.type === 'fail' ? <XCircle className="shrink-0" /> : <Info className="shrink-0" />}
                      <div>
                        <p className="font-bold">{scenarioFeedback.text}</p>
                        {(scenarioFeedback.type === 'success' || scenarioFeedback.type === 'fail') && (
                          <button 
                            onClick={() => setView('scenarios')}
                            className="mt-4 text-xs font-black uppercase tracking-widest underline"
                          >
                            Senaryolara Dön
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {view === 'guide' && (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('menu')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hızlı Rehber</h2>
              </div>

              <div className="space-y-4">
                {GUIDE_ITEMS.map((item, idx) => (
                  <div key={idx} className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                        {item.icon}
                      </div>
                      <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.content}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'about' && (
            <motion.div 
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('menu')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hakkımızda</h2>
              </div>

              <div className="space-y-8">
                <div className={`p-8 rounded-[2.5rem] border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-red-50 border-red-100'}`}>
                  <p className={`text-lg font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-red-900'}`}>
                    Solunum İlk Yardım Eğitim Merkezi, hayati önem taşıyan ilk yardım bilgilerini modern ve etkileşimli yöntemlerle sunan, Sağlık Bakanlığı onaylı bir eğitim kuruluşudur.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className={`p-6 rounded-3xl border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Award size={24} />
                      </div>
                      <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Vizyonumuz</h3>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Her evde, her iş yerinde ve her araçta en az bir eğitimli ilk yardımcı bulunmasını sağlayarak, önlenebilir can kayıplarının önüne geçmek ve bilinçli bir toplum inşasına katkıda bulunmaktır.
                    </p>
                  </div>

                  <div className={`p-6 rounded-3xl border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <GraduationCap size={24} />
                      </div>
                      <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Eğitim Kalitemiz</h3>
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Uzman sağlık personeli eğitmenlerimiz, son teknoloji eğitim mankenlerimiz ve interaktif müfredatımızla, teorik bilgiyi pratik beceriye dönüştürüyoruz. Kursiyerlerimizin sadece sınavı geçmesini değil, gerçek bir olayda soğukkanlılıkla müdahale edebilmesini sağlıyoruz.
                    </p>
                  </div>

                  <div className={`p-6 rounded-3xl border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <HeartPulse size={24} />
                      </div>
                      <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Neden Biz?</h3>
                    </div>
                    <ul className={`text-sm font-medium space-y-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      <li className="flex items-center gap-2">• Sağlık Bakanlığı Onaylı Sertifika</li>
                      <li className="flex items-center gap-2">• %100 Uygulamalı Eğitim Modeli</li>
                      <li className="flex items-center gap-2">• Merkezi Lokasyon ve Modern Sınıflar</li>
                      <li className="flex items-center gap-2">• Sınav Öncesi Sınırsız Soru Çözüm Desteği</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'contact' && (
            <motion.div 
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('menu')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>İletişim</h2>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-5 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 hover:border-red-500'}`}>
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                      <Phone size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Telefon Numaralarımız</p>
                      <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>0212 572 2007</p>
                      <p className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>0540 572 2007</p>
                    </div>
                  </div>

                  <div className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex items-center gap-5 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 hover:border-red-500'}`}>
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Eğitim Merkezimiz</p>
                      <p className={`font-bold text-sm leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        İsmetpaşa Mh. 54. Sk. No: 2/5<br />
                        Sultangazi / İSTANBUL
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`pt-6 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Sosyal Medya</p>
                  <div className="flex gap-4">
                    <a href="https://www.instagram.com/solunumiem/" target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'}`}>
                      <Instagram size={24} />
                    </a>
                    <a href="https://www.facebook.com/Solunumiem/" target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-blue-500' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}>
                      <Facebook size={24} />
                    </a>
                    <a href="https://www.youtube.com/@solunumilkyardm6965" target="_blank" rel="noopener noreferrer" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'}`}>
                      <Youtube size={24} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'quiz' && (
            <motion.div 
              key="quiz" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              role="region"
              aria-label="Sınav Sorusu"
            >
              <div className={`${theme === 'dark' ? 'bg-slate-900 border-b border-slate-800' : 'bg-red-600'} p-8 sm:p-10 text-white flex justify-between items-center relative`}>
                <button 
                  onClick={goBack}
                  aria-label="Ana sayfaya dön"
                  className={`absolute left-8 top-4 text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-widest border backdrop-blur-sm outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-red-700/50 border-red-400/30 hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-white'}`}
                >
                  ← Ana Sayfaya Dön
                </button>
                
                <div className="mt-6">
                  <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-white/80'}`}>{studentName}</h2>
                  <p className={`text-xl sm:text-2xl font-black leading-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-white'}`}>Soru {currentStep + 1} <span className="text-red-100 text-sm font-bold ml-1 opacity-90">/ {activeQuestions.length}</span></p>
                </div>
                <div 
                  className={`mt-6 flex items-center gap-3 px-6 py-3 rounded-2xl border-2 shadow-xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-red-700 border-red-400'} ${timeLeft <= 5 ? 'animate-pulse border-white' : ''}`}
                  aria-live={timeLeft <= 5 ? 'assertive' : 'polite'}
                  aria-label={`Kalan süre: ${timeLeft} saniye`}
                >
                  <Timer size={24} aria-hidden="true" />
                  <span className="font-black text-2xl tabular-nums leading-none" aria-hidden="true">{timeLeft}</span>
                </div>
              </div>
              
              <div className={`h-3 w-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`} role="progressbar" aria-valuenow={Math.round(((currentStep + (isAnswered ? 1 : 0)) / activeQuestions.length) * 100)} aria-valuemin={0} aria-valuemax={100}>
                <motion.div 
                  className="h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
                  animate={{ width: `${((currentStep + (isAnswered ? 1 : 0)) / activeQuestions.length) * 100}%` }} 
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="p-10 sm:p-12 space-y-10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 id="question-text" className={`text-2xl font-bold leading-tight min-h-[5rem] tracking-tight flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {activeQuestions[currentStep].question}
                    </h2>
                    <button
                      onClick={() => speak(activeQuestions[currentStep].question)}
                      disabled={isSpeaking}
                      className={`p-3 rounded-2xl transition-all disabled:opacity-50 ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600'}`}
                      title="Soruyu Dinle"
                    >
                      {isSpeaking ? <Loader2 className="animate-spin" size={24} /> : <Volume2 size={24} />}
                    </button>
                  </div>
                  
                  <div className="space-y-4" role="radiogroup" aria-labelledby="question-text">
                    {activeQuestions[currentStep].options.map((option, index) => {
                      const isCorrect = index === activeQuestions[currentStep].correct;
                      const isSelected = index === selectedAnswer;
                      let btnClass = "w-full text-left p-6 rounded-[1.75rem] border-2 transition-all duration-300 flex items-center group relative outline-none ";
                      
                      if (!isAnswered) {
                        btnClass += theme === 'dark' 
                          ? "border-slate-800 bg-slate-800/50 hover:border-red-500 hover:bg-slate-800 text-slate-300" 
                          : "border-slate-100 bg-white hover:border-red-500 hover:bg-red-50 hover:shadow-lg text-slate-800 active:scale-[0.98] focus-visible:border-red-500 focus-visible:ring-4 focus-visible:ring-red-50";
                      }
                      else if (isCorrect) btnClass += "border-green-500 bg-green-500/10 text-green-500 shadow-md";
                      else if (isSelected) btnClass += "border-red-500 bg-red-500/10 text-red-500 shadow-md";
                      else btnClass += "border-slate-800 opacity-40 grayscale-[0.5] text-slate-500";

                      return (
                        <button 
                          key={index} 
                          onClick={() => handleAnswer(index)} 
                          disabled={isAnswered} 
                          className={btnClass}
                          aria-label={`${String.fromCharCode(65 + index)} şıkkı: ${option}`}
                        >
                          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center mr-5 font-black text-base transition-all ${!isAnswered ? (theme === 'dark' ? 'bg-slate-700 text-slate-400 group-hover:bg-red-500 group-hover:text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-red-500 group-hover:text-white') : isCorrect ? 'bg-green-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-800'}`} aria-hidden="true">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="font-bold text-base sm:text-lg flex-1 leading-snug">{option}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="text-green-500 shrink-0 ml-2" size={28} aria-hidden="true" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500 shrink-0 ml-2" size={28} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {isAnswered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-[1.75rem] border-2 ${selectedAnswer === activeQuestions[currentStep].correct ? 'border-green-100 bg-green-50/50 text-green-900' : 'border-red-100 bg-red-50/50 text-red-900'}`}
                        role="alert"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                              {selectedAnswer === activeQuestions[currentStep].correct ? (
                                <><CheckCircle2 size={16} /> Doğru Cevap</>
                              ) : (
                                <><XCircle size={16} /> Yanlış Cevap</>
                              )}
                            </p>
                            <p className="text-sm font-bold leading-relaxed">
                              {activeQuestions[currentStep].explanation}
                            </p>
                          </div>
                          <button
                            onClick={() => speak(activeQuestions[currentStep].explanation)}
                            disabled={isSpeaking}
                            className="p-2 bg-white/50 text-slate-500 rounded-xl hover:bg-white hover:text-red-600 transition-all disabled:opacity-50 shrink-0"
                            title="Açıklamayı Dinle"
                          >
                            {isSpeaking ? <Loader2 className="animate-spin" size={18} /> : <Volume2 size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {isAnswered && !isQuizFinished && (
                      currentStep < activeQuestions.length - 1 ? (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={nextQuestion} 
                          aria-label="Sonraki soruya geç"
                          className="w-full bg-slate-900 text-white py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl active:scale-95 focus-visible:ring-4 focus-visible:ring-slate-200 outline-none"
                        >
                          Sıradaki Soru <ChevronRight size={28} aria-hidden="true" />
                        </motion.button>
                      ) : (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={finishQuiz} 
                          aria-label="Sınavı bitir ve sonuçları gör"
                          className="w-full bg-red-600 text-white py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl flex items-center justify-center gap-4 hover:bg-red-700 transition-all shadow-2xl active:scale-95 focus-visible:ring-4 focus-visible:ring-red-200 outline-none"
                        >
                          Sınavı Bitir <Award size={28} aria-hidden="true" />
                        </motion.button>
                      )
                    )}

                    {isQuizFinished && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 text-white p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        <div className="relative z-10">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="text-red-500 animate-bounce" size={32} />
                          </div>
                          <h3 className="text-xl font-black mb-2">Sınav Tamamlandı!</h3>
                          <p className="text-slate-400 font-medium">Sonuçlar hesaplanıyor ve gösteriliyor...</p>
                          <div className="mt-6 flex justify-center gap-1">
                            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-red-500 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-red-500 rounded-full" />
                            <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'result' && (
            <motion.div 
              key="result" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="p-6 sm:p-16 text-center"
              role="region"
              aria-label="Sınav Sonucu"
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-red-50'}`} aria-hidden="true">
                <Award className="text-red-500" size={64} />
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-2 -right-2 bg-green-500 text-white p-3 rounded-2xl shadow-lg"
                >
                  <CheckCircle2 size={24} />
                </motion.div>
              </div>
              
              <div className="mb-10">
                <p className="text-red-600 font-black text-xs uppercase tracking-[0.4em] mb-3">Sınav Tamamlandı</p>
                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{studentName}</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {quizMode === 'time-attack' ? 'Zamana Karşı' : quizMode === 'perfect' ? 'Hatasız Mod' : quizMode === 'marathon' ? 'Maraton' : 'Normal Mod'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Doğru</p>
                  <p className="text-3xl sm:text-4xl font-black text-green-500 tabular-nums">{score}</p>
                </div>
                <div className={`p-8 rounded-[2.5rem] border-2 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Yanlış</p>
                  <p className="text-3xl sm:text-4xl font-black text-red-500 tabular-nums">{activeQuestions.length - score}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleWhatsAppShare}
                  className="w-full bg-slate-900 text-white py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  WhatsApp ile Gönder <Share2 size={24} />
                </button>
                <button 
                  onClick={goBack} 
                  className={`w-full py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl flex items-center justify-center gap-4 border-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}
                >
                  Ana Menüye Dön <ArrowLeft size={24} />
                </button>
              </div>
            </motion.div>
          )}
          {view === 'wheel' && (
            <motion.div 
              key="wheel"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full flex flex-col items-center relative py-6"
            >
              <div className="w-full flex justify-between items-center mb-10 px-4">
                 <button onClick={() => setView('menu')} className={`p-3 rounded-2xl transition-colors font-bold flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
                   <ArrowLeft size={20} /> Ana Menü
                 </button>
                 <h2 className={`text-2xl font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Sıradakİ Kursİyer!</h2>
                 <div className="w-10"></div>
              </div>

              <div className="relative w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] mt-4">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-900 z-20 shadow-lg" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
                
                <motion.div 
                  className="w-full h-full rounded-full border-8 border-slate-900 shadow-2xl relative overflow-hidden"
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: 5, ease: [0.15, 0.85, 0.35, 1] }}
                  style={{
                    background: `conic-gradient(${WHEEL_SEGMENTS.map((s, i) => `${s.color} ${i * (360 / WHEEL_SEGMENTS.length)}deg ${(i + 1) * (360 / WHEEL_SEGMENTS.length)}deg`).join(', ')})`
                  }}
                >
                  {WHEEL_SEGMENTS.map((seg, i) => {
                    const angle = 360 / WHEEL_SEGMENTS.length;
                    const rotate = (i * angle) + (angle / 2);
                    return (
                      <div key={i} className="absolute w-full h-full flex justify-center pt-6 sm:pt-10" style={{ transform: `rotate(${rotate}deg)` }}>
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
                className={`mt-16 px-14 py-6 rounded-full font-black text-2xl uppercase tracking-widest shadow-xl transition-all ${isSpinning ? 'bg-slate-300 text-slate-500 cursor-not-allowed scale-95' : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-red-200'}`}
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
                                <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black ${wheelSelectedAnswer === null ? 'bg-slate-100 text-slate-500' : (isCorrect ? 'bg-green-200 text-green-900' : (isSelected ? 'bg-red-200 text-red-900' : 'bg-slate-100 text-slate-400'))}`}>
                                  {String.fromCharCode(65+i)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {wheelSelectedAnswer !== null && (
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className={`mt-10 p-8 rounded-[2rem] border-4 ${isWheelAnswerCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
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

          {view === 'admin-login' && (
            <motion.div 
              key="admin-login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 sm:p-16"
            >
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setView('menu')} className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                  <ArrowLeft size={24} className="text-slate-400" />
                </button>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Eğitmen Girişi</h2>
              </div>
              <div className="space-y-4">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Paneli görüntülemek için eğitmen şifresini giriniz:</p>
                <input 
                  type="password"
                  value={adminPin}
                  onChange={e => setAdminPin(e.target.value)}
                  className={`w-full p-4 rounded-2xl border-2 font-bold focus-visible:border-red-500 outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'}`}
                  placeholder="Şifre"
                />
                <button onClick={loginAdmin} className="w-full bg-red-600 text-white py-4 rounded-2xl font-black mt-4 hover:bg-red-700">Giriş Yap</button>
              </div>
            </motion.div>
          )}

          {view === 'admin-dashboard' && (
            <motion.div 
              key="admin-dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 sm:p-10 w-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <button onClick={() => setView('menu')} className={`p-3 rounded-2xl transition-colors font-bold flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
                  <ArrowLeft size={20} /> Ana Menü
                </button>
                <div className={`flex gap-2 p-1.5 rounded-2xl shadow-inner ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                   <button onClick={() => setAdminTab('scores')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${adminTab === 'scores' ? (theme === 'dark' ? 'bg-slate-700 shadow-md text-white' : 'bg-white shadow-md text-slate-900') : 'text-slate-500 hover:text-slate-700'}`}>Sonuçlar</button>
                   <button onClick={() => setAdminTab('questions')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${adminTab === 'questions' ? (theme === 'dark' ? 'bg-slate-700 shadow-md text-white' : 'bg-white shadow-md text-slate-900') : 'text-slate-500 hover:text-slate-700'}`}>Soru Bankası</button>
                </div>
              </div>

              {adminTab === 'scores' && (
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                  {scoresList.length === 0 ? <p className="text-slate-500 font-medium text-center py-10">Kayıtlı sınav sonucu bulunmamaktadır.</p> : scoresList.slice().reverse().map((s: any, i: number) => (
                    <div key={i} className={`p-5 sm:p-6 rounded-3xl border-2 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.name}</span>
                        <span className="font-black px-3 py-1 rounded-xl bg-red-50 text-red-600 text-sm tracking-widest uppercase">{s.score} / {s.totalQuestions} Doğru</span>
                      </div>
                      <span className="text-xs text-slate-400 font-bold mb-4 block">{new Date(s.date).toLocaleString('tr-TR')} • Mod: {s.mode}</span>
                      
                      {s.wrongAnswers && s.wrongAnswers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-red-100">
                          <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2"><XCircle size={16}/> Yanlış Bilinen Sorular</p>
                          <ul className="space-y-2">
                            {s.wrongAnswers.map((w: string, idx: number) => (
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
                <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 pb-20" id="question-bank-scroll">
                  <div className={`p-5 sm:p-8 rounded-3xl border-2 shadow-lg ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <h3 className={`text-xl sm:text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{newQuestion.id ? '✏️ Soruyu Düzenle' : '➕ Yeni Soru Ekle'}</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Soru Metni</label>
                        <textarea placeholder="Sorunun kendisini buraya yazın..." value={newQuestion.question || ''} onChange={e=>setNewQuestion({...newQuestion, question: e.target.value})} className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-red-500 font-bold min-h-[4rem] ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 text-slate-800'}`} />
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Şıklar (Doğru olanı işaretleyin)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {newQuestion.options?.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-2xl border-2 pl-4 focus-within:border-red-400 transition-colors ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                              <input type="radio" name="correctOption" checked={newQuestion.correct === oIdx} onChange={() => setNewQuestion({...newQuestion, correct: oIdx})} className="w-6 h-6 accent-red-500 cursor-pointer" />
                              <input type="text" placeholder={`${String.fromCharCode(65+oIdx)} Şıkkı`} value={opt} onChange={e=>{const nopts=[...(newQuestion.options || [])]; nopts[oIdx]=e.target.value; setNewQuestion({...newQuestion, options: nopts})}} className={`w-full bg-transparent outline-none text-base font-bold ${theme === 'dark' ? 'text-white placeholder:text-slate-500' : 'text-slate-800'}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Açıklama (Yanlış cevaplandığında gösterilecek)</label>
                        <textarea placeholder="Neden bu cevap doğru? Açıklaması..." value={newQuestion.explanation || ''} onChange={e=>setNewQuestion({...newQuestion, explanation: e.target.value})} className={`w-full p-4 rounded-2xl border-2 outline-none focus:border-red-500 font-bold min-h-[4rem] ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 text-slate-800'}`} />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-slate-100">
                        <button onClick={handleSaveQuestion} className="bg-red-600 shadow-xl shadow-red-200 text-white font-black px-8 py-4 rounded-2xl hover:bg-red-700 transition-all text-lg flex-1 sm:flex-none">Sisteme Kaydet</button>
                        {newQuestion.id && <button onClick={()=>setNewQuestion({ options: ['', '', '', ''], correct: 0, question: '', explanation: '' })} className="bg-slate-200 text-slate-600 font-black px-8 py-4 rounded-2xl hover:bg-slate-300 transition-all text-lg flex-1 sm:flex-none">İptal</button>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mevcut Sorular ({adminQuestions.length})</h3>
                    {adminQuestions.map((q: Question, i: number) => (
                      <div key={q.id} className={`p-4 sm:p-6 rounded-3xl border-2 shadow-sm flex flex-col gap-4 group hover:border-red-300 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        <div className="flex-1">
                          <p className={`font-bold text-base sm:text-lg leading-snug mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{i+1}. {q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {q.options.map((opt: string, oId: number) => (
                               <div key={oId} className={`text-xs font-bold p-2 rounded-lg ${oId === q.correct ? 'bg-green-100 text-green-700 border border-green-200' : (theme === 'dark' ? 'bg-slate-700 text-slate-400 border border-slate-600' : 'bg-slate-50 text-slate-500 border border-slate-100')}`}>
                                 {String.fromCharCode(65+oId)}) {opt}
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 w-full">
                          <button onClick={() => { setNewQuestion(q); document.getElementById('question-bank-scroll')?.scrollTo({top:0, behavior:'smooth'}); }} className="flex-1 px-5 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Düzenle</button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="flex-1 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Sil</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExitConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center"
              >
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RotateCcw size={40} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">Emin misiniz?</h3>
                <p className="text-slate-600 mb-8 font-medium leading-relaxed">Sınavdan çıkmak üzeresiniz. Mevcut ilerlemeniz ve skorunuz silinecektir.</p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmExit}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                  >
                    Evet, Çıkış Yap
                  </button>
                  <button 
                    onClick={cancelExit}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    Vazgeç
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
