import json
import os
import random
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

AVATARS = ["🌿", "🍃", "🌱", "🌲", "🌾", "🪴", "🍀", "🌻", "🦋", "🌸"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """API для Птичка: авторизация, заявки на сдачу вторсырья, панель администратора."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # ── register ──────────────────────────────────────────────
    if action == "register" and method == "POST":
        name = (body.get("name") or "").strip()
        phone = (body.get("phone") or "").strip()
        password = (body.get("password") or "").strip()
        if not name or not phone or not password:
            return err("Заполните все поля")
        avatar = random.choice(AVATARS)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM ptichka_users WHERE phone = %s", (phone,))
        if cur.fetchone():
            conn.close()
            return err("Пользователь с таким номером уже зарегистрирован")
        cur.execute(
            "INSERT INTO ptichka_users (name, phone, password, avatar) VALUES (%s,%s,%s,%s) RETURNING id,name,phone,avatar,total_kg,is_admin",
            (name, phone, password, avatar),
        )
        r = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"id": r[0], "name": r[1], "phone": r[2], "avatar": r[3], "totalKg": float(r[4]), "isAdmin": r[5]})

    # ── login ─────────────────────────────────────────────────
    if action == "login" and method == "POST":
        phone = (body.get("phone") or "").strip()
        password = (body.get("password") or "").strip()
        if not phone or not password:
            return err("Заполните все поля")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id,name,phone,avatar,total_kg,is_admin FROM ptichka_users WHERE phone=%s AND password=%s",
            (phone, password),
        )
        r = cur.fetchone()
        conn.close()
        if not r:
            return err("Неверный номер телефона или пароль")
        return ok({"id": r[0], "name": r[1], "phone": r[2], "avatar": r[3], "totalKg": float(r[4]), "isAdmin": r[5]})

    # ── add entry ─────────────────────────────────────────────
    if action == "add_entry" and method == "POST":
        user_id = body.get("userId")
        user_name = (body.get("userName") or "").strip()
        user_phone = (body.get("userPhone") or "").strip()
        entry_type = (body.get("type") or "").strip()
        kg = body.get("kg")
        if not all([user_id, user_name, user_phone, entry_type, kg]):
            return err("Заполните все поля")
        try:
            kg = float(kg)
        except Exception:
            return err("Некорректное количество кг")
        if kg <= 0:
            return err("Количество должно быть больше 0")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO ptichka_entries (user_id,user_name,user_phone,type,kg) VALUES (%s,%s,%s,%s,%s) RETURNING id,created_at",
            (user_id, user_name, user_phone, entry_type, kg),
        )
        r = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"id": r[0], "status": "pending", "date": r[1].strftime("%d.%m.%Y")})

    # ── get entries (admin) ───────────────────────────────────
    if action == "entries" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id,user_id,user_name,user_phone,type,kg,status,created_at FROM ptichka_entries ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        conn.close()
        return ok([
            {"id": r[0], "userId": r[1], "userName": r[2], "userPhone": r[3],
             "type": r[4], "kg": float(r[5]), "status": r[6], "date": r[7].strftime("%d.%m.%Y")}
            for r in rows
        ])

    # ── confirm entry ─────────────────────────────────────────
    if action == "confirm" and method == "POST":
        entry_id = body.get("entryId")
        if not entry_id:
            return err("entryId обязателен")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT user_id,kg,status FROM ptichka_entries WHERE id=%s", (entry_id,))
        r = cur.fetchone()
        if not r:
            conn.close()
            return err("Заявка не найдена", 404)
        if r[2] != "pending":
            conn.close()
            return err("Заявка уже обработана")
        cur.execute("UPDATE ptichka_entries SET status='confirmed' WHERE id=%s", (entry_id,))
        cur.execute("UPDATE ptichka_users SET total_kg=total_kg+%s WHERE id=%s", (r[1], r[0]))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── reject entry ──────────────────────────────────────────
    if action == "reject" and method == "POST":
        entry_id = body.get("entryId")
        if not entry_id:
            return err("entryId обязателен")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE ptichka_entries SET status='rejected' WHERE id=%s AND status='pending'", (entry_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── rating ────────────────────────────────────────────────
    if action == "rating" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT name,phone,avatar,total_kg FROM ptichka_users WHERE is_admin=FALSE AND total_kg>0 ORDER BY total_kg DESC"
        )
        rows = cur.fetchall()
        conn.close()
        return ok([{"name": r[0], "phone": r[1], "avatar": r[2], "totalKg": float(r[3])} for r in rows])

    # ── healthcheck ───────────────────────────────────────────
    if method == "GET" and not action:
        return ok({"status": "ok"})

    return err("Unknown action", 404)
