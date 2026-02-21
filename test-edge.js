const fetch = require('node-fetch');

(async () => {
    try {
        console.log("Testing POST to track-events...");
        const res = await fetch("https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/track-events", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: "f76e1072-f195-46aa-abcd-98440536ef0d", // dummy uuid
                events: [
                    {
                        event: "test",
                        visitor_id: "721e05d0-99c5-4a25-a131-729486cdda03",
                        session_id: "5a9d8a39-ec45-42d8-bf5b-551ddf8b8a36",
                        timestamp: Date.now()
                    }
                ]
            })
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body text:", text);
    } catch (err) {
        console.error("Fetch error:", err);
    }
})();
