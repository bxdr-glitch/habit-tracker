export type RootStackParamList = {
  Tabs: undefined;
  HabitForm: { habitId?: string } | undefined;
  HabitDetail: { habitId: string };
};

export type TabParamList = {
  Today: undefined;
  Settings: undefined;
};
