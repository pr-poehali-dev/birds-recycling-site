import json
import os
import random
import base64
import uuid
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

AVATARS = ["🌿", "🍃", "🌱", "🌲", "🌾", "🪴", "🍀", "🌻", "🦋", "🌸"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


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
            "INSERT INTO ptichka_users (name, phone, password, avatar) VALUES (%s,%s,%s,%s) RETURNING id,name,phone,avatar,total_kg,is_admin,avatar_url",
            (name, phone, password, avatar),
        )
        r = cur.fetchone()
        conn.commit()
        conn.close()
        return ok({"id": r[0], "name": r[1], "phone": r[2], "avatar": r[3], "totalKg": float(r[4]), "isAdmin": r[5], "avatarUrl": r[6]})

    # ── login ─────────────────────────────────────────────────
    if action == "login" and method == "POST":
        phone = (body.get("phone") or "").strip()
        password = (body.get("password") or "").strip()
        if not phone or not password:
            return err("Заполните все поля")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id,name,phone,avatar,total_kg,is_admin,avatar_url FROM ptichka_users WHERE phone=%s AND password=%s",
            (phone, password),
        )
        r = cur.fetchone()
        conn.close()
        if not r:
            return err("Неверный номер телефона или пароль")
        return ok({"id": r[0], "name": r[1], "phone": r[2], "avatar": r[3], "totalKg": float(r[4]), "isAdmin": r[5], "avatarUrl": r[6]})

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
            "SELECT name,phone,avatar,total_kg,avatar_url FROM ptichka_users WHERE is_admin=FALSE AND total_kg>0 ORDER BY total_kg DESC"
        )
        rows = cur.fetchall()
        conn.close()
        return ok([{"name": r[0], "phone": r[1], "avatar": r[2], "totalKg": float(r[3]), "avatarUrl": r[4]} for r in rows])

    # ── список пользователей (admin) ──────────────────────────
    if action == "users" and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id,name,phone,avatar,total_kg,is_admin,avatar_url,created_at FROM ptichka_users WHERE is_admin=FALSE ORDER BY total_kg DESC, id DESC"
        )
        rows = cur.fetchall()
        conn.close()
        return ok([
            {"id": r[0], "name": r[1], "phone": r[2], "avatar": r[3],
             "totalKg": float(r[4]), "isAdmin": r[5], "avatarUrl": r[6],
             "createdAt": r[7].strftime("%d.%m.%Y")}
            for r in rows
        ])

    # ── обновить имя пользователя (admin) ─────────────────────
    if action == "update_user" and method == "POST":
        user_id = body.get("userId")
        new_name = (body.get("name") or "").strip()
        if not user_id or not new_name:
            return err("userId и name обязательны")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE ptichka_users SET name=%s WHERE id=%s AND is_admin=FALSE", (new_name, user_id))
        cur.execute("UPDATE ptichka_entries SET user_name=%s WHERE user_id=%s", (new_name, user_id))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── обнулить кг пользователя (admin) ──────────────────────
    if action == "reset_user" and method == "POST":
        user_id = body.get("userId")
        if not user_id:
            return err("userId обязателен")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE ptichka_users SET total_kg=0 WHERE id=%s AND is_admin=FALSE", (user_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── удалить пользователя (admin) ──────────────────────────
    if action == "delete_user" and method == "POST":
        user_id = body.get("userId")
        if not user_id:
            return err("userId обязателен")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM ptichka_entries WHERE user_id=%s", (user_id,))
        cur.execute("DELETE FROM ptichka_users WHERE id=%s AND is_admin=FALSE", (user_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # ── загрузить аватар (base64) ─────────────────────────────
    if action == "upload_avatar" and method == "POST":
        user_id = body.get("userId")
        image_b64 = body.get("imageBase64")
        content_type = body.get("contentType") or "image/png"
        if not user_id or not image_b64:
            return err("userId и imageBase64 обязательны")
        try:
            if "," in image_b64:
                image_b64 = image_b64.split(",", 1)[1]
            data = base64.b64decode(image_b64)
        except Exception:
            return err("Некорректное изображение")
        ext = "png"
        if "jpeg" in content_type or "jpg" in content_type:
            ext = "jpg"
        elif "webp" in content_type:
            ext = "webp"
        elif "gif" in content_type:
            ext = "gif"
        key = f"avatars/{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
        s3 = get_s3()
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE ptichka_users SET avatar_url=%s WHERE id=%s", (url, user_id))
        conn.commit()
        conn.close()
        return ok({"avatarUrl": url})

    # ── удалить аватар пользователя (admin) ───────────────────
    if action == "remove_avatar" and method == "POST":
        user_id = body.get("userId")
        if not user_id:
            return err("userId обязателен")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("UPDATE ptichka_users SET avatar_url=NULL WHERE id=%s", (user_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    if method == "GET" and not action:
        return ok({"status": "ok"})

    return err("Unknown action", 404)
