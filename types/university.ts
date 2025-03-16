export interface University {
  name: string;
  url: string;
}

export const UNIVERSITIES: University[] = [
  { name: 'University of Technology Sydney', url: 'https://canvas.uts.edu.au' },
  { name: 'University of Sydney', url: 'https://canvas.sydney.edu.au' },
  { name: 'UNSW Sydney', url: 'https://health.unsw.edu.au' },
  { name: 'Macquarie University', url: 'https://ilearn.mq.edu.au' },
  { name: 'Western Sydney University', url: 'https://vuws.westernsydney.edu.au' },
  { name: 'Australian Catholic University', url: 'https://canvas.acu.edu.au' }
];

export function getUniversityByUrl(url: string): University | undefined {
  return UNIVERSITIES.find(university => university.url === url);
}

export function getUniversityByName(name: string): University | undefined {
  return UNIVERSITIES.find(university => university.name === name);
} 