export interface MotivationalThought {
  quote: string;
  author: string;
  theme: 'focus' | 'calm' | 'consistency' | 'strength' | 'mindset' | 'energy' | 'action';
  action: string;
}

export const MOTIVATIONAL_THOUGHTS: MotivationalThought[] = [
  {
    quote: 'The secret of getting ahead is getting started. Break complex tasks into small, manageable pieces.',
    author: 'Mark Twain',
    theme: 'action',
    action: 'Pick your single most important task and begin the first 5 minutes.',
  },
  {
    quote: 'Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.',
    author: 'John C. Maxwell',
    theme: 'consistency',
    action: 'Celebrate showing up today, even if it is just one finished checkmark.',
  },
  {
    quote: 'You do not have to be extreme, just consistent. Progress is built on quiet repetition.',
    author: 'Zen Proverb',
    theme: 'calm',
    action: 'Move through your list with calm intention, not rushed urgency.',
  },
  {
    quote: 'Action is the foundational key to all success. Do not wait for ideal conditions.',
    author: 'Pablo Picasso',
    theme: 'action',
    action: 'Take one clean action right now before overthinking the whole day.',
  },
  {
    quote: 'Take care of your body. It’s the only place you have to live.',
    author: 'Jim Rohn',
    theme: 'strength',
    action: 'Pair your mental focus today with physical movement or mindful stretching.',
  },
  {
    quote: 'Simplicity is the ultimate sophistication. Eliminate what does not matter.',
    author: 'Leonardo da Vinci',
    theme: 'focus',
    action: 'Strip down non-essential noise and protect your prime focus window.',
  },
  {
    quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant',
    theme: 'consistency',
    action: 'Build your identity one completed habit and set at a time.',
  },
  {
    quote: 'Peace comes from within. Do not seek it without. A calm mind accomplishes more.',
    author: 'Siddhartha Gautama',
    theme: 'calm',
    action: 'Take 3 deep belly breaths before starting your scheduled tasks.',
  },
  {
    quote: 'Focus is a muscle. The more you protect your attention, the stronger you become.',
    author: 'Cal Newport',
    theme: 'focus',
    action: 'Put notifications on silent for your next 30-minute block.',
  },
  {
    quote: 'Energy flows where attention goes. Direct yours toward what truly moves the needle.',
    author: 'Tony Robbins',
    theme: 'energy',
    action: 'Tackle your high-priority task while your energy is peak.',
  },
  {
    quote: 'Do not count the days, make the days count.',
    author: 'Muhammad Ali',
    theme: 'strength',
    action: 'Give full presence to whatever set, rep, or task is right in front of you.',
  },
  {
    quote: 'The mind is everything. What you think you become.',
    author: 'Buddha',
    theme: 'mindset',
    action: 'Replace "I have to do this" with "I choose to accomplish this today".',
  },
  {
    quote: 'Done is better than perfect. Perfection is the enemy of forward momentum.',
    author: 'Sheryl Sandberg',
    theme: 'action',
    action: 'Aim for 80% momentum today rather than waiting for 100% perfection.',
  },
  {
    quote: 'Physical strength leads to mental resilience. When body and mind train together, nothing shakes you.',
    author: 'Marcus Aurelius',
    theme: 'strength',
    action: 'Get your workout in—even 15 focused minutes shifts your mental state.',
  },
  {
    quote: 'Adopt the pace of nature: her secret is patience.',
    author: 'Ralph Waldo Emerson',
    theme: 'calm',
    action: 'Patience produces lasting compound gains in fitness and career.',
  },
  {
    quote: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    theme: 'consistency',
    action: 'Just keep moving your feet forward, one step at a time.',
  },
  {
    quote: 'Clarity comes from engagement, not thought. The best way to know what to do is to start.',
    author: 'Marie Forleo',
    theme: 'action',
    action: 'Turn thought into physical action within 60 seconds.',
  },
  {
    quote: 'Rest is not a reward for work; it is an essential part of the work.',
    author: 'Zen Wisdom',
    theme: 'calm',
    action: 'Honor your rest periods today during training and work blocks.',
  },
  {
    quote: 'The only bad workout is the one that did not happen.',
    author: 'Fitness Maxim',
    theme: 'strength',
    action: 'Even a light session keeps the habit alive and fuels energy.',
  },
  {
    quote: 'Mastering others is strength. Mastering yourself is true power.',
    author: 'Lao Tzu',
    theme: 'mindset',
    action: 'Guard your morning routine and notice how smoothly your day unfolds.',
  },
  {
    quote: 'Discipline is choosing between what you want now and what you want most.',
    author: 'Abraham Lincoln',
    theme: 'focus',
    action: 'Stay loyal to the goals you set for future you.',
  },
  {
    quote: 'Each morning we are born again. What we do today is what matters most.',
    author: 'Buddha',
    theme: 'mindset',
    action: 'Today is a clean canvas—let go of yesterday’s unfinished items and flow.',
  },
];

/**
 * Returns a stable thought for the day based on the calendar date string (YYYY-MM-DD)
 */
export function getDailyThought(dateString?: string): MotivationalThought {
  const seedString = dateString || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MOTIVATIONAL_THOUGHTS.length;
  return MOTIVATIONAL_THOUGHTS[index];
}
