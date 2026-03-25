// ============================================================================
// MCOS Tip Tracker — LSL Script for Simple Box Prim
//
// This script detects L$ payments to the object and sends the data
// to the Metaverse Club OS dashboard via HTTP POST.
//
// SETUP:
//   1. Rez a simple box prim in Second Life
//   2. Drop this script into the prim's contents
//   3. Set the description of the prim to the dashboard URL:
//      https://metaverse-club-os.web.app/api/sl/tip
//   4. The prim will automatically detect the owner's UUID for auth
//
// The prim must be owned by the same avatar whose SL UUID is registered
// as `ownerSlUuid` in the org's Firestore document.
// ============================================================================

string  g_apiUrl;           // Dashboard API endpoint
key     g_httpReqId;        // Current HTTP request ID

default
{
    state_entry()
    {
        // Read the API URL from the object description
        g_apiUrl = llGetObjectDesc();
        if (g_apiUrl == "" || g_apiUrl == "(No Description)")
        {
            g_apiUrl = "https://metaverse-club-os.web.app/api/sl/tip";
        }

        // Enable receiving money
        llSetPayPrice(PAY_DEFAULT, [50, 100, 250, 500]);
        llRequestPermissions(llGetOwner(), PERMISSION_DEBIT);

        llSetText("♥ Tip Jar ♥\nTouch to tip!", <0.0, 1.0, 0.8>, 1.0);
        llOwnerSay("MCOS Tip Tracker active. Endpoint: " + g_apiUrl);
    }

    money(key id, integer amount)
    {
        string payerName = llKey2Name(id);
        string payerUuid = (string)id;
        string timestamp = llGetTimestamp();
        string region    = llGetRegionName();

        // Build JSON payload
        string json = "{" +
            "\"type\":\"tip\"," +
            "\"payerUuid\":\"" + payerUuid + "\"," +
            "\"payerName\":\"" + payerName + "\"," +
            "\"amount\":" + (string)amount + "," +
            "\"category\":\"club\"," +
            "\"recipientName\":\"\"," +
            "\"timestamp\":\"" + timestamp + "\"," +
            "\"region\":\"" + region + "\"" +
        "}";

        // Send to dashboard
        g_httpReqId = llHTTPRequest(g_apiUrl,
            [HTTP_METHOD, "POST",
             HTTP_MIMETYPE, "application/json",
             HTTP_BODY_MAXLENGTH, 2048],
            json);

        // Visual feedback
        llSetText("♥ Tip Jar ♥\nThanks " + payerName + "!\nL$" + (string)amount, <0.0, 1.0, 0.4>, 1.0);

        // Reset text after 5 seconds
        llSetTimerEvent(5.0);
    }

    http_response(key reqId, integer status, list metadata, string body)
    {
        if (reqId == g_httpReqId)
        {
            if (status == 200)
            {
                // Tip recorded successfully
                llOwnerSay("Tip logged to dashboard.");
            }
            else
            {
                llOwnerSay("Dashboard error (" + (string)status + "): " + body);
            }
        }
    }

    timer()
    {
        llSetTimerEvent(0.0);
        llSetText("♥ Tip Jar ♥\nTouch to tip!", <0.0, 1.0, 0.8>, 1.0);
    }

    run_time_permissions(integer perm)
    {
        if (perm & PERMISSION_DEBIT)
        {
            llOwnerSay("Payment permissions granted.");
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
