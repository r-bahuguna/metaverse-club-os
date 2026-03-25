// ============================================================================
// MCOS Visitor Tracker — LSL Script for Simple Box Prim
//
// This script periodically scans for avatars in the region and sends
// arrival/departure events to the Metaverse Club OS dashboard.
//
// SETUP:
//   1. Rez a simple box prim in your club parcel
//   2. Drop this script into the prim's contents
//   3. Set the description to the dashboard URL:
//      https://metaverse-club-os.web.app/api/sl/visitor
//   4. Place the prim centrally in your club for best sensor range
//
// Uses llGetAgentList() for parcel-wide detection (more reliable than sensor).
// ============================================================================

string  g_apiUrl;
float   g_scanInterval = 30.0;  // Scan every 30 seconds
list    g_knownAvatars;         // List of UUID strings currently tracked
key     g_httpReqId;

default
{
    state_entry()
    {
        g_apiUrl = llGetObjectDesc();
        if (g_apiUrl == "" || g_apiUrl == "(No Description)")
        {
            g_apiUrl = "https://metaverse-club-os.web.app/api/sl/visitor";
        }

        g_knownAvatars = [];
        llSetTimerEvent(g_scanInterval);
        llSetText("📡 Visitor Tracker\nActive", <0.0, 0.8, 1.0>, 0.8);
        llOwnerSay("MCOS Visitor Tracker active. Scanning every " +
            (string)((integer)g_scanInterval) + "s. Endpoint: " + g_apiUrl);
    }

    timer()
    {
        // Get all avatars on this parcel
        list currentAvatars = llGetAgentList(AGENT_LIST_PARCEL, []);
        integer currentCount = llGetListLength(currentAvatars);

        // ── Detect arrivals ──
        integer i;
        for (i = 0; i < currentCount; i++)
        {
            key avatarKey = llList2Key(currentAvatars, i);
            string avatarUuid = (string)avatarKey;

            if (llListFindList(g_knownAvatars, [avatarUuid]) == -1)
            {
                // New arrival
                string avatarName = llKey2Name(avatarKey);
                string timestamp  = llGetTimestamp();
                string region     = llGetRegionName();

                string json = "{" +
                    "\"type\":\"visitor\"," +
                    "\"avatarUuid\":\"" + avatarUuid + "\"," +
                    "\"avatarName\":\"" + avatarName + "\"," +
                    "\"event\":\"arrival\"," +
                    "\"isNew\":0," +
                    "\"currentCount\":" + (string)currentCount + "," +
                    "\"timestamp\":\"" + timestamp + "\"," +
                    "\"region\":\"" + region + "\"" +
                "}";

                g_httpReqId = llHTTPRequest(g_apiUrl,
                    [HTTP_METHOD, "POST",
                     HTTP_MIMETYPE, "application/json",
                     HTTP_BODY_MAXLENGTH, 2048],
                    json);

                g_knownAvatars += [avatarUuid];
            }
        }

        // ── Detect departures ──
        list newKnown = [];
        integer j;
        for (j = 0; j < llGetListLength(g_knownAvatars); j++)
        {
            string knownUuid = llList2String(g_knownAvatars, j);

            if (llListFindList(currentAvatars, [(key)knownUuid]) == -1)
            {
                // Departed
                string timestamp = llGetTimestamp();
                string region    = llGetRegionName();

                string json = "{" +
                    "\"type\":\"visitor\"," +
                    "\"avatarUuid\":\"" + knownUuid + "\"," +
                    "\"avatarName\":\"\"," +
                    "\"event\":\"departure\"," +
                    "\"isNew\":0," +
                    "\"currentCount\":" + (string)currentCount + "," +
                    "\"timestamp\":\"" + timestamp + "\"," +
                    "\"region\":\"" + region + "\"" +
                "}";

                g_httpReqId = llHTTPRequest(g_apiUrl,
                    [HTTP_METHOD, "POST",
                     HTTP_MIMETYPE, "application/json",
                     HTTP_BODY_MAXLENGTH, 2048],
                    json);
            }
            else
            {
                newKnown += [knownUuid];
            }
        }

        g_knownAvatars = newKnown;

        llSetText("📡 Visitors: " + (string)currentCount + "\nTracking...",
            <0.0, 0.8, 1.0>, 0.8);
    }

    http_response(key reqId, integer status, list metadata, string body)
    {
        if (status != 200)
        {
            llOwnerSay("Visitor API error (" + (string)status + "): " + body);
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
