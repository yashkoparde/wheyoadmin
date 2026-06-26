import React, { useState } from 'react';
import { 
  Building, 
  HelpCircle, 
  ShieldAlert, 
  Search, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Minus,
  Apple,
  Clock,
  Dumbbell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Structuring high-quality SEO Optimized pages content directly
interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const SEO_FAQS: FaqItem[] = [
  {
    category: "Subscriptions",
    question: "How do Wheyo Fresh High-Protein meal subscriptions work?",
    answer: "Wheyo offers premium, chef-prepared weekly and monthly athlete meal prep subscriptions. You choose your training volume or macro package, and our culinary kitchen designs calorie-accurate high-protein meals. Each morning, fresh meal boxes and premium whey booster drinks are prepared and shipped directly to your designated partner gym's reception table via our delivery boys."
  },
  {
    category: "Delivery Boys",
    question: "Do you use stagnant lockers or storage lockers for drop-offs?",
    answer: "No! There are absolutely no lockers. To ensure the highest grade of food preservation and freshness, all meal preps are delivered live of the line by our hand-picked delivery team. The delivery boy drops your fresh insulated package directly to the designated athlete pickup points (usually the gym's reception counter or coaching trainers table) right around your scheduled pre or post-workout feeding slot."
  },
  {
    category: "Nutrition",
    question: "Can I customize the nutritional macros in my meal plan?",
    answer: "Yes, our elite plans (such as Lean Gain Blueprint and Hypertrophy Overdrive) allow full customization. We track protein, fats, and complex carbohydrates seamlessly. You can add extra Whey protein isolate or hydration boosters directly into your contract drop checklist so your delivery boy always brings you personalized nutrition."
  },
  {
    category: "Billing",
    question: "What is the cancellation or pause policy for subscription plans?",
    answer: "Contracts run on automated rolling weekly or monthly billing cycles to guarantee consistent fresh ingredient sourcing. You can pause or adjust your assigned gym drop points at any time with a 24-hour operator notice inside the Wheyo admin panel."
  },
  {
    category: "Coupons",
    question: "How are whey promotional coupons saved and applied to my checkout cart?",
    answer: "Promotional vouchers and gym reward discount coupons are safely managed on our secure backend database. Once configured in our coupon manager, they can be searched and activated on your account. When completing a custom order, the cart engine validates the coupon against current active deals, updates the reference sub-total, and applies your corresponding discount instantly."
  }
];

export default function SeoHub() {
  const [activeSubTab, setActiveSubTab] = useState<'philosophy' | 'points' | 'faq' | 'legal'>('philosophy');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Filter FAQs
  const filteredFaqs = SEO_FAQS.filter(
    f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
         f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-brand-neon/10 border border-brand-neon/20 rounded font-mono text-[9px] text-brand-neon uppercase tracking-widest">
              SEO & Public Pages Center
            </span>
          </div>
          <h2 className="text-3xl font-black font-display uppercase tracking-tight text-white flex items-center gap-3">
            Organic Traffic & Info Hub
          </h2>
          <p className="text-xs font-mono text-white/50 uppercase tracking-wide mt-1">
            Search engine indexed landing pages, delivery drop information, dietary philosophies, and consumer disclosures.
          </p>
        </div>
      </div>

      {/* Internal SEO Hub Navigation */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveSubTab('philosophy')}
          className={`px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'philosophy' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          1. Diet Philosophy & Macros
        </button>

        <button
          onClick={() => setActiveSubTab('points')}
          className={`px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'points' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          2. Hand-Delivered Drop Zones
        </button>

        <button
          onClick={() => setActiveSubTab('faq')}
          className={`px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'faq' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          3. FAQ & Index Schemas
        </button>

        <button
          onClick={() => setActiveSubTab('legal')}
          className={`px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0 ${
            activeSubTab === 'legal' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          4. Privacy & Disclosures
        </button>
      </div>

      {/* MAIN VIEW CONTENTS */}
      <div className="min-h-[500px]">
        {/* PANEL A: PHILOSOPHY */}
        {activeSubTab === 'philosophy' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-6 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon mb-4">
                    <Apple size={20} />
                  </div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Lean Muscle Formula</h3>
                  <p className="font-mono text-[11px] text-white/60 mt-3 uppercase leading-relaxed">
                    Designed specifically for athletic training. Every meal utilizes a 40:40:20 distribution block of lean chicken breast or grass-fed cow paneer, complex brown carbs, and essential active fats.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-brand-neon/70 uppercase mt-4 tracking-widest">
                  ★ High Protein Meal prep Plan
                </div>
              </div>

              <div className="glass-card p-6 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon mb-4">
                    <Dumbbell size={20} />
                  </div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Pure Whey Booster Infusions</h3>
                  <p className="font-mono text-[11px] text-white/60 mt-3 uppercase leading-relaxed">
                    Unlike standard meals, Wheyo integrates ultra-filtered Whey Isolate, Creatine Monohydrate, and Amino Hydrators directly into your delivered shaker cups, preloaded on your exact training schedule.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-brand-neon/70 uppercase mt-4 tracking-widest">
                  ★ Whey Boosters Nutrition
                </div>
              </div>

              <div className="glass-card p-6 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon mb-4">
                    <Clock size={20} />
                  </div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Absolute Zero Stale Storage</h3>
                  <p className="font-mono text-[11px] text-white/60 mt-3 uppercase leading-relaxed">
                    Stored locker containers cultivate bacteria and deteriorate flavor. Our commitment is direct kitchen-to-gym hand delivery, avoiding physical cabinets and lockers entirely for flawless hygiene.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-brand-neon/70 uppercase mt-4 tracking-widest">
                  ★ Fresh Athlete Nutrition
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-white/5 bg-brand-gray/30">
              <h4 className="font-display text-2xl font-bold uppercase tracking-tight mb-4">Hyper-Optimized Keyword Reference list</h4>
              <p className="font-mono text-xs text-white/70 leading-relaxed mb-6 uppercase">
                Search Engine bots read our structured indices to index the following tags. We strictly monitor organic placement for fitness queries:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  "Fresh Diet meal subscription",
                  "Chef meal prep delivery service",
                  "Gym health meals dropped daily",
                  "No locker premium food",
                  "Whey isolate shake boosters",
                  "Custom macros bodybuilding diet",
                  "Low sodium athlete lunch subscription",
                  "Instant protein recovery shakes",
                  "Certified sports nutritionist meals",
                  "Keto high-fat power packs",
                  "Weight loss portion-control drops",
                  "Pre-workout creatine boost meal"
                ].map((tag, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 p-3 rounded font-mono text-[10px] text-brand-neon flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-neon inline-block" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PANEL B: DELIVERY POINTS */}
        {activeSubTab === 'points' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-card p-8 border-brand-neon/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon shrink-0">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-display font-black text-3xl uppercase tracking-tight text-white">Hand-Delivered Logistics (No Cabinets)</h3>
                  <p className="font-mono text-xs text-white/50 mt-1 uppercase">
                    Every meal package is handled strictly by our premium delivery boy pool directly to athlete training centers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-black/40 border border-white/5 rounded-lg p-5">
                  <span className="font-mono text-[10px] text-brand-neon uppercase tracking-wider block mb-2 font-bold">1. How You Receive Your Food</span>
                  <p className="font-mono text-xs text-white/70 leading-relaxed uppercase">
                    Once the delivery boy arrives at your registered gym location, he hand-delivers your fresh Wheyo meal boxes to the reception desk or the assigned coaches storage table. 
                    No code required, no stale compartments. Approach the desk, specify your Student ID or Registered Phone Number, and grab your nutrient-dense fuel!
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-lg p-5">
                  <span className="font-mono text-[10px] text-brand-neon uppercase tracking-wider block mb-2 font-bold">2. Our Delivery Boy Guarantee</span>
                  <p className="font-mono text-xs text-white/70 leading-relaxed uppercase">
                    Our runners are fully trained in hot-and-cold food preservation standards. All shaker feeds and preps are transported in insulated high-grade storage packs so your post-workout whey isolate nutrition remains optimal.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Partner Drop-zones */}
            <h4 className="font-display text-xl font-bold uppercase tracking-tight text-white mt-8 mb-4">Active partner Drop Locations / Partner Gyms</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Gold's Elite Gym Center", zones: "Reception Desk Level 1", timing: "06:00 AM - 10:00 AM" },
                { name: "Iron Temple Weightlifting Studio", zones: "Coaching Team Counter", timing: "07:00 AM - 11:30 AM" },
                { name: "Cult Fit Workout Arena", zones: "Front Desk Intake Table", timing: "06:30 AM - 09:30 AM" },
                { name: "Redwood Athletics club House", zones: "Main Lobby Member Lounge", timing: "08:00 AM - 12:00 PM" },
                { name: "Powerhouse Hypertrophy Lab", zones: "Trainer Table Block B", timing: "05:30 AM - 10:00 AM" },
                { name: "Supreme Crossfit Box", zones: "Sports Bar Area Counter", timing: "07:30 AM - 11:00 AM" }
              ].map((loc, i) => (
                <div key={i} className="glass-card p-5 border-white/15">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="text-white/40 w-4 h-4" />
                    <span className="font-display font-medium text-white truncate uppercase">{loc.name}</span>
                  </div>
                  <div className="space-y-1 font-mono text-[10px] text-white/50 uppercase">
                    <div>Drop Zone: <span className="text-white font-bold">{loc.zones}</span></div>
                    <div>Runner Hours: <span className="text-brand-neon font-bold">{loc.timing}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PANEL C: FAQ */}
        {activeSubTab === 'faq' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="relative mb-6">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search indexable FAQ database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-gray border border-white/10 rounded px-3 py-3 pl-10 font-mono text-xs text-white focus:border-brand-neon outline-none uppercase"
              />
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq, i) => (
                <div 
                  key={i} 
                  className="bg-brand-gray/30 border border-white/5 rounded-lg overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-display font-bold text-white uppercase text-sm cursor-pointer hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-brand-neon/10 border border-brand-neon/30 text-brand-neon font-mono text-[8px] rounded uppercase shrink-0">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    {openFaq === i ? <Minus size={16} /> : <Plus size={16} />}
                  </button>

                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-black/20"
                      >
                        <p className="p-5 font-mono text-xs text-white/70 uppercase leading-relaxed border-t border-white/5">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-12 font-mono text-xs text-white/40">
                  <HelpCircle className="mx-auto w-8 h-8 opacity-25 mb-2" />
                  NO SEARCH MATCHES FOUND FOR '{searchQuery}'
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL D: LEGAL & DISCLOSURES */}
        {activeSubTab === 'legal' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-card p-6 border-white/10 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <ShieldAlert className="text-brand-orange w-5 h-5 shrink-0" />
                <h4 className="font-display font-bold text-lg uppercase tracking-tight text-white">Important Subscriber Disclosures</h4>
              </div>

              <div className="space-y-4 font-mono text-xs text-white/70 uppercase leading-relaxed">
                <div>
                  <h5 className="font-bold text-brand-neon mb-1 font-display">1. Allergen & Cross-Contamination Statement</h5>
                  <p>
                    All Wheyo meal preps and protein supplements are produced in a facility that actively processes gluten, soy, tree nuts, groundnuts, eggs, and dairy isolates. Athletes with severe clinical food allergies must consult their physician before starting our automated meal subscriptions.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-brand-neon mb-1 font-display">2. Recurring Agreement & Automatic Charge cycles</h5>
                  <p>
                    By activating a weekly or monthly subscription contract (such as the Lean Gain Blueprint or Hypertrophy Overdrive), you explicitly permit and authorize Wheyo to automatically renew and process transactions of your configured price point each cycle. Your contract can be paused or updated inside the subscriber panel at any time.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-brand-neon mb-1 font-display">3. Courier Responsibility & Shelf-Life Notice</h5>
                  <p>
                    Once the delivery boy finishes and completes the drop-off of your nutritional items at the gym partner receiver depot, the primary custody of the fresh meals shifts to the user athlete. Because meals are preservative-free, they must be refrigerated or consumed within 4 hours of drop notification to prevent macro decomposition.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
