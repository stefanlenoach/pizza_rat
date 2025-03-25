// Mock data for pizza place reviews
export interface Review {
  id: string;
  placeId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  userProfilePic?: string;
}

export const mockReviews: Review[] = [
  {
    id: '1',
    placeId: 'ChIJCXNI2uxZwokRXVV3Hn8gKzU', // Joe's Pizza
    userName: 'Pizza Lover',
    rating: 5,
    comment: 'Best slice in NYC! The perfect balance of cheese and sauce. Crispy yet foldable crust.',
    date: '2025-02-15',
    userProfilePic: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: '2',
    placeId: 'ChIJCXNI2uxZwokRXVV3Hn8gKzU', // Joe's Pizza
    userName: 'NY Foodie',
    rating: 4,
    comment: 'Classic NY slice. A bit pricey but worth it for the quality. Always a line but moves fast.',
    date: '2025-02-10',
    userProfilePic: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    id: '3',
    placeId: 'ChIJCXNI2uxZwokRXVV3Hn8gKzU', // Joe's Pizza
    userName: 'SliceHunter',
    rating: 5,
    comment: 'This is what pizza should taste like. No frills, just perfect pizza.',
    date: '2025-01-22',
    userProfilePic: 'https://randomuser.me/api/portraits/men/3.jpg'
  },
  {
    id: '4',
    placeId: 'ChIJ4zGFAZpZwokRGUGph3Mf37k', // Lombardi's
    userName: 'HistoryBuff',
    rating: 5,
    comment: 'America\'s first pizzeria and still one of the best! The coal-fired crust is amazing.',
    date: '2025-03-01',
    userProfilePic: 'https://randomuser.me/api/portraits/women/4.jpg'
  },
  {
    id: '5',
    placeId: 'ChIJ4zGFAZpZwokRGUGph3Mf37k', // Lombardi's
    userName: 'TouristFromChicago',
    rating: 3,
    comment: 'Good but not great. As a Chicago deep dish fan, this was a bit underwhelming.',
    date: '2025-02-28',
    userProfilePic: 'https://randomuser.me/api/portraits/men/5.jpg'
  },
  {
    id: '6',
    placeId: 'ChIJQwRFP1BZwokR1BRZ2q4RmaQ', // Di Fara
    userName: 'BrooklynNative',
    rating: 5,
    comment: 'Worth the trip to Brooklyn. Dom\'s pizza is art, not just food. The wait is part of the experience.',
    date: '2025-03-10',
    userProfilePic: 'https://randomuser.me/api/portraits/women/6.jpg'
  },
  {
    id: '7',
    placeId: 'ChIJQwRFP1BZwokR1BRZ2q4RmaQ', // Di Fara
    userName: 'ItalianFoodie',
    rating: 5,
    comment: 'Closest thing to authentic Italian pizza in NYC. The fresh basil makes all the difference.',
    date: '2025-02-20',
    userProfilePic: 'https://randomuser.me/api/portraits/men/7.jpg'
  },
  {
    id: '8',
    placeId: 'ChIJT2Y6Qn1ZwokRQsZ2Lav_AB0', // Rubirosa
    userName: 'PastaAndPizza',
    rating: 4,
    comment: 'The vodka pizza is incredible! Great atmosphere too. Make reservations well in advance.',
    date: '2025-03-05',
    userProfilePic: 'https://randomuser.me/api/portraits/women/8.jpg'
  },
  {
    id: '9',
    placeId: 'ChIJT2Y6Qn1ZwokRQsZ2Lav_AB0', // Rubirosa
    userName: 'DateNightExpert',
    rating: 5,
    comment: 'Perfect date spot. Amazing thin crust and great cocktails. The tie-dye pizza is a must-try!',
    date: '2025-02-14',
    userProfilePic: 'https://randomuser.me/api/portraits/men/9.jpg'
  },
  {
    id: '10',
    placeId: 'ChIJN8Z5i5JZwokRZaM3BgZ9_Y8', // John's of Bleecker
    userName: 'OldSchoolNYC',
    rating: 4,
    comment: 'Classic coal oven pizza. No slices, whole pies only. The char on the crust is perfect.',
    date: '2025-03-15',
    userProfilePic: 'https://randomuser.me/api/portraits/women/10.jpg'
  },
  {
    id: '11',
    placeId: 'ChIJN8Z5i5JZwokRZaM3BgZ9_Y8', // John's of Bleecker
    userName: 'PizzaHistorian',
    rating: 5,
    comment: 'One of the OGs of NYC pizza. The restaurant itself is a piece of history. Love the booth carvings!',
    date: '2025-03-01',
    userProfilePic: 'https://randomuser.me/api/portraits/men/11.jpg'
  }
];

// Function to get reviews for a specific place
export const getReviewsForPlace = (placeId: string): Review[] => {
  return mockReviews.filter(review => review.placeId === placeId);
};

// Function to add a new review
export const addReview = (review: Omit<Review, 'id' | 'date'>): Review => {
  // Generate a unique ID using timestamp and random number to avoid collisions
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  
  const newReview: Review = {
    ...review,
    id: uniqueId,
    date: new Date().toISOString().split('T')[0]
  };
  
  // In a real app, this would be added to a database
  // For this mock, we'll just return the new review
  mockReviews.push(newReview); // Add to the mock data array
  return newReview;
};
