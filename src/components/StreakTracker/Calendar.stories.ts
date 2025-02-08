import type { Meta, StoryObj } from "@storybook/react";

import { Calendar } from "./Calendar";
import { mockData } from "../StreakTracker/StreakTracker.mockData";

const meta = {
  title: "Calendar",
  component: Calendar,
  parameters: {},
  tags: ["autodocs"],
  args: {
    streak: mockData,
    onSelectDate: console.log,
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
