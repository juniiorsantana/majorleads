fetch("https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/track-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        token: "818589b2-2bb1-486d-aebd-8dd4a9d09a41",
        events: [{
            event: "test",
            visitor_id: "721e05d0-99c5-4a25-a131-729486cdda03",
            session_id: "5a9d8a39-ec45-42d8-bf5b-551ddf8b8a36",
            timestamp: Date.now()
        }]
    })
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Body:", await r.text());
}).catch(console.error);
