import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
// App tab
await p.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);
const tabCur = await p.evaluate(() => {
  const t = [...document.querySelectorAll('nav button')].find(b=>b.textContent.trim()==='Overview');
  return t ? getComputedStyle(t).cursor : 'no-tab';
});
const toggleCur = await p.evaluate(() => {
  const t = document.querySelector('[role="switch"], button[aria-label*="mode"]');
  return t ? getComputedStyle(t).cursor : 'none';
});
// Landing
await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const landingBtn = await p.evaluate(() => {
  const t = [...document.querySelectorAll('a,button')].find(b=>/Open your vault|Get started/.test(b.textContent||""));
  return t ? getComputedStyle(t).cursor : 'none';
});
const faq = await p.evaluate(() => {
  const s = document.querySelector('summary');
  return s ? getComputedStyle(s).cursor : 'none';
});
console.log("app tab cursor:", tabCur);
console.log("theme toggle cursor:", toggleCur);
console.log("landing CTA cursor:", landingBtn);
console.log("FAQ summary cursor:", faq);
await b.close();
