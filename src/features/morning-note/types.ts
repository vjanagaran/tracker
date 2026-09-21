export type MorningTask = {
  id: string;
  title: string;
  tagLabel: string | null;
  spokes: string[];
  repeatLabel: string | null;
  targetLabel: string | null;
};

export type MorningMeeting = {
  boardName: string;
  when: string;
};

export type MorningNote = {
  heading: string;
  dayShort: string;
  toward: string[];
  dueToday: MorningTask[];
  dueTodayHidden: number;
  overdue: MorningTask[];
  overdueHidden: number;
  meeting: MorningMeeting | null;
};

export type MorningRecipient = {
  userId: string;
  email: string;
  timezone: string;
  sentOn: string | null;
};
