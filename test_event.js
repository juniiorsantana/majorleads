const payload = {
  token: "316e8820-fe51-481f-9c24-2abae2f22dee",
  events: [{
    event: "popup_shown",
    visitor_id: "00000000-0000-0000-0000-000000000001",
    session_id: "00000000-0000-0000-0000-000000000001",
    timestamp: Date.now(),
    properties: { popup_id: "2abf1324-a3b2-46fd-b7bb-d80d09dd37ff" }
  }]
};

fetch('https://gaxqumepjfbfaxklekqq.supabase.co/functions/v1/track-events', {
  method: 'POST',
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
