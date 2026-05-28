import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon,
  Lock,
  RefreshCw,
  Save,
  Trophy,
  UserRound,
} from "lucide-react";

const STORAGE_KEY = "austin-nati-success-tracker-v1";

const DEFAULT_SETTINGS = {
  appTitle: "Austin & Nati’s Success Tracker",
  subtitle: "Building our future one day at a time.",
  endDate: "2026-12-26T00:00:00",
  greenThreshold: 90,
  yellowThreshold: 60,
  austinProteinGoal: 220,
  austinCalorieCap: 2600,
  adminPin: "2175",
  weeklyFlexBudget: 200,
  appsScriptUrl: "",
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "master", label: "Master Plan", icon: BookOpen },
  { id: "austin", label: "Austin", icon: UserRound },
  { id: "nati", label: "Nati", icon: UserRound },
  { id: "review", label: "Review", icon: Trophy },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const AUSTIN_CHECKS = [
  {
    id: "fitness",
    category: "Fitness",
    label: "Did Austin close all of his fitness rings today?",
  },
  {
    id: "work",
    category: "Work/School",
    label:
      "Did Austin complete meaningful work toward life insurance, media, fitness, or part-time income today?",
  },
  {
    id: "protein",
    category: "Nutrition",
    label: "Did Austin hit his protein goal for the day?",
  },
  {
    id: "calories",
    category: "Nutrition",
    label: "Did Austin stay under 2,600 calories for the day?",
  },
  {
    id: "personal",
    category: "Personal Investment",
    label: "Did Austin dedicate 15 minutes today to bettering himself?",
  },
];

const NATI_CHECKS = [
  {
    id: "fitness",
    category: "Fitness",
    label:
      "Did Nati go to the gym or complete a 30 minute walk / intentional movement today?",
  },
  {
    id: "school",
    category: "Work/School",
    label:
      "Did Nati complete intentional study time or meaningful school progress today? Minimum 60 minutes.",
  },
  {
    id: "homeMeals",
    category: "Nutrition",
    label: "Did Nati eat mostly home/prepped meals today?",
  },
  {
    id: "water",
    category: "Nutrition",
    label: "Did Nati drink enough water today?",
  },
  {
    id: "personal",
    category: "Personal Investment",
    label: "Did Nati dedicate 15 minutes today to bettering herself?",
  },
];

const AUSTIN_WORK_OPTIONS = [
  "Life Insurance",
  "Media",
  "Fitness",
  "Part-Time Income",
  "Other",
];

const AUSTIN_PERSONAL_OPTIONS = [
  "Reading",
  "Spanish",
  "Journaling",
  "Mindset",
  "Sales Training",
  "Faith/Reflection",
  "Other",
];

const NATI_MOVEMENT_OPTIONS = [
  "Gym",
  "30-Minute Walk",
  "Pilates",
  "Home Workout",
  "Stretching/Mobility",
  "Other",
];

const NATI_SCHOOL_OPTIONS = [
  "Study",
  "Assignment",
  "Exam Prep",
  "Project",
  "Other",
];

const NATI_PERSONAL_OPTIONS = [
  "Reading",
  "Journaling",
  "Self-Care",
  "Planning",
  "Learning",
  "Reflection",
  "Other",
];

const MOTIVATION = {
  Green: [
    "You both handled business. Keep the standard high.",
    "Green week energy. Stay locked in and protect the momentum.",
    "This is what consistency looks like. Keep building.",
  ],
  Yellow: [
    "Still in the game. Tighten the weak spot and reset.",
    "Progress is there. Now clean up the inconsistency.",
    "Yellow means effort showed up. Next step is sharper execution.",
  ],
  Red: [
    "No shame. Correct the pattern and get back on track.",
    "This week needs correction. Reset the standard today.",
    "Red is feedback, not failure. Fix the weak spot and move.",
  ],
};

const RESET_SUGGESTIONS = {
  Fitness: "30-minute walk, Pilates, gym session, or mobility before fun.",
  "Work/School": "Complete one focused work/study block before fun.",
  Nutrition: "Grocery run, meal prep, or planned healthy meal before fun.",
  "Personal Investment":
    "15-minute reflection, reading, journaling, or learning reset before fun.",
};

const initialData = {
  settings: DEFAULT_SETTINGS,
  checkIns: [],
  weeklyReviews: [],
  weights: [],
  startingWeights: {
    Austin: null,
    Nati: null,
  },
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfScoringWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  return addDays(d, diff);
}

function scoringDays(date = new Date()) {
  const start = startOfScoringWeek(date);
  return Array.from({ length: 6 }, (_, i) => addDays(start, i));
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDay(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function getStatus(score, settings = DEFAULT_SETTINGS) {
  if (score >= Number(settings.greenThreshold)) return "Green";
  if (score >= Number(settings.yellowThreshold)) return "Yellow";
  return "Red";
}

function statusColor(status) {
  if (status === "Green") return "#22c55e";
  if (status === "Yellow") return "#eab308";
  return "#ef4444";
}

function scoreFromChecks(checks) {
  const values = Object.values(checks || {});
  if (!values.length) return 0;
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function completedCount(checks) {
  return Object.values(checks || {}).filter(Boolean).length;
}

function personChecks(person) {
  return person === "Austin" ? AUSTIN_CHECKS : NATI_CHECKS;
}

function categoryScores(person, record) {
  const checks = personChecks(person);
  const result = {};
  checks.forEach((item) => {
    if (!result[item.category]) result[item.category] = [];
    result[item.category].push(Boolean(record?.checks?.[item.id]));
  });

  return Object.fromEntries(
    Object.entries(result).map(([category, values]) => [
      category,
      Math.round((values.filter(Boolean).length / values.length) * 100),
    ])
  );
}

function strongestWeakestFromCategoryScores(scores) {
  const entries = Object.entries(scores);
  if (!entries.length) {
    return { strongest: "None yet", weakest: "None yet" };
  }
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  return {
    strongest: sorted[0][0],
    weakest: sorted[sorted.length - 1][0],
  };
}

function findCheckIn(checkIns, person, dateKey) {
  return checkIns.find((r) => r.person === person && r.date === dateKey);
}

function makeEmptyChecks(person) {
  return Object.fromEntries(personChecks(person).map((c) => [c.id, false]));
}

function calculatePersonWeekly(person, checkIns, settings, date = new Date()) {
  const days = scoringDays(date);
  const totalPossible = days.length * 5;
  let totalDone = 0;

  days.forEach((day) => {
    const record = findCheckIn(checkIns, person, toKey(day));
    totalDone += completedCount(record?.checks || {});
  });

  const score = Math.round((totalDone / totalPossible) * 100);
  return { score, status: getStatus(score, settings), totalDone, totalPossible };
}

function calculateCombinedWeekly(checkIns, settings, date = new Date()) {
  const austin = calculatePersonWeekly("Austin", checkIns, settings, date);
  const nati = calculatePersonWeekly("Nati", checkIns, settings, date);
  const score = Math.round((austin.score + nati.score) / 2);
  return {
    score,
    status: getStatus(score, settings),
    austin,
    nati,
  };
}

function calculateDailyCombined(checkIns, settings, date) {
  const dateKey = toKey(date);
  const austin = findCheckIn(checkIns, "Austin", dateKey);
  const nati = findCheckIn(checkIns, "Nati", dateKey);
  const aScore = austin ? scoreFromChecks(austin.checks) : 0;
  const nScore = nati ? scoreFromChecks(nati.checks) : 0;
  const score = Math.round((aScore + nScore) / 2);

  return {
    dateKey,
    score,
    status: getStatus(score, settings),
    austinScore: aScore,
    natiScore: nScore,
    austin,
    nati,
  };
}

function weeklyCategoryReport(person, checkIns, date = new Date()) {
  const days = scoringDays(date);
  const checks = personChecks(person);
  const categoryBuckets = {};

  checks.forEach((item) => {
    if (!categoryBuckets[item.category]) categoryBuckets[item.category] = [];
  });

  days.forEach((day) => {
    const record = findCheckIn(checkIns, person, toKey(day));
    checks.forEach((item) => {
      categoryBuckets[item.category].push(Boolean(record?.checks?.[item.id]));
    });
  });

  const scores = Object.fromEntries(
    Object.entries(categoryBuckets).map(([category, values]) => [
      category,
      Math.round((values.filter(Boolean).length / values.length) * 100),
    ])
  );

  return {
    scores,
    ...strongestWeakestFromCategoryScores(scores),
  };
}

function combinedCategoryReport(checkIns, date = new Date()) {
  const a = weeklyCategoryReport("Austin", checkIns, date).scores;
  const n = weeklyCategoryReport("Nati", checkIns, date).scores;
  const categories = ["Fitness", "Work/School", "Nutrition", "Personal Investment"];
  const scores = Object.fromEntries(
    categories.map((cat) => [cat, Math.round(((a[cat] || 0) + (n[cat] || 0)) / 2)])
  );
  return {
    scores,
    ...strongestWeakestFromCategoryScores(scores),
  };
}

function specificWeakSpots(checkIns, date = new Date()) {
  const days = scoringDays(date);
  const misses = [];

  [
    ["Austin", AUSTIN_CHECKS],
    ["Nati", NATI_CHECKS],
  ].forEach(([person, checks]) => {
    checks.forEach((check) => {
      let missed = 0;
      days.forEach((day) => {
        const record = findCheckIn(checkIns, person, toKey(day));
        if (!record?.checks?.[check.id]) missed += 1;
      });
      misses.push({
        person,
        label: check.label,
        category: check.category,
        missed,
      });
    });
  });

  return misses.sort((a, b) => b.missed - a.missed).slice(0, 2);
}

function currentStreak(person, checkIns, isTeam = false) {
  let count = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i += 1) {
    const day = cursor.getDay();
    if (day === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }

    if (cursor > new Date()) {
      cursor = addDays(cursor, -1);
      continue;
    }

    const dateKey = toKey(cursor);

    if (isTeam) {
      const a = findCheckIn(checkIns, "Austin", dateKey);
      const n = findCheckIn(checkIns, "Nati", dateKey);
      const ok =
        completedCount(a?.checks || {}) >= 3 && completedCount(n?.checks || {}) >= 3;
      if (ok) count += 1;
      else break;
    } else {
      const record = findCheckIn(checkIns, person, dateKey);
      if (completedCount(record?.checks || {}) >= 3) count += 1;
      else break;
    }

    cursor = addDays(cursor, -1);
  }

  return count;
}

function bestWeeklyStreak(person, checkIns, isTeam = false) {
  const weeks = new Map();

  checkIns.forEach((record) => {
    const weekStart = toKey(startOfScoringWeek(parseKey(record.date)));
    if (!weeks.has(weekStart)) weeks.set(weekStart, []);
  });

  if (!weeks.size) {
    weeks.set(toKey(startOfScoringWeek(new Date())), []);
  }

  let best = 0;

  weeks.forEach((_, weekKey) => {
    const days = scoringDays(parseKey(weekKey));
    let current = 0;

    days.forEach((day) => {
      const dateKey = toKey(day);
      let ok = false;

      if (isTeam) {
        const a = findCheckIn(checkIns, "Austin", dateKey);
        const n = findCheckIn(checkIns, "Nati", dateKey);
        ok =
          completedCount(a?.checks || {}) >= 3 &&
          completedCount(n?.checks || {}) >= 3;
      } else {
        const record = findCheckIn(checkIns, person, dateKey);
        ok = completedCount(record?.checks || {}) >= 3;
      }

      if (ok) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });
  });

  return best;
}

function useStoredData() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...initialData, ...JSON.parse(raw) } : initialData;
    } catch {
      return initialData;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  return [data, setData];
}

function Ring({ score, label, size = 190, stroke = 16, status, muted = false }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ringStatus = status || getStatus(score);
  const color = muted ? "#475569" : statusColor(ringStatus);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative grid place-items-center progress-glow"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(148,163,184,0.16)"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 900ms ease, stroke 300ms ease" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className={size < 100 ? "text-sm font-black" : "text-3xl font-black"}>
            {muted ? "—" : `${score}%`}
          </div>
          {!muted && size >= 150 && (
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {ringStatus}
            </div>
          )}
        </div>
      </div>
      {label && <div className="text-sm font-bold text-slate-300">{label}</div>}
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return <div className={`glass-card rounded-3xl p-5 ${className}`}>{children}</div>;
}

function PillButton({ children, onClick, type = "button", variant = "gold", disabled }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "gold" ? "gold-button" : "dark-button"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-yellow-400"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-yellow-400"
    />
  );
}

function CheckboxRow({ checked, onChange, label }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-yellow-400"
      />
      <span className="text-sm font-semibold leading-6 text-slate-100">{label}</span>
    </label>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useStoredData();
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [selectedDay, setSelectedDay] = useState(toKey(new Date()));
  const [expandedDay, setExpandedDay] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const effectiveData = showDemo ? makeDemoData(settings) : data;

  const weekDays = scoringDays(new Date());
  const weekStart = weekDays[0];
  const weekEnd = weekDays[5];
  const combined = calculateCombinedWeekly(effectiveData.checkIns, settings);
  const combinedReport = combinedCategoryReport(effectiveData.checkIns);
  const weakSpots = specificWeakSpots(effectiveData.checkIns);
  const weeksLeft = Math.max(
    0,
    Math.ceil((new Date(settings.endDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
  );
  const messagePool = MOTIVATION[combined.status];
  const motivation = messagePool[combined.score % messagePool.length];

  function saveCheckIn(person, dateKey, checks, details) {
    const now = new Date().toISOString();
    setData((prev) => {
      const existing = findCheckIn(prev.checkIns, person, dateKey);
      const record = {
        date: dateKey,
        weekStart: toKey(startOfScoringWeek(parseKey(dateKey))),
        weekEnd: toKey(addDays(startOfScoringWeek(parseKey(dateKey)), 5)),
        person,
        checks,
        details,
        dailyScore: scoreFromChecks(checks),
        submittedAt: existing?.submittedAt || now,
        lastEditedAt: now,
        synced: false,
      };

      return {
        ...prev,
        checkIns: existing
          ? prev.checkIns.map((r) =>
              r.person === person && r.date === dateKey ? record : r
            )
          : [...prev.checkIns, record],
      };
    });
  }

  function saveWeight(person, payload) {
    const now = new Date().toISOString();
    const weekKey = toKey(startOfScoringWeek(new Date()));
    setData((prev) => {
      const existing = prev.weights.find(
        (w) => w.person === person && w.weekStart === weekKey
      );
      const record = {
        person,
        weekStart: weekKey,
        date: toKey(new Date()),
        ...payload,
        submittedAt: existing?.submittedAt || now,
        lastEditedAt: now,
      };
      return {
        ...prev,
        weights: existing
          ? prev.weights.map((w) =>
              w.person === person && w.weekStart === weekKey ? record : w
            )
          : [...prev.weights, record],
      };
    });
  }

  function saveStartingWeight(person, weight) {
    setData((prev) => ({
      ...prev,
      startingWeights: {
        ...prev.startingWeights,
        [person]: weight,
      },
    }));
  }

  function saveWeeklyReview(form) {
    const now = new Date().toISOString();
    const aReport = weeklyCategoryReport("Austin", effectiveData.checkIns);
    const nReport = weeklyCategoryReport("Nati", effectiveData.checkIns);
    const record = {
      weekStart: toKey(weekStart),
      weekEnd: toKey(weekEnd),
      combinedScore: combined.score,
      overallWeekColor: `${combined.status} Week`,
      strongestSharedCategory: combinedReport.strongest,
      weakestSharedCategory: combinedReport.weakest,
      suggestedReset: RESET_SUGGESTIONS[combinedReport.weakest],
      austinWeeklyScore: combined.austin.score,
      austinStrongestCategory: aReport.strongest,
      austinWeakestCategory: aReport.weakest,
      natiWeeklyScore: combined.nati.score,
      natiStrongestCategory: nReport.strongest,
      natiWeakestCategory: nReport.weakest,
      ...form,
      submittedAt: now,
    };

    setData((prev) => ({
      ...prev,
      weeklyReviews: [...prev.weeklyReviews, record],
    }));
  }

  function resetLocalData() {
    setData(initialData);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="min-h-screen pb-24 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <header className="mb-5 text-center">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            {settings.appTitle}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-300 sm:text-base">
            {settings.subtitle}
          </p>
        </header>

        <DesktopTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="mt-5">
          {activeTab === "dashboard" && (
            <Dashboard
              settings={settings}
              weeksLeft={weeksLeft}
              combined={combined}
              combinedReport={combinedReport}
              weakSpots={weakSpots}
              weekDays={weekDays}
              checkIns={effectiveData.checkIns}
              expandedDay={expandedDay}
              setExpandedDay={setExpandedDay}
              motivation={motivation}
              weeklyReviews={effectiveData.weeklyReviews}
            />
          )}

          {activeTab === "master" && <MasterPlan />}

          {activeTab === "austin" && (
            <PersonTracker
              person="Austin"
              checks={AUSTIN_CHECKS}
              settings={settings}
              data={effectiveData}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              onSave={saveCheckIn}
              onSaveWeight={saveWeight}
              onSaveStartingWeight={saveStartingWeight}
            />
          )}

          {activeTab === "nati" && (
            <PersonTracker
              person="Nati"
              checks={NATI_CHECKS}
              settings={settings}
              data={effectiveData}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              onSave={saveCheckIn}
              onSaveWeight={saveWeight}
              onSaveStartingWeight={saveStartingWeight}
            />
          )}

          {activeTab === "review" && (
            <WeeklyReview
              data={effectiveData}
              settings={settings}
              combined={combined}
              combinedReport={combinedReport}
              onSubmit={saveWeeklyReview}
            />
          )}

          {activeTab === "settings" && (
            <Settings
              data={data}
              setData={setData}
              settings={settings}
              adminUnlocked={adminUnlocked}
              setAdminUnlocked={setAdminUnlocked}
              showDemo={showDemo}
              setShowDemo={setShowDemo}
              resetLocalData={resetLocalData}
            />
          )}
        </main>
      </div>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function DesktopTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="hidden justify-center gap-2 rounded-full border border-slate-800 bg-slate-950/40 p-2 backdrop-blur md:flex">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
              isActive ? "bg-yellow-400 text-slate-950" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[10px] font-bold ${
                isActive ? "bg-yellow-400 text-slate-950" : "text-slate-400"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Dashboard({
  settings,
  weeksLeft,
  combined,
  combinedReport,
  weakSpots,
  weekDays,
  checkIns,
  expandedDay,
  setExpandedDay,
  motivation,
  weeklyReviews,
}) {
  const weekLabel = `${formatShortDate(weekDays[0])} – ${formatShortDate(
    weekDays[5]
  )}`;
  const teamStreak = currentStreak(null, checkIns, true);
  const teamBest = bestWeeklyStreak(null, checkIns, true);
  const reviewSubmitted = weeklyReviews.some(
    (r) => r.weekStart === toKey(weekDays[0]) && r.weekEnd === toKey(weekDays[5])
  );

  return (
    <div className="space-y-5">
      <GlassCard className="text-center">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-950/40 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Weeks Left
            </p>
            <p className="text-4xl font-black text-yellow-300">{weeksLeft}</p>
          </div>
          <div className="rounded-3xl bg-slate-950/40 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Current Week
            </p>
            <p className="text-2xl font-black">{weekLabel}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
          This Week’s Progress
        </p>
        <Ring
          score={combined.score}
          status={combined.status}
          size={230}
          stroke={20}
          label={`Current Weekly Score: ${combined.score}% / ${combined.status} Week`}
        />
        <p className="mx-auto mt-5 max-w-md text-sm font-semibold text-slate-300">
          {motivation}
        </p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              Team Streak
            </p>
            <p className="text-2xl font-black">{teamStreak} days locked in</p>
          </div>
          <div className="text-right text-sm text-slate-400">
            Best Weekly Streak
            <div className="font-black text-slate-100">{teamBest}/6</div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard name="Austin" score={combined.austin.score} settings={settings} />
        <ScoreCard name="Nati" score={combined.nati.score} settings={settings} />
      </div>

      <GlassCard>
        <h2 className="mb-4 text-xl font-black">Daily Progress</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
          {weekDays.map((day) => {
            const dateKey = toKey(day);
            const isFuture = day > new Date();
            const daily = calculateDailyCombined(checkIns, settings, day);
            const hasRecord = daily.austin || daily.nati;
            const muted = isFuture || (!hasRecord && toKey(day) === toKey(new Date()));

            return (
              <button
                key={dateKey}
                onClick={() => setExpandedDay(expandedDay === dateKey ? null : dateKey)}
                className="rounded-3xl bg-slate-950/40 p-3"
              >
                <Ring
                  score={hasRecord ? daily.score : 0}
                  status={daily.status}
                  size={76}
                  stroke={8}
                  muted={muted}
                />
                <p className="mt-1 text-xs font-black">{formatDay(day)}</p>
              </button>
            );
          })}

          <div className="rounded-3xl bg-slate-950/40 p-3 text-center">
            <Trophy className="mx-auto mb-2 h-7 w-7 text-yellow-300" />
            <p className="text-xs font-black">Review + Reset</p>
            <p className="mt-1 text-[11px] text-slate-400">
              {reviewSubmitted ? "Submitted" : "Not Submitted Yet"} · {combined.score}% /{" "}
              {combined.status}
            </p>
          </div>
        </div>

        {expandedDay && (
          <DailyBreakdown
            dateKey={expandedDay}
            checkIns={checkIns}
            settings={settings}
          />
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Projected Couple Report</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ReportStat label="Strongest Shared Category" value={combinedReport.strongest} />
          <ReportStat label="Weakest Shared Category" value={combinedReport.weakest} />
        </div>
        <div className="mt-4 rounded-3xl bg-slate-950/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Specific Weak Spot
          </p>
          <p className="mt-2 text-sm font-bold text-slate-200">
            {weakSpots.map((w) => `${w.person}: ${w.category}`).join(" + ")}
          </p>
        </div>
        <div className="mt-4 rounded-3xl bg-slate-950/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Suggested Reset Before Fun
          </p>
          <p className="mt-2 text-sm font-bold text-slate-200">
            {RESET_SUGGESTIONS[combinedReport.weakest]}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

function ScoreCard({ name, score, settings }) {
  const status = getStatus(score, settings);
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
            {name}
          </p>
          <p className="text-3xl font-black">{score}%</p>
        </div>
        <div
          className="rounded-full px-4 py-2 text-xs font-black"
          style={{ background: `${statusColor(status)}22`, color: statusColor(status) }}
        >
          {status}
        </div>
      </div>
    </GlassCard>
  );
}

function ReportStat({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-950/40 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function DailyBreakdown({ dateKey, checkIns, settings }) {
  const [full, setFull] = useState(false);
  const daily = calculateDailyCombined(checkIns, settings, parseKey(dateKey));

  function missed(person) {
    const record = findCheckIn(checkIns, person, dateKey);
    return personChecks(person)
      .filter((c) => !record?.checks?.[c.id])
      .map((c) => c.category);
  }

  return (
    <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/50 p-4">
      <h3 className="text-lg font-black">{formatShortDate(parseKey(dateKey))}</h3>
      <p className="text-sm text-slate-400">Combined daily score: {daily.score}%</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="text-sm">
          <span className="font-black">Austin missed:</span>{" "}
          {missed("Austin").join(", ") || "None"}
        </p>
        <p className="text-sm">
          <span className="font-black">Nati missed:</span>{" "}
          {missed("Nati").join(", ") || "None"}
        </p>
      </div>
      <button
        className="mt-4 rounded-full border border-yellow-400/30 px-4 py-2 text-xs font-bold"
        onClick={() => setFull(!full)}
      >
        {full ? "Hide Full Details" : "View Full Details"}
      </button>

      {full && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Austin", "Nati"].map((person) => {
            const record = findCheckIn(checkIns, person, dateKey);
            return (
              <div key={person} className="rounded-2xl bg-slate-900/70 p-4">
                <p className="mb-2 font-black">{person}</p>
                {personChecks(person).map((check) => (
                  <p key={check.id} className="text-sm text-slate-300">
                    {record?.checks?.[check.id] ? "✅" : "❌"} {check.category}
                  </p>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PersonTracker({
  person,
  checks,
  settings,
  data,
  selectedDay,
  setSelectedDay,
  onSave,
  onSaveWeight,
  onSaveStartingWeight,
}) {
  const weekDays = scoringDays(new Date());
  const selectedRecord = findCheckIn(data.checkIns, person, selectedDay);
  const [localChecks, setLocalChecks] = useState(
    selectedRecord?.checks || makeEmptyChecks(person)
  );
  const [details, setDetails] = useState(selectedRecord?.details || {});
  const [message, setMessage] = useState("");
  const [weightOpen, setWeightOpen] = useState(false);
  const weekly = calculatePersonWeekly(person, data.checkIns, settings);
  const todayKey = toKey(new Date());
  const todayRecord = findCheckIn(data.checkIns, person, todayKey);
  const todayScore = todayRecord ? scoreFromChecks(todayRecord.checks) : 0;
  const preview = scoreFromChecks(localChecks);
  const existing = Boolean(selectedRecord);
  const report = weeklyCategoryReport(person, data.checkIns);
  const streak = currentStreak(person, data.checkIns);
  const best = bestWeeklyStreak(person, data.checkIns);

  useEffect(() => {
    const record = findCheckIn(data.checkIns, person, selectedDay);
    setLocalChecks(record?.checks || makeEmptyChecks(person));
    setDetails(record?.details || {});
  }, [selectedDay, person, data.checkIns]);

  function updateCheck(id, value) {
    setLocalChecks((prev) => ({ ...prev, [id]: value }));
  }

  function updateDetail(id, value) {
    setDetails((prev) => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    onSave(person, selectedDay, localChecks, details);
    setMessage(existing ? "Progress updated." : "Day completed.");
    setTimeout(() => setMessage(""), 2500);
  }

  return (
    <div className="space-y-5">
      <GlassCard className="text-center">
        <Ring
          score={weekly.score}
          status={weekly.status}
          size={210}
          stroke={18}
          label={`${person}’s Progress · ${weekly.score}% / ${weekly.status}`}
        />
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
            <span>Today</span>
            <span>{todayScore}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-800">
            <div
              className="h-3 rounded-full bg-yellow-400 transition-all"
              style={{ width: `${todayScore}%` }}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
          Current Streak
        </p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-2xl font-black">{streak} days locked in</p>
          <p className="text-sm text-slate-400">Best Weekly Streak: {best}/6</p>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-xl font-black">Daily Check-In</h2>

        <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {weekDays.map((day) => {
            const key = toKey(day);
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`rounded-2xl px-3 py-2 text-xs font-black ${
                  selectedDay === key
                    ? "bg-yellow-400 text-slate-950"
                    : "bg-slate-950/50 text-slate-300"
                }`}
              >
                {formatDay(day)}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.id}>
              <CheckboxRow
                checked={Boolean(localChecks[check.id])}
                onChange={(value) => updateCheck(check.id, value)}
                label={check.label}
              />
              {localChecks[check.id] && (
                <DetailFields
                  person={person}
                  id={check.id}
                  details={details}
                  updateDetail={updateDetail}
                  settings={settings}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-950/40 p-4 text-center">
          <p className="text-sm font-bold text-slate-300">
            Preview: {completedCount(localChecks)}/5 complete, {preview}%
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <PillButton onClick={handleSubmit}>
            {existing ? "Update Check-In" : "Complete Today"}
          </PillButton>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-center text-sm font-bold text-yellow-200">
            {message}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="mb-4 text-xl font-black">Previous Days This Week</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {weekDays.map((day) => {
            const record = findCheckIn(data.checkIns, person, toKey(day));
            const score = record ? scoreFromChecks(record.checks) : 0;
            const status = getStatus(score, settings);
            const missed = checks
              .filter((c) => !record?.checks?.[c.id])
              .map((c) => c.category);

            return (
              <div key={toKey(day)} className="rounded-3xl bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-black">{formatDay(day)}</p>
                  <p style={{ color: record ? statusColor(status) : "#94a3b8" }}>
                    {record ? `${score}%` : "Incomplete"}
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Missed: {record ? missed.join(", ") || "None" : "Not submitted"}
                </p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Projected Weekly Report</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ReportStat label={`${person} Excelled At`} value={report.strongest} />
          <ReportStat label={`${person} Needs Work On`} value={report.weakest} />
        </div>
      </GlassCard>

      <GlassCard>
        <button
          onClick={() => setWeightOpen(!weightOpen)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xl font-black">Weight Tracking</span>
          {weightOpen ? <ChevronUp /> : <ChevronDown />}
        </button>
        {weightOpen && (
          <WeightTracking
            person={person}
            data={data}
            onSaveWeight={onSaveWeight}
            onSaveStartingWeight={onSaveStartingWeight}
          />
        )}
      </GlassCard>
    </div>
  );
}

function DetailFields({ person, id, details, updateDetail, settings }) {
  if (person === "Austin" && id === "fitness") {
    return (
      <div className="mt-3 grid gap-3 rounded-2xl bg-slate-950/40 p-4 sm:grid-cols-3">
        <TextInput
          type="number"
          placeholder="Move calories"
          value={details.moveCalories || ""}
          onChange={(e) => updateDetail("moveCalories", e.target.value)}
        />
        <TextInput
          type="number"
          placeholder="Exercise minutes"
          value={details.exerciseMinutes || ""}
          onChange={(e) => updateDetail("exerciseMinutes", e.target.value)}
        />
        <TextInput
          type="number"
          placeholder="Steps"
          value={details.steps || ""}
          onChange={(e) => updateDetail("steps", e.target.value)}
        />
      </div>
    );
  }

  if (person === "Austin" && id === "work") {
    return (
      <div className="mt-3 rounded-2xl bg-slate-950/40 p-4">
        <SelectInput
          value={details.workType || ""}
          onChange={(e) => updateDetail("workType", e.target.value)}
        >
          <option value="">Work type</option>
          {AUSTIN_WORK_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectInput>
      </div>
    );
  }

  if (person === "Austin" && id === "protein") {
    const val = Number(details.proteinGrams || 0);
    return (
      <div className="mt-3 rounded-2xl bg-slate-950/40 p-4">
        <TextInput
          type="number"
          placeholder="Protein grams"
          value={details.proteinGrams || ""}
          onChange={(e) => updateDetail("proteinGrams", e.target.value)}
        />
        {details.proteinGrams && val < Number(settings.austinProteinGoal) && (
          <p className="mt-2 text-xs font-bold text-yellow-300">
            Protein goal is {settings.austinProteinGoal}g. Make sure this still honestly counts for today.
          </p>
        )}
      </div>
    );
  }

  if (person === "Austin" && id === "calories") {
    const val = Number(details.totalCalories || 0);
    return (
      <div className="mt-3 rounded-2xl bg-slate-950/40 p-4">
        <TextInput
          type="number"
          placeholder="Total calories"
          value={details.totalCalories || ""}
          onChange={(e) => updateDetail("totalCalories", e.target.value)}
        />
        {details.totalCalories && val > Number(settings.austinCalorieCap) && (
          <p className="mt-2 text-xs font-bold text-yellow-300">
            Calorie cap is {settings.austinCalorieCap}. Make sure this still honestly counts for today.
          </p>
        )}
      </div>
    );
  }

  if (person === "Austin" && id === "personal") {
    return (
      <div className="mt-3 rounded-2xl bg-slate-950/40 p-4">
        <SelectInput
          value={details.personalType || ""}
          onChange={(e) => updateDetail("personalType", e.target.value)}
        >
          <option value="">Personal investment type</option>
          {AUSTIN_PERSONAL_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectInput>
      </div>
    );
  }

  if (person === "Nati" && id === "fitness") {
    return (
      <div className="mt-3 rounded-2xl bg-slate-950/40 p-4">
        <SelectInput
          value={details.movementType || ""}
          onChange={(e) => updateDetail("movementType", e.target.value)}
        >
          <option value="">Movement type</option>
          {NATI_MOVEMENT_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectInput>
      </div>
    );
  }

  if (person === "Nati" && id === "school") {
    const minutes = Number(details.studyMinutes || 0);
    return (
      <div className="mt-3 grid gap-3 rounded-2xl bg-slate-950/40 p-4 sm:grid-cols-2">
        <TextInput
          type="number"
          placeholder="Minutes studied"
          value={details.studyMinutes || ""}
          onChange={(e) => updateDetail("studyMinutes", e.target.value)}
        />
        <SelectInput
          value={details.schoolType || ""}
          onChange={(e) => updateDetail("schoolType", e.target.value)}
        >
          <option value="">School type</option>
          {NATI_SCHOOL_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectInput>
        {details.studyMinutes && minutes < 60 && (
          <p className="text-xs font-bold text-yellow-300 sm:col-span-2">
            Minimum goal is 60 minutes. Make sure this still counts as meaningful progress.
          </p>
        )}
      </div>
    );
  }

  if (person === "Nati" && id === "personal") {
    return (
      <div className="mt-3 rounded-2xl bg-slate-950/40 p-4">
        <SelectInput
          value={details.personalType || ""}
          onChange={(e) => updateDetail("personalType", e.target.value)}
        >
          <option value="">Personal investment type</option>
          {NATI_PERSONAL_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </SelectInput>
      </div>
    );
  }

  return null;
}

function WeightTracking({ person, data, onSaveWeight, onSaveStartingWeight }) {
  const [starting, setStarting] = useState(data.startingWeights?.[person] || "");
  const [editingStarting, setEditingStarting] = useState(!data.startingWeights?.[person]);
  const [weight, setWeight] = useState("");
  const today = new Date();
  const day = today.getDay();
  const canEnter = day === 1 || day === 2;
  const personWeights = data.weights
    .filter((w) => w.person === person)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const last4 = personWeights.slice(0, 4);
  const current = last4[0]?.mondayWeight;
  const previous = last4[1]?.mondayWeight;
  const weeklyChange =
    current && previous ? (Number(current) - Number(previous)).toFixed(1) : null;
  const totalChange =
    current && data.startingWeights?.[person]
      ? (Number(current) - Number(data.startingWeights[person])).toFixed(1)
      : null;

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-3xl bg-slate-950/40 p-4">
        <p className="text-sm font-black">Starting Weight</p>
        {editingStarting ? (
          <div className="mt-3 flex gap-2">
            <TextInput
              type="number"
              step="0.1"
              placeholder="Starting weight"
              value={starting}
              onChange={(e) => setStarting(e.target.value)}
            />
            <PillButton
              onClick={() => {
                onSaveStartingWeight(person, starting);
                setEditingStarting(false);
              }}
            >
              <Save className="h-4 w-4" />
            </PillButton>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-2xl font-black">{data.startingWeights?.[person]} lbs</p>
            <button
              className="text-xs font-bold text-yellow-300"
              onClick={() => setEditingStarting(true)}
            >
              Edit Starting Weight
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-slate-950/40 p-4">
        <p className="text-sm font-black">Monday Weigh-In</p>
        {canEnter ? (
          <div className="mt-3 flex gap-2">
            <TextInput
              type="number"
              step="0.1"
              placeholder="Current weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <PillButton
              onClick={() => {
                onSaveWeight(person, {
                  startingWeight: data.startingWeights?.[person] || "",
                  mondayWeight: weight,
                });
                setWeight("");
              }}
            >
              Save
            </PillButton>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            Weight entry opens Monday and Tuesday.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ReportStat label="Current" value={current ? `${current} lbs` : "—"} />
        <ReportStat label="Weekly Change" value={weeklyChange ? `${weeklyChange} lbs` : "—"} />
        <ReportStat label="Total Change" value={totalChange ? `${totalChange} lbs` : "—"} />
      </div>

      <div className="rounded-3xl bg-slate-950/40 p-4">
        <p className="mb-3 text-sm font-black">Last 4 Monday Weigh-Ins</p>
        {last4.length ? (
          last4.map((w) => (
            <p key={`${w.person}-${w.weekStart}`} className="text-sm text-slate-300">
              {formatShortDate(parseKey(w.weekStart))}: {w.mondayWeight} lbs
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-400">No weigh-ins yet.</p>
        )}
      </div>
    </div>
  );
}

function WeeklyReview({ data, settings, combined, combinedReport, onSubmit }) {
  const [form, setForm] = useState({
    whatWentWell: "",
    improveNextWeek: "",
    resetBeforeFun: "",
    funEarned: "",
    notes: "",
  });
  const [done, setDone] = useState(false);
  const isSunday = new Date().getDay() === 0;
  const aReport = weeklyCategoryReport("Austin", data.checkIns);
  const nReport = weeklyCategoryReport("Nati", data.checkIns);

  function update(id, value) {
    setForm((prev) => ({ ...prev, [id]: value }));
  }

  function submit() {
    onSubmit(form);
    setDone(true);
  }

  return (
    <div className="space-y-5">
      <GlassCard className="text-center">
        <h2 className="mb-4 text-2xl font-black">Combined Couple Report</h2>
        <Ring
          score={combined.score}
          status={combined.status}
          size={210}
          stroke={18}
          label={`${combined.score}% / ${combined.status} Week`}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ReportStat label="Strongest Shared Category" value={combinedReport.strongest} />
          <ReportStat label="Weakest Shared Category" value={combinedReport.weakest} />
        </div>
        <div className="mt-4 rounded-3xl bg-slate-950/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Suggested Reset Before Fun
          </p>
          <p className="mt-2 font-bold">{RESET_SUGGESTIONS[combinedReport.weakest]}</p>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <h3 className="text-xl font-black">Austin Weekly Report</h3>
          <p className="mt-3 text-sm text-slate-300">Score: {combined.austin.score}%</p>
          <p className="mt-2 text-sm text-slate-300">Strongest: {aReport.strongest}</p>
          <p className="mt-2 text-sm text-slate-300">Needs Work: {aReport.weakest}</p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-black">Nati Weekly Report</h3>
          <p className="mt-3 text-sm text-slate-300">Score: {combined.nati.score}%</p>
          <p className="mt-2 text-sm text-slate-300">Strongest: {nReport.strongest}</p>
          <p className="mt-2 text-sm text-slate-300">Needs Work: {nReport.weakest}</p>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-4 text-xl font-black">Reflection Fields</h2>
        <div className="space-y-3">
          {[
            ["whatWentWell", "What went well this week?"],
            ["improveNextWeek", "What needs to improve next week?"],
            ["resetBeforeFun", "What reset needs to happen before fun?"],
            ["funEarned", "What fun did we earn?"],
            ["notes", "Any notes before next week?"],
          ].map(([id, label]) => (
            <Field key={id} label={label}>
              <textarea
                value={form[id]}
                onChange={(e) => update(id, e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-yellow-400"
              />
            </Field>
          ))}
        </div>

        <div className="mt-5 flex justify-center">
          <PillButton onClick={submit} disabled={!isSunday || done}>
            Complete Weekly Review
          </PillButton>
        </div>
        {!isSunday && (
          <p className="mt-3 text-center text-xs font-bold text-slate-400">
            Weekly Review can only be submitted on Sunday.
          </p>
        )}
        {done && (
          <p className="mt-3 text-center text-sm font-bold text-yellow-200">
            This week is complete. On to the next.
          </p>
        )}
      </GlassCard>
    </div>
  );
}

function MasterPlan() {
  return (
    <div className="space-y-5">
      <GlassCard>
        <h2 className="text-2xl font-black">Master Plan</h2>
        <p className="mt-3 text-slate-300">
          This is our 6-month commitment to fitness, work, nutrition, and personal
          investment. The goal is not perfection. The goal is daily proof that we are
          building a better future together.
        </p>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Colombia Deadline</h2>
        <p className="mt-3 text-slate-300">
          December 26th is the finish line for this phase. The goal is to arrive at
          Colombia feeling lighter, stronger, and more locked in as a team.
        </p>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <StandardsCard title="Austin" checks={AUSTIN_CHECKS} />
        <StandardsCard title="Nati" checks={NATI_CHECKS} />
      </div>

      <GlassCard>
        <h2 className="text-xl font-black">Green / Yellow / Red Rules</h2>
        <div className="mt-4 space-y-3">
          <RuleLine color="🟢" title="Green Week" text="90–100% · Full fun/date within budget" />
          <RuleLine color="🟡" title="Yellow Week" text="60–89% · Smaller fun + reset first" />
          <RuleLine color="🔴" title="Red Week" text="Below 60% · Reset first, simple quality time only" />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Main Rule</h2>
        <p className="mt-3 text-slate-300">
          One bad day does not cancel fun. A pattern of not showing up changes the type
          of fun.
        </p>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Reset Suggestions</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(RESET_SUGGESTIONS).map(([cat, reset]) => (
            <RuleLine key={cat} title={cat} text={reset} />
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Weekly Schedule</h2>
        <div className="mt-4 space-y-3">
          <RuleLine title="Monday–Saturday" text="Scoring days" />
          <RuleLine title="Friday" text="Connection night" />
          <RuleLine title="Saturday" text="Fun / reset-first day" />
          <RuleLine title="Sunday" text="Review + Reset day" />
        </div>
      </GlassCard>
    </div>
  );
}

function StandardsCard({ title, checks }) {
  return (
    <GlassCard>
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {checks.map((check) => (
          <p key={check.id} className="rounded-2xl bg-slate-950/40 p-3 text-sm text-slate-300">
            {check.label}
          </p>
        ))}
      </div>
    </GlassCard>
  );
}

function RuleLine({ color, title, text }) {
  return (
    <div className="rounded-2xl bg-slate-950/40 p-4">
      <p className="font-black">
        {color && <span className="mr-2">{color}</span>}
        {title}
      </p>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Settings({
  data,
  setData,
  settings,
  adminUnlocked,
  setAdminUnlocked,
  showDemo,
  setShowDemo,
  resetLocalData,
}) {
  const [pin, setPin] = useState("");
  const [local, setLocal] = useState(settings);
  const [resetPhrase, setResetPhrase] = useState("");

  function saveSettings() {
    setData((prev) => ({ ...prev, settings: local }));
  }

  if (!adminUnlocked) {
    return (
      <GlassCard className="mx-auto max-w-md text-center">
        <Lock className="mx-auto mb-4 h-10 w-10 text-yellow-300" />
        <h2 className="text-2xl font-black">Admin Settings</h2>
        <p className="mt-2 text-sm text-slate-400">Enter PIN to unlock settings.</p>
        <div className="mt-5">
          <TextInput
            type="password"
            placeholder="Admin PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <PillButton
            onClick={() => {
              if (pin === settings.adminPin) setAdminUnlocked(true);
            }}
          >
            Unlock Settings
          </PillButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      <GlassCard>
        <h2 className="mb-4 text-2xl font-black">Admin Settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="App Title">
            <TextInput
              value={local.appTitle}
              onChange={(e) => setLocal({ ...local, appTitle: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <TextInput
              value={local.subtitle}
              onChange={(e) => setLocal({ ...local, subtitle: e.target.value })}
            />
          </Field>
          <Field label="End Date">
            <TextInput
              type="datetime-local"
              value={local.endDate?.slice(0, 16)}
              onChange={(e) => setLocal({ ...local, endDate: e.target.value })}
            />
          </Field>
          <Field label="Green Threshold">
            <TextInput
              type="number"
              value={local.greenThreshold}
              onChange={(e) => setLocal({ ...local, greenThreshold: e.target.value })}
            />
          </Field>
          <Field label="Yellow Threshold">
            <TextInput
              type="number"
              value={local.yellowThreshold}
              onChange={(e) => setLocal({ ...local, yellowThreshold: e.target.value })}
            />
          </Field>
          <Field label="Austin Protein Goal">
            <TextInput
              type="number"
              value={local.austinProteinGoal}
              onChange={(e) =>
                setLocal({ ...local, austinProteinGoal: e.target.value })
              }
            />
          </Field>
          <Field label="Austin Calorie Cap">
            <TextInput
              type="number"
              value={local.austinCalorieCap}
              onChange={(e) => setLocal({ ...local, austinCalorieCap: e.target.value })}
            />
          </Field>
          <Field label="Admin PIN">
            <TextInput
              value={local.adminPin}
              onChange={(e) => setLocal({ ...local, adminPin: e.target.value })}
            />
          </Field>
          <Field label="Weekly Flex Budget">
            <TextInput
              type="number"
              value={local.weeklyFlexBudget}
              onChange={(e) =>
                setLocal({ ...local, weeklyFlexBudget: e.target.value })
              }
            />
          </Field>
          <Field label="Apps Script URL">
            <TextInput
              value={local.appsScriptUrl}
              onChange={(e) => setLocal({ ...local, appsScriptUrl: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-5">
          <PillButton onClick={saveSettings}>Save Settings</PillButton>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Demo Data</h2>
        <p className="mt-2 text-sm text-slate-400">
          Preview sample data temporarily. This does not save to local storage or Google
          Sheets.
        </p>
        <div className="mt-4">
          <PillButton variant="dark" onClick={() => setShowDemo(!showDemo)}>
            {showDemo ? "Turn Demo Off" : "Preview Demo"}
          </PillButton>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Sync Status</h2>
        <p className="mt-2 text-sm text-slate-400">
          Google Sheets sync will be connected in the next phase.
        </p>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">Reset Local Data</h2>
        <p className="mt-2 text-sm text-slate-400">
          This clears browser data only. It will not delete Google Sheets data.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <TextInput
            placeholder="Type RESET"
            value={resetPhrase}
            onChange={(e) => setResetPhrase(e.target.value)}
          />
          <PillButton
            variant="dark"
            disabled={resetPhrase !== "RESET"}
            onClick={resetLocalData}
          >
            <RefreshCw className="h-4 w-4" />
          </PillButton>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-black">How Scoring Works</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>Green = 90–100%</p>
          <p>Yellow = 60–89%</p>
          <p>Red = below 60%</p>
          <p>Monday–Saturday are scoring days.</p>
          <p>Sunday is Review + Reset only.</p>
          <p>Austin = 50%, Nati = 50%.</p>
          <p>Future days count as 0% but show gray.</p>
          <p>Past incomplete days count as 0% and show red.</p>
        </div>
      </GlassCard>
    </div>
  );
}

function makeDemoData(settings) {
  const days = scoringDays(new Date());
  const checkIns = [];

  days.forEach((day, index) => {
    const date = toKey(day);
    if (index <= 3) {
      checkIns.push({
        date,
        weekStart: toKey(days[0]),
        weekEnd: toKey(days[5]),
        person: "Austin",
        checks: {
          fitness: true,
          work: true,
          protein: index !== 2,
          calories: index !== 1,
          personal: true,
        },
        details: {},
        dailyScore: 80,
      });
      checkIns.push({
        date,
        weekStart: toKey(days[0]),
        weekEnd: toKey(days[5]),
        person: "Nati",
        checks: {
          fitness: true,
          school: index !== 1,
          homeMeals: true,
          water: index !== 3,
          personal: true,
        },
        details: {},
        dailyScore: 80,
      });
    }
  });

  return {
    ...initialData,
    settings,
    checkIns,
    weights: [
      {
        person: "Austin",
        weekStart: toKey(days[0]),
        date: toKey(days[0]),
        mondayWeight: "278.4",
      },
      {
        person: "Nati",
        weekStart: toKey(days[0]),
        date: toKey(days[0]),
        mondayWeight: "192.0",
      },
    ],
    startingWeights: {
      Austin: "280.0",
      Nati: "192.0",
    },
  };
}

export default App;