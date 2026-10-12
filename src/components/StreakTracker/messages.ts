import { defineMessages } from "../../i18n/i18n";
import { pluralize } from "../../utils/string";

type Unit = "day" | "week";

const svUnit = (count: number, unit: Unit) =>
  unit === "day" ? pluralize(count, "dag", "dagar") : pluralize(count, "vecka", "veckor");

export const streakTrackerMessages = defineMessages({
  en: {
    notFound: "This habit doesn't exist, or it isn't yours.",
    loadFailed: "Couldn't load this habit. Check your connection and try again.",
    backToHabits: "Back to your habits",
    delete: "Delete",
    deleteTitle: "Delete habit?",
    deleteBody: (name: string) => `“${name}” and its whole history will be removed.`,
    deleteFailed: "Couldn't delete the habit. Please try again.",
    saveNameFailed: "Couldn't save the name. Please try again.",
    saveDescriptionFailed: "Couldn't save the description. Please try again.",
    saveGoalFailed: "Couldn't save the goal. Please try again.",
    saveDayFailed: "Couldn't save that day. Please try again.",
    removeStatusTitle: "Remove status?",
    removeStatusBody: (notes: string) => `The note for this day will be deleted too: “${notes}”`,
    remove: "Remove",
    weeklyHint: (left: number) => `${left} more to reach this week's goal.`,
    dailyHint: "Today isn't marked yet. Tap today to log it.",
    descriptionPlaceholder: "Add a description",
    current: "Current",
    longest: "Longest",
    currentUnit: (count: number, unit: Unit) =>
      pluralize(count, `${unit} in a row`, `${unit}s in a row`),
    longestUnit: (count: number, unit: Unit) =>
      pluralize(count, `${unit}, best chain`, `${unit}s, best chain`),
    goodDaysInTotal: (count: number) => `${count} good ${pluralize(count, "day")} in total`,
    goodAndBad: (good: number, bad: number) => `${good} good · ${bad} bad`,
    patterns: "Patterns",
    note: "Note",
    notePlaceholder: "e.g. Ran 5 km",
    markToAddNoteDaily: "Mark the day ✓, ✗ or as a day off to add a note",
    markToAddNoteWeekly: "Mark the day ✓ to add a note",
    done: "Done",
  },
  sv: {
    notFound: "Den här vanan finns inte, eller så är den inte din.",
    loadFailed: "Det gick inte att ladda vanan. Kontrollera anslutningen och försök igen.",
    backToHabits: "Tillbaka till dina vanor",
    delete: "Radera",
    deleteTitle: "Radera vanan?",
    deleteBody: (name: string) => `”${name}” och hela dess historik tas bort.`,
    deleteFailed: "Det gick inte att radera vanan. Försök igen.",
    saveNameFailed: "Det gick inte att spara namnet. Försök igen.",
    saveDescriptionFailed: "Det gick inte att spara beskrivningen. Försök igen.",
    saveGoalFailed: "Det gick inte att spara målet. Försök igen.",
    saveDayFailed: "Det gick inte att spara dagen. Försök igen.",
    removeStatusTitle: "Ta bort markeringen?",
    removeStatusBody: (notes: string) => `Anteckningen för dagen raderas också: ”${notes}”`,
    remove: "Ta bort",
    weeklyHint: (left: number) => `${left} kvar till veckans mål.`,
    dailyHint: "Dagen är inte markerad än. Tryck på dagens ruta för att markera den.",
    descriptionPlaceholder: "Lägg till en beskrivning",
    current: "Nuvarande",
    longest: "Längsta",
    currentUnit: (count: number, unit: Unit) => `${svUnit(count, unit)} i rad`,
    longestUnit: (count: number, unit: Unit) => `${svUnit(count, unit)}, rekord`,
    goodDaysInTotal: (count: number) => `${count} bra ${pluralize(count, "dag", "dagar")} totalt`,
    goodAndBad: (good: number, bad: number) => `${good} bra · ${bad} ${bad === 1 ? "dålig" : "dåliga"}`,
    patterns: "Mönster",
    note: "Anteckning",
    notePlaceholder: "t.ex. Sprang 5 km",
    markToAddNoteDaily: "Markera dagen ✓, ✗ eller som fridag för att lägga till en anteckning",
    markToAddNoteWeekly: "Markera dagen ✓ för att lägga till en anteckning",
    done: "Klar",
  },
});

export const calendarMessages = defineMessages({
  en: {
    previousMonth: "Previous month",
    nextMonth: "Next month",
    day: (n: number) => `Day ${n}`,
    tapToCycle: "Tap to cycle status",
    holdToAddNote: "Hold for a note or a day off",
    holdToAddNoteWeekly: "Hold to add a note",
    hasNote: "* has a note",
    litWeek: "Lit week = goal reached",
  },
  sv: {
    previousMonth: "Föregående månad",
    nextMonth: "Nästa månad",
    day: (n: number) => `Dag ${n}`,
    tapToCycle: "Tryck för att byta status",
    holdToAddNote: "Håll inne för en anteckning eller en fridag",
    holdToAddNoteWeekly: "Håll inne för att lägga till en anteckning",
    hasNote: "* har en anteckning",
    litWeek: "Ifylld vecka = målet nått",
  },
});

export const goalSelectMessages = defineMessages({
  en: {
    goal: "Goal",
    everyDay: "Every day",
    timesAWeek: (times: number) => `${times} ${pluralize(times, "time")} a week`,
  },
  sv: {
    goal: "Mål",
    everyDay: "Varje dag",
    timesAWeek: (times: number) => `${times} ${pluralize(times, "gång", "gånger")} i veckan`,
  },
});

export const yearOverviewMessages = defineMessages({
  en: {
    title: "Last 12 months",
    goodDays: (count: number) => `${count} good ${pluralize(count, "day")}`,
    gridLabel: (goodDays: string) => `${goodDays} in the last 12 months`,
    status: { GOOD: "✓", BAD: "✗", REST: "day off", NOT_SPECIFIED: "not marked" },
  },
  sv: {
    title: "De senaste 12 månaderna",
    goodDays: (count: number) => `${count} bra ${pluralize(count, "dag", "dagar")}`,
    gridLabel: (goodDays: string) => `${goodDays} de senaste 12 månaderna`,
    status: { GOOD: "✓", BAD: "✗", REST: "fridag", NOT_SPECIFIED: "inte markerad" },
  },
});
