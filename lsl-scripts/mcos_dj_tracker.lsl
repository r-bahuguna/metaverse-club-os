// ============================================================================
// MCOS DJ Session Tracker — LSL Script for Simple Box Prim
//
// This script allows DJs to log in/out and send their session status
// to the Metaverse Club OS dashboard.
//
// SETUP:
//   1. Rez a simple box prim
//   2. Drop this script in
//   3. Set description to: https://metaverse-club-os.web.app/api/sl/dj-status
//   4. Touch to toggle DJ session (login/logout)
//
// When a DJ touches the prim:
//   - If no DJ is active: starts a session (login)
//   - If the touching DJ is active: ends session (logout)
//   - If a different DJ touches: tells them someone is already live
// ============================================================================

string  g_apiUrl;
key     g_activeDj      = NULL_KEY;
string  g_activeDjName  = "";
key     g_httpReqId;

default
{
    state_entry()
    {
        g_apiUrl = llGetObjectDesc();
        if (g_apiUrl == "" || g_apiUrl == "(No Description)")
        {
            g_apiUrl = "https://metaverse-club-os.web.app/api/sl/dj-status";
        }

        llSetText("🎧 DJ Booth\nTouch to go live!", <1.0, 0.0, 0.6>, 1.0);
        llOwnerSay("MCOS DJ Tracker active. Endpoint: " + g_apiUrl);
    }

    touch_start(integer num)
    {
        key toucher     = llDetectedKey(0);
        string name     = llDetectedName(0);
        string uuid     = (string)toucher;
        string timestamp = llGetTimestamp();
        string region   = llGetRegionName();

        if (g_activeDj == NULL_KEY)
        {
            // ── DJ Login ──
            g_activeDj = toucher;
            g_activeDjName = name;

            string json = "{" +
                "\"type\":\"dj_status\"," +
                "\"djUuid\":\"" + uuid + "\"," +
                "\"djName\":\"" + name + "\"," +
                "\"streamUrl\":\"\"," +
                "\"genre\":\"\"," +
                "\"event\":\"login\"," +
                "\"timestamp\":\"" + timestamp + "\"," +
                "\"region\":\"" + region + "\"" +
            "}";

            g_httpReqId = llHTTPRequest(g_apiUrl,
                [HTTP_METHOD, "POST",
                 HTTP_MIMETYPE, "application/json",
                 HTTP_BODY_MAXLENGTH, 2048],
                json);

            llSetText("🎧 DJ: " + name + "\n🔴 LIVE", <1.0, 0.2, 0.0>, 1.0);
            llSay(0, "🎧 " + name + " is now LIVE on the decks!");
        }
        else if (toucher == g_activeDj)
        {
            // ── DJ Logout ──
            string json = "{" +
                "\"type\":\"dj_status\"," +
                "\"djUuid\":\"" + uuid + "\"," +
                "\"djName\":\"" + g_activeDjName + "\"," +
                "\"streamUrl\":\"\"," +
                "\"genre\":\"\"," +
                "\"event\":\"logout\"," +
                "\"timestamp\":\"" + timestamp + "\"," +
                "\"region\":\"" + region + "\"" +
            "}";

            g_httpReqId = llHTTPRequest(g_apiUrl,
                [HTTP_METHOD, "POST",
                 HTTP_MIMETYPE, "application/json",
                 HTTP_BODY_MAXLENGTH, 2048],
                json);

            llSay(0, "🎧 " + g_activeDjName + " has ended their set. Thanks!");
            g_activeDj = NULL_KEY;
            g_activeDjName = "";
            llSetText("🎧 DJ Booth\nTouch to go live!", <1.0, 0.0, 0.6>, 1.0);
        }
        else
        {
            // Another DJ tried to login while one is active
            llInstantMessage(toucher,
                "🎧 " + g_activeDjName + " is currently live. Wait for them to finish.");
        }
    }

    http_response(key reqId, integer status, list metadata, string body)
    {
        if (reqId == g_httpReqId)
        {
            if (status == 200)
            {
                llOwnerSay("DJ status synced to dashboard.");
            }
            else
            {
                llOwnerSay("Dashboard error (" + (string)status + "): " + body);
            }
        }
    }

    changed(integer change)
    {
        if (change & CHANGED_OWNER)
        {
            llResetScript();
        }
    }
}
