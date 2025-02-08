import type { Meta, StoryObj } from "@storybook/react";

import { StreakTracker } from "./StreakTracker";
import type { DayInStreak } from "../../shared/Activity";

const meta = {
  title: "StreakTracker",
  component: StreakTracker,
  parameters: {},
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof StreakTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {};
