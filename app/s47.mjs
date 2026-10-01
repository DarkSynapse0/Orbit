import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 620 } });
await p.goto('http://localhost:3000/app', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
const demo = p.getByRole('button', { name: /demo account/i }).first();
if (await demo.count()) { await demo.click(); await p.waitForTimeout(2800); }
await p.evaluate(() => {
  const t = Date.now();
  localStorage.setItem('orbit.goals.v1', JSON.stringify([
    {id:'g1',emoji:'🎁',name:'For gift',target:100,allocated:40,earned:0.0006,since:t-3600000},
    {id:'g2',emoji:'🏖️',name:'Vacation',target:500,allocated:120,earned:0.0008,since:t-7200000},
  ]));
  localStorage.setItem('orbit.nav.v1','goals');
});
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
await p.screenshot({ path: '/tmp/goalshdr.png', clip: { x: 288, y: 64, width: 1152, height: 300 } });
await b.close(); console.log('SHOT_OK');
