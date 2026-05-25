export interface Event {
  name: string;
  date: string;
  time?: string;
  end_time?: string;
  venue: string;
  neighborhood?: string;
  category: "art" | "food";
  description: string;
  url: string;
  source: string;
}
