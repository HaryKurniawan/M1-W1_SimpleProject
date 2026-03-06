# ESLint Configuration Guide

Dokumentasi ini menjelaskan konfigurasi **ESLint** yang digunakan dalam proyek ini.

Proyek ini menggunakan **ESLint** untuk menjaga kualitas kode, mencegah bug umum, serta memastikan konsistensi penulisan kode pada aplikasi berbasis **React** dan **TypeScript**.

---

# Tools yang Digunakan

Konfigurasi linting pada proyek ini menggunakan beberapa plugin berikut:

- **ESLint** → alat utama untuk static code analysis
- **TypeScript ESLint** → rule khusus TypeScript
- **React ESLint Plugin** → rule khusus React
- **React Hooks ESLint Plugin** → validasi penggunaan React Hooks
- **JSX Accessibility Plugin** → memastikan aksesibilitas komponen
- **Import Plugin** → mengatur struktur import
- **Security Plugin** → mendeteksi potensi security issue
- **No Unsanitized Plugin** → mencegah potensi XSS

---

# Extends Configuration

Bagian `extends` digunakan untuk mengambil kumpulan rule yang telah disediakan oleh plugin atau preset tertentu.

### eslint:recommended

Mengaktifkan rule dasar JavaScript untuk mencegah bug umum seperti:

- penggunaan variabel yang tidak dideklarasikan
- unreachable code
- duplicate case dalam switch

---

### typescript-eslint/recommended

Mengaktifkan rule khusus TypeScript seperti:

- mendeteksi variabel TypeScript yang tidak digunakan
- menghindari penggunaan type `any`

Tujuannya untuk menjaga kualitas type system.

---

### react/recommended

Mengaktifkan best practice untuk React seperti:

- memastikan JSX valid
- validasi penggunaan props
- validasi struktur komponen React

---

### react-hooks/recommended

Memastikan penggunaan React Hooks sesuai aturan React.

Contoh aturan penting:

- Hooks hanya boleh dipanggil di level teratas function component
- Hooks tidak boleh dipanggil di dalam kondisi atau loop

---

### jsx-a11y/recommended

Plugin ini memastikan komponen React memenuhi standar accessibility.

Contoh aturan:

- setiap `<img>` harus memiliki atribut `alt`
- anchor harus memiliki link valid
- elemen interaktif harus memiliki keyboard support

---

### import/recommended

Digunakan untuk memvalidasi penggunaan import/export module.

Contohnya:

- mencegah duplicate import
- memastikan module dapat ditemukan
- menjaga konsistensi struktur import

---

### security/recommended

Plugin ini membantu mendeteksi potensi kerentanan keamanan seperti:

- object injection
- penggunaan fungsi yang berpotensi berbahaya

---

### no-unsanitized/recommended

Digunakan untuk mencegah potensi **XSS (Cross-Site Scripting)** dengan memastikan HTML yang di-render sudah disanitasi.

---

# Custom Rules

Selain rule dari preset, proyek ini juga menambahkan beberapa rule tambahan untuk menjaga kualitas kode.

---

## eqeqeq

Memaksa penggunaan strict equality (`===`) daripada `==`.

Tujuan:
mencegah bug akibat type coercion pada JavaScript.

Contoh:

Salah

```
if (value == 5)
```

Benar

```
if (value === 5)
```

---

## no-console

Mencegah penggunaan `console.log` pada kode production.

Namun masih mengizinkan:

- console.warn
- console.error

Tujuannya agar log debugging tidak masuk ke production.

---

## no-debugger

Melarang penggunaan statement `debugger`.

Jika terdapat debugger pada production code, aplikasi dapat berhenti saat debugging.

---

## no-duplicate-imports

Mencegah import module yang sama lebih dari sekali.

Salah:

```
import React from "react"
import { useState } from "react"
```

Benar:

```
import React, { useState } from "react"
```

---

## prefer-const

Memastikan penggunaan `const` jika variabel tidak berubah nilainya.

Tujuannya untuk meningkatkan predictability dan keamanan kode.

---

## no-var

Melarang penggunaan `var`.

Karena `var` memiliki perilaku scope yang dapat menyebabkan bug.

Disarankan menggunakan:

- `let`
- `const`

---

## react/self-closing-comp

Mengubah komponen kosong menjadi self-closing tag.

Contoh:

Salah

```
<Component></Component>
```

Benar

```
<Component />
```

---

## react/jsx-no-useless-fragment

Mencegah penggunaan fragment (`<> </>`) yang tidak diperlukan.

Fragment hanya digunakan ketika terdapat lebih dari satu elemen.

---

## react/jsx-key

Memastikan setiap elemen dalam list React memiliki `key`.

Contoh:

Salah

```
items.map(item => <li>{item}</li>)
```

Benar

```
items.map(item => <li key={item}>{item}</li>)
```

---

## react-hooks/rules-of-hooks

Memastikan React Hooks digunakan sesuai aturan React.

Hooks hanya boleh digunakan:

- di function component
- di custom hook
- pada top level function

---

## react-hooks/exhaustive-deps

Memastikan dependency pada `useEffect`, `useMemo`, dan hook lainnya sudah lengkap.

Hal ini membantu mencegah bug akibat state yang tidak terupdate.

---

## import/order

Mengatur urutan import agar kode lebih konsisten dan mudah dibaca.

Urutan yang direkomendasikan:

1. builtin modules
2. external packages
3. internal modules

Contoh:

```
import fs from "fs"

import React from "react"

import Button from "@/components/Button"
```

---

# Kesimpulan

Konfigurasi ESLint ini dirancang untuk:

- meningkatkan kualitas kode
- mencegah bug umum
- menjaga konsistensi coding style
- memastikan keamanan aplikasi
- memastikan best practice React dan TypeScript

Konfigurasi ini mengikuti praktik yang umum digunakan pada proyek React modern di industri.
