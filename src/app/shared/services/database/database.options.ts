import { IModuleOptionModel } from "../../models/module-option-model.interface";
import { ModuleOptionEditor, ModuleOptionName } from "../../models/module-option.enum";

export const defaultModuleOptions: IModuleOptionModel[] = [
  {
    name: ModuleOptionName.ScanMusicFolderPath,
    moduleName: 'Music',
    title: 'Directory path to look for audio files',
    description: '',
    valueEditorType: ModuleOptionEditor.Text,
    multipleValues: false,
    system: false,
    values: ''
  },
  {
    name: ModuleOptionName.ScanPlaylistFolderPath,
    moduleName: 'Music',
    title: 'Directory path to look for playlist files',
    description: '',
    valueEditorType: ModuleOptionEditor.Text,
    multipleValues: false,
    system: false,
    values: ''
  },
  {
    name: ModuleOptionName.ArtistSplitCharacters,
    moduleName: 'Music',
    title: 'Artist Split Characters',
    description: 'Symbols to be used to split the Artist tag into multiple artists.',
    valueEditorType: ModuleOptionEditor.Text,
    multipleValues: true,
    system: false,
    values: JSON.stringify(['\\'])
  },
  {
    name: ModuleOptionName.GenreSplitCharacters,
    moduleName: 'Music',
    title: 'Genre Split Characters',
    description: 'Symbols to be used to split the Genre tag into multiple genres.',
    valueEditorType: ModuleOptionEditor.Text,
    multipleValues: true,
    system: false,
    values: JSON.stringify(['\\'])
  },
  {
    name: ModuleOptionName.ExpandPlayerOnSongPlay,
    moduleName: 'Music',
    title: 'Expand Player On Song Play',
    description: 'Whether or not the full player should be expanded when a song starts to played from the song list.',
    valueEditorType: ModuleOptionEditor.YesNo,
    multipleValues: false,
    system: true,
    values: JSON.stringify(true)
  }
];