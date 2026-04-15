
# Solar Pump Web HMI

This project is a beginner-friendly React web HMI inspired by your attached panel screen. It supports:

- Login page with Supabase authentication
- User profile table in database
- Role-based restriction for pump ON/OFF
- Click any value to open its trend popup
- Live data read from MQTT over WebSocket
- Pump ON/OFF write commands over MQTT
- Trend/data log storage in Supabase
- Free deployment on Vercel
- Demo mode when real hardware is not connected

## 1. What you need

- Node.js 20 or newer
- A GSM router or MQTT broker that supports WebSocket
- A free Supabase account
- A free Vercel account

## 2. Install and run locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal, usually `http://localhost:5173`.

## 3. Environment setup

Copy `.env.example` to `.env` and fill in your values.

```bash
copy .env.example .env
```

Use these variables:

- `VITE_MQTT_URL`: WebSocket MQTT URL, example `wss://broker.emqx.io:8084/mqtt`
- `VITE_MQTT_USERNAME`: MQTT username, if required
- `VITE_MQTT_PASSWORD`: MQTT password, if required
- `VITE_MQTT_CLIENT_ID`: Unique client id for this HMI
- `VITE_MQTT_BASE_TOPIC`: Base topic like `plant/solar-pump/site-01`
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon key
- `VITE_ENABLE_DEMO_MODE`: `true` or `false`

## 4. MQTT payload format

Publish live data to:

`<base-topic>/telemetry/live`

Example:

```json
{
  "pump1": {
    "command": true,
    "healthy": true,
    "running": true
  },
  "pump2": {
    "command": false,
    "healthy": true,
    "running": false
  },
  "metrics": {
    "inverterPowerKw": 25.4,
    "solarRadiation": 712.8,
    "pump1Head": 18.5,
    "pump2Head": 17.2,
    "pump1Flow": 67.8,
    "pump2Flow": 62.1,
    "ambientTemp": 31.4
  },
  "totals": {
    "totalPowerMwh": 0.03,
    "totalFlowM3": 0.13
  }
}
```

The web HMI writes commands to:

- `<base-topic>/command/pump1`
- `<base-topic>/command/pump2`

Example command:

```json
{
  "pump": 1,
  "command": true,
  "source": "web-hmi",
  "timestamp": "2026-04-14T12:00:00.000Z"
}
```

## 5. Supabase setup for trending

1. Create a free project in Supabase.
2. Open SQL Editor.
3. Paste the content of [supabase/schema.sql](./supabase/schema.sql) and run it.
4. Go to Project Settings -> API.
5. Copy Project URL and anon public key into `.env`.
6. Open Authentication -> Users.
7. Create your first user manually with email and password.

This app stores one trend row roughly every 60 seconds while data is updating.

## 5A. How login works

- The login page uses Supabase Auth email/password login.
- After a user is created in Supabase Auth, the `app_users` table stores profile data.
- The `app_users` table is linked to `auth.users` with `user_id`.
- Trend table access is limited to logged-in users.
- Pump control is allowed only for `admin` and `engineer` roles.
- `operator` can log in and monitor, but cannot switch pumps.

Suggested first user:

- Email: `admin@plant.com`
- Password: choose your own strong password
- Optional metadata: `full_name`, `role`, `site_name`

If you want control access, set the `role` in `app_users` to:

- `admin`
- `engineer`

If you want monitor-only access, set:

- `operator`

## 6. Vercel deployment

1. Push this project to GitHub.
2. Create a free Vercel account and import the GitHub repository.
3. Framework preset: `Vite`
4. Add the same variables from `.env` into Vercel Project Settings -> Environment Variables.
5. Deploy.

After deploy, your HMI will be live on a free Vercel URL.

## 7. Important note about MQTT security

Because this is a frontend web app, browser environment variables are not secret. For a beginner project this is okay if:

- your MQTT broker uses limited-permission user accounts
- your topics are separated per site
- you do not reuse admin credentials

If later you want stronger security, we can add a backend API layer.

## 8. Beginner roadmap

Follow this order:

1. Run the project in demo mode and check the layout.
2. Create Supabase and enable data log.
3. Connect MQTT broker over WebSocket.
4. Map your PLC/router data into the JSON payload format.
5. Deploy to Vercel.

## 9. Project structure

- `src/App.jsx`: auth gate and app entry
- `src/components/LoginPage.jsx`: login screen
- `src/components/HmiDashboard.jsx`: full HMI screen
- `src/components/TrendModal.jsx`: trend popup for a selected value
- `src/components/PumpPanel.jsx`: pump control block
- `src/hooks/useHmiController.js`: MQTT + Supabase logic
- `src/lib/mqttService.js`: MQTT connection helper
- `supabase/schema.sql`: trend table SQL

## 10. Next improvements

- Add login/authentication
- Add charts for hourly and daily trends
- Add alarm history
- Add device status page
- Add mobile operator signal and router health
