[PillPal_device.txt](https://github.com/user-attachments/files/27472339/PillPal_device.txt)
import network, time, json, ntptime, M5
from M5 import *
from hardware import RGB, I2C, Pin
from unit import DLightUnit
import requests2

# WiFi & API Configuration
WIFI = [{"ssid": "FMagic5", "password": "fhy123454321"}]
API_KEY = "sb_publishable_SLp_wg98TRukYnhYcon7Xw_YAo2-kaA"
ENDPOINTS = {
 "reminders": "https://lzzjyxyojvsghqihlozd.supabase.co/rest/v1/medication_reminders",
 "events": "https://lzzjyxyojvsghqihlozd.supabase.co/rest/v1/pill_event",
 "bindings": "https://lzzjyxyojvsghqihlozd.supabase.co/rest/v1/device_bindings"
}
DEVICE_ID, USER_ID = "demo_device_01", None
LED_PIN, LED_COUNT = 0, 30
OPEN_LUX, CLOSE_LUX, LUX_CHECK_INTERVAL_MS = 25, 10, 200
box_open, last_lux_check_ms = False, 0

# Speaker constants
SPEAKER_VOLUME = 250
SPEAKER_FREQ = 2000
SPEAKER_DURATION_MS = 150 # Short beep per flash

def http_headers():
    return {"apikey": API_KEY, "Authorization": "Bearer " + API_KEY}

def supabase_get_bound_user_id():
    url = ENDPOINTS["bindings"] + "?select=user_id&device_id=eq.%s&limit=1" % DEVICE_ID
    try:
        r = requests2.get(url, headers=http_headers()); d = json.loads(r.text)
        return d[0]["user_id"] if d and "user_id" in d[0] else None
    except: return None

def supabase_is_reminder_active(reminder_id):
    # New logic: Poll the database to see if app confirmed the med
    url = ENDPOINTS["reminders"] + "?select=is_active&id=eq.%s&limit=1" % reminder_id
    try:
        r = requests2.get(url, headers=http_headers()); d = json.loads(r.text)
        # Returns True if active, False if already confirmed by App
        return d[0]["is_active"] if d else False
    except: return True 

def connect_wifi_loop():
    wlan = network.WLAN(network.STA_IF); wlan.active(True)
    while not wlan.isconnected():
        for c in WIFI:
            wlan.connect(c["ssid"], c.get("password", ""))
            t0 = time.time()
            while time.time()-t0<10:
                if wlan.isconnected(): return
                time.sleep(0.5)
        time.sleep(5)

def sync_time(): 
    try: ntptime.host = "time.cloudflare.com"; ntptime.settime()
    except: pass

def supabase_fetch_reminders(user_id):
    # Fetch all active reminders for the user
    url = (ENDPOINTS["reminders"] + "?select=id,remind_time,memo,is_active"
    + "&user_id=eq.%s&is_active=eq.true&order=remind_time.asc" % user_id)
    try:
        r = requests2.get(url, headers=http_headers())
        return [{"id": x["id"], "time": x.get("remind_time","")[:5], "memo": x.get("memo","")}
        for x in json.loads(r.text) if x.get("remind_time")]
    except: return []

def supabase_confirm_event(reminder_id, remind_hhmm, memo=""):
    t = time.gmtime(time.time())
    data = {
        "user_id": USER_ID,
        "event_time": "%04d-%02d-%02dT%02d:%02d:%02dZ" % tuple(t[:6]),
        "voltage": 3.7,
        "event_type": "confirmed_by_device",
        "memo": "confirmed reminder %s at %s %s" % (reminder_id, remind_hhmm, memo)
    }
    url = ENDPOINTS["events"]
    try:
        requests2.post(
            url, headers=dict(list(http_headers().items()) + [
            ("Content-Type", "application/json"),
            ("Prefer", "return=representation")
            ]), data=json.dumps(data)
        )
    except: pass

def supabase_deactivate_reminder(reminder_id):
    url = ENDPOINTS["reminders"] + "?id=eq.%s&user_id=eq.%s" % (reminder_id, USER_ID)
    try:
        requests2.patch(url, headers=dict(list(http_headers().items()) + [
            ("Content-Type", "application/json"),
            ("Prefer", "return=representation")
        ]), data=json.dumps({"is_active": False}))
    except: pass

def now_hhmm(): 
    t = time.time() + 8*3600 # UTC+8
    lt = time.localtime(t)
    return "%02d:%02d"%(lt[3],lt[4])

def hhmm_to_minutes(hhmm): 
    if not hhmm or len(hhmm) < 5: return None
    return int(hhmm[:2])*60+int(hhmm[3:5])

def find_all_due_or_past(reminders, current_hhmm):
    # Logic: Find all active reminders where set_time <= current_time
    now_m = hhmm_to_minutes(current_hhmm)
    if now_m is None: return []
    return [r for r in reminders if hhmm_to_minutes(r["time"]) <= now_m]

def red_flash_and_beep():
    rgb.fill_color(0xcc0000)
    Speaker.setVolume(SPEAKER_VOLUME)
    Speaker.setPA(True)
    Speaker.tone(SPEAKER_FREQ, SPEAKER_DURATION_MS)
    time.sleep(SPEAKER_DURATION_MS/1000)
    rgb.fill_color(0)
    time.sleep(0.2)

def green_chase():
    for i in range(LED_COUNT): rgb.fill_color(0); rgb.set_color(i,0x00ff00); time.sleep_ms(50)
    rgb.fill_color(0)

def read_lux_edge():
    global box_open, last_lux_check_ms
    if time.ticks_diff(time.ticks_ms(), last_lux_check_ms)<LUX_CHECK_INTERVAL_MS:
        return None, box_open, False
    last_lux_check_ms = time.ticks_ms()
    lux = None
    try: lux = dlight.get_lux()
    except: pass
    open_edge = False
    if not box_open and (lux is not None and lux > OPEN_LUX): box_open, open_edge = True, True
    elif box_open and (lux is not None and lux < CLOSE_LUX): box_open=False
    return lux, box_open, open_edge

def main():
    global rgb, i2c0, dlight, USER_ID
    M5.begin(); Widgets.setRotation(0)
    rgb=RGB(io=LED_PIN, n=LED_COUNT, type="SK6812"); rgb.set_brightness(15); rgb.fill_color(0)
    i2c0=I2C(0,scl=Pin(10),sda=Pin(9),freq=100000); time.sleep_ms(200); dlight=DLightUnit(i2c0)
    Widgets.fillScreen(0); Widgets.Label("WiFi: connecting...",10,10,1.2,0xFFFFFF)
    connect_wifi_loop(); sync_time()
    Speaker.end(); Speaker.setVolume(SPEAKER_VOLUME); Speaker.setPA(True)
 
    # Binding Loop
    while not USER_ID:
        USER_ID = supabase_get_bound_user_id()
        if not USER_ID:
            Widgets.fillScreen(0); Widgets.Label("NOT BOUND",10,10,1.5,0x00AAFF)
            Widgets.Label("device_id:",10,40,1,0xFFFFFF); Widgets.Label(DEVICE_ID,10,60,1,0xFFFFFF)
            time.sleep(2)
 
    reminders = supabase_fetch_reminders(USER_ID); last_fetch = time.time()
    ringing, due, ring_start, last_slow_flash_ts = False, None, 0, 0
    due_queue = []
 
    while True:
        M5.update()
        hhmm = now_hhmm()
 
        # Fetch from DB every 10s
        if time.time()-last_fetch >= 10:
            reminders = supabase_fetch_reminders(USER_ID)
            last_fetch = time.time()
            due_queue = find_all_due_or_past(reminders, hhmm)
 
        if not ringing and due_queue:
            due = due_queue[0]; ringing = True; ring_start = time.time(); last_slow_flash_ts = 0
 
        if ringing and due:
            # Refresh screen with pill info
            Widgets.fillScreen(0); Widgets.Label("TAKE PILL",10,10,1.5,0xFF0000)
            Widgets.Label("%s %s"%(due["time"],due["memo"]),10,40,1.2,0xFFFFFF)
            
            # --- CRITICAL: Check if App already confirmed this reminder ---
            if not supabase_is_reminder_active(due["id"]):
                green_chase()
                ringing = False; due = None
                reminders = supabase_fetch_reminders(USER_ID)
                continue # Jump to next loop iteration
            
            # Original Alarm Logic
            elapsed = time.time()-ring_start
            if elapsed <= 30: 
                red_flash_and_beep()
            else:
                # Slow flash after 30s
                now_ts = time.time()
                if now_ts-last_slow_flash_ts >= 3.0:
                    last_slow_flash_ts = now_ts; red_flash_and_beep()
                else:
                    rgb.fill_color(0); time.sleep(0.05)
            
            # Check Hardware opening
            lux, is_open, open_edge = read_lux_edge()
            if open_edge:
                green_chase()
                supabase_confirm_event(due["id"], due["time"], due.get("memo",""))
                supabase_deactivate_reminder(due["id"])
                ringing = False; due = None 
                reminders = supabase_fetch_reminders(USER_ID)
        else:
            # Idle Display
            rgb.fill_color(0)
            Widgets.fillScreen(0); Widgets.Label("Time: "+hhmm,10,10,1.2,0xFFFFFF)
            if not reminders:
                Widgets.Label("No reminders",10,40,1,0xAAAAAA)
            else:
                Widgets.Label("Next: %s"%reminders[0]["time"],10,40,1,0x00FF00)
            time.sleep(0.1)

if __name__ == "__main__":
    main()
