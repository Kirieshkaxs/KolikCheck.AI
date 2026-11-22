# ════════════════════════════════════════════════════════════════════
#  KolikCheck.AI — Развёртывание на Google Cloud Run
#  Запуск:  powershell -ExecutionPolicy Bypass -File deploy-cloud-run.ps1
# ═════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# ─── Настройки ───────────────────────────────────────────────────────
$PROJECT_ID       = Read-Host "Введите ID вашего проекта Google Cloud (например: kolikcheck-ai-123)"
$REGION           = "europe-west3"      # регион ближе к Казахстану / Европе
$SERVICE_NAME     = "kolikcheck-ai"
$IMAGE_NAME       = "kolikcheck-ai"
$REPO_NAME        = "kolikcheck-repo"   # Artifact Registry репозиторий
$PORT             = 8080
$CPU              = "0.1"      # минимальный vCPU (экономичный режим)
$MEMORY           = "512Mi"    # 512 МБ ОЗУ

Write-Host "`n🚀 Начинаем развёртывание KolikCheck.AI на Google Cloud Run" -ForegroundColor Cyan
Write-Host "   Проект: $PROJECT_ID | Регион: $REGION | Сервис: $SERVICE_NAME" -ForegroundColor Gray

# ─── 1. Проверка инструментов ────────────────────────────────────────
Write-Host "`n[1/6] Проверка инструментов (gcloud)..." -ForegroundColor Yellow

$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
    Write-Warning "gcloud CLI не найден. Установите Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
}
Write-Host "   gcloud CLI found" -ForegroundColor Green

# ─── 2. Аутентификация ───────────────────────────────────────────────
Write-Host "`n[2/6] Аутентификация в Google Cloud..." -ForegroundColor Yellow
gcloud auth login --brief
if ($LASTEXITCODE -ne 0) { exit 1 }

# ─── 3. Выбор проекта ────────────────────────────────────────────────
Write-Host "`n[3/6] Настройка проекта: $PROJECT_ID" -ForegroundColor Yellow
gcloud config set project $PROJECT_ID
if ($LASTEXITCODE -ne 0) { exit 1 }

# ─── 4. Включение необходимых API ────────────────────────────────────
Write-Host "`n[4/6] Включение Google Cloud API..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "   ✓ API включены" -ForegroundColor Green

# ─── 5. Создание репозитория Artifact Registry ───────────────────────
Write-Host "`n[5/6] Создание репозитория Artifact Registry..." -ForegroundColor Yellow
gcloud artifacts repositories describe $REPO_NAME --location=$REGION 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Docker repo for KolikCheck.AI"
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
Write-Host "   ✓ Репозиторий готов ($REPO_NAME)" -ForegroundColor Green


# ─── 6. Сборка и развёртывание через Cloud Build ─────────────────────
Write-Host "`n[6/6] Сборка образа и развёртывание на Cloud Run..." -ForegroundColor Yellow
$IMAGE_URI = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/${IMAGE_NAME}:latest"

gcloud builds submit --tag $IMAGE_URI --ignore-file (Join-Path $PSScriptRoot ".dockerignore") $PSScriptRoot
if ($LASTEXITCODE -ne 0) { exit 1 }

# Читаем GEMINI_API_KEY из server/.env для передачи в Cloud Run
$ENV_FILE = Join-Path $PSScriptRoot "server\.env"
$GEMINI_KEY = ""
if (Test-Path $ENV_FILE) {
    $lines = Get-Content $ENV_FILE
    foreach ($line in $lines) {
        if ($line -match "^GEMINI_API_KEY=(.+)$") {
            $GEMINI_KEY = $matches[1]
            break
        }
    }
}

if (-not $GEMINI_KEY -or $GEMINI_KEY -eq "your_gemini_api_key_here") {
    Write-Warning "GEMINI_API_KEY не найден или не заполнен в server/.env"
    $GEMINI_KEY = Read-Host "Введите ваш GEMINI_API_KEY (https://aistudio.google.com/apikey)"
}

gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_URI `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port $PORT `
    --update-env-vars "GEMINI_API_KEY=$GEMINI_KEY" `
    --memory $MEMORY `
    --cpu $CPU `
    --concurrency 1 `
    --execution-environment gen1 `
    --cpu-throttling `
    --max-instances 10 `
    --timeout 300s
if ($LASTEXITCODE -ne 0) { exit 1 }

# ─── Готово ──────────────────────────────────────────────────────────
$SERVICE_URL = (gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n═════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Развёртывание завершено!" -ForegroundColor Green
Write-Host "  🌐 Ваш сайт доступен по адресу: $SERVICE_URL" -ForegroundColor Green
Write-Host "  🔑 Регион: $REGION | Сервис: $SERVICE_NAME" -ForegroundColor Gray
Write-Host "═════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "Если нужно обновить сайт позже — просто снова запустите этот скрипт." -ForegroundColor Gray
Write-Host "Логи: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/logs?project=$PROJECT_ID" -ForegroundColor Gray
