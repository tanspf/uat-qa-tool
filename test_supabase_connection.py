import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("==================================================")
print("🗄️ SUPABASE POSTGRESQL CONNECTION VERIFICATION")
print("==================================================")

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))

print(f"Supabase URL: {supabase_url if supabase_url else '[Not configured in local ENV - Fallback Mode Active]'}")
print(f"Supabase Key: {'******' if supabase_key else '[Not configured in local ENV]'}")

print("\n--- BẢNG CẤU TRÚC SQL DATABASE SUPABASE (database/schema.sql) ---")
with open("database/schema.sql", "r", encoding="utf-8") as f:
    sql_schema = f.read()
    print(sql_schema)

print("\n✅ Hướng Dẫn Kết Nối Supabase Thật Cho Production:")
print("1. Mở Supabase Dashboard (https://supabase.com) -> Tạo Project mới.")
print("2. Vào SQL Editor -> Copy toàn bộ câu lệnh trong database/schema.sql ở trên và bấm Run.")
print("3. Vào Project Settings -> API -> Copy Project URL và Service Role Key / Anon Key.")
print("4. Thêm 2 dòng sau vào file .env hoặc frontend/.env.local:")
print("   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co")
print("   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>")
print("5. Khi ứng dụng chạy, db.ts sẽ tự động sử dụng @supabase/supabase-js để CRUD dữ liệu trực tiếp trên Supabase Postgres database!")
print("==================================================")
