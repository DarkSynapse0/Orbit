# Orbit: App Demo Script (tab by tab)

A full walkthrough of the `/app` dashboard: every tab, every card, every control, with what to click and what to say. Grounded in the live UI.

**Recommended live order** (reorders the sidebar for a story that flows): Sign in → Dashboard → Wallet → Budget → Activity → Savings Goals → Security → Settings → Help Center. You spend like normal, Orbit sets money aside, it lands in a vault you own, and it earns. Everything after that is proof and control.

**Before you start:** have the demo account ready (or your own login), browser on devnet, and the vault either fresh or already funded depending on whether you want to show the empty state or real balances.

---

## 0 · Sign in + the shell

**[DO]** Sign in (demo login is one tap). Land on the dashboard. Point at the top bar and the sidebar banner.
**[SAY]**
> "First thing to notice: signing in took one tap. No wallet to install, no seed phrase. Up top there's a search box for your transactions and an Invite and Earn button. And we're honest about where we are, this banner says it plainly: the vault and the yield are live on Solana devnet, and the only simulated step is the bank-to-dollars conversion. Nothing's faked except the one piece that needs a payments license."

---

## 1 · Dashboard: "Your money at a glance"

**[DO]** Stay on the Dashboard tab. Start at the dark hero balance.
**[SAY]**
> "This is home base. The big number up top is everything you've saved, and right under it you can watch the yield tick up live, six percent a year, counting in real time. Two buttons: add money, or withdraw straight back to your bank."

**[DO]** Point at the two cards: **In vault** and **Set aside**.
**[SAY]**
> "Below that, your money splits into two honest buckets. 'In vault' is what's already invested on-chain and earning, and only you can withdraw it. 'Set aside' is money still sitting in your bank, waiting. See this line: it moves to your vault at ten dollars. Before that threshold, it's just a number. The dollars don't leave your account until there's enough to be worth moving."

**[DO]** Scroll to **Your money over time** (the area chart).
**[SAY]**
> "And this is your growth over time. If you're brand new it says 'no savings yet' and explains the chart fills in once Orbit starts setting money aside. Once you're running, this curve is the whole point: small amounts, compounding."

---

## 2 · Wallet: "Your vault & yield"

**[DO]** Open the Wallet tab. Point at the three tiles: **Total value**, **Yield earned**, **Current yield**.
**[SAY]**
> "The Wallet tab is where the real money lives. Three numbers: your total value, the yield you've actually earned so far, and the rate it's earning right now, six percent, with the venue it's earning in shown right there."

**[DO]** Point at the **Your vault** card (onboarding state).
**[SAY]**
> "If you haven't opened your vault yet, this is a one-tap thing. 'Create an account' and Orbit makes you a real Solana wallet in the browser, no seed phrase to write down. You set a passphrase to protect it on this device. If you've got Phantom or Solflare already, you can connect that instead."

**[DO]** (If connected) Show the account row, **Your savings**, the **Add** input, **Get test money**, **Withdraw to bank**.
**[SAY]**
> "Once you're in, here are your controls. Your account address, copyable. Your savings balance. You can add money by hand, but you don't have to, Orbit fills this automatically from your spending. There's a 'get test money' button since we're on devnet, and 'withdraw to bank' sends dollars back out anytime. No lockup, no waiting."

**[DO]** Point at the **bank card** (or "Connect your bank").
**[SAY]**
> "On the right is your bank. It connects through Plaid, and this is the important part: it's read-only, detection only. Orbit can see that you spent, so it knows when to set money aside. It cannot move, hold, or touch a cent in your bank account. You can sync or disconnect it right here."

**[DO]** Scroll to **Where your USDC earns**, open the venue picker (Orbit Reserve, Kamino, Aave, Solend, marginfi).
**[SAY]**
> "This is where your savings go to work. Right now it's earning in the Orbit Reserve, our audited program vault, live on devnet. And look at the three tags: self-custody, on-chain, withdraw anytime. These other venues, Kamino, Aave, Solend, marginfi, are the real mainnet yield sources we plug into as we grow, with their live rates and billions in deposits. You pick where your money earns."

**[DO]** Scroll to **Growth projection**. Type an amount, drag the years slider.
**[SAY]**
> "And a quick projection so people can feel it. Put in two thousand dollars, drag the slider to five years, and it shows what that becomes at six percent. Small, steady saving turns into real money over time."

**[DO]** Click **View your vault on Solscan** (the on-chain proof).
**[SAY]**
> "Last thing, and this is the one that separates us from every savings app. Here's the vault, live on Solana, anyone can open it. The deposits, the yield, the withdrawals, all public and verifiable. This isn't a number we're telling you to trust. You can check it yourself."

---

## 3 · Budget: "How much you set aside"

**[DO]** Open the Budget tab. Point at the **Set-aside rate** card.
**[SAY]**
> "Budget is the engine room, the dials that decide how saving happens. This is your set-aside rate. It's on two percent, and it shows you exactly what that means: on a fifty-dollar purchase, you'd save a dollar. You can nudge it between half a percent and five percent with these buttons. And it reminds you money moves to the vault at ten dollars."

**[DO]** Point at **Simulate a purchase**. Click a quick-spend button ($45 / $120 / $600) or type a custom amount and hit **Spend**.
**[SAY]**
> "Now watch the whole thing run live. I'll simulate a purchase. Orbit detects it, sets aside its slice, and once the set-asides cross ten dollars, it deposits into the vault on-chain. Detect, set aside, deposit. That's the entire pipeline, and it just ran in front of you, for real."

**[DO]** Point at the **Automation** card (Auto-invest toggle, Pause saving toggle).
**[SAY]**
> "Two switches for how hands-off you want to be. Auto-invest moves money into the vault without you doing anything. Pause lets you keep tracking spending but stop setting money aside for a while, say a tight month. We're upfront that these two are a preview, while the set-aside rate itself is fully live on every purchase."

**[DO]** Point at the **Bank connection** shortcut card.
**[SAY]**
> "And a shortcut to your bank connection, so you can jump straight to managing it."

---

## 4 · Activity: "Everything your money did"

**[DO]** Open the Activity tab. Point at the four KPI cards (Activities, Spending, Set aside, Invested).
**[SAY]**
> "Activity is the receipt for everything. Four numbers across the top: how many things happened, what you spent, what you set aside, and what got invested, each with a change versus last week."

**[DO]** Point at the **search + filter** row, then the **All activity** table.
**[SAY]**
> "You can search by merchant, or filter by type, spending, deposits, withdrawals, goals, wallet moves. And here's the full log. Every row is tagged: spent, saved, or invested, so you can see at a glance what Orbit did with each purchase."

**[DO]** Click a row to open the **detail view**. Then click **← All activity** to go back.
**[SAY]**
> "Tap any one and you get the full story, the amount, how much was set aside, the category, and whether it's moved to the vault yet. Nothing's hidden. For a demo, there's also a 'reset demo' button up here to start clean."

---

## 5 · Savings Goals: "Your savings pots"

**[DO]** Open the Savings Goals tab. Point at the three tiles (Unallocated, Active goals, Reached).
**[SAY]**
> "Goals let you give your savings a purpose. Up top: how much is unallocated and free to assign, how many goals are active, and how many you've already reached. The clever bit is these are all pots layered over your one vault, so every goal earns the same six percent while it fills."

**[DO]** Point at a goal card (progress bar, +$10 / +$50 / Empty buttons).
**[SAY]**
> "Each goal has an emoji, a target, and a progress bar. You can top it up by ten or fifty, or empty it back into your vault. When it hits its target it's marked 'reached'."

**[DO]** Click **New goal**, show the sheet (emoji picker, name, target, initial allocation).
**[SAY]**
> "Making one is quick. Pick an icon, name it, say vacation, set a target, and drop in a starting amount from what's unallocated. Done. It starts earning immediately."

---

## 6 · Security: "What protects your money"

**[DO]** Open the Security tab. Read the dark hero.
**[SAY]**
> "People's real question is 'is my money safe?' so we built a whole page to answer it honestly. The headline is the promise: your money is yours, always. Orbit is fully self-custodial."

**[DO]** Point at the status strip (Wallet, Bank link, Vault) then the three pillars (Keys & wallet, Your vault, Bank link).
**[SAY]**
> "A quick status check: your wallet, your bank link, your vault. Then three plain-language pillars. One, keys: Orbit never sees or stores your private keys, only your wallet can approve a move. Two, the vault: your funds sit in a Solana program tied to your wallet, and you can withdraw the full balance anytime, no lockups. Three, the bank link: read-only, it only notices spending, it can't move your money."

**[DO]** Scroll to **Don't trust. Verify.**, point at the copyable program ID and vault account with Solscan links.
**[SAY]**
> "And then we hand you the receipts. 'Don't trust, verify.' Here's the vault program address and your own vault account, both copyable, both linked straight to the block explorer. Check everything yourself."

**[DO]** Point at **Your controls** and the **Danger zone**.
**[SAY]**
> "Below that, your controls, manage your wallet, open the vault, revoke the bank's access, all in one place. And a danger zone to sign out or reset the app. Note what reset does not touch: your on-chain vault balance is never cleared. That's the whole point of self-custody."

---

## 7 · Settings: "Profile & preferences"

**[DO]** Open the Settings tab. Point at the **Profile** card.
**[SAY]**
> "Settings is the housekeeping. Your profile up top, sign in to sync your savings across devices, or sign out."

**[DO]** Point at the **Wallet** card and **Data** card.
**[SAY]**
> "A quick view of your connected wallet with a shortcut to manage it. And a reset option that clears your set-asides, activity, and bank connection, while, again, leaving your on-chain vault completely untouched."

**[DO]** Point at the **Preferences** card (Appearance / Network / Backend).
**[SAY]**
> "Preferences let you flip between light and dark, see which network you're on, devnet, with a link to the program on the explorer, and check that the backend service is connected. There's even a footer that spells out the legal truth: real on-chain deposits, mocked Stripe step, not a bank, not FDIC-insured. We'd rather say it than hide it."

---

## 8 · Help Center: "Guides for using Orbit"

**[DO]** Open the Help Center tab. Point at the search + category chips (Basics, Saving, Vault, Goals, Growing, Security).
**[SAY]**
> "Finally, a built-in help center, because a product for people who've never touched crypto needs to teach as it goes. Search, or browse by topic."

**[DO]** Point across the article cards, then open one (e.g. "Your vault, and withdrawing anytime").
**[SAY]**
> "Nine plain-language guides, from 'getting started' and 'finding your way around' to 'how your set-aside works', 'connecting your bank safely', and 'how your savings earn yield'. Open one and it's clean, readable, step by step. No jargon. Everything a new user needs to feel in control."

---

## Closing line

**[SAY]**
> "So that's Orbit end to end. You spend like you always do. It sets a slice aside, invests it on-chain, pays real yield, and every dollar stays yours the whole way, provably. A savings account that finally runs itself, for everyone, not just crypto people."

---

**Timing:** ~5–6 min for the full tour. For a 2-minute cut, keep **Dashboard → Budget (simulate a purchase) → Wallet (venue + Solscan proof) → Security (verify)**. That's the hook, the engine, the yield, and the trust, which is the entire pitch.
