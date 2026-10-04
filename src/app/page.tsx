"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CircleHelp,
  Landmark,
  Menu,
  PiggyBank,
  Wallet,
} from "lucide-react";

type Mode = "loan" | "savings" | "budget";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const modes: { id: Mode; label: string; icon: typeof Landmark }[] = [
  { id: "loan", label: "Loan payoff", icon: Landmark },
  { id: "savings", label: "Savings growth", icon: PiggyBank },
  { id: "budget", label: "Monthly budget", icon: Wallet },
];

function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const boundValue = (candidate: number) =>
    Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, candidate));

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        {prefix && <span className="input-affix">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(event) => {
            const rawValue = event.currentTarget.value;
            setDraft(rawValue);
            if (rawValue !== "" && Number.isFinite(Number(rawValue))) {
              onChange(boundValue(Number(rawValue)));
            }
          }}
          onBlur={() => {
            const nextValue = draft.trim() === "" ? min : boundValue(Number(draft));
            setDraft(String(nextValue));
            onChange(nextValue);
          }}
        />
        {suffix && <span className="input-affix">{suffix}</span>}
      </span>
    </label>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("loan");
  const [loanAmount, setLoanAmount] = useState(28000);
  const [loanRate, setLoanRate] = useState(6.4);
  const [loanYears, setLoanYears] = useState(5);
  const [initialSavings, setInitialSavings] = useState(8200);
  const [monthlySavings, setMonthlySavings] = useState(450);
  const [savingsRate, setSavingsRate] = useState(4.5);
  const [savingsYears, setSavingsYears] = useState(10);
  const [income, setIncome] = useState(6200);
  const [expenses, setExpenses] = useState(3840);
  const [budgetSavings, setBudgetSavings] = useState(900);
  const [showProjectionDetails, setShowProjectionDetails] = useState(false);

  const safeLoanYears = Math.min(40, Math.max(1, loanYears));
  const safeSavingsYears = Math.min(50, Math.max(1, savingsYears));
  const loanMonthlyRate = loanRate / 1200;
  const loanPayments = safeLoanYears * 12;
  const loanPayment = loanMonthlyRate === 0
    ? loanAmount / loanPayments
    : (loanAmount * loanMonthlyRate) /
      (1 - Math.pow(1 + loanMonthlyRate, -loanPayments));
  const loanInterest = loanPayment * loanPayments - loanAmount;

  const savingsMonthlyRate = savingsRate / 1200;
  const savingsMonths = safeSavingsYears * 12;
  const growthFactor = savingsMonthlyRate === 0
    ? savingsMonths
    : (Math.pow(1 + savingsMonthlyRate, savingsMonths) - 1) / savingsMonthlyRate;
  const savingsTotal = initialSavings * Math.pow(1 + savingsMonthlyRate, savingsMonths) +
    monthlySavings * growthFactor;
  const savingsContributions = initialSavings + monthlySavings * savingsMonths;
  const budgetRemainder = income - expenses - budgetSavings;
  const extraLoanPayment = 100;
  let acceleratedBalance = loanAmount;
  let acceleratedMonths = 0;
  let acceleratedInterest = 0;
  while (acceleratedBalance > 0.005 && acceleratedMonths < loanPayments) {
    const monthlyInterest = acceleratedBalance * loanMonthlyRate;
    acceleratedInterest += monthlyInterest;
    acceleratedBalance = Math.max(
      0,
      acceleratedBalance + monthlyInterest - loanPayment - extraLoanPayment,
    );
    acceleratedMonths += 1;
  }
  const loanMonthsSaved = Math.max(0, loanPayments - acceleratedMonths);
  const loanInterestSaved = Math.max(0, loanInterest - acceleratedInterest);
  const extraSavingsValue = 50 * growthFactor;
  const budgetTargetGap = Math.max(0, income * 0.2 - budgetSavings);

  const headlineValue = mode === "loan"
    ? currency.format(loanPayment)
    : mode === "savings"
      ? currency.format(savingsTotal)
      : currency.format(budgetRemainder);

  const chartValues = mode === "savings"
    ? Array.from({ length: 7 }, (_, index) => {
        const year = Math.max(1, Math.round((savingsYears * (index + 1)) / 7));
        const months = Math.min(year * 12, savingsMonths);
        const factor = savingsMonthlyRate === 0
          ? months
          : (Math.pow(1 + savingsMonthlyRate, months) - 1) / savingsMonthlyRate;
        return initialSavings * Math.pow(1 + savingsMonthlyRate, months) + monthlySavings * factor;
      })
    : mode === "loan"
      ? Array.from({ length: 7 }, (_, index) => {
          const months = Math.min(loanPayments, Math.max(1, Math.round((loanPayments * (index + 1)) / 7)));
          return loanPayment * months;
        })
      : [income, expenses, budgetSavings, Math.max(0, budgetRemainder)];
  const chartMaximum = Math.max(...chartValues, 1);
  const chartLabels = mode === "budget"
    ? ["Income", "Costs", "Save", "Left"]
    : chartValues.map((_, index) => `${Math.max(1, Math.round(((mode === "loan" ? safeLoanYears : safeSavingsYears) * (index + 1)) / 7))}y`);

  const activeMode = modes.find((item) => item.id === mode)!;
  const ActiveIcon = activeMode.icon;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Morrow home">
          <span className="brand-mark"><span /></span>
          <span>morrow<span className="brand-period">.</span></span>
        </a>

        <div className="side-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`side-link ${mode === "loan" ? "active" : ""}`} type="button" aria-current={mode === "loan" ? "page" : undefined} onClick={() => setMode("loan")}>
            <Calculator size={18} strokeWidth={1.8} />
            <span>Calculator</span>
            {mode === "loan" && <span className="nav-indicator" />}
          </button>
          <button className={`side-link ${mode === "budget" ? "active" : ""}`} type="button" aria-current={mode === "budget" ? "page" : undefined} onClick={() => setMode("budget")}>
            <Wallet size={18} strokeWidth={1.8} />
            <span>Monthly budget</span>
            {mode === "budget" && <span className="nav-indicator" />}
          </button>
          <button className={`side-link ${mode === "savings" ? "active" : ""}`} type="button" aria-current={mode === "savings" ? "page" : undefined} onClick={() => setMode("savings")}>
            <PiggyBank size={18} strokeWidth={1.8} />
            <span>Savings plan</span>
            {mode === "savings" && <span className="nav-indicator" />}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-icon"><CircleHelp size={17} /></div>
            <p>Small steps today add up to more choices tomorrow.</p>
          </div>
          <div className="profile" aria-label="Your profile">
            <span className="avatar">JS</span>
            <span className="profile-copy"><strong>Jordan Smith</strong><small>Personal account</small></span>
            <Menu className="profile-menu" size={17} />
          </div>
        </div>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-divider">/</span><strong>Calculator</strong></div>
          <div className="topbar-right">
            <span className="today-dot" />
            <span className="today-label">Your money, in focus</span>
            <span className="top-avatar">JS</span>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">A CLEARER VIEW OF WHAT&apos;S NEXT</p>
              <h1>Make your next move <span>count.</span></h1>
              <p className="heading-copy">Run the numbers. Find a plan that feels right.</p>
            </div>
            <div className="date-chip"><span className="date-spark">✳</span> FINANCIAL TOOLKIT <span className="date-year">2026</span></div>
          </div>

          <section className="summary-strip" aria-label="Calculator summary">
            <div className="summary-intro">
              <div className="summary-icon"><ActiveIcon size={19} strokeWidth={1.8} /></div>
              <div><span className="summary-label">{mode === "loan" ? "ESTIMATED MONTHLY PAYMENT" : mode === "savings" ? "PROJECTED SAVINGS" : "LEFT AFTER YOUR PLAN"}</span><strong className="summary-value">{headlineValue}</strong></div>
            </div>
            <div className="summary-divider" />
            <div className="summary-stat"><span className="summary-label">{mode === "loan" ? "TOTAL INTEREST" : mode === "savings" ? "TOTAL CONTRIBUTED" : "SAVINGS RATE"}</span><strong>{mode === "loan" ? currency.format(loanInterest) : mode === "savings" ? currency.format(savingsContributions) : `${income > 0 ? Math.round((budgetSavings / income) * 100) : 0}%`}</strong></div>
            <div className="summary-stat"><span className="summary-label">{mode === "loan" ? "PAYOFF TIME" : mode === "savings" ? "TIME HORIZON" : "MONTHLY INCOME"}</span><strong>{mode === "loan" ? `${loanYears} years` : mode === "savings" ? `${savingsYears} years` : currency.format(income)}</strong></div>
            <div className={`summary-change ${mode === "budget" && budgetRemainder < 0 ? "negative" : ""}`}>
              {mode === "budget" && budgetRemainder < 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
              <span>{mode === "budget" && budgetRemainder < 0 ? "Over plan" : "On track"}</span>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="calculator-panel">
              <div className="panel-heading">
                <div><span className="panel-kicker">YOUR NUMBERS</span><h2>Calculator</h2></div>
                <span className="updated-tag"><span /> LIVE ESTIMATE</span>
              </div>

              <div className="mode-tabs" role="group" aria-label="Calculator type">
                {modes.map(({ id, label, icon: Icon }) => (
                  <button key={id} className={`mode-tab ${mode === id ? "selected" : ""}`} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>
                    <Icon size={16} strokeWidth={1.9} /><span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="form-section">
                <div className="form-title-row"><h3>{mode === "loan" ? "Loan details" : mode === "savings" ? "Savings details" : "Monthly cash flow"}</h3><span>Adjust any value</span></div>
                {mode === "loan" && <div className="fields-grid">
                  <NumberField label="Loan amount" value={loanAmount} onChange={setLoanAmount} prefix="$" max={100_000_000} step={500} />
                  <NumberField label="Interest rate" value={loanRate} onChange={setLoanRate} suffix="%" min={0} max={100} step={0.1} />
                  <NumberField label="Loan term" value={loanYears} onChange={setLoanYears} suffix="years" min={1} max={40} />
                </div>}
                {mode === "savings" && <div className="fields-grid">
                  <NumberField label="Starting balance" value={initialSavings} onChange={setInitialSavings} prefix="$" max={100_000_000} step={500} />
                  <NumberField label="Monthly contribution" value={monthlySavings} onChange={setMonthlySavings} prefix="$" max={100_000_000} step={25} />
                  <NumberField label="Annual return" value={savingsRate} onChange={setSavingsRate} suffix="%" min={0} max={100} step={0.1} />
                  <NumberField label="Time horizon" value={savingsYears} onChange={setSavingsYears} suffix="years" min={1} max={50} />
                </div>}
                {mode === "budget" && <div className="fields-grid">
                  <NumberField label="Monthly take-home" value={income} onChange={setIncome} prefix="$" max={100_000_000} step={100} />
                  <NumberField label="Monthly expenses" value={expenses} onChange={setExpenses} prefix="$" max={100_000_000} step={100} />
                  <NumberField label="Planned savings" value={budgetSavings} onChange={setBudgetSavings} prefix="$" max={100_000_000} step={50} />
                </div>}
              </div>

              <div className="result-block">
                <div className="result-copy"><span className="result-label">{mode === "loan" ? "YOUR MONTHLY PAYMENT" : mode === "savings" ? `IN ${safeSavingsYears} YEARS` : "FLEXIBLE MONEY LEFT"}</span><strong>{headlineValue}<small>{mode === "loan" ? "/mo" : mode === "budget" ? "/mo" : ""}</small></strong><p>{mode === "loan" ? `Across ${loanPayments.toLocaleString()} monthly payments` : mode === "savings" ? `With ${currency.format(monthlySavings)} added each month` : "After expenses and planned savings"}</p></div>
                <div className="result-mark"><span className="result-mark-center">{mode === "loan" ? "APR" : mode === "savings" ? "GROW" : "NET"}</span><svg viewBox="0 0 100 100" role="img" aria-label="Illustrative result indicator"><circle className="ring-track" cx="50" cy="50" r="42" /><circle className="ring-value" cx="50" cy="50" r="42" /></svg></div>
              </div>

              <div className="panel-footnote"><span className="footnote-mark">i</span><span>{mode === "loan" ? "Estimate excludes taxes, fees, and any additional payments." : mode === "savings" ? "Projection assumes monthly compounding and consistent contributions." : budgetRemainder < 0 ? "Planned monthly outflow is above take-home pay; review your expenses and savings target." : "A positive balance gives you room for unplanned costs."}</span></div>
            </section>

            <section className="growth-panel">
              <div className="growth-heading"><div><span className="panel-kicker">THE LONG VIEW</span><h2>{mode === "loan" ? "Cost breakdown" : mode === "savings" ? "Your money, growing" : "Your monthly picture"}</h2></div><button className="icon-button" type="button" title="Projection details" aria-label="Projection details" aria-expanded={showProjectionDetails} onClick={() => setShowProjectionDetails(!showProjectionDetails)}><CircleHelp size={17} /></button></div>
              <div className="chart-total"><strong>{mode === "loan" ? currency.format(loanAmount + loanInterest) : mode === "savings" ? currency.format(savingsTotal) : currency.format(income)}</strong><span>{mode === "loan" ? "total paid over loan term" : mode === "savings" ? "estimated future value" : "monthly income"}</span></div>
              {showProjectionDetails && <p className="projection-detail">{mode === "loan" ? "Assumes a fixed rate and equal monthly payments; excludes fees, taxes, and extra payments." : mode === "savings" ? "Assumes a fixed annual return, monthly compounding, and end-of-month contributions." : "Compares the monthly amounts entered; irregular income and expenses are not included."}</p>}
              <div className="chart-area">
                <div className="chart-y-labels"><span>{compactCurrency.format(chartMaximum)}</span><span>{compactCurrency.format(chartMaximum / 2)}</span><span>$0</span></div>
                <div className="chart-bars" role="img" aria-label={mode === "savings" ? "Savings growth projection chart" : mode === "loan" ? "Cumulative loan payments chart" : "Monthly budget comparison chart"} style={{ gridTemplateColumns: `repeat(${chartValues.length}, minmax(0, 1fr))` }}>
                  <div className="chart-gridline top" /><div className="chart-gridline middle" /><div className="chart-gridline bottom" />
                  {chartValues.map((value, index) => <div className="bar-column" key={`${index}-${value}`}><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(8, (value / chartMaximum) * 100)}%` }} /></div><span>{chartLabels[index]}</span></div>)}
                </div>
              </div>
              <div className="chart-legend"><span className="legend-dot" /> {mode === "savings" ? "Projected balance" : mode === "loan" ? "Cumulative payments" : "Monthly amount"} <span className="legend-note">Illustrative</span></div>
              <div className="insight-box"><span className="insight-icon"><PiggyBank size={17} /></span><div><span className="insight-label">ONE IDEA TO EXPLORE</span><p>{mode === "loan" ? loanAmount > 0 && loanMonthsSaved > 0 ? <>Paying an extra <strong>{currency.format(extraLoanPayment)}/mo</strong> could shorten payoff by about {loanMonthsSaved} months and save {currency.format(loanInterestSaved)} in interest.</> : "Your current balance is already paid off in this estimate." : mode === "savings" ? <>Adding <strong>{currency.format(50)}/mo</strong> could increase the projected balance by about {currency.format(extraSavingsValue)}.</> : budgetRemainder < 0 ? <>You&apos;re <strong>{currency.format(Math.abs(budgetRemainder))} over plan.</strong> Try adjusting expenses or planned savings to balance the month.</> : income <= 0 ? "Enter monthly take-home pay to explore a savings target." : budgetTargetGap === 0 ? <>Your planned savings meet or exceed the optional <strong>20% savings target.</strong></> : budgetRemainder >= budgetTargetGap ? <>Adding <strong>{currency.format(budgetTargetGap)}/mo</strong> would bring planned savings to 20% of income and leave {currency.format(budgetRemainder - budgetTargetGap)} flexible.</> : <>An optional 20% savings target is {currency.format(budgetTargetGap)} above your current plan; adjust the inputs to compare options.</>}</p></div></div>
              <div className="projection-footer"><span>COMPOUNDING</span><strong>{mode === "savings" ? "Monthly" : "Monthly estimate"}</strong><span className="footer-separator" /><span>ASSUMPTION</span><strong>{mode === "savings" ? `${savingsRate}% annual` : "Fixed inputs"}</strong></div>
            </section>
          </div>

          <footer className="page-footer"><span>For planning purposes only. Not financial advice.</span><span>Make room for what matters.</span></footer>
        </div>
      </section>
    </main>
  );
}
