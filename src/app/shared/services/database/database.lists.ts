/**
 * A class that exposes the ids of the value list types and their entries.
 * Classification types are a special case because they exist in the database
 * as valueListType records and also as valueListEntry records and they share
 * the same primary key for both tables.
 */
export class ValueLists {
  static ClassificationType = {
    id: '81ba5a10-385d-42c1-90e4-b76a4cbbd1a1',
    entries: {
      Subgenre: '522b4e6c-1161-477b-ad5f-0a219f46d99d',
      Occasion: '1eacb5b1-6438-4d41-aa1e-80b10c051fc4',
      Instrument: '0f593be0-45e4-4de0-9367-ea52bc51c595',
      Category: '9442c907-1e72-4c54-9c1d-d0c731a604af',
      Genre: '79907d9f-1e09-4dad-a497-dfd92398bac0'
    }
  };
  static PlaylistGroup = {
    id: 'f8ce02a9-a951-4142-a66c-acc81a040053',
    entries: {
      Default: {
        id: '042901e6-66da-4d4e-89ea-ae40ab98f7ab',
        name: 'Default'
      }
    }
  };
  static FilterType = {
    id: "ddf1d521-8836-48f8-a9fa-80db11d1df8e",
    entries: {
      Smartlist: '336ffcd4-941e-4aea-b94e-292ad5d6e36d',
      QuickFilters: 'a8c2aeb1-184f-4299-870d-90ffc9715f09'
    }
  };
  static AlbumType = {
    id: '6dc5ea64-3c1a-4f38-b4c1-510f1ec20d2f',
    entries: {
      LP: {
        id: 'c613d1e5-f7b1-4533-92a8-7d57b7906daf',
        name: 'LP'
      }
    }
  };
  static ArtistType = {
    id: '5582c562-53c5-4937-af3c-f285ee2cc696',
    entries: {
      Unknown: {
        id: '9f0b9c29-5d9b-4086-897a-1b69fc243afc',
        name: 'Unknown'
      }
    }
  };
  static Gender = {
    id: '98270b93-5181-4971-a9b7-140d8f60e081',
    entries: {
      Unknown: {
        id: 'a6016ac9-6235-4df2-aed8-d0ec69351137',
        name: 'Unknown'
      }
    }
  };
  static Country = {
    id: '794fb6f0-6fe1-4afe-99e9-3976e1b748a5',
    entries: {
      Unknown: {
        id: '77aad7f2-044e-4fb1-aed8-65cde38077a4',
        name: 'Unknown'
      }
    }
  };
  static Mood = {
    id: '4f9cbc6b-a841-47a5-8c4d-11197337e95e',
    entries: {
      Unknown: {
        id: 'b16fc5e7-1c6d-66b9-9cd8-1ca5112b1442',
        name: 'Unknown'
      }
    }
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
  static Category = {
    id: '9442c907-1e72-4c54-9c1d-d0c731a604af'
  };
  static Language = {
    id: '65c31ee4-fbba-4086-b4eb-5fa6b2a499f7',
    entries: {
      Unknown: {
        id: 'a1cce2a5-bb02-aa46-693a-76ad7788cd00',
        name: 'Unknown'
      }
    }
  };
}