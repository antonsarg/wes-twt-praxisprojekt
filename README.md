# Smart Notes

Smart Notes ist eine minimalistische Notizanwendung, die im Rahmen der Lehrveranstaltung "Trends in Webtechnologien" in dem Masterstudiengang Web Engineering & IT Solutions (WES) im Sommersemester 2026 erstellt wurde. Die Anwendung ermöglicht das Erstellen, Bearbeiten, Löschen und Suchen/Filtern von Notizen, unterstützt durch eine lokale KI-Integration (Ollama) für automatische Titelgenerierung, Tagging und monatliche Zusammenfassungen.

---

## Tech-Stack

* **Backend**: Go
* **Frontend**: Angular
* **Styling**: Tailwind CSS
* **Datenbank**: PostgreSQL
* **KI**: Ollama (lokal gehostet)
* **Infrastruktur**: Docker

---

## Voraussetzungen

Folgende Werkzeuge müssen auf dem System installiert sein:

* **Docker**: Für die Containerisierung der gesamten Infrastruktur.
* **Ollama**: Zum lokalen Ausführen eines Large Language Models (LLMs).

---

## Setup und Installation

Folge diesen Schritten, um das Projekt lokal aufzusetzen:

### 1. Repository klonen
Navigiere in dein Arbeitsverzeichnis und klone das Projekt.

```bash
git clone https://gitlab.web.fh-kufstein.ac.at/sarganton.wes24/wes-twt-praxisprojekt.git
```

### 2. Umgebungsvariablen konfigurieren
Das Projekt benötigt eine .env-Datei im Hauptverzeichnis. Nutze die bereitgestellte Vorlage:

```bash
cp .env.example .env
```

Öffne die .env-Datei und passe die Werte bei Bedarf an. Die Standardkonfiguration sieht wie folgt aus:

```env
# Datenbank-Konfiguration
DATABASE_HOST=db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=postgres

# Sicherheit
JWT_SECRET=my_super_secret_jwt_key

# KI-Integration (Ollama)
# 'host.docker.internal' erlaubt dem Docker-Container den Zugriff auf den Host-Rechner
OLLAMA_URL=http://host.docker.internal:11434/api/generate
OLLAMA_MODEL=gemma3
```

---

## Das Projekt starten

Die gesamte Umgebung (Backend, Frontend, Datenbank) lässt sich mit einem Befehl starten:

```bash
docker compose up --build
```

Sobald die Container laufen, ist die Anwendung unter folgenden Adressen erreichbar:
* **Frontend**: http://localhost:4200 (oder der in der compose-Datei definierte Port)
* **Backend API**: http://localhost:8080
* **Adminer (DB Management)**: http://localhost:8081

---

## Datenbank-Seeding (Optional)

Um die Datenbank mit Testdaten (Benutzer und Beispiel-Notizen) zu füllen, führe folgenden Befehl aus, während die Container laufen:

```bash
docker compose exec backend go run cmd/seed/main.go
```

---

## Weitere Ressourcen

* [Reflexion](docs/reflexion.pdf)
* [Präsentation](/docs/praesentation.pdf)
* [Frontend Prompt](/docs/frontend_prompt.pdf)
* [Design (Google Stitch)](https://stitch.withgoogle.com/projects/12592699125218748584)