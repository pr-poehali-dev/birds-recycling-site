import { useState } from "react";
import Icon from "@/components/ui/icon";

/* ─── Моковые данные рейтинга ─── */
const mockRating = [
  { id: 1, name: "Анна Петрова", phone: "+7 *** ***-**-01", kg: 127, avatar: "🌿" },
  { id: 2, name: "Иван Сидоров", phone: "+7 *** ***-**-02", kg: 98, avatar: "🍃" },
  { id: 3, name: "Мария Козлова", phone: "+7 *** ***-**-03", kg: 84, avatar: "🌱" },
  { id: 4, name: "Сергей Новиков", phone: "+7 *** ***-**-04", kg: 73, avatar: "🌲" },
  { id: 5, name: "Елена Морозова", phone: "+7 *** ***-**-05", kg: 61, avatar: "🌾" },
  { id: 6, name: "Дмитрий Волков", phone: "+7 *** ***-**-06", kg: 54, avatar: "🪴" },
  { id: 7, name: "Ольга Соколова", phone: "+7 *** ***-**-07", kg: 43, avatar: "🍀" },
  { id: 8, name: "Алексей Лебедев", phone: "+7 *** ***-**-08", kg: 37, avatar: "🌻" },
];

const mockHalf = [
  { id: 1, name: "Мария Козлова", phone: "+7 *** ***-**-03", kg: 412, avatar: "🌱" },
  { id: 2, name: "Анна Петрова", phone: "+7 *** ***-**-01", kg: 387, avatar: "🌿" },
  { id: 3, name: "Иван Сидоров", phone: "+7 *** ***-**-02", kg: 320, avatar: "🍃" },
  { id: 4, name: "Елена Морозова", phone: "+7 *** ***-**-05", kg: 285, avatar: "🌾" },
  { id: 5, name: "Сергей Новиков", phone: "+7 *** ***-**-04", kg: 241, avatar: "🌲" },
];

const mockYear = [
  { id: 1, name: "Иван Сидоров", phone: "+7 *** ***-**-02", kg: 892, avatar: "🍃" },
  { id: 2, name: "Анна Петрова", phone: "+7 *** ***-**-01", kg: 754, avatar: "🌿" },
  { id: 3, name: "Дмитрий Волков", phone: "+7 *** ***-**-06", kg: 623, avatar: "🪴" },
  { id: 4, name: "Мария Козлова", phone: "+7 *** ***-**-03", kg: 598, avatar: "🌱" },
  { id: 5, name: "Ольга Соколова", phone: "+7 *** ***-**-07", kg: 471, avatar: "🍀" },
];

const rawTypes = ["Бумага", "Пластик", "Стекло", "Металл", "Картон", "Текстиль", "Электроника"];

type Section = "home" | "about" | "rating" | "contacts";
type AuthMode = "login" | "register";

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

function RatingRow({ item, index }: { item: typeof mockRating[0]; index: number }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl mb-3 transition-all hover:scale-[1.01] ${index < 3 ? "card-eco" : "bg-white/60 border border-green-100"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankClass(index)}`}>
        {getRankEmoji(index)}
      </div>
      <div className="text-2xl">{item.avatar}</div>
      <div className="flex-1">
        <div className="font-semibold text-gray-800">{item.name}</div>
        <div className="text-sm text-gray-500">{item.phone}</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-green-700 text-lg">{item.kg} кг</div>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [rawType, setRawType] = useState(rawTypes[0]);
  const [rawKg, setRawKg] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  const navItems: { id: Section; label: string }[] = [
    { id: "home", label: "Главная" },
    { id: "about", label: "О проекте" },
    { id: "rating", label: "Рейтинг" },
    { id: "contacts", label: "Контакты" },
  ];

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggedIn(true);
    setUser({ name: authMode === "register" ? name : "Участник", phone });
    setShowAuth(false);
    setPhone("");
    setName("");
    setPassword("");
  }

  function handleAddRaw(e: React.FormEvent) {
    e.preventDefault();
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setShowAddForm(false);
      setRawKg("");
    }, 2000);
  }

  const currentRating = ratingTab === "month" ? mockRating : ratingTab === "half" ? mockHalf : mockYear;

  return (
    <div className="min-h-screen bg-nature-texture">
      {/* ─── НАВИГАЦИЯ ─── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setSection("home")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-700 to-green-500 flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 transition-transform">
              🐦
            </div>
            <span className="font-black text-xl text-green-800" style={{ fontFamily: "'Golos Text', sans-serif" }}>
              Птичка
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`nav-link text-sm font-medium transition-colors ${section === item.id ? "text-green-700 active" : "text-gray-600 hover:text-green-700"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary px-4 py-2 text-sm hidden md:flex items-center gap-2"
                >
                  <Icon name="Plus" size={16} />
                  Сдать вторсырьё
                </button>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <span className="text-green-700 text-sm font-medium">{user?.name}</span>
                  <button onClick={() => { setIsLoggedIn(false); setUser(null); }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Icon name="LogOut" size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setAuthMode("login"); }}
                className="btn-primary px-5 py-2 text-sm"
              >
                Войти
              </button>
            )}
            <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-green-100 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setMobileMenuOpen(false); }}
                className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${section === item.id ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-green-50"}`}
              >
                {item.label}
              </button>
            ))}
            {isLoggedIn && (
              <button
                onClick={() => { setShowAddForm(true); setMobileMenuOpen(false); }}
                className="btn-primary w-full py-2 text-sm mt-2 flex items-center justify-center gap-2"
              >
                <Icon name="Plus" size={16} />
                Сдать вторсырьё
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ─── ГЛАВНАЯ ─── */}
      {section === "home" && (
        <>
          <section className="hero-bg text-white relative">
            <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
                  <span>🌿</span>
                  <span>Экологический пункт сбора вторсырья</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                  Сдавай.<br />
                  <span className="text-yellow-300">Побеждай.</span><br />
                  Береги 🌍
                </h1>
                <p className="text-xl text-green-100 mb-8 leading-relaxed max-w-md">
                  Присоединяйтесь к сообществу «Птичка» — сдавайте вторсырьё, участвуйте в рейтинге и выигрывайте призы!
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => { setShowAuth(true); setAuthMode("register"); }}
                    className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Начать участие 🚀
                  </button>
                  <button
                    onClick={() => setSection("rating")}
                    className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all backdrop-blur-sm"
                  >
                    Посмотреть рейтинг
                  </button>
                </div>
              </div>
              <div className="flex-1 flex justify-center animate-float">
                <div className="relative">
                  <img
                    src="https://cdn.poehali.dev/projects/db5b1cd7-e249-488f-a318-9c52676d7b5d/files/0aa4e2ec-01b6-4da5-ad99-ba6612731fb5.jpg"
                    alt="Природа"
                    className="w-72 h-72 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl border-4 border-white/20"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-green-900 font-bold px-5 py-3 rounded-2xl shadow-lg text-sm">
                    🏆 Призы каждый месяц!
                  </div>
                  <div className="absolute -top-4 -left-4 bg-white text-green-700 font-bold px-4 py-2 rounded-2xl shadow-lg text-sm animate-float delay-200">
                    ♻️ Помогаем планете
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Статистика */}
          <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { val: "2.4 т", label: "Собрано вторсырья", icon: "Scale" },
                { val: "187", label: "Участников", icon: "Users" },
                { val: "12", label: "Месяцев работы", icon: "Calendar" },
                { val: "36", label: "Призов выдано", icon: "Trophy" },
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

          {/* Призы */}
          <section className="bg-white py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <div className="leaf-divider mb-4"><span className="text-lg font-bold text-green-700">Призы участникам</span></div>
                <p className="text-gray-500">Сдавайте больше — получайте лучшие награды</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { medal: "🥇", title: "Топ месяца", prize: "500 ₽", desc: "Сертификат на маркетплейс", color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700", rank: "1 место" },
                  { medal: "🏅", title: "Топ полугодия", prize: "1 000 ₽", desc: "Сертификат на маркетплейс", color: "text-gray-600", badge: "bg-gray-100 text-gray-600", rank: "1 место" },
                  { medal: "🏆", title: "Топ года", prize: "2 000 ₽", desc: "Сертификат на маркетплейс", color: "text-amber-700", badge: "bg-amber-100 text-amber-700", rank: "1 место" },
                ].map((p, i) => (
                  <div key={i} className="card-eco p-8 text-center group">
                    <div className="text-5xl mb-4 group-hover:animate-float inline-block">{p.medal}</div>
                    <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{p.title}</div>
                    <div className={`text-4xl font-black mb-2 ${p.color}`}>{p.prize}</div>
                    <div className="text-gray-600 mb-4">{p.desc}</div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${p.badge}`}>{p.rank}</div>
                    <p className="text-xs text-gray-400 mt-4">
                      За получением приза обращайтесь:<br />
                      <a href="mailto:ptichka937@gmail.com" className="text-green-600 hover:underline">ptichka937@gmail.com</a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Как участвовать */}
          <section className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
              <div className="leaf-divider"><span className="text-lg font-bold text-green-700">Как участвовать</span></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "1", icon: "UserPlus", title: "Зарегистрируйтесь", desc: "Введите номер телефона и имя — регистрация мгновенная, без СМС" },
                { step: "2", icon: "PackagePlus", title: "Сдайте вторсырьё", desc: "Привезите вторсырьё в пункт приёма и внесите данные в личном кабинете" },
                { step: "3", icon: "Trophy", title: "Получите приз", desc: "Займите топ-1 в рейтинге месяца, полугода или года и заберите сертификат" },
              ].map((s, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg">
                    {s.step}
                  </div>
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
      {section === "about" && (
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
              <p className="text-gray-600 leading-relaxed">
                Организация «Птичка» создана с целью привлечения жителей к раздельному сбору отходов и повышения экологической осознанности сообщества.
              </p>
            </div>
            <div className="card-eco p-8">
              <div className="text-3xl mb-4">♻️</div>
              <h3 className="text-xl font-bold text-green-800 mb-3">Что мы принимаем</h3>
              <div className="flex flex-wrap gap-2">
                {rawTypes.map((t) => (
                  <span key={t} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="card-eco p-8 text-center">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-green-800 mb-3">Призовая система</h3>
            <p className="text-gray-600 mb-6">Рейтинг обновляется 1-го числа каждого месяца. Победители получают сертификаты на маркетплейс.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Топ месяца", prize: "500 ₽" },
                { label: "Топ полугодия", prize: "1 000 ₽" },
                { label: "Топ года", prize: "2 000 ₽" },
              ].map((p, i) => (
                <div key={i} className="bg-green-50 rounded-xl p-4">
                  <div className="text-2xl font-black text-green-700">{p.prize}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.label}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Для получения призов: <a href="mailto:ptichka937@gmail.com" className="text-green-600 hover:underline">ptichka937@gmail.com</a>
            </p>
          </div>
        </div>
      )}

      {/* ─── РЕЙТИНГ ─── */}
      {section === "rating" && (
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
              <button
                key={tab.id}
                onClick={() => setRatingTab(tab.id as "month" | "half" | "year")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${ratingTab === tab.id ? "tab-active" : "text-gray-600 hover:bg-green-100"}`}
              >
                {tab.label}
                <span className={`ml-2 text-xs font-bold ${ratingTab === tab.id ? "text-yellow-300" : "text-green-600"}`}>{tab.prize}</span>
              </button>
            ))}
          </div>

          <div className={`rounded-2xl p-6 mb-6 text-center text-white shadow-lg ${ratingTab === "month" ? "bg-gradient-to-r from-green-700 to-green-500" : ratingTab === "half" ? "bg-gradient-to-r from-blue-700 to-blue-500" : "bg-gradient-to-r from-amber-700 to-amber-500"}`}>
            <div className="text-4xl mb-1">{currentRating[0]?.avatar}</div>
            <div className="font-black text-xl">{currentRating[0]?.name}</div>
            <div className="text-white/80 text-sm">лидер {ratingTab === "month" ? "месяца" : ratingTab === "half" ? "полугодия" : "года"}</div>
            <div className="text-3xl font-black mt-2">{currentRating[0]?.kg} кг</div>
          </div>

          <div>
            {currentRating.map((item, i) => (
              <RatingRow key={item.id} item={item} index={i} />
            ))}
          </div>

          <div className="text-center mt-8 text-sm text-gray-400">
            🏆 Приз за 1 место:{" "}
            <span className="font-bold text-green-700">
              {ratingTab === "month" ? "сертификат 500 ₽" : ratingTab === "half" ? "сертификат 1 000 ₽" : "сертификат 2 000 ₽"}
            </span>
            <br />
            Для получения: <a href="mailto:ptichka937@gmail.com" className="text-green-600 hover:underline">ptichka937@gmail.com</a>
          </div>
        </div>
      )}

      {/* ─── КОНТАКТЫ ─── */}
      {section === "contacts" && (
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
              <p className="text-gray-500 text-sm mb-4">Вопросы по работе платформы, регистрации и участию</p>
              <a href="mailto:ptichka3829@gmail.com" className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-900 transition-colors">
                <Icon name="Mail" size={18} />
                ptichka3829@gmail.com
              </a>
            </div>
            <div className="card-eco p-8">
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
                <Icon name="Trophy" size={24} className="text-yellow-600" />
              </div>
              <h3 className="font-bold text-green-800 text-xl mb-2">Получение призов</h3>
              <p className="text-gray-500 text-sm mb-4">Обращайтесь для получения сертификатов за победу в рейтинге</p>
              <a href="mailto:ptichka937@gmail.com" className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-900 transition-colors">
                <Icon name="Mail" size={18} />
                ptichka937@gmail.com
              </a>
            </div>
          </div>

          <div className="card-eco p-8 mt-6">
            <h3 className="font-bold text-green-800 text-xl mb-6">Призовые категории</h3>
            <div className="space-y-4">
              {[
                { emoji: "🥇", period: "Топ месяца", prize: "Сертификат 500 ₽", update: "Обновляется 1-го числа каждого месяца" },
                { emoji: "🏅", period: "Топ полугодия", prize: "Сертификат 1 000 ₽", update: "Январь–Июнь, Июль–Декабрь" },
                { emoji: "🏆", period: "Топ года", prize: "Сертификат 2 000 ₽", update: "Итоги подводятся 31 декабря" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <span className="text-3xl">{p.emoji}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{p.period}</div>
                    <div className="text-xs text-gray-500">{p.update}</div>
                  </div>
                  <div className="font-black text-green-700 text-lg">{p.prize}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── МОДАЛ: АВТОРИЗАЦИЯ ─── */}
      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}
        >
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up relative">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🐦</div>
              <h3 className="text-2xl font-black text-green-800">
                {authMode === "login" ? "Вход в аккаунт" : "Регистрация"}
              </h3>
              <p className="text-gray-500 text-sm mt-1">без отправки СМС</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ваше имя</label>
                  <input
                    className="input-eco w-full px-4 py-3"
                    placeholder="Иван Петров"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Номер телефона</label>
                <input
                  className="input-eco w-full px-4 py-3"
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Пароль</label>
                <input
                  className="input-eco w-full px-4 py-3"
                  placeholder="Придумайте пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 mt-2">
                {authMode === "login" ? "Войти" : "Зарегистрироваться"}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                {authMode === "login" ? "Нет аккаунта? Зарегистрируйтесь" : "Уже есть аккаунт? Войти"}
              </button>
            </div>
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── МОДАЛ: ДОБАВИТЬ ВТОРСЫРЬЁ ─── */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}
        >
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up relative">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">♻️</div>
              <h3 className="text-2xl font-black text-green-800">Сдать вторсырьё</h3>
              <p className="text-gray-500 text-sm mt-1">Введите данные о сданном сырье</p>
            </div>

            {addSuccess ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <div className="text-xl font-bold text-green-700">Данные записаны!</div>
                <div className="text-gray-500 text-sm mt-2">Рейтинг обновится 1-го числа месяца</div>
              </div>
            ) : (
              <form onSubmit={handleAddRaw} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Тип вторсырья</label>
                  <select
                    className="input-eco w-full px-4 py-3 cursor-pointer"
                    value={rawType}
                    onChange={(e) => setRawType(e.target.value)}
                  >
                    {rawTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Количество (кг)</label>
                  <input
                    className="input-eco w-full px-4 py-3"
                    placeholder="Например: 3.5"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={rawKg}
                    onChange={(e) => setRawKg(e.target.value)}
                    required
                  />
                </div>
                <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3 border border-green-100">
                  <Icon name="Info" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">Данные будут учтены в рейтинге после подтверждения сотрудником пункта приёма</p>
                </div>
                <button type="submit" className="btn-primary w-full py-3.5">
                  Подтвердить сдачу
                </button>
              </form>
            )}
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ─── ФУТЕР ─── */}
      <footer className="bg-green-900 text-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🐦</span>
                <span className="font-black text-xl">Птичка</span>
              </div>
              <p className="text-green-300 text-sm leading-relaxed">
                Экологический пункт сбора вторсырья. Вместе сделаем планету чище!
              </p>
            </div>
            <div>
              <div className="font-bold text-green-300 mb-3 text-sm uppercase tracking-wider">Навигация</div>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className="block text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-bold text-green-300 mb-3 text-sm uppercase tracking-wider">Контакты</div>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-white/50 text-xs">Поддержка</div>
                  <a href="mailto:ptichka3829@gmail.com" className="text-white/80 hover:text-white transition-colors">
                    ptichka3829@gmail.com
                  </a>
                </div>
                <div>
                  <div className="text-white/50 text-xs">Призы</div>
                  <a href="mailto:ptichka937@gmail.com" className="text-white/80 hover:text-white transition-colors">
                    ptichka937@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
            © 2024 Птичка. Все права защищены. Рейтинг обновляется 1-го числа каждого месяца.
          </div>
        </div>
      </footer>
    </div>
  );
}