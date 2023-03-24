export enum ValueListTypeId {
  ClassificationType = '81ba5a10-385d-42c1-90e4-b76a4cbbd1a1',
  AlbumType = '6dc5ea64-3c1a-4f38-b4c1-510f1ec20d2f',
  ArtistType = '5582c562-53c5-4937-af3c-f285ee2cc696',
  Country = '794fb6f0-6fe1-4afe-99e9-3976e1b748a5',
  ImageType = '89612b85-c358-4426-b1a4-e5afa526a849',
  Mood = '4f9cbc6b-a841-47a5-8c4d-11197337e95e',
  PlaylistType = '41c17123-ba0a-43ea-bc32-39b3b6d4ed52',
  Genre = '79907d9f-1e09-4dad-a497-dfd92398bac0',
  Subgenre = '522b4e6c-1161-477b-ad5f-0a219f46d99d',
  Occasion = '1eacb5b1-6438-4d41-aa1e-80b10c051fc4',
  Instrument = '0f593be0-45e4-4de0-9367-ea52bc51c595',
  Language = '65c31ee4-fbba-4086-b4eb-5fa6b2a499f7',
  Category = '9442c907-1e72-4c54-9c1d-d0c731a604af'
}

/** Default list of value list entries. */
export const valueListEntries: { [valueListTypeId: string]: string[] } = { };
valueListEntries[ValueListTypeId.ClassificationType] = [
  ValueListTypeId.Genre + '|Genre',
  ValueListTypeId.Subgenre + '|Subgenre',
  ValueListTypeId.Occasion + '|Occasion',
  ValueListTypeId.Instrument + '|Instrument',
  ValueListTypeId.Language + '|Language',
  ValueListTypeId.Category + '|Category'
];
valueListEntries[ValueListTypeId.Mood] = [
  'No Mood',
  'Depressed',
  'Sad',
  'Melancholy',
  'Indifferent',
  'Relaxed',
  'Peaceful',
  'Grateful',
  'Happy',
  'Excited',
  'Energetic'
];

/** Default list of classifications. */
export const classificationEntries: { [valueListTypeId: string]: string[] } = { };
classificationEntries[ValueListTypeId.Subgenre] = [
  'Acoustic',
  'Ballad',
  'Banda',
  'Bolero',
  'Choir',
  'Christian',
  'Con Mariachi',
  'Easy Listening',
  'Merengue',
  'Reggaeton',
  'Slow Jams',
  'Soft',
  'Texano'
];
classificationEntries[ValueListTypeId.Category] = [
  'Animals',
  'Child Singer',
  'Colors',
  'Date&Time',
  'Family',
  'Father',
  'Food',
  'Friendship',
  'Girly',
  'Headphones',
  'Morning',
  'Mother',
  'Names',
  'One Hit Wonder',
  'Oscars',
  'Oz Favorites',
  'Phone Call',
  'Places',
  'Quotes',
  'Relationship',
  'Ringtone',
  'Sports',
  'Supergroup',
  'Weird Voice'
];
classificationEntries[ValueListTypeId.Instrument] = [
  'Flute',
  'Guitar',
  'Harmonica-Melodica',
  'Piano',
  'Sax',
  'Trumpet',
  'Vocal',
  'Whistle'
];
classificationEntries[ValueListTypeId.Language] = [
  'English',
  'French',
  'Italian',
  'Japanese',
  'None',
  'Portuguese',
  'Spanish',
  'Unknown',
  'Various'
];
classificationEntries[ValueListTypeId.Occasion] = [
  'Anniversary',
  'Beach',
  'Birthday',
  'Christmas',
  'Fast Dance',
  'Halloween',
  'Karaoke',
  'New Year',
  'Party',
  'Rain',
  'Relaxing',
  'Romantic',
  'Sing In Group',
  'Slow Dance',
  'Workout'
];
