# Aegis Network IDS — Native Stateful Intrusion Detection System

Aegis Network IDS is a high-performance, native desktop Network Intrusion Detection System (NIDS) built for real-time packet capture, 5-tuple stateful session analysis, deterministic threat heuristic evaluation, and transparent anomaly scoring.

---

## 🏛️ System Architecture

```text
                  [ Physical / Virtual Network Adapter ]
                                    │
                                    ▼
                       [ Native libpcap / Npcap ]
                                    │
                                    ▼
                       [ Defensive Packet Decoder ]
                     (Ethernet -> IPv4 -> TCP/UDP/ICMP)
                                    │
                                    ▼
                     [ Stateful Flow & Host Tracker ]
               (5-Tuple Session State + 10s Sliding Window)
                                    │
                                    ▼
                   [ Deterministic Detection Engine ]
             (DoS, Probe, R2L, U2R Proxy, Anomaly Z-Score)
                                    │
                                    ▼
                     [ Electron IPC contextBridge ]
                                    │
                                    ▼
                  [ Next.js / React SOC Dashboard ]
```

---

## 🛡️ Threat Detection Heuristics & Deterministic Rules

All classification decisions are deterministic, fully auditable, and based on real-time protocol headers and flow metrics:

### 1. Denial of Service (DoS)
- **Volumetric Rate Flood**: Triggers when source packet rate exceeds `>= 75.0 packets/second` or `>= 60 packets` within the 10-second sliding window.
- **TCP SYN Flood**: Triggers when source emits `>= 12 SYN packets` with a SYN-to-ACK ratio `>= 2.50` (unanswered half-open connection attempts).
- **Bandwidth Exhaustion**: Triggers when continuous throughput to a single endpoint exceeds `>= 400.0 KB/second`.

### 2. Network Probing & Reconnaissance (Probe)
- **Vertical Port Scan**: Triggers when a single source contacts `>= 6 distinct destination ports` on a target host within the sliding window.
- **Horizontal Host Sweep**: Triggers when a source queries `>= 5 distinct host IP addresses` across network subnets.
- **Stealth Half-Open Probing**: Identifies bare SYN packets dispatched across `>= 4 destination ports` without handshake completion.

### 3. Remote-to-Local Unauthorized Access (R2L)
- **Credential Brute-Force**: Triggers when a source initiates `>= 3 connection attempts` against sensitive authentication ports (`SSH 22`, `FTP 21`, `Telnet 23`, `RDP 3389`, `SMB 445`, `MySQL 3306`, `Postgres 5432`, `VNC 5900`) accompanied by `>= 2 connection resets (RST)` or rapid terminations.

### 4. User-to-Root (U2R) Proxy Signal
- **Transparent Limitation**: Network packets cannot directly inspect local OS kernel or process privilege escalation (e.g., setuid execution, kernel exploits, or local sudo abuse), as those events occur entirely inside host syscalls and process namespaces.
- **Network Proxy Heuristic**: Implements a best-effort proxy signal detecting anomalous sustained data bursts (`>= 35.0 KB`) on administrative management channels (`22`, `3389`, `445`, `8443`) following initial access.
- **Operational Recommendation**: Labeled transparently as a proxy signal in all telemetry; host audit logs (`auditd`, `Sysmon`) are recommended to verify local privilege state.

---

## ⚡ Global Keyboard Shortcut

Aegis registers a system-wide global shortcut to quickly toggle live packet capture:
- **Windows / Linux**: `Ctrl + Shift + A`
- **macOS**: `Command + Shift + A`

When pressed, Aegis toggles monitoring between Standby and Active state (if a valid network adapter is available). The shortcut is automatically unregistered when the application closes.

---

## 🔒 Security & Privacy Guarantees

1. **100% On-Device Processing**: No raw packet data, protocol metadata, or telemetry ever leaves your machine. Zero external API dependencies for detection.
2. **Zero Synthetic Packet Fallback in Production**: When capture cannot start (e.g., missing Npcap/libpcap driver or standard user privileges), Aegis cleanly displays `CAPTURE UNAVAILABLE` with diagnostic instructions rather than fabricating fake packets.
3. **Defensive Parsing**: The packet decoder bounds-checks every byte offset with defensive `try/catch` wrapping to prevent buffer overrun crashes from malformed or truncated frames.
4. **Bounded Memory Eviction**: Stateful flows idle for longer than 60 seconds are automatically evicted from memory. Flow capacity is capped at 10,000 active sessions with LRU pruning.
5. **Isolated IPC Architecture**: Electron enforces `contextIsolation: true`, `nodeIntegration: false`, and a strict `contextBridge`.

---

## 🚀 Installation & Prerequisites

### Prerequisites by Operating System:
- **Windows**:
  - Install [Npcap](https://npcap.com/) (ensure "Install Npcap in WinPcap API-compatible Mode" is checked).
  - Run the application with Administrator privileges to enable promiscuous mode capture.
- **Linux**:
  - Install `libpcap`:
    ```bash
    sudo apt-get install libpcap-dev
    ```
  - Grant raw socket capabilities to Node/Electron:
    ```bash
    sudo setcap cap_net_raw,cap_net_admin=eip $(which node)
    ```
- **macOS**:
  - Raw packet capture requires root privileges (`sudo`) or `bpf` device permissions:
    ```bash
    sudo chown $USER /dev/bpf*
    ```

---

## 📦 Building & Testing

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (22 unit & integration tests)
npm test

# 3. Run desktop app in development
npm run electron:dev

# 4. Package standalone distribution builds
npm run electron:build

# Target-specific packaging commands:
npm run dist:win    # Windows NSIS Installer (Aegis-Network-IDS-Setup.exe)
npm run dist:mac    # macOS DMG (Aegis-Network-IDS.dmg)
npm run dist:linux  # Linux AppImage (Aegis-Network-IDS.AppImage)
```

Packaging outputs will be placed in the `/release-builds` directory.

---

## 🌐 GitHub Repository

The official GitHub repository URL will be added after the project is published.

To initialize and publish this codebase to your own GitHub repository:

```bash
git init
git add .
git commit -m "Initial production release"
git branch -M main
git remote add origin <YOUR_REAL_GITHUB_REPOSITORY_URL>
git push -u origin main
```

*(Note: Replace `<YOUR_REAL_GITHUB_REPOSITORY_URL>` with your actual repository URL).*

---

## 🚀 Publishing a Release

Follow these steps to produce distribution artifacts and configure real download links:

### Step 1: Create GitHub Repository
Create a new repository on your GitHub account or organization.

### Step 2: Push Project
Push this codebase to your newly created repository using the instructions above.

### Step 3: Run / Build Desktop Installers
Compile the standalone desktop binaries locally or via the included GitHub Actions workflow:
```bash
npm run electron:build
```
This generates the target installer binaries inside `/release-builds`:
- `Aegis-Network-IDS-Setup.exe` (Windows)
- `Aegis-Network-IDS.dmg` (macOS)
- `Aegis-Network-IDS.AppImage` (Linux)

### Step 4: Create a GitHub Release
On GitHub, navigate to **Releases** → **Draft a new release**, and specify a version tag (e.g., `v1.0.0`).

### Step 5: Upload Release Assets
Attach the compiled installer files to the release:
```text
GitHub Repository
        ↓
Releases
        ↓
v1.0.0
        ├── Aegis-Network-IDS-Setup.exe
        ├── Aegis-Network-IDS.dmg
        └── Aegis-Network-IDS.AppImage
```

### Step 6: Copy Asset URLs
Copy the direct download URLs for each uploaded artifact from the published release.

### Step 7: Configure Download URLs
Configure the environment variables in your deployment or `.env.local`:
```env
NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL="https://github.com/<OWNER>/<REPO>/releases/download/v1.0.0/Aegis-Network-IDS-Setup.exe"
NEXT_PUBLIC_MACOS_DOWNLOAD_URL="https://github.com/<OWNER>/<REPO>/releases/download/v1.0.0/Aegis-Network-IDS.dmg"
NEXT_PUBLIC_LINUX_DOWNLOAD_URL="https://github.com/<OWNER>/<REPO>/releases/download/v1.0.0/Aegis-Network-IDS.AppImage"
```

### Step 8: Verify Dashboard Download Buttons
Open the dashboard and open **Download Desktop App**. The modal will automatically display active download buttons pointing to your real release binaries instead of the default **Coming Soon** standby state.

---

## 🛡️ Independent Local Operation

Aegis is completely self-contained and operates 100% on-device:
- **No Remote Telemetry**: Zero packet information, protocol metadata, or payload bytes are uploaded.
- **Zero GitHub Runtime Dependency**: GitHub is exclusively used for source hosting, release distribution, and CI/CD builds. The network capture, flow tracker, and threat detection engines run strictly within the local desktop process.

