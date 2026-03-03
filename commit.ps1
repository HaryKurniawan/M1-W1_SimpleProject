# ═══════════════════════════════════════════════
#  📝 Interactive Commit Script (PowerShell)
#  Format: type(scope): description
# ═══════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📝 Interactive Commit" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Daftar tipe commit
$types = @(
  @{ Name = "feat";     Desc = "Fitur baru" }
  @{ Name = "fix";      Desc = "Perbaikan bug" }
  @{ Name = "update";   Desc = "Update/perubahan" }
  @{ Name = "docs";     Desc = "Dokumentasi" }
  @{ Name = "style";    Desc = "Formatting (tanpa perubahan kode)" }
  @{ Name = "refactor"; Desc = "Refactoring kode" }
  @{ Name = "test";     Desc = "Menambah test" }
  @{ Name = "chore";    Desc = "Maintenance" }
  @{ Name = "perf";     Desc = "Perbaikan performa" }
  @{ Name = "ci";       Desc = "CI/CD changes" }
  @{ Name = "build";    Desc = "Build system" }
  @{ Name = "revert";   Desc = "Revert commit" }
)

# Tampilkan pilihan
Write-Host "📋 Pilih tipe commit:" -ForegroundColor Yellow
Write-Host ""
for ($i = 0; $i -lt $types.Count; $i++) {
  $num = ($i + 1).ToString().PadLeft(2)
  $name = $types[$i].Name.PadRight(10)
  Write-Host "  $num) " -NoNewline -ForegroundColor Green
  Write-Host "$name" -NoNewline -ForegroundColor White
  Write-Host " - $($types[$i].Desc)" -ForegroundColor Gray
}
Write-Host ""

# Input tipe
do {
  $choice = Read-Host "Pilih nomor [1-$($types.Count)]"
  $choiceNum = 0
  $valid = [int]::TryParse($choice, [ref]$choiceNum) -and $choiceNum -ge 1 -and $choiceNum -le $types.Count
  if (-not $valid) {
    Write-Host "⚠️  Pilihan tidak valid! Masukkan angka 1-$($types.Count)" -ForegroundColor Red
  }
} while (-not $valid)

$selectedType = $types[$choiceNum - 1].Name
Write-Host ""

# Input scope (opsional)
$scope = Read-Host "Scope (opsional, tekan Enter untuk skip)"

# Input deskripsi
do {
  $description = Read-Host "Deskripsi commit"
  if ([string]::IsNullOrWhiteSpace($description)) {
    Write-Host "⚠️  Deskripsi tidak boleh kosong!" -ForegroundColor Red
  }
} while ([string]::IsNullOrWhiteSpace($description))

# Format commit message
if ([string]::IsNullOrWhiteSpace($scope)) {
  $commitMsg = "${selectedType}: ${description}"
} else {
  $commitMsg = "${selectedType}(${scope}): ${description}"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Commit message: $commitMsg" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Konfirmasi
$confirm = Read-Host "Lanjutkan commit? [Y/n]"
if ($confirm -eq "n" -or $confirm -eq "N") {
  Write-Host "❌ Commit dibatalkan." -ForegroundColor Red
  exit 0
}

# Jalankan git commit
git commit -m "$commitMsg"

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "🎉 Commit berhasil!" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "❌ Commit gagal!" -ForegroundColor Red
  exit 1
}
