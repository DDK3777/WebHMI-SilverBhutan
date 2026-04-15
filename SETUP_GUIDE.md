# Step-by-Step Guide

This guide is written for a beginner.

## Step 1: Open the project

Open this project folder in VS Code or any code editor.

## Step 2: Install Node modules

Open terminal in this project folder and run:

```bash
npm install
```

## Step 3: Start the HMI screen

Run:

```bash
npm run dev
```

Open the browser link shown in terminal.

If `.env` is not configured yet, the project will still work in demo mode.

## Step 4: Create `.env`

Create a file named `.env` in the project root.

You can copy from `.env.example`.

Example:

```env
VITE_MQTT_URL=wss://broker.emqx.io:8084/mqtt
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_MQTT_CLIENT_ID=solar-pump-hmi-web
VITE_MQTT_BASE_TOPIC=plant/solar-pump/site-01
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_DEMO_MODE=true
```

## Step 5: Prepare your MQTT side

Important:

- Browser HMI cannot use normal MQTT TCP port directly.
- Your GSM router or broker must support MQTT over WebSocket.
- Example WebSocket format is `ws://...` or `wss://...`

Your PLC, RTU, or gateway should publish JSON data to:

`plant/solar-pump/site-01/telemetry/live`

The web HMI sends ON/OFF commands to:

- `plant/solar-pump/site-01/command/pump1`
- `plant/solar-pump/site-01/command/pump2`

## Step 6: Create Supabase trending database

1. Go to Supabase and create a free project.
2. Open SQL Editor.
3. Open [supabase/schema.sql](/C:/Users/Dharmesh.katariya/Documents/New%20project/supabase/schema.sql).
4. Copy the SQL and run it.
5. Copy your Supabase URL and anon key into `.env`.

Now the HMI will save trend rows to cloud database and create the `app_users` table.

## Step 7: Create the first login user

1. Open Supabase dashboard.
2. Go to `Authentication`.
3. Open `Users`.
4. Click `Add user`.
5. Enter email and password.
6. Save.

After that, you can log in from the web login page.

## Step 7A: Set user role for control permission

Open `Table Editor` in Supabase and open `app_users`.

Set the `role` column like this:

- `admin` or `engineer`: can turn pump ON and OFF
- `operator`: view only, no pump control

## Step 8: Test with real data

When your MQTT JSON format matches the example in [README.md](/C:/Users/Dharmesh.katariya/Documents/New%20project/README.md), the values on the HMI screen will update automatically.

You can click on any live value card to open the trend popup for that value.

## Step 9: Deploy to Vercel

1. Create a GitHub repository.
2. Upload this full project.
3. Login to Vercel with your GitHub account.
4. Import the repository.
5. Select framework `Vite`.
6. Add all environment variables from `.env`.
7. Click deploy.

Your website will get a free public URL.

## Step 10: What to do if login does not work

Check these items:

- Supabase URL is correct
- Supabase anon key is correct
- User is created in Authentication -> Users
- Email and password are correct
- Browser console does not show blocked network request

## Step 11: What to do if MQTT does not connect

Check these items:

- MQTT URL must be WebSocket URL, not normal broker port
- Topic names must match exactly
- JSON field names must match exactly
- Router firewall must allow access
- Username and password must be correct
- Try public test broker first, then move to your real broker

## Step 12: Safe industrial note

Use this web HMI for monitoring and operator control only.

Do not depend on browser software for:

- emergency stop
- motor protection
- dry run protection
- overload trip
- interlocks

Those functions should stay in PLC, relay logic, VFD, or hardwired control panel.
