# Project: Başvuru Takip & Kişisel CV Sitesi

Rules:

- If a new feature is added → update Features section
- If stack changes → update Tech Stack
- If bug fixed → add to Changelog

Tek kullanıcılık iş başvuru yönetim sistemi ve kişisel tanıtım (CV) web sitesi.

---

## Teknoloji Stack

| Katman   | Teknoloji                                     |
| -------- | --------------------------------------------- |
| Frontend | React 18, TypeScript, Vite                    |
| Styling  | Tailwind CSS, shadcn/ui, Framer Motion        |
| Backend  | Lovable Cloud (Supabase)                      |
| State    | TanStack React Query                          |
| Routing  | React Router DOM v6                           |
| Auth     | Supabase Auth (email/password)                |
| Storage  | Supabase Storage (`application-files` bucket) |
| Tema     | Koyu/Açık mod (class-based, localStorage)     |

---

## Sayfa Yapısı & Routing

| Route        | Sayfa      | Dosya                                   | Açıklama                                     |
| ------------ | ---------- | --------------------------------------- | -------------------------------------------- |
| `/`          | CV Sayfası | `src/pages/CVPage.tsx`                  | Herkese açık kişisel tanıtım sayfası (EN/TR) |
| `/dashboard` | Dashboard  | `src/pages/Index.tsx` → `Dashboard.tsx` | Giriş yapılmışsa dashboard, yoksa login      |
| `*`          | 404        | `src/pages/NotFound.tsx`                | Bulunamayan sayfalar                         |

### Auth Akışı

- `Index.tsx` auth durumunu kontrol eder → giriş yoksa `Login.tsx`, varsa `Dashboard.tsx` gösterir
- Auth context: `src/hooks/useAuth.tsx` (AuthProvider ile wrap edilmiş)
- Metotlar: `signIn`, `signUp`, `signOut`

---

## CV Sayfası (`/`)

### Dosyalar

- `src/pages/CVPage.tsx` — Ana sayfa, dil geçişi, edit modu kontrolü
- `src/components/cv/CVSections.tsx` — Hero, Experience, Education, Skills, Contact bölümleri
- `src/components/cv/CVEditMode.tsx` — Admin düzenleme arayüzü (EN ve TR yan yana)
- `src/hooks/useCVContent.ts` — CV verisi CRUD (Supabase `cv_content` tablosu)

### Özellikler

- **İki dilli**: İngilizce / Türkçe geçiş (Globe butonu)
- **Admin düzenleme**: Giriş yapıldığında Edit butonu aktif, EN ve TR içerikler aynı anda düzenlenebilir
- **Paylaşılan alanlar**: `name`, `email`, `linkedinUrl`, `skills` her iki dilde senkron tutulur
- **Animasyonlar**: Framer Motion ile parallax scroll, staggered fade-in, hover efektleri
- **Mobil**: Her bölüm tam ekran (`min-h-[100svh]`), bölümler arası ok butonu ile scroll

### CV Veri Modeli (`CVData`)

```typescript
{
  name: string;          // Paylaşılan
  title: string;         // Dile özel
  location: string;      // Dile özel
  summary: string;       // Dile özel
  experience: { role, company, period, description }[];
  education: { degree, school, period }[];
  skills: string[];      // Paylaşılan
  contactNote: string;   // Dile özel
  email: string;         // Paylaşılan
  linkedinUrl: string;   // Paylaşılan
}
```

---

## Dashboard (`/dashboard`)

### Dosyalar

- `src/pages/Dashboard.tsx` — Ana layout, üst navbar, istatistik kartları
- `src/components/ApplicationList.tsx` — Başvuru listesi (tablo + mobil kart görünümü)
- `src/components/CalendarView.tsx` — Aylık takvim görünümü
- `src/components/ApplicationDrawer.tsx` — Başvuru ekleme/düzenleme çekmecesi
- `src/components/StatusBadge.tsx` — Durum etiketi bileşeni
- `src/hooks/useApplications.ts` — Başvuru & departman CRUD işlemleri

### Üst Navbar

- Geri butonu (CV sayfasına)
- Logo + "Başvuru Takip" başlığı
- Liste / Takvim görünüm geçişi (tab style)
- "Yeni Başvuru" butonu
- Tema geçişi (koyu/açık)
- Çıkış butonu

### İstatistik Kartları

- Toplam Başvuru (mavi)
- Aktif Süreç (sarı) — kabul ve ret hariç
- Kabul (yeşil)
- Ret (kırmızı)

### Başvuru Listesi Sıralama Mantığı (4 Katmanlı)

```
Tier 1: Kabul edilenler (en üstte, updated_at desc)
Tier 2: Aktif + önemli tarihi bugün veya gelecekte (en yakın tarih en üstte)
Tier 3: Aktif + önemli tarihi yok veya geçmiş (created_at desc)
Tier 4: Reddedilenler (en altta, updated_at desc)
```

> Önemli tarihin günü boyunca (gün sonuna kadar) başvuru Tier 2'de kalır, gün geçtikten sonra Tier 3'e düşer.

### Başvuru Durumları

| Enum Değeri            | Etiket               | Renk          |
| ---------------------- | -------------------- | ------------- |
| `basvuruldu`           | Başvuruldu           | 🟠 Turuncu    |
| `online_degerlendirme` | Ön Aşama Sınavı      | ⚪ Beyaz/Nötr |
| `ik_mulakati`          | İK Mülakatı          | 🩷 Pembe      |
| `teknik_degerlendirme` | Teknik Değerlendirme | 🔵 Açık Mavi  |
| `kabul`                | Kabul                | 🟢 Yeşil      |
| `reddedildi`           | Reddedildi           | 🔴 Kırmızı    |

---

## Veritabanı Şeması

### `applications`

| Sütun                | Tür                     | Açıklama                                 |
| -------------------- | ----------------------- | ---------------------------------------- |
| id                   | uuid (PK)               | Otomatik                                 |
| user_id              | uuid                    | Kullanıcı ID                             |
| institution_name     | text                    | Kurum adı                                |
| program_name         | text                    | Program adı                              |
| department_ids       | uuid[]                  | (Eski, kullanılmıyor)                    |
| department_names     | text[]                  | Başvuruya özel departmanlar              |
| status               | application_status enum | Başvuru durumu                           |
| applied_date         | timestamptz             | Başvuru tarihi                           |
| important_date       | timestamptz             | Önemli tarih (sınav, mülakat vb.)        |
| important_date_label | text                    | Tarih açıklaması                         |
| notes                | text                    | Notlar                                   |
| website_url          | text                    | Web sitesi linki                         |
| created_at           | timestamptz             | Oluşturma tarihi                         |
| updated_at           | timestamptz             | Güncelleme tarihi (trigger ile otomatik) |

> **Not**: `department_names` her başvuruya özel text dizisidir. Departmanlar ortak havuzdan değil, başvuru bazında eklenir.

### `application_files`

| Sütun          | Tür         | Açıklama       |
| -------------- | ----------- | -------------- |
| id             | uuid (PK)   | Otomatik       |
| application_id | uuid (FK)   | Bağlı başvuru  |
| user_id        | uuid        | Kullanıcı ID   |
| file_name      | text        | Dosya adı      |
| file_path      | text        | Storage yolu   |
| file_type      | text        | MIME tipi      |
| file_size      | bigint      | Dosya boyutu   |
| created_at     | timestamptz | Yükleme tarihi |

- Maksimum 4 dosya/başvuru
- Kabul edilen türler: PDF, Word (.doc, .docx)
- İşlemler: Önizle (signed URL, yeni sekmede), İndir, Sil

### `reminders`

| Sütun          | Tür         | Açıklama                                   |
| -------------- | ----------- | ------------------------------------------ |
| id             | uuid (PK)   | Otomatik                                   |
| application_id | uuid (FK)   | Bağlı başvuru                              |
| user_id        | uuid        | Kullanıcı ID                               |
| remind_before  | text        | Hatırlatma süresi (ör. "1_week", "3_days") |
| remind_at      | timestamptz | Hatırlatma zamanı (hesaplanmış)            |
| sent           | boolean     | Gönderildi mi                              |

Hatırlatma seçenekleri: 1 Hafta, 3 Gün, 2 Gün, 1 Gün, 12 Saat, 4 Saat

### `cv_content`

| Sütun      | Tür         | Açıklama                      |
| ---------- | ----------- | ----------------------------- |
| id         | uuid (PK)   | Otomatik                      |
| user_id    | uuid        | Kullanıcı ID                  |
| lang       | text        | "en" veya "tr"                |
| data       | jsonb       | CV içeriği (CVData yapısında) |
| updated_at | timestamptz | Güncelleme tarihi             |

### `departments` (Eski tablo — artık aktif kullanılmıyor)

Departmanlar artık `applications.department_names` text[] sütununda saklanıyor.

---

## RLS (Row-Level Security) Politikaları

| Tablo             | Politika                       | Kural                        |
| ----------------- | ------------------------------ | ---------------------------- |
| applications      | Users manage own applications  | `auth.uid() = user_id` (ALL) |
| application_files | Users manage own files         | `auth.uid() = user_id` (ALL) |
| reminders         | Users manage own reminders     | `auth.uid() = user_id` (ALL) |
| cv_content        | Anyone can read                | `true` (SELECT)              |
| cv_content        | Owner can insert/update/delete | `auth.uid() = user_id`       |

---

## Bileşen Yapısı

```
src/
├── pages/
│   ├── CVPage.tsx          # Herkese açık CV sayfası
│   ├── Index.tsx           # Auth gate (Login veya Dashboard)
│   ├── Dashboard.tsx       # Ana dashboard layout
│   ├── Login.tsx           # Giriş/kayıt formu
│   └── NotFound.tsx        # 404
├── components/
│   ├── cv/
│   │   ├── CVSections.tsx  # Hero, Experience, Education, Skills, Contact
│   │   └── CVEditMode.tsx  # Admin düzenleme (EN/TR yan yana)
│   ├── ApplicationList.tsx # Tablo + mobil kart listesi
│   ├── ApplicationDrawer.tsx # Başvuru form çekmecesi
│   ├── CalendarView.tsx    # Aylık takvim
│   ├── StatusBadge.tsx     # Durum renk etiketi
│   ├── ThemeToggle.tsx     # Koyu/açık mod butonu
│   └── ui/                 # shadcn/ui bileşenleri
├── hooks/
│   ├── useAuth.tsx         # Auth context & provider
│   ├── useApplications.ts  # Başvuru CRUD (React Query)
│   ├── useCVContent.ts     # CV CRUD (React Query)
│   ├── useTheme.ts         # Tema state (localStorage)
│   └── use-mobile.tsx      # Mobil ekran algılama
├── types/
│   └── application.ts      # Application, Department, Status tipleri & renk/etiket sabitleri
└── integrations/
    └── supabase/
        ├── client.ts       # ❌ DÜZENLEME! Otomatik oluşturulur
        └── types.ts        # ❌ DÜZENLEME! Otomatik oluşturulur
```

---

## Tasarım Sistemi

### CSS Token'ları (`src/index.css`)

- Açık ve koyu mod değişkenleri (`:root` ve `.dark`)
- Hero bölümü özel token'ları (`--hero-*`)
- Font: Display → Sora, Body → Inter

### Tema Geçişi

- `tailwind.config.ts` → `darkMode: ["class"]`
- `useTheme.ts` → `localStorage` bazlı, `document.documentElement` class toggle
- `ThemeToggle.tsx` → Ay/Güneş ikonu

### Önemli Kurallar

- Renkleri **doğrudan değil**, `hsl(var(--token))` ile kullan
- `src/integrations/supabase/client.ts` ve `types.ts` **ASLA** düzenlenmemeli
- `.env` dosyası otomatik yönetilir, dokunma

---

## Storage

- Bucket: `application-files` (private)
- Yol formatı: `{user_id}/{application_id}/{timestamp}_{filename}`
- Önizleme: 1 saatlik signed URL ile yeni sekmede açılır

---

## Yapılabilecek Geliştirmeler

- [ ] E-posta hatırlatıcı sistemi (Edge Function + cron)
- [ ] CV sayfasına Projeler/Portföy bölümü
- [ ] Takvimde haftalık görünüm
- [ ] Başvuru listesinde başvuru tarihi sütunu
- [ ] Dashboard'a grafik/istatistik (Recharts)
- [ ] Dosya önizleme embed (drawer içinde)
