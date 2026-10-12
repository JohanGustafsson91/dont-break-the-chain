import { defineMessages } from "../i18n/i18n";

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
const years = (n: number) => `${n} ${n === 1 ? "year" : "years"}`;
const dagar = (n: number) => `${n} ${n === 1 ? "dag" : "dagar"}`;

// Indexed like Date.getUTCDay(): Sunday first. Swedish weekday names are lowercase.
const englishWeekdays = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
const swedishWeekdays = ["söndagar", "måndagar", "tisdagar", "onsdagar", "torsdagar", "fredagar", "lördagar"];
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Each line must fit the habit card: at most 28 characters and one emoji, at the end
// (see statusLine.ts and its test), so the Swedish wording is shortened where needed.
export const statusLineMessages = defineMessages({
  en: {
    weeksGoalMet: (weeks: number) => `Goal met ${weeks} weeks in a row 🏆`,
    doneWithDaysToSpare: (spare: number) => `Done, ${days(spare)} to spare ✅`,
    weekGoalDone: "This week's goal is done ✅",
    niceMoreThisWeek: (left: number) => `Nice, ${left} more this week 💪`,
    everyExtraDayCounts: "Every extra day counts",
    moreEveryDayCounts: (left: number) => `${left} more, every day counts 🎯`,
    moreThisWeek: (left: number) => `${left} more this week`,
    yearsInARow: (n: number) => `${years(n)} in a row 🎉`,
    daysInARow: (n: number) => `${n} days in a row 🎉`,
    newBest: (n: number) => `New best: ${days(n)} 🏆`,
    toYourBest: (day: number, left: number) => `Day ${day}, ${left} to your best 🎯`,
    toMilestone: (day: number, left: number, milestone: number) => `Day ${day}, ${left} to ${milestone} 🎯`,
    backOnTrack: "Back on track 💪",
    newChain: "Day 1 of a new chain 🌱",
    dayInARow: (day: number) => `Day ${day} in a row 🔗`,
    alwaysBounceBack: "You always bounce back",
    recoverInTen: (n: number) => `You recover ${n} in 10 times`,
    stillGoodOverall: (share: number) => `Still ${share} % good overall`,
    oneMissIsFine: "One miss is fine 🌱",
    restDay: "Day off, chain kept",
    restDayNoChain: "Day off",
    todayMakesYears: (n: number) => `Today makes ${years(n)} 🎯`,
    todayIsDay: (day: number) => `Today is day ${day} 🎯`,
    beatYourBest: "Beat your best today 🏆",
    dontMissTwice: "Don't miss twice 💪",
    weekdayTendsToSlip: (weekday: number) => `${englishWeekdays[weekday]} tend to slip`,
    daysToMilestone: (left: number, milestone: number) => `${days(left)} to ${milestone} in a row 🎯`,
    recordRun: "On a record run 🏆",
    firstWeek: (done: number) => `First week: ${done} of 7 done 🌱`,
    keepGoing: (n: number) => `${days(n)}, keep going 🔗`,
    lastDone: (daysAgo: number) => `Last done ${days(daysAgo)} ago`,
    startFirstDay: "Start your first day 🌱",
  },
  sv: {
    weeksGoalMet: (weeks: number) => `Målet nått ${weeks} v i rad 🏆`,
    doneWithDaysToSpare: (spare: number) => `Klart med ${dagar(spare)} kvar ✅`,
    weekGoalDone: "Veckomålet är nått ✅",
    niceMoreThisWeek: (left: number) => `Snyggt, ${left} kvar i veckan 💪`,
    everyExtraDayCounts: "Varje extra dag räknas",
    moreEveryDayCounts: (left: number) => `${left} kvar, varje dag räknas 🎯`,
    moreThisWeek: (left: number) => `${left} kvar i veckan`,
    yearsInARow: (n: number) => `${n} år i rad 🎉`,
    daysInARow: (n: number) => `${n} dagar i rad 🎉`,
    newBest: (n: number) => `Nytt rekord: ${dagar(n)} 🏆`,
    toYourBest: (day: number, left: number) => `Dag ${day}, ${left} till rekordet 🎯`,
    toMilestone: (day: number, left: number, milestone: number) => `Dag ${day}, ${left} kvar till ${milestone} 🎯`,
    backOnTrack: "Tillbaka på banan 💪",
    newChain: "Dag 1 i en ny kedja 🌱",
    dayInARow: (day: number) => `Dag ${day} i kedjan 🔗`,
    alwaysBounceBack: "Du reser dig alltid igen",
    recoverInTen: (n: number) => `Du reser dig ${n} av 10 gånger`,
    stillGoodOverall: (share: number) => `Fortfarande ${share} % bra totalt`,
    oneMissIsFine: "En miss gör inget 🌱",
    restDay: "Fridag, kedjan håller",
    restDayNoChain: "Fridag",
    todayMakesYears: (n: number) => `Idag blir det ${n} år 🎯`,
    todayIsDay: (day: number) => `Idag är det dag ${day} 🎯`,
    beatYourBest: "Slå ditt rekord idag 🏆",
    dontMissTwice: "Missa inte två i rad 💪",
    weekdayTendsToSlip: (weekday: number) => `${capitalize(swedishWeekdays[weekday])} brukar glippa`,
    daysToMilestone: (left: number, milestone: number) => `${dagar(left)} till ${milestone} i rad 🎯`,
    recordRun: "Mitt i en rekordsvit 🏆",
    firstWeek: (done: number) => `Första veckan: ${done}/7 klara 🌱`,
    keepGoing: (n: number) => `${dagar(n)}, fortsätt så 🔗`,
    lastDone: (daysAgo: number) => `Senast för ${dagar(daysAgo)} sedan`,
    startFirstDay: "Kom igång med dag 1 🌱",
  },
});

export const insightsMessages = defineMessages({
  en: {
    weekday: (weekday: number, count: number, lookback: number) =>
      `You miss most often on ${englishWeekdays[weekday]}: ${count} of the last ${lookback}.`,
    recovery: (percent: number) => `After a bad day, the next day is good ${percent} % of the time.`,
    chainBreak: (range: string, high: number) => `Your chains usually break after ${range} ${high === 1 ? "day" : "days"}.`,
    trendShare: (now: number, window: number, up: boolean, before: number) =>
      `${now} % good days in the last ${window} days, ${up ? "up" : "down"} from ${before} %.`,
    trendCount: (now: number, window: number, up: boolean, before: number) =>
      `${now} good days in the last ${window} days, ${up ? "up" : "down"} from ${before}.`,
  },
  sv: {
    weekday: (weekday: number, count: number, lookback: number) =>
      `Du missar oftast på ${swedishWeekdays[weekday]}: ${count} av de senaste ${lookback}.`,
    recovery: (percent: number) => `Efter en dålig dag blir nästa dag bra i ${percent} % av fallen.`,
    chainBreak: (range: string, high: number) => `Dina kedjor brukar brytas efter ${range} ${high === 1 ? "dag" : "dagar"}.`,
    trendShare: (now: number, window: number, up: boolean, before: number) =>
      `${now} % bra dagar de senaste ${window} dagarna, ${up ? "upp" : "ner"} från ${before} %.`,
    trendCount: (now: number, window: number, up: boolean, before: number) =>
      `${now} bra dagar de senaste ${window} dagarna, ${up ? "upp" : "ner"} från ${before}.`,
  },
});
