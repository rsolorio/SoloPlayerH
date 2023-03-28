export class ValueLists {
  static ClassificationType = {
    id: '81ba5a10-385d-42c1-90e4-b76a4cbbd1a1'
  };
  static AlbumType = {
    id: '6dc5ea64-3c1a-4f38-b4c1-510f1ec20d2f',
    entries: {
      LP: 'c613d1e5-f7b1-4533-92a8-7d57b7906daf'
    }
  };
  static ArtistType = {
    id: '5582c562-53c5-4937-af3c-f285ee2cc696',
    entries: {
      Unknown: '9f0b9c29-5d9b-4086-897a-1b69fc243afc'
    }
  };
  static Country = {
    id: '794fb6f0-6fe1-4afe-99e9-3976e1b748a5',
    entries: {
      Unknown: '9f0b9c29-5d9b-4086-897a-1b69fc243afc'
    }
  };
  static Mood = {
    id: '4f9cbc6b-a841-47a5-8c4d-11197337e95e'
  };
  static PlaylistType = {
    id: '41c17123-ba0a-43ea-bc32-39b3b6d4ed52'
  };
  static Genre = {
    id: '79907d9f-1e09-4dad-a497-dfd92398bac0'
  };
  static Subgenre = {
    id: '522b4e6c-1161-477b-ad5f-0a219f46d99d'
  };
  static Occasion = {
    id: '1eacb5b1-6438-4d41-aa1e-80b10c051fc4'
  };
  static Instrument = {
    id: '0f593be0-45e4-4de0-9367-ea52bc51c595'
  };
  static Language = {
    id: '65c31ee4-fbba-4086-b4eb-5fa6b2a499f7'
  };
  static Category = {
    id: '9442c907-1e72-4c54-9c1d-d0c731a604af'
  };
}

/** Default list of value list entries. */
export const valueListEntries: { [valueListTypeId: string]: string[] } = { };
// Each classification type is listed in the value list entry table,
// but at the same time, all classifications associated with these types are save in the value list entry table.
valueListEntries[ValueLists.ClassificationType.id] = [
  ValueLists.Genre.id + '|Genre',
  ValueLists.Subgenre.id + '|Subgenre',
  ValueLists.Occasion.id + '|Occasion',
  ValueLists.Instrument.id + '|Instrument',
  ValueLists.Language.id + '|Language',
  ValueLists.Category.id + '|Category'
];
valueListEntries[ValueLists.Mood.id] = [
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
valueListEntries[ValueLists.AlbumType.id] = [
  'Compilation',
  'EP',
  'Live',
  'LP',
  'Mixtape',
  'Remix',
  'Single',
  'Soundtrack'
];
valueListEntries[ValueLists.ArtistType.id] = [
  'Solo - Male',
  'Solo - Male Singer',
  'Solo - Female',
  'Solo - Female Singer',
  'Duo',
  'Duo - Male Singer',
  'Duo - Female Singer',
  'Duo - Mixed Singers',
  'Trio',
  'Trio - Male Singer',
  'Trio - Female Singer',
  'Trio - Mixed Singers',
  'Band',
  'Band - Female Singer',
  'Band - Male Singer',
  'Band - Mixed Singers',
  'Unknown'
];
valueListEntries[ValueLists.Country.id] = [
  'Unknown',
  'United States',
  'Mexico'
];

/** Default list of classifications. */
export const classificationEntries: { [valueListTypeId: string]: string[] } = { };
classificationEntries[ValueLists.Subgenre.id] = [
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
classificationEntries[ValueLists.Category.id] = [
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
classificationEntries[ValueLists.Instrument.id] = [
  'Flute',
  'Guitar',
  'Harmonica-Melodica',
  'Piano',
  'Sax',
  'Trumpet',
  'Vocal',
  'Whistle'
];
classificationEntries[ValueLists.Language.id] = [
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
classificationEntries[ValueLists.Occasion.id] = [
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
