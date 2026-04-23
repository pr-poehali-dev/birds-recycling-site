import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const API = "https://functions.poehali.dev/31550111-ad83-4c23-8f5d-8ba51a172318";

const rawTypes = ["Бумага", "Пластик", "Стекло", "Металл", "Картон", "Текстиль", "Электроника"];

type Section = "home" | "about" | "rating" | "contacts" | "certificate";
type AuthMode = "login" | "register" | "admin" | "forgot" | "reset";
type EntryStatus = "pending" | "confirmed" | "rejected";
type AdminTab = "entries" | "users";

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  avatar: string;
  avatarUrl?: string | null;
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
  avatarUrl?: string | null;
  totalKg: number;
}

interface AdminUser {
  id: number;
  name: string;
  phone: string;
  avatar: string;
  avatarUrl?: string | null;
  totalKg: number;
  createdAt: string;
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

function AvatarView({ avatar, avatarUrl, size = 40 }: { avatar: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className="rounded-full object-cover border-2 border-green-200 flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-green-50 border-2 border-green-100 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      {avatar}
    </div>
  );
}

function RatingRow({ item, index }: { item: RatingUser; index: number }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl mb-3 transition-all hover:scale-[1.01] ${index < 3 ? "card-eco" : "bg-white/60 border border-green-100"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankClass(index)}`}>
        {getRankEmoji(index)}
      </div>
      <AvatarView avatar={item.avatar} avatarUrl={item.avatarUrl} size={44} />
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

/* ─── Сертификат ─── */
function CertificatePage({ onBack }: { onBack: () => void }) {
  const [participantName, setParticipantName] = useState("");
  const [kg, setKg] = useState("");
  const [generated, setGenerated] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const dateStr = today.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!participantName.trim()) return;
    setGenerated(true);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (!certRef.current) return;
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `сертификат_птичка_${participantName.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-green-700 hover:text-green-900 font-semibold mb-8 transition-colors">
        <Icon name="ArrowLeft" size={18} />
        Назад
      </button>

      {!generated ? (
        <div className="card-eco p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-2xl font-black text-green-800">Получить сертификат</h2>
            <p className="text-gray-500 text-sm mt-2">Сертификат участника экологической акции «Птичка» города Сургут</p>
          </div>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Имя участника</label>
              <input
                className="input-eco w-full px-4 py-3"
                placeholder="Иванов Иван Иванович"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Сдано вторсырья (кг) <span className="text-gray-400 font-normal">— необязательно</span></label>
              <input
                className="input-eco w-full px-4 py-3"
                placeholder="Например: 12.5"
                type="number"
                min="0"
                step="0.1"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              <Icon name="Award" size={18} />
              Создать сертификат
            </button>
          </form>
        </div>
      ) : (
        <div>
          {/* Сертификат */}
          <div
            ref={certRef}
            className="mx-auto relative overflow-hidden"
            style={{
              width: "100%",
              maxWidth: 720,
              background: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)",
              borderRadius: 24,
              padding: "0",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              fontFamily: "'Golos Text', Arial, sans-serif",
            }}
          >
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <div style={{ position: "absolute", top: "50%", left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

            <div style={{ position: "relative", zIndex: 1, padding: "48px 56px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 40 }}>🐦</div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>ПТИЧКА</div>
                    <div style={{ color: "#6ee7b7", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Сургут</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#6ee7b7", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Экологическая акция</div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>2024–2025</div>
                </div>
              </div>

              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", marginBottom: 32 }} />

              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ color: "#6ee7b7", fontSize: 12, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>Настоящий сертификат подтверждает, что</div>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: 36, lineHeight: 1.2, textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                  {participantName}
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.7 }}>
                  является участником городской экологической акции<br />
                  по сбору вторичного сырья <strong style={{ color: "#fff" }}>«Птичка»</strong>
                  {kg && parseFloat(kg) > 0 && (
                    <>
                      <br />
                      и сдал(а) <strong style={{ color: "#a7f3d0", fontSize: 18 }}>{kg} кг</strong> вторичного сырья
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 32 }}>
                {["📦", "🧴", "🥫", "📰", "🔋"].map((icon, i) => (
                  <div key={i} style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20
                  }}>{icon}</div>
                ))}
              </div>

              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", marginBottom: 24 }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 6 }}>Организатор акции</div>
                  <div style={{ color: "#a7f3d0", fontWeight: 700, fontSize: 15 }}>Экопункт «Птичка»</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>г. Сургут, ХМАО–Югра</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 6 }}>Дата выдачи</div>
                  <div style={{ color: "#a7f3d0", fontWeight: 700, fontSize: 15 }}>{dateStr}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>ptichka.poehali.dev</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 max-w-[720px] mx-auto">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Icon name="Download" size={18} />
              {downloading ? "Сохраняю..." : "Скачать PNG"}
            </button>
            <button
              onClick={() => { setGenerated(false); setParticipantName(""); setKg(""); }}
              className="btn-secondary flex-1 py-3.5 flex items-center justify-center gap-2"
            >
              <Icon name="RefreshCw" size={18} />
              Другое имя
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">Нажмите «Скачать PNG» — сертификат сохранится как изображение</p>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showAddForm, setShowAddForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState("");

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<RawEntry[]>([]);
  const [ratingUsers, setRatingUsers] = useState<RatingUser[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);

  const [adminTab, setAdminTab] = useState<AdminTab>("entries");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [avatarUploadingId, setAvatarUploadingId] = useState<number | null>(null);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);

  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fName, setFName] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fPassword2, setFPassword2] = useState("");
  const [showEaster, setShowEaster] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const [rawType, setRawType] = useState(rawTypes[0]);
  const [rawKg, setRawKg] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const isAdmin = currentUser?.isAdmin === true;

  const navItems: { id: Section; label: string }[] = [
    { id: "home", label: "Главная" },
    { id: "about", label: "О проекте" },
    { id: "rating", label: "Рейтинг" },
    { id: "certificate", label: "Сертификат" },
    { id: "contacts", label: "Контакты" },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token");
    if (token) {
      setResetToken(token);
      setAuthMode("reset");
      setShowAuth(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const data = await api<RawEntry[]>("entries");
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  const loadRating = useCallback(async () => {
    setLoadingRating(true);
    try {
      const data = await api<RatingUser[]>("rating");
      setRatingUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoadingRating(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await api<AdminUser[]>("users");
      setAdminUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { loadRating(); }, [loadRating]);
  useEffect(() => {
    if (isAdmin) { loadEntries(); loadUsers(); }
  }, [isAdmin, loadEntries, loadUsers]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadOwnAvatar(file: File) {
    if (!currentUser) return;
    setProfileAvatarUploading(true);
    try {
      const b64 = await fileToBase64(file);
      const result = await api<{ avatarUrl: string; error?: string }>("upload_avatar", "POST", {
        userId: currentUser.id, imageBase64: b64, contentType: file.type,
      });
      if (result.avatarUrl) {
        setCurrentUser({ ...currentUser, avatarUrl: result.avatarUrl });
        loadRating();
      }
    } catch (_e) { /* ignore */ } finally { setProfileAvatarUploading(false); }
  }

  async function handleAdminUploadAvatar(userId: number, file: File) {
    setAvatarUploadingId(userId);
    try {
      const b64 = await fileToBase64(file);
      const result = await api<{ avatarUrl: string; error?: string }>("upload_avatar", "POST", {
        userId, imageBase64: b64, contentType: file.type,
      });
      if (result.avatarUrl) {
        setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl: result.avatarUrl } : u));
        loadRating();
      }
    } catch (_e) { /* ignore */ } finally { setAvatarUploadingId(null); }
  }

  async function handleRemoveAvatar(userId: number) {
    await api("remove_avatar", "POST", { userId });
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl: null } : u));
    loadRating();
  }

  async function handleSaveName(userId: number) {
    if (!editingName.trim()) return;
    await api("update_user", "POST", { userId, name: editingName.trim() });
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, name: editingName.trim() } : u));
    setEditingUserId(null); setEditingName("");
    loadRating(); loadEntries();
  }

  async function handleResetUser(userId: number) {
    if (!window.confirm("Обнулить результаты этого пользователя?")) return;
    await api("reset_user", "POST", { userId });
    setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, totalKg: 0 } : u));
    loadRating();
  }

  async function handleDeleteUser(userId: number) {
    if (!window.confirm("Удалить пользователя полностью? Все его заявки тоже удалятся.")) return;
    await api("delete_user", "POST", { userId });
    setAdminUsers(prev => prev.filter(u => u.id !== userId));
    loadRating(); loadEntries();
  }

  function resetAuthForm() {
    setFPhone(""); setFName(""); setFPassword(""); setFPassword2("");
    setFEmail(""); setAuthError(""); setAuthSuccess("");
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(""); setAuthSuccess("");
    setAuthLoading(true);
    try {
      if (authMode === "reset") {
        if (fPassword !== fPassword2) { setAuthError("Пароли не совпадают"); return; }
        if (fPassword.length < 6) { setAuthError("Пароль должен быть не менее 6 символов"); return; }
        const res = await api<{ ok?: boolean; error?: string }>("reset_password", "POST", {
          token: resetToken, password: fPassword,
        });
        if (res.error) { setAuthError(res.error); return; }
        setAuthSuccess("Пароль успешно изменён! Теперь можете войти.");
        setTimeout(() => { setAuthMode("login"); setAuthSuccess(""); resetAuthForm(); }, 2500);
        return;
      }

      if (authMode === "forgot") {
        if (!fEmail) { setAuthError("Введите email"); return; }
        await api("forgot_password", "POST", { email: fEmail });
        setAuthSuccess("Если этот email зарегистрирован — письмо со ссылкой уже в пути.");
        return;
      }

      if (authMode === "register") {
        if (fPassword !== fPassword2) { setAuthError("Пароли не совпадают"); return; }
        const user = await api<User & { error?: string }>("register", "POST", {
          name: fName.trim(), phone: fPhone.trim(), email: fEmail.trim(), password: fPassword,
        });
        if (user.error) { setAuthError(user.error); return; }
        setCurrentUser(user as User);
        setShowAuth(false); resetAuthForm(); return;
      }

      const loginField = fPhone.trim() || fEmail.trim();
      const user = await api<User & { error?: string }>("login", "POST", {
        phone: loginField, email: loginField, password: fPassword,
      });
      if (user.error) { setAuthError(user.error); return; }
      setCurrentUser(user as User);
      if ((user as User).isAdmin) await loadEntries();
      setShowAuth(false); resetAuthForm();
    } catch {
      setAuthError("Ошибка соединения, попробуйте ещё раз");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleAddRaw(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    const kg = parseFloat(rawKg);
    if (isNaN(kg) || kg <= 0) return;
    setAddLoading(true);
    try {
      const result = await api<{ id: number; status: string; error?: string }>("add_entry", "POST", {
        userId: currentUser.id, userName: currentUser.name,
        userPhone: currentUser.phone, type: rawType, kg,
      });
      if (result.error) return;
      setAddSuccess(true);
      setTimeout(() => { setAddSuccess(false); setShowAddForm(false); setRawKg(""); }, 2000);
    } catch (_e) { /* ignore */ } finally { setAddLoading(false); }
  }

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

  function authTitle() {
    if (authMode === "admin") return "Вход для администратора";
    if (authMode === "register") return "Регистрация";
    if (authMode === "forgot") return "Восстановление пароля";
    if (authMode === "reset") return "Новый пароль";
    return "Вход в аккаунт";
  }

  return (
    <div className="min-h-screen bg-nature-texture">

      {/* ─── НАВИГАЦИЯ ─── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setSection("home")} className="flex items-center gap-2 group">
            <div className="w-9 h-9 from-green-700 to-green-500 flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 transition-transform mx-0 bg-cyan-600 rounded-3xl"></div>
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
                    <AvatarView avatar={currentUser.avatar} avatarUrl={currentUser.avatarUrl} size={24} />
                    <span className="text-green-700 text-sm font-medium">{currentUser.name}</span>
                    <button onClick={() => setCurrentUser(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Icon name="LogOut" size={14} />
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowAuth(true); setAuthMode("login"); resetAuthForm(); }} className="btn-primary px-5 py-2 text-sm">
                  Войти
                </button>
                <button onClick={() => { setShowAuth(true); setAuthMode("admin"); resetAuthForm(); }} className="btn-secondary px-4 py-2 text-sm hidden md:block" title="Вход для администратора">
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
              <button onClick={() => { setShowAuth(true); setAuthMode("admin"); setMobileMenuOpen(false); resetAuthForm(); }} className="btn-secondary w-full py-2 text-sm mt-1">
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

      {/* ─── СЕРТИФИКАТ ─── */}
      {section === "certificate" && !isAdmin && (
        <CertificatePage onBack={() => setSection("home")} />
      )}

      {/* ─── ПАНЕЛЬ АДМИНИСТРАТОРА ─── */}
      {isAdmin && (
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl">⚙️</div>
              <div>
                <h2 className="text-2xl font-black text-gray-800">Панель администратора</h2>
                <p className="text-gray-500 text-sm">Заявки и управление участниками</p>
              </div>
            </div>
            <button onClick={() => { loadEntries(); loadUsers(); loadRating(); }}
              className="md:ml-auto btn-secondary px-4 py-2 text-sm flex items-center gap-2">
              <Icon name="RefreshCw" size={15} />
              Обновить
            </button>
          </div>

          <div className="flex gap-2 p-1.5 bg-green-50 rounded-2xl mb-6 border border-green-100">
            <button onClick={() => setAdminTab("entries")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${adminTab === "entries" ? "tab-active" : "text-gray-600 hover:bg-green-100"}`}>
              <Icon name="Inbox" size={16} />
              Заявки
              {pendingCount > 0 && <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
            <button onClick={() => setAdminTab("users")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${adminTab === "users" ? "tab-active" : "text-gray-600 hover:bg-green-100"}`}>
              <Icon name="Users" size={16} />
              Пользователи
              <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{adminUsers.length}</span>
            </button>
          </div>

          {adminTab === "entries" && (
            <>
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
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3 animate-spin inline-block">⚙️</div><p>Загружаю заявки...</p></div>
              ) : entries.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-4">📭</div><p>Заявок пока нет</p></div>
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
                            <Icon name="Check" size={16} />Подтвердить
                          </button>
                          <button onClick={() => handleReject(entry.id)} className="px-5 py-2 text-sm rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all font-semibold flex items-center gap-2">
                            <Icon name="X" size={16} />Отклонить
                          </button>
                        </div>
                      )}
                      {entry.status === "confirmed" && <div className="text-green-600 text-sm font-semibold flex items-center gap-1"><Icon name="CheckCircle" size={16} />Подтверждено</div>}
                      {entry.status === "rejected" && <div className="text-red-400 text-sm font-semibold flex items-center gap-1"><Icon name="XCircle" size={16} />Отклонено</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {adminTab === "users" && (
            <>
              {loadingUsers ? (
                <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3 animate-spin inline-block">⚙️</div><p>Загружаю пользователей...</p></div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-4">👥</div><p>Пользователей ещё нет</p></div>
              ) : (
                <div className="space-y-3">
                  {adminUsers.map((u) => (
                    <div key={u.id} className="card-eco p-5 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="relative group flex-shrink-0">
                        <AvatarView avatar={u.avatar} avatarUrl={u.avatarUrl} size={56} />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          {avatarUploadingId === u.id ? <Icon name="Loader2" size={20} className="text-white animate-spin" /> : <Icon name="Camera" size={20} className="text-white" />}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAdminUploadAvatar(u.id, f); }} />
                        </label>
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <input value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              className="input-eco px-3 py-1.5 text-sm flex-1" placeholder="Имя" />
                            <button onClick={() => handleSaveName(u.id)} className="btn-primary px-3 py-1.5 text-xs">Сохранить</button>
                            <button onClick={() => setEditingUserId(null)} className="btn-secondary px-3 py-1.5 text-xs">Отмена</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 truncate">{u.name}</span>
                            <button onClick={() => { setEditingUserId(u.id); setEditingName(u.name); }} className="text-gray-400 hover:text-green-600 transition-colors">
                              <Icon name="Pencil" size={14} />
                            </button>
                          </div>
                        )}
                        <div className="text-sm text-gray-500 mt-0.5">{maskPhone(u.phone)} · с {u.createdAt}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-green-700">{u.totalKg} кг</div>
                        <div className="flex gap-1.5 justify-end mt-1.5 flex-wrap">
                          {u.avatarUrl && (
                            <button onClick={() => handleRemoveAvatar(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
                              Удалить фото
                            </button>
                          )}
                          <button onClick={() => handleResetUser(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all">
                            Обнулить
                          </button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── ГЛАВНАЯ ─── */}
      {section === "home" && !isAdmin && (
        <div>
          <section className="relative overflow-hidden py-20 px-4">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-green-200">
                <span>🌿</span>
                <span>Экологический пункт сбора вторсырья</span>
                <span>·</span>
                <span>г. Сургут</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Golos Text', sans-serif" }}>
                Сдай вторсырьё —<br />
                <span className="text-green-700">спаси планету</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Присоединяйся к экологической акции «Птичка» и вноси вклад в чистоту нашего города. Каждый килограмм вторсырья — это шаг к лучшему будущему!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {currentUser ? (
                  <button onClick={() => setShowAddForm(true)} className="btn-primary px-8 py-4 text-lg flex items-center justify-center gap-2">
                    <Icon name="Plus" size={22} />
                    Сдать вторсырьё
                  </button>
                ) : (
                  <button onClick={() => { setShowAuth(true); setAuthMode("register"); resetAuthForm(); }} className="btn-primary px-8 py-4 text-lg flex items-center justify-center gap-2">
                    <Icon name="UserPlus" size={22} />
                    Стать участником
                  </button>
                )}
                <button onClick={() => setSection("rating")} className="btn-secondary px-8 py-4 text-lg flex items-center justify-center gap-2">
                  <Icon name="Trophy" size={20} />
                  Рейтинг
                </button>
                <button onClick={() => setSection("certificate")} className="btn-secondary px-8 py-4 text-lg flex items-center justify-center gap-2">
                  <Icon name="Award" size={20} />
                  Сертификат
                </button>
              </div>
            </div>
          </section>

          <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: "Recycle", title: "Сдай вторсырьё", desc: "Приносите бумагу, пластик, стекло, металл, картон, текстиль и электронику в наш пункт приёма", color: "bg-green-50 border-green-200", iconColor: "text-green-600" },
                  { icon: "ClipboardCheck", title: "Получи подтверждение", desc: "Сотрудник пункта проверит и подтвердит вашу заявку — килограммы зачислятся в рейтинг", color: "bg-blue-50 border-blue-200", iconColor: "text-blue-600" },
                  { icon: "Award", title: "Забери приз", desc: "Победители рейтинга получают призы! Чем больше сдадите — тем выше ваш результат", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
                ].map((item, i) => (
                  <div key={i} className={`card-eco p-7 border ${item.color}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                      <Icon name={item.icon as Parameters<typeof Icon>[0]["name"]} size={24} className={item.iconColor} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {ratingUsers.length > 0 && (
            <section className="py-12 px-4 bg-white/50">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-gray-800 mb-2">Топ участников</h2>
                  <p className="text-gray-500">Самые активные экологи Сургута</p>
                </div>
                {ratingUsers.slice(0, 3).map((u, i) => <RatingRow key={i} item={u} index={i} />)}
                {ratingUsers.length > 3 && (
                  <div className="text-center mt-4">
                    <button onClick={() => setSection("rating")} className="btn-secondary px-6 py-2.5 text-sm flex items-center gap-2 mx-auto">
                      <Icon name="ChevronDown" size={16} />
                      Показать всех ({ratingUsers.length})
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ─── О ПРОЕКТЕ ─── */}
      {section === "about" && !isAdmin && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-800 mb-4">О проекте «Птичка»</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Городская экологическая инициатива по раздельному сбору вторсырья в Сургуте</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              { icon: "🌍", title: "Наша миссия", text: "Снижение количества отходов на городских полигонах через вовлечение жителей Сургута в культуру раздельного сбора мусора." },
              { icon: "♻️", title: "Что принимаем", text: "Бумагу, пластик, стекло, металл, картон, текстиль и электронику. Принимаем в чистом виде без органических остатков." },
              { icon: "🏆", title: "Система рейтинга", text: "Каждый килограмм сданного сырья засчитывается участнику. Лидеры рейтинга получают призы от организаторов." },
              { icon: "📍", title: "Где мы", text: "Пункт приёма находится в городе Сургут. Адрес и время работы уточняйте в разделе «Контакты»." },
            ].map((item, i) => (
              <div key={i} className="card-eco p-7">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-800 text-xl mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── РЕЙТИНГ ─── */}
      {section === "rating" && !isAdmin && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-800 mb-3">Рейтинг участников</h2>
            <p className="text-gray-500">Сургут заботится о природе вместе с «Птичкой»</p>
          </div>
          {loadingRating ? (
            <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-4 animate-bounce">🌿</div><p>Загружаю рейтинг...</p></div>
          ) : ratingUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-500 text-lg">Рейтинг пока пуст. Стань первым!</p>
              {!currentUser && (
                <button onClick={() => { setShowAuth(true); setAuthMode("register"); resetAuthForm(); }} className="btn-primary mt-6 px-8 py-3">
                  Зарегистрироваться
                </button>
              )}
            </div>
          ) : (
            ratingUsers.map((u, i) => <RatingRow key={i} item={u} index={i} />)
          )}
        </div>
      )}

      {/* ─── КОНТАКТЫ ─── */}
      {section === "contacts" && !isAdmin && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-800 mb-4">Контакты</h2>
            <p className="text-gray-500 text-lg">Свяжитесь с нами по любому вопросу</p>
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up relative max-h-[90vh] overflow-y-auto">

            {authMode !== "admin" && authMode !== "forgot" && authMode !== "reset" && (
              <div className="flex gap-1 p-1 bg-green-50 rounded-xl mb-6 border border-green-100">
                <button onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === "login" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>Войти</button>
                <button onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${authMode === "register" ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>Регистрация</button>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="text-4xl mb-2">
                {authMode === "admin" ? "⚙️" : authMode === "forgot" || authMode === "reset" ? "🔐" : "🐦"}
              </div>
              <h3 className="text-2xl font-black text-green-800">{authTitle()}</h3>
              {authMode === "admin" && <p className="text-gray-500 text-sm mt-1">Только для сотрудников пункта приёма</p>}
              {authMode === "forgot" && <p className="text-gray-500 text-sm mt-1">Введите email — пришлём ссылку для смены пароля</p>}
              {authMode === "reset" && <p className="text-gray-500 text-sm mt-1">Придумайте новый пароль</p>}
            </div>

            {authSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-4 rounded-xl flex items-start gap-2 mb-4">
                <Icon name="CheckCircle" size={18} className="flex-shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ваше имя</label>
                  <input className="input-eco w-full px-4 py-3" placeholder="Иван Петров" value={fName} onChange={(e) => setFName(e.target.value)} required />
                </div>
              )}

              {(authMode === "login" || authMode === "register" || authMode === "admin") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {authMode === "admin" ? "Логин" : authMode === "login" ? "Телефон или Email" : "Номер телефона"}
                  </label>
                  <input className="input-eco w-full px-4 py-3"
                    placeholder={authMode === "admin" ? "admin" : authMode === "login" ? "+7 900 000-00-00 или email@mail.ru" : "+7 (___) ___-__-__"}
                    value={fPhone}
                    onChange={(e) => {
                      setFPhone(e.target.value);
                      if (e.target.value === "67" && fPassword === "67") setShowEaster(true);
                    }}
                    type={authMode === "admin" ? "text" : "tel"}
                    required={authMode !== "login"}
                  />
                </div>
              )}

              {(authMode === "register" || authMode === "forgot") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email {authMode === "register" && <span className="text-gray-400 font-normal">— для восстановления пароля</span>}
                  </label>
                  <input className="input-eco w-full px-4 py-3"
                    placeholder="example@mail.ru"
                    type="email"
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                    required={authMode === "forgot"}
                  />
                </div>
              )}

              {authMode !== "forgot" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Пароль</label>
                  <input className="input-eco w-full px-4 py-3"
                    placeholder={authMode === "register" || authMode === "reset" ? "Придумайте пароль (мин. 6 символов)" : "Введите пароль"}
                    type="password"
                    value={fPassword}
                    onChange={(e) => {
                      setFPassword(e.target.value);
                      if (fPhone === "67" && e.target.value === "67") setShowEaster(true);
                    }}
                    required
                  />
                </div>
              )}

              {(authMode === "register" || authMode === "reset") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Повторите пароль</label>
                  <input className="input-eco w-full px-4 py-3"
                    placeholder="Повторите пароль"
                    type="password"
                    value={fPassword2}
                    onChange={(e) => setFPassword2(e.target.value)}
                    required
                  />
                </div>
              )}

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} className="flex-shrink-0" />
                  {authError}
                </div>
              )}

              <button type="submit" disabled={authLoading || !!authSuccess} className="btn-primary w-full py-3.5 mt-2 disabled:opacity-60">
                {authLoading ? "Загружаю..." :
                  authMode === "admin" ? "Войти как администратор" :
                  authMode === "register" ? "Зарегистрироваться" :
                  authMode === "forgot" ? "Отправить письмо" :
                  authMode === "reset" ? "Сохранить пароль" :
                  "Войти"}
              </button>
            </form>

            <div className="text-center mt-4 space-y-2">
              {authMode === "login" && (
                <button onClick={() => { setAuthMode("forgot"); setAuthError(""); setAuthSuccess(""); }}
                  className="block w-full text-xs text-gray-400 hover:text-green-600 transition-colors">
                  Забыли пароль?
                </button>
              )}
              {(authMode === "forgot" || authMode === "reset") && (
                <button onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors">
                  ← Вернуться ко входу
                </button>
              )}
              {authMode !== "admin" ? (
                <button onClick={() => { setAuthMode("admin"); setAuthError(""); setAuthSuccess(""); resetAuthForm(); }}
                  className="block w-full text-xs text-gray-400 hover:text-amber-600 transition-colors">
                  ⚙️ Вход для администратора
                </button>
              ) : (
                <button onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors">
                  ← Обычный вход
                </button>
              )}
            </div>

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
                  <div className="relative group flex-shrink-0">
                    <AvatarView avatar={currentUser.avatar} avatarUrl={currentUser.avatarUrl} size={40} />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {profileAvatarUploading ? <Icon name="Loader2" size={14} className="text-white animate-spin" /> : <Icon name="Camera" size={14} className="text-white" />}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadOwnAvatar(f); }} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-800">{currentUser.name}</div>
                    <div className="text-xs text-green-600">{currentUser.totalKg} кг уже подтверждено</div>
                    <div className="text-[10px] text-green-500 mt-0.5">Наведите на фото, чтобы изменить</div>
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
                  <input className="input-eco w-full px-4 py-3" placeholder="Например: 2.5" type="number" min="0.1" step="0.1"
                    value={rawKg} onChange={(e) => setRawKg(e.target.value)} required />
                </div>
                <button type="submit" disabled={addLoading} className="btn-primary w-full py-3.5 disabled:opacity-60 flex items-center justify-center gap-2">
                  <Icon name="Send" size={18} />
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
      {!isAdmin && section !== "certificate" && (
        <footer className="bg-green-900 text-white mt-16">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4"><span className="text-2xl">🐦</span><span className="font-black text-xl">Птичка</span></div>
                <p className="text-green-300 text-sm leading-relaxed">Экологический пункт сбора вторсырья. Вместе сделаем планету чище!</p>
                <p className="text-green-400 text-xs mt-2">г. Сургут, ХМАО–Югра</p>
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
            <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">© 2024 Птичка · г. Сургут. Рейтинг обновляется 1-го числа каждого месяца.</div>
          </div>
        </footer>
      )}

      {/* ─── ПАСХАЛКА ─── */}
      {showEaster && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black cursor-pointer" onClick={() => setShowEaster(false)}>
          <img
            src="https://cdn.poehali.dev/projects/db5b1cd7-e249-488f-a318-9c52676d7b5d/bucket/64934191-694b-4aae-b156-592e85b08934.png"
            alt="Екатерина II"
            className="max-h-screen max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}