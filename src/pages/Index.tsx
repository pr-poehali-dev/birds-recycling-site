import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/31550111-ad83-4c23-8f5d-8ba51a172318";

const rawTypes = ["Бумага", "Пластик", "Стекло", "Металл", "Картон", "Текстиль", "Электроника"];

type Section = "home" | "about" | "rating" | "contacts";
type AuthMode = "login" | "register" | "admin";
type EntryStatus = "pending" | "confirmed" | "rejected";

interface User {
  id: number;
  name: string;
  phone: string;
  avatar: string;
  totalKg: number;
  isAdmin: boolean;
}

interface RawEntry {
  id: number;
  userId: number;
  userName: string;
  userPhone: string;
  type: string;
  kg: number;
  status: EntryStatus;
  date: string;
}

interface RatingUser {
  name: string;
  phone: string;
  avatar: string;
  totalKg: number;
}

async function api<T>(action: string, method = "GET", body?: object): Promise<T> {
  const res = await fetch(`${API}?action=${action}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = JSON.parse(text);
  if (typeof data === "string") return JSON.parse(data) as T;
  return data as T;
}

function maskPhone(phone: string) {
  if (phone.length < 6) return phone;
  return phone.slice(0, 4) + " *** ***-**-" + phone.slice(-2);
}

function getRankClass(i: number) {
  if (i === 0) return "rank-1";
  if (i === 1) return "rank-2";
  if (i === 2) return "rank-3";
  return "rank-other";
}
function getRankEmoji(i: number) {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `${i + 1}`;
}

function RatingRow({ item, index }: { item: RatingUser; index: number }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl mb-3 transition-all hover:scale-[1.01] ${index < 3 ? "card-eco" : "bg-white/60 border border-green-100"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankClass(index)}`}>
        {getRankEmoji(index)}
      </div>
      <div className="text-2xl">{item.avatar}</div>
      <div className="flex-1">
        <div className="font-semibold text-gray-800">{item.name}</div>
        <div className="text-sm text-gray-500">{maskPhone(item.phone)}</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-green-700 text-lg">{item.totalKg} кг</div>
        <div className="text-xs text-gray-400">сдано</div>
      </div>
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [ratingTab, setRatingTab] = useState<"month" | "half" | "year">("month");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showAddForm, setShowAddForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [ratingUsers, setRatingUsers] = useState<RatingUser[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);

  const [fPhone, setFPhone] = useState("");
  const [fName, setFName] = useState("");
  const [fPassword, setFPassword] = useState("");

  const [rawType, setRawType] = useState(rawTypes[0]);
  const [rawKg, setRawKg] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const isAdmin = currentUser?.isAdmin === true;

  const navItems: { id: Section; label: string }[] = [
    { id: "home", label: "Главная" },
    { id: "about", label: "О проекте" },
    { id: "rating", label: "Рейтинг" },
    { id: "contacts", label: "Контакты" },
  ];

  /* ─── Загрузка заявок (для админа) ─── */
  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const data = await api<RawEntry[]>("entries");
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  /* ─── Загрузка рейтинга ─── */
  const loadRating = useCallback(async () => {
    setLoadingRating(true);
    try {
      const data = await api<RatingUser[]>("rating");
      setRatingUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoadingRating(false);
    }
  }, []);

  useEffect(() => {
    loadRating();
  }, [loadRating]);

  useEffect(() => {
    if (isAdmin) loadEntries();
  }, [isAdmin, loadEntries]);

  /* ─── Авторизация ─── */
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "register") {
        const user = await api<User & { error?: string }>("register", "POST", {
          name: fName.trim(), phone: fPhone.trim(), password: fPassword,
        });
        if (user.error) { setAuthError(user.error); return; }
        setCurrentUser(user as User);
        setShowAuth(false);
        resetAuthForm();
        return;
      }
      const user = await api<User & { error?: string }>("login", "POST", {
        phone: fPhone.trim(), password: fPassword,
      });
      if (user.error) { setAuthError(user.error); return; }
      setCurrentUser(user as User);
      if ((user as User).isAdmin) {
        await loadEntries();
      }
      setShowAuth(false);
      resetAuthForm();
    } catch {
      setAuthError("Ошибка соединения, попробуйте ещё раз");
    } finally {
      setAuthLoading(false);
    }
  }

  function resetAuthForm() {
    setFPhone(""); setFName(""); setFPassword(""); setAuthError("");
  }

  /* ─── Подача заявки ─── */
  async function handleAddRaw(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    const kg = parseFloat(rawKg);
    if (isNaN(kg) || kg <= 0) return;
    setAddLoading(true);
    try {
      const result = await api<{ id: number; status: string; error?: string }>("add_entry", "POST", {
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        type: rawType,
        kg,
      });
      if (result.error) return;
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddForm(false);
        setRawKg("");
      }, 2000);
    } catch {
      /* ignore */
    } finally {
      setAddLoading(false);
    }
  }

  /* ─── Подтвердить/отклонить (admin) ─── */
  async function handleConfirm(entryId: number) {
    await api("confirm", "POST", { entryId });
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: "confirmed" } : e));
    loadRating();
  }

  async function handleReject(entryId: number) {
    await api("reject", "POST", { entryId });
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: "rejected" } : e));
  }

  const pendingCount = entries.filter(e => e.status === "pending").length;

  return (
    <div className="min-h-screen bg-nature-texture">

      {/* ─── НАВИГАЦИЯ ─── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setSection("home")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 transition-transform">
              🐦
            </div>
            <span className="font-black text-xl text-green-800" style={{ fontFamily: "'Golos Text', sans-serif" }}>Птичка</span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={`nav-link text-sm font-medium transition-colors ${section === item.id ? "text-green-700 active" : "text-gray-600 hover:text-green-700"}`}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              isAdmin ? (
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  <span className="text-amber-700 text-sm font-bold">⚙️ Администратор</span>
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                  )}
                  <button onClick={() => { setCurrentUser(null); setEntries([]); }} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                    <Icon name="LogOut" size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowAddForm(true)} className="btn-primary px-4 py-2 text-sm hidden md:flex items-center gap-2">
                    <Icon name="Plus" size={16} />
                    Сдать вторсырьё
                  </button>
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <span className="text-lg">{currentUser.avatar}</span>
                    <span className="text-green-700 text-sm font-medium">{currentUser.name}</span>
                    <button onClick={() => setCurrentUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Icon name="LogOut" size={14} />
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowAuth(true); setAuthMode("login"); setAuthError(""); }} className="btn-primary px-5 py-2 text-sm">
                  Войти
                </button>
                <button onClick={() => { setShowAuth(true); setAuthMode("admin"); setAuthError(""); }} className="btn-secondary px-4 py-2 text-sm hidden md:block" title="Вход для администратора">
                  ⚙️ Админ
                </button>
              </div>
            )}
            <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-green-100 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setSection(item.id); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${section === item.id ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-green-50"}`}>
                {item.label}
              </button>
            ))}
            {!currentUser && (
              <button onClick={() => { setShowAuth(true); setAuthMode("admin"); setMobileMenuOpen(false); setAuthError(""); }} className="btn-secondary w-full py-2 text-sm mt-1">
                ⚙️ Вход для администратора
              </button>
            )}
            {currentUser && !isAdmin && (
              <button onClick={() => { setShowAddForm(true); setMobileMenuOpen(false); }} className="btn-primary w-full py-2 text-sm mt-2 flex items-center justify-center gap-2">
                <Icon name="Plus" size={16} />
                Сдать вторсырьё
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ─── ПАНЕЛЬ АДМИНИСТРАТОРА ─── */}
      {isAdmin && (
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">⚙️</div>
              <div>
                <h2 className="text-2xl font-black text-gray-800">Панель администратора</h2>
                <p className="text-gray-500 text-sm">Управление заявками на сдачу вторсырья</p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="md:ml-auto bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl font-semibold text-sm">
                ⚠️ {pendingCount} заявок ожидают подтверждения
              </div>
            )}
            <button onClick={loadEntries} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
              <Icon name="RefreshCw" size={15} />
              Обновить
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { val: entries.filter(e => e.status === "pending").length, label: "Ожидают", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { val: entries.filter(e => e.status === "confirmed").length, label: "Подтверждено", color: "text-green-600", bg: "bg-green-50 border-green-200" },
              { val: entries.filter(e => e.status === "rejected").length, label: "Отклонено", color: "text-red-500", bg: "bg-red-50 border-red-200" },
            ].map((s, i) => (
              <div key={i} className={`card-eco p-5 text-center border ${s.bg}`}>
                <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {loadingEntries ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3 animate-spin inline-block">⚙️</div>
              <p>Загружаю заявки...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📭</div>
              <p>Заявок пока нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className={`card-eco p-5 flex flex-col md:flex-row md:items-center gap-4 ${entry.status === "confirmed" ? "border-green-200 bg-green-50/30" : entry.status === "rejected" ? "border-red-100 bg-red-50/20 opacity-60" : ""}`}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${entry.status === "confirmed" ? "bg-green-100" : entry.status === "rejected" ? "bg-red-100" : "bg-amber-100"}`}>
                      {entry.status === "confirmed" ? "✅" : entry.status === "rejected" ? "❌" : "⏳"}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{entry.userName}</div>
                      <div className="text-xs text-gray-400">{maskPhone(entry.userPhone)} · {entry.date}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">{entry.type}</span>
                      <span className="font-black text-gray-800 text-lg">{entry.kg} кг</span>
                    </div>
                  </div>
                  {entry.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirm(entry.id)} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                        <Icon name="Check" size={16} />
                        Подтвердить
                      </button>
                      <button onClick={() => handleReject(entry.id)} className="px-5 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all font-semibold flex items-center gap-2">
                        <Icon name="X" size={16} />
                        Отклонить
                      </button>
                    </div>
                  )}
                  {entry.status === "confirmed" && <div className="text-green-600 text-sm font-semibold flex items-center gap-1"><Icon name="CheckCircle" size={16} />Подтверждено</div>}
                  {entry.status === "rejected" && <div className="text-red-400 text-sm font-semibold flex items-center gap-1"><Icon name="XCircle" size={16} />Отклонено</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ГЛАВНАЯ ─── */}
      {!isAdmin && section === "home" && (
        <>
          <section className="hero-bg text-white relative">
            <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
                  <span>🌿</span><span>Экологический пункт сбора вторсырья</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                  Сдавай.<br /><span className="text-yellow-300">Побеждай.</span><br />Береги 🌍
                </h1>
                <p className="text-xl text-green-100 mb-8 leading-relaxed max-w-md">
                  Присоединяйтесь к сообществу «Птичка» — сдавайте вторсырьё, участвуйте в рейтинге и выигрывайте призы!
                </p>
                <div className="flex flex-wrap gap-4">
                  {currentUser ? (
                    <button onClick={() => setShowAddForm(true)} className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg">
                      ♻️ Сдать вторсырьё
                    </button>
                  ) : (
                    <button onClick={() => { setShowAuth(true); setAuthMode("register"); setAuthError(""); }} className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg">
                      Начать участие 🚀
                    </button>
                  )}
                  <button onClick={() => setSection("rating")} className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all backdrop-blur-sm">
                    Посмотреть рейтинг
                  </button>
                </div>
              </div>
              <div className="flex-1 flex justify-center animate-float">
                <div className="relative">
                  <img src="https://cdn.poehali.dev/projects/db5b1cd7-e249-488f-a318-9c52676d7b5d/files/0aa4e2ec-01b6-4da5-ad99-ba6612731fb5.jpg" alt="Природа"
                    className="w-72 h-72 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl border-4 border-white/20" />
                  <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-green-900 font-bold px-5 py-3 rounded-2xl shadow-lg text-sm">🏆 Призы каждый месяц!</div>
                  <div className="absolute -top-4 -left-4 bg-white text-green-700 font-bold px-4 py-2 rounded-2xl shadow-lg text-sm animate-float delay-200">♻️ Помогаем планете</div>
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { val: ratingUsers.reduce((s, u) => s + u.totalKg, 0).toFixed(0) + " кг", label: "Собрано вторсырья", icon: "Scale" },
                { val: ratingUsers.length, label: "Участников", icon: "Users" },
                { val: "3", label: "Периода рейтинга", icon: "Trophy" },
                { val: rawTypes.length, label: "Видов сырья", icon: "Layers" },
              ].map((s, i) => (
                <div key={i} className="card-eco p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                    <Icon name={s.icon} size={22} className="text-green-600" />
                  </div>
                  <div className="text-3xl font-black text-green-700">{s.val}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <div className="leaf-divider mb-4"><span className="text-lg font-bold text-green-700">Призы участникам</span></div>
                <p className="text-gray-500">Сдавайте больше — получайте лучшие награды</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { medal: "🥇", title: "Топ месяца", prize: "500 ₽", desc: "Сертификат на маркетплейс", color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700" },
                  { medal: "🏅", title: "Топ полугодия", prize: "1 000 ₽", desc: "Сертификат на маркетплейс", color: "text-gray-600", badge: "bg-gray-100 text-gray-600" },
                  { medal: "🏆", title: "Топ года", prize: "2 000 ₽", desc: "Сертификат на маркетплейс", color: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
                ].map((p, i) => (
                  <div key={i} className="card-eco p-8 text-center group">
                    <div className="text-5xl mb-4 group-hover:animate-float inline-block">{p.medal}</div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{p.title}</div>
                    <div className={`text-4xl font-black mb-2 ${p.color}`}>{p.prize}</div>
                    <div className="text-gray-600 mb-4">{p.desc}</div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${p.badge}`}>1 место</div>
                    <p className="text-xs text-gray-400 mt-4">За призом: <a href="mailto:ptichka937@gmail.com" className="text-green-600 hover:underline">ptichka937@gmail.com</a></p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <div className="leaf-divider"><span className="text-lg font-bold text-green-700">Как участвовать</span></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Зарегистрируйтесь", desc: "Введите номер телефона и имя — регистрация мгновенная, без СМС" },
                { step: "2", title: "Сдайте вторсырьё", desc: "Привезите вторсырьё в пункт приёма и внесите данные в личном кабинете" },
                { step: "3", title: "Получите приз", desc: "Займите топ-1 в рейтинге месяца, полугода или года и заберите сертификат" },
              ].map((s, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg">{s.step}</div>
                  <div>
                    <div className="font-bold text-gray-800 mb-1">{s.title}</div>
                    <div className="text-gray-500 text-sm leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─── О ПРОЕКТЕ ─── */}
      {!isAdmin && section === "about" && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">🌿</div>
            <h2 className="section-title text-4xl mb-4">О проекте «Птичка»</h2>
            <div className="w-16 h-1 bg-green-500 rounded mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="card-eco p-8">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-green-800 mb-3">Наша миссия</h3>
              <p className="text-gray-600 leading-relaxed">Организация «Птичка» создана с целью привлечения жителей к раздельному сбору отходов и повышения экологической осознанности сообщества.</p>
            </div>
            <div className="card-eco p-8">
              <div className="text-3xl mb-4">♻️</div>
              <h3 className="text-xl font-bold text-green-800 mb-3">Что мы принимаем</h3>
              <div className="flex flex-wrap gap-2">
                {rawTypes.map((t) => (
                  <span key={t} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="card-eco p-8 text-center">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-green-800 mb-3">Призовая система</h3>
            <div className="grid grid-cols-3 gap-4">
              {[{ label: "Топ месяца", prize: "500 ₽" }, { label: "Топ полугодия", prize: "1 000 ₽" }, { label: "Топ года", prize: "2 000 ₽" }].map((p, i) => (
                <div key={i} className="bg-green-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-green-700">{p.prize}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── РЕЙТИНГ ─── */}
      {!isAdmin && section === "rating" && (
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="section-title text-4xl mb-3">Рейтинг участников</h2>
            <p className="text-gray-500">Обновляется 1-го числа каждого месяца</p>
          </div>

          <div className="flex gap-2 p-1.5 bg-green-50 rounded-2xl mb-8 border border-green-100">
            {[
              { id: "month", label: "🌙 Месяц", prize: "500 ₽" },
              { id: "half", label: "📅 Полгода", prize: "1 000 ₽" },
              { id: "year", label: "🌟 Год", prize: "2 000 ₽" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setRatingTab(tab.id as "month" | "half" | "year")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${ratingTab === tab.id ? "tab-active" : "text-gray-600 hover:bg-green-100"}`}>
                {tab.label}
                <span className={`ml-2 text-xs font-bold ${ratingTab === tab.id ? "text-yellow-300" : "text-green-600"}`}>{tab.prize}</span>
              </button>
            ))}
          </div>

          {loadingRating ? (
            <div className="text-center py-16 text-gray-400">Загружаю рейтинг...</div>
          ) : ratingUsers.length > 0 ? (
            <>
              <div className={`rounded-2xl p-6 mb-6 text-center text-white shadow-lg ${ratingTab === "month" ? "bg-gradient-to-r from-green-700 to-green-500" : ratingTab === "half" ? "bg-gradient-to-r from-blue-700 to-blue-500" : "bg-gradient-to-r from-amber-700 to-amber-500"}`}>
                <div className="text-4xl mb-1">{ratingUsers[0]?.avatar}</div>
                <div className="font-black text-xl">{ratingUsers[0]?.name}</div>
                <div className="text-white/80 text-sm">лидер {ratingTab === "month" ? "месяца" : ratingTab === "half" ? "полугодия" : "года"}</div>
                <div className="text-3xl font-black mt-2">{ratingUsers[0]?.totalKg} кг</div>
              </div>
              {ratingUsers.map((u, i) => <RatingRow key={u.phone} item={u} index={i} />)}
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🌱</div>
              <p>Пока нет участников. Станьте первым!</p>
            </div>
          )}

          <div className="text-center mt-8 text-sm text-gray-400">
            🏆 Приз за 1 место: <span className="font-bold text-green-700">{ratingTab === "month" ? "сертификат 500 ₽" : ratingTab === "half" ? "сертификат 1 000 ₽" : "сертификат 2 000 ₽"}</span>
            <br />
            Для получения: <a href="mailto:ptichka937@gmail.com" className="text-green-600 hover:underline">ptichka937@gmail.com</a>
          </div>
        </div>
      )}

      {/* ─── КОНТАКТЫ ─── */}
      {!isAdmin && section === "contacts" && (
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="section-title text-4xl mb-3">Контакты</h2>
            <div className="w-16 h-1 bg-green-500 rounded mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-eco p-8">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <Icon name="Mail" size={24} className="text-green-600" />
              </div>
              <h3 className="font-bold text-green-800 text-xl mb-2">Служба поддержки</h3>
              <p className="text-gray-500 text-sm mb-4">Вопросы по работе платформы</p>
              <a href="mailto:ptichka3829@gmail.com" className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-900">
                <Icon name="Mail" size={18} />ptichka3829@gmail.com
              </a>
            </div>
            <div className="card-eco p-8">
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
                <Icon name="Trophy" size={24} className="text-yellow-600" />
              </div>
              <h3 className="font-bold text-green-800 text-xl mb-2">Получение призов</h3>
              <p className="text-gray-500 text-sm mb-4">Для победителей рейтинга</p>
              <a href="mailto:ptichka937@gmail.com" className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-900">
                <Icon name="Mail" size={18} />ptichka937@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── МОДАЛ: АВТОРИЗАЦИЯ ─── */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up relative">
            {authMode !== "admin" && (
              <div className="flex gap-1 p-1 bg-green-50 rounded-xl mb-6 border border-green-100">
                <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === "login" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>Войти</button>
                <button onClick={() => { setAuthMode("register"); setAuthError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === "register" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>Регистрация</button>
              </div>
            )}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{authMode === "admin" ? "⚙️" : "🐦"}</div>
              <h3 className="text-2xl font-black text-green-800">
                {authMode === "admin" ? "Вход для администратора" : authMode === "login" ? "Вход в аккаунт" : "Регистрация"}
              </h3>
              {authMode === "admin" && <p className="text-gray-500 text-sm mt-1">Только для сотрудников пункта приёма</p>}
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ваше имя</label>
                  <input className="input-eco w-full px-4 py-3" placeholder="Иван Петров" value={fName} onChange={(e) => setFName(e.target.value)} required />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {authMode === "admin" ? "Логин" : "Номер телефона"}
                </label>
                <input className="input-eco w-full px-4 py-3" placeholder={authMode === "admin" ? "admin" : "+7 (___) ___-__-__"}
                  value={fPhone} onChange={(e) => setFPhone(e.target.value)} type={authMode === "admin" ? "text" : "tel"} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Пароль</label>
                <input className="input-eco w-full px-4 py-3" placeholder={authMode === "register" ? "Придумайте пароль" : "Введите пароль"}
                  type="password" value={fPassword} onChange={(e) => setFPassword(e.target.value)} required />
              </div>
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} className="flex-shrink-0" />
                  {authError}
                </div>
              )}
              <button type="submit" disabled={authLoading} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                {authLoading ? "Загружаю..." : authMode === "admin" ? "Войти как администратор" : authMode === "login" ? "Войти" : "Зарегистрироваться"}
              </button>
            </form>

            {authMode !== "admin" ? (
              <div className="text-center mt-4">
                <button onClick={() => { setAuthMode("admin"); setAuthError(""); resetAuthForm(); }} className="text-xs text-gray-400 hover:text-amber-600 transition-colors">
                  ⚙️ Вход для администратора
                </button>
              </div>
            ) : (
              <div className="text-center mt-4">
                <button onClick={() => { setAuthMode("login"); setAuthError(""); resetAuthForm(); }} className="text-xs text-gray-400 hover:text-green-600 transition-colors">
                  ← Обычный вход
                </button>
              </div>
            )}
            <button onClick={() => { setShowAuth(false); resetAuthForm(); }} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── МОДАЛ: ДОБАВИТЬ ВТОРСЫРЬЁ ─── */}
      {showAddForm && currentUser && !isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up relative">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">♻️</div>
              <h3 className="text-2xl font-black text-green-800">Сдать вторсырьё</h3>
              <p className="text-gray-500 text-sm mt-1">Заявка будет подтверждена сотрудником</p>
            </div>

            {addSuccess ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-xl font-bold text-green-700">Заявка отправлена!</div>
                <div className="text-gray-500 text-sm mt-2">Ожидайте подтверждения от администратора</div>
              </div>
            ) : (
              <form onSubmit={handleAddRaw} className="space-y-4">
                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3 border border-green-100 mb-2">
                  <span className="text-xl">{currentUser.avatar}</span>
                  <div>
                    <div className="text-sm font-semibold text-green-800">{currentUser.name}</div>
                    <div className="text-xs text-green-600">{currentUser.totalKg} кг уже подтверждено</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Тип вторсырья</label>
                  <select className="input-eco w-full px-4 py-3 cursor-pointer" value={rawType} onChange={(e) => setRawType(e.target.value)}>
                    {rawTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Количество (кг)</label>
                  <input className="input-eco w-full px-4 py-3" placeholder="Например: 3.5" type="number" min="0.1" step="0.1"
                    value={rawKg} onChange={(e) => setRawKg(e.target.value)} required />
                </div>
                <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3 border border-amber-100">
                  <Icon name="Info" size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">Данные учтутся в рейтинге после подтверждения администратором</p>
                </div>
                <button type="submit" disabled={addLoading} className="btn-primary w-full py-3.5 disabled:opacity-60">
                  {addLoading ? "Отправляю..." : "Отправить заявку"}
                </button>
              </form>
            )}
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── ФУТЕР ─── */}
      {!isAdmin && (
        <footer className="bg-green-900 text-white mt-16">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4"><span className="text-2xl">🐦</span><span className="font-black text-xl">Птичка</span></div>
                <p className="text-green-300 text-sm leading-relaxed">Экологический пункт сбора вторсырья. Вместе сделаем планету чище!</p>
              </div>
              <div>
                <div className="font-bold text-green-300 mb-3 text-sm uppercase tracking-wider">Навигация</div>
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <button key={item.id} onClick={() => setSection(item.id)} className="block text-sm text-white/70 hover:text-white transition-colors">{item.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-bold text-green-300 mb-3 text-sm uppercase tracking-wider">Контакты</div>
                <div className="space-y-2 text-sm">
                  <div><div className="text-white/50 text-xs">Поддержка</div><a href="mailto:ptichka3829@gmail.com" className="text-white/80 hover:text-white">ptichka3829@gmail.com</a></div>
                  <div><div className="text-white/50 text-xs">Призы</div><a href="mailto:ptichka937@gmail.com" className="text-white/80 hover:text-white">ptichka937@gmail.com</a></div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">© 2024 Птичка. Рейтинг обновляется 1-го числа каждого месяца.</div>
          </div>
        </footer>
      )}
    </div>
  );
}
