const fs = require('fs');
const https = require('https');

const url = 'https://ovsfbaqpvpizriuezjcv.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2ZiYXFwdnBpenJpdWV6amN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY0MjQ2NSwiZXhwIjoyMDkxMjE4NDY1fQ.13I01uM39hCf8QfkVuP1hWELLTPJCGo63-zQuExr9SI';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('openapi.json', data);
    console.log('Saved openapi.json, length: ' + data.length);
  });
});
