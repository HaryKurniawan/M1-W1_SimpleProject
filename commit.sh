#!/bin/bash

# ═══════════════════════════════════════════════
#  📝 Interactive Commit Script
#  Format: type(scope): description
# ═══════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════"
echo "  📝 Interactive Commit"
echo "═══════════════════════════════════════════════"
echo ""

# Daftar tipe commit
types=(
  "feat"
  "fix"
  "update"
  "docs"
  "style"
  "refactor"
  "test"
  "chore"
  "perf"
  "ci"
  "build"
  "revert"
)

descriptions=(
  "Fitur baru"
  "Perbaikan bug"
  "Update/perubahan"
  "Dokumentasi"
  "Formatting (tanpa perubahan kode)"
  "Refactoring kode"
  "Menambah test"
  "Maintenance"
  "Perbaikan performa"
  "CI/CD changes"
  "Build system"
  "Revert commit"
)

# Tampilkan pilihan
echo "📋 Pilih tipe commit:"
echo ""
for i in "${!types[@]}"; do
  printf "  %2d) %-10s - %s\n" $((i+1)) "${types[$i]}" "${descriptions[$i]}"
done
echo ""

# Input tipe
while true; do
  read -p "Pilih nomor [1-${#types[@]}]: " choice
  if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#types[@]}" ]; then
    selected_type="${types[$((choice-1))]}"
    break
  else
    echo "⚠️  Pilihan tidak valid! Masukkan angka 1-${#types[@]}"
  fi
done

echo ""

# Input scope (opsional)
read -p "Scope (opsional, tekan Enter untuk skip): " scope

# Input deskripsi
while true; do
  read -p "Deskripsi commit: " description
  if [ -n "$description" ]; then
    break
  else
    echo "⚠️  Deskripsi tidak boleh kosong!"
  fi
done

# Format commit message
if [ -n "$scope" ]; then
  commit_msg="${selected_type}(${scope}): ${description}"
else
  commit_msg="${selected_type}: ${description}"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Commit message: $commit_msg"
echo "═══════════════════════════════════════════════"
echo ""

# Konfirmasi
read -p "Lanjutkan commit? [Y/n]: " confirm
if [[ "$confirm" =~ ^[Nn]$ ]]; then
  echo "❌ Commit dibatalkan."
  exit 0
fi

# Jalankan git commit
git commit -m "$commit_msg"

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 Commit berhasil!"
else
  echo ""
  echo "❌ Commit gagal!"
  exit 1
fi
