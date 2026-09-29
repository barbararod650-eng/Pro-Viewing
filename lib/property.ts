export const PROPERTY = {
  name: 'The Aspen Residences',
  address: '1428 Maple Grove Lane, Portland, OR 97201',
  price: 3200,
  beds: 3,
  baths: 2,
  sqft: 1450,
  imageUrl:
    'https://images.pexels.com/photos/14998334/pexels-photo-14998334.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  galleryImages: [
    'https://images.pexels.com/photos/8089172/pexels-photo-8089172.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/8082243/pexels-photo-8082243.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/7722168/pexels-photo-7722168.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/29012619/pexels-photo-29012619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ],
  amenities: [
    'In-unit Washer & Dryer',
    'Central Air Conditioning',
    'Stainless Steel Appliances',
    'Hardwood Floors',
    'Private Balcony',
    'Covered Parking',
    'Fitness Center Access',
    'Pet Friendly',
  ],
  description:
    'A beautifully appointed apartment in the heart of Portland, offering spacious living areas, modern finishes, and stunning natural light. Available for move-in immediately.',
};

export const TIME_SLOTS = [
  '9:00 AM – 9:30 AM',
  '11:00 AM – 11:30 AM',
  '1:00 PM – 1:30 PM',
  '3:00 PM – 3:30 PM',
  '5:00 PM – 5:30 PM',
];

export const INSPECTION_FEE = 25;



// Timezone the property is located in. Viewing time slots (e.g. "9:00 AM")
// are interpreted in this timezone, no matter where the visitor's browser is.
// Change this if your property isn't in Portland, OR.
// List of valid names: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
export const PROPERTY_TIMEZONE = 'America/Los_Angeles';

export function getMockViewingWindow(): { start: Date; end: Date } {
  const start = new Date();
  start.setMinutes(start.getMinutes() + 10);
  start.setSeconds(0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { start, end };
}
