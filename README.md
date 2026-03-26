# TCEB Chat Log CMS — MySQL + MongoDB

ดึง chat log จาก **MySQL** + เก็บ AI metadata ใน **MongoDB Atlas**

## Tech Stack
- Next.js 15 + TypeScript + TailwindCSS
- MySQL (read-only) — chat logs
- MongoDB Atlas — sentiment, tags, notes, flags
- Claude API — AI analysis
- Line Messaging API — notifications

## Setup

```bash
npm install
cp .env.local.example .env.local
# แก้ไข .env.local
npm run dev
```

## Environment Variables

```env
# MySQL (read-only)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=tvai_dev
MYSQL_TABLE=tceb_chat_logs

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tceb-cms

# Auth
NEXTAUTH_SECRET=random-32-chars
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@tceb.or.th
ADMIN_PASSWORD=your-password

# Gemini AI
ANTHROPIC_API_KEY=sk-ant-...

# Line Messaging API
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_NOTIFY_GROUP_ID=...

# Cron
CRON_SECRET=random-secret
```

## Pages

| Path | Description |
|------|-------------|
| `/dashboard` | KPI + charts + sentiment pie + top topics |
| `/sessions` | List พร้อม filter sentiment/flagged/date |
| `/sessions/[id]` | Chat viewer + AI Analyze + Tags + Admin Notes |
| `/analytics` | Charts เชิงลึก |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sessions` | List sessions (MySQL + MongoDB) |
| GET | `/api/sessions/[id]` | Messages ของ conversation |
| GET | `/api/sessions/meta/[id]` | MongoDB metadata |
| PATCH | `/api/sessions/meta/[id]` | Update tags/notes/flags |
| POST | `/api/sessions/analyze/[id]` | Run Gemini AI analysis |
| GET | `/api/analytics` | Dashboard stats |
| GET | `/api/export?format=csv\|xlsx` | Export |
| GET | `/api/cron/daily-digest` | Daily Line digest (ใส่ Bearer CRON_SECRET) |

## How AI Analysis Works

1. เปิด session ใดก็ได้ → กด **Analyze**
2. Claude API วิเคราะห์ทุก message ใน conversation นั้น
3. ผลลัพธ์ (sentiment, topic, tags, summary, is_answered, flag) บันทึกลง MongoDB
4. ถ้า negative หรือ flagged → แจ้งเตือน Line อัตโนมัติ
